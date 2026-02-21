import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { lockSystem, verifyIdentity } from '../../services/face';

const MAX_ATTEMPTS = 3;

const AUTH_STATE = {
  LOADING: 'loading',
  SCANNING: 'scanning',
  MATCHING: 'matching',
  SUCCESS: 'success',
  FAILURE: 'failure',
  LOCKED: 'locked',
} as const;

type AuthState = (typeof AUTH_STATE)[keyof typeof AUTH_STATE];

const DETECTOR_OPTIONS = new faceapi.TinyFaceDetectorOptions({
  inputSize: 416,
  scoreThreshold: 0.5,
});

type FaceLoginProps = {
  userId: string;
  scanIntervalMs?: number;
  onSuccess?: (data: { distance?: number; threshold?: number }) => void;
  onFailure?: (message: string) => void;
};

type LoadingPanelProps = {
  message: string;
};

function LoadingPanel({ message }: LoadingPanelProps) {
  return (
    <div className="status-shell">
      <p>Status: Loading</p>
      <p>{message}</p>
    </div>
  );
}

type ScanPanelProps = {
  attempts: number;
  maxAttempts: number;
  message: string;
};

function ScanPanel({ attempts, maxAttempts, message }: ScanPanelProps) {
  return (
    <div className="status-shell">
      <p>Status: Scanning</p>
      <p>Attempt {attempts + 1} of {maxAttempts}</p>
      <p>{message}</p>
    </div>
  );
}

type SuccessPanelProps = {
  confidence: number | null;
};

function SuccessPanel({ confidence }: SuccessPanelProps) {
  return (
    <div className="status-shell">
      <p>Status: Success</p>
      {confidence !== null && <p>Confidence: {confidence.toFixed(4)}</p>}
    </div>
  );
}

type FailurePanelProps = {
  state: AuthState;
  message: string;
  attempts: number;
  maxAttempts: number;
};

function FailurePanel({ state, message, attempts, maxAttempts }: FailurePanelProps) {
  const isLocked = state === AUTH_STATE.LOCKED;

  return (
    <div className="status-shell">
      <p>Status: {isLocked ? 'Locked' : 'Failure'}</p>
      <p>{message}</p>
      <p>Attempts: {attempts} / {maxAttempts}</p>
    </div>
  );
}

export default function FaceLogin({
  userId,
  scanIntervalMs = 600,
  onSuccess,
  onFailure,
}: FaceLoginProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const modelsLoadedRef = useRef(false);
  const processingRef = useRef(false);
  const authStateRef = useRef<AuthState>(AUTH_STATE.LOADING);

  const [authState, setAuthState] = useState<AuthState>(AUTH_STATE.LOADING);
  const [statusMessage, setStatusMessage] = useState('Initializing face authentication...');
  const [attempts, setAttempts] = useState(0);
  const [confidence, setConfidence] = useState<number | null>(null);

  const browserSupportsMedia = useMemo(
    () => typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia),
    []
  );

  const stopCamera = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!browserSupportsMedia) {
      throw new Error('Camera is not supported on this device/browser context.');
    }

    setStatusMessage('Starting webcam...');

    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
      audio: false,
    });

    streamRef.current = stream;

    if (!videoRef.current) {
      throw new Error('Video element is not ready.');
    }

    videoRef.current.srcObject = stream;
    await videoRef.current.play();
  }, [browserSupportsMedia]);

  const loadModels = useCallback(async () => {
    if (modelsLoadedRef.current) {
      return;
    }

    setAuthState(AUTH_STATE.LOADING);
    setStatusMessage('Loading face models...');

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    ]);

    modelsLoadedRef.current = true;
  }, []);

  const applyFailure = useCallback(
    (message: string) => {
      setAttempts((currentAttempts) => {
        const nextAttempts = currentAttempts + 1;
        const locked = nextAttempts >= MAX_ATTEMPTS;
        const nextState = locked ? AUTH_STATE.LOCKED : AUTH_STATE.FAILURE;

        setAuthState(nextState);
        setStatusMessage(
          locked
            ? 'Maximum authentication attempts reached. System is locked.'
            : message
        );

        if (locked) {
          void lockSystem({ userId, reason: 'MAX_ATTEMPTS_REACHED' });
        }

        onFailure?.(locked ? 'Maximum authentication attempts reached.' : message);

        return nextAttempts;
      });
    },
    [onFailure, userId]
  );

  const authenticateFrame = useCallback(async () => {
    if (processingRef.current || !videoRef.current || videoRef.current.readyState < 2) {
      return;
    }

    if (authStateRef.current === AUTH_STATE.SUCCESS || authStateRef.current === AUTH_STATE.LOCKED) {
      return;
    }

    processingRef.current = true;

    setAuthState(AUTH_STATE.SCANNING);
    setStatusMessage('Scanning face...');

    try {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, DETECTOR_OPTIONS)
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (!detections.length) {
        applyFailure('No face detected. Please align your face with the camera.');
        return;
      }

      if (detections.length !== 1) {
        applyFailure('Multiple faces detected. Only one face is allowed.');
        return;
      }

      setAuthState(AUTH_STATE.MATCHING);
      setStatusMessage('Matching face identity...');

      const descriptor = Array.from(detections[0].descriptor) as number[];
      const result = await verifyIdentity(userId, descriptor);

      if (!result.success) {
        applyFailure(result.error ?? 'Unable to verify identity.');
        return;
      }

      if (typeof result.confidence === 'number' && Number.isFinite(result.confidence)) {
        setConfidence(result.confidence);
      } else {
        setConfidence(null);
      }

      if (result.allow) {
        setAuthState(AUTH_STATE.SUCCESS);
        setStatusMessage('Authentication successful.');
        stopCamera();
        onSuccess?.({ distance: result.distance, threshold: result.threshold });
        return;
      }

      const distanceText =
        typeof result.distance === 'number' && Number.isFinite(result.distance)
          ? result.distance.toFixed(4)
          : 'N/A';
      applyFailure(`Face mismatch. Distance ${distanceText} exceeded threshold.`);
    } finally {
      processingRef.current = false;
    }
  }, [applyFailure, onSuccess, stopCamera, userId]);

  useEffect(() => {
    authStateRef.current = authState;
  }, [authState]);

  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        if (!userId || typeof userId !== 'string') {
          throw new Error('A valid userId is required for face login.');
        }

        setAttempts(0);
        setConfidence(null);
        setAuthState(AUTH_STATE.LOADING);
        setStatusMessage('Initializing face authentication...');

        await loadModels();
        await startCamera();

        if (!isMounted) {
          return;
        }

        setAuthState(AUTH_STATE.SCANNING);
        setStatusMessage('Camera ready. Start scanning...');

        intervalRef.current = window.setInterval(() => {
          if (processingRef.current) {
            return;
          }

          if (authStateRef.current === AUTH_STATE.SUCCESS || authStateRef.current === AUTH_STATE.LOCKED) {
            return;
          }

          void authenticateFrame().catch((error: unknown) => {
            const message = error instanceof Error ? error.message : 'Unexpected face verification error.';
            applyFailure(message);
          });
        }, scanIntervalMs);
      } catch (error: unknown) {
        const err = error as { name?: string; message?: string };
        const message =
          err?.name === 'NotAllowedError'
            ? 'Camera permission denied. Please allow camera access and retry.'
            : err?.name === 'NotFoundError'
              ? 'No camera device found on this system.'
              : err?.message ?? 'Unable to initialize face login.';
        applyFailure(message);
      }
    }

    void initialize();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [applyFailure, authenticateFrame, loadModels, scanIntervalMs, startCamera, stopCamera, userId]);

  useEffect(() => {
    if (authState !== AUTH_STATE.FAILURE) {
      return;
    }

    if (attempts >= MAX_ATTEMPTS) {
      setAuthState(AUTH_STATE.LOCKED);
      stopCamera();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setAuthState(AUTH_STATE.SCANNING);
      setStatusMessage('Retrying face scan...');
    }, 900);

    return () => window.clearTimeout(timeoutId);
  }, [attempts, authState, stopCamera]);

  useEffect(() => {
    if (authState === AUTH_STATE.LOCKED || authState === AUTH_STATE.SUCCESS) {
      stopCamera();
    }
  }, [authState, stopCamera]);

  const renderStatusPanel = () => {
    if (authState === AUTH_STATE.LOADING) {
      return <LoadingPanel message={statusMessage} />;
    }

    if (authState === AUTH_STATE.SCANNING || authState === AUTH_STATE.MATCHING) {
      return <ScanPanel attempts={attempts} maxAttempts={MAX_ATTEMPTS} message={statusMessage} />;
    }

    if (authState === AUTH_STATE.SUCCESS) {
      return <SuccessPanel confidence={confidence} />;
    }

    return (
      <FailurePanel
        state={authState}
        message={statusMessage}
        attempts={attempts}
        maxAttempts={MAX_ATTEMPTS}
      />
    );
  };

  return (
    <section className="face-card">
      <h2>Face Authentication</h2>
      <div className="video-shell">
        <video ref={videoRef} muted playsInline className="video" />
      </div>
      {renderStatusPanel()}
    </section>
  );
}
