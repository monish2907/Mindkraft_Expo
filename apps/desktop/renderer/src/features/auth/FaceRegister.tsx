import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { enrollIdentity } from '../../services/face';

const STATUS = {
  IDLE: 'Idle',
  LOADING: 'Loading face models...',
  STARTING_CAMERA: 'Starting webcam...',
  DETECTING: 'Detecting face...',
  SAVING: 'Saving descriptor...',
  SUCCESS: 'Face registration successful',
  FAILED: 'Face registration failed',
} as const;

const DETECTOR_OPTIONS = new faceapi.TinyFaceDetectorOptions({
  inputSize: 416,
  scoreThreshold: 0.5,
});

type FaceRegisterProps = {
  userId: string;
  scanIntervalMs?: number;
  stableFramesRequired?: number;
  onSuccess?: (data: { descriptorLength: number }) => void;
  onFailure?: (message: string) => void;
};

export default function FaceRegister({
  userId,
  scanIntervalMs = 600,
  stableFramesRequired = 3,
  onSuccess,
  onFailure,
}: FaceRegisterProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const stableFrameCountRef = useRef(0);
  const modelsLoadedRef = useRef(false);
  const savingRef = useRef(false);

  const [status, setStatus] = useState<string>(STATUS.IDLE);
  const [errorMessage, setErrorMessage] = useState('');

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

  const handleFailure = useCallback(
    (message: string) => {
      setStatus(STATUS.FAILED);
      setErrorMessage(message);
      savingRef.current = false;
      onFailure?.(message);
    },
    [onFailure]
  );

  const loadModels = useCallback(async () => {
    if (modelsLoadedRef.current) {
      return;
    }

    setStatus(STATUS.LOADING);
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    ]);
    modelsLoadedRef.current = true;
  }, []);

  const startCamera = useCallback(async () => {
    if (!browserSupportsMedia) {
      throw new Error('Camera is not supported on this device/browser context.');
    }

    setStatus(STATUS.STARTING_CAMERA);

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

  const registerFrame = useCallback(async () => {
    if (savingRef.current || !videoRef.current || videoRef.current.readyState < 2) {
      return;
    }

    setStatus(STATUS.DETECTING);

    const detections = await faceapi
      .detectAllFaces(videoRef.current, DETECTOR_OPTIONS)
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (!detections.length) {
      stableFrameCountRef.current = 0;
      setErrorMessage('No face detected. Align face with camera.');
      return;
    }

    if (detections.length !== 1) {
      stableFrameCountRef.current = 0;
      setErrorMessage('Multiple faces detected. Only one face is allowed.');
      return;
    }

    stableFrameCountRef.current += 1;
    if (stableFrameCountRef.current < stableFramesRequired) {
      setErrorMessage('Hold still to complete enrollment...');
      return;
    }

    savingRef.current = true;
    setStatus(STATUS.SAVING);
    setErrorMessage('');

    const descriptor = Array.from(detections[0].descriptor) as number[];
    const saveResult = await enrollIdentity(userId, descriptor);

    if (!saveResult.success) {
      handleFailure(saveResult.error ?? 'Failed to save descriptor.');
      return;
    }

    setStatus(STATUS.SUCCESS);
    stopCamera();
    onSuccess?.({ descriptorLength: descriptor.length });
  }, [handleFailure, onSuccess, stableFramesRequired, stopCamera, userId]);

  useEffect(() => {
    let isMounted = true;

    async function initialize() {
      try {
        if (!userId || typeof userId !== 'string') {
          throw new Error('A valid userId is required for face enrollment.');
        }

        setErrorMessage('');
        stableFrameCountRef.current = 0;

        await loadModels();
        await startCamera();

        if (!isMounted) {
          return;
        }

        intervalRef.current = window.setInterval(() => {
          void registerFrame().catch((error: unknown) => {
            const message = error instanceof Error ? error.message : 'Unexpected face enrollment error.';
            handleFailure(message);
          });
        }, scanIntervalMs);
      } catch (error: unknown) {
        const err = error as { name?: string; message?: string };
        const message =
          err?.name === 'NotAllowedError'
            ? 'Camera permission denied. Please allow camera access and retry.'
            : err?.name === 'NotFoundError'
              ? 'No camera device found on this system.'
              : err?.message ?? 'Unable to initialize face registration.';
        handleFailure(message);
      }
    }

    void initialize();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [handleFailure, loadModels, registerFrame, scanIntervalMs, startCamera, stopCamera, userId]);

  return (
    <section className="face-card">
      <h2>Face Registration</h2>
      <div className="video-shell">
        <video ref={videoRef} muted playsInline className="video" />
      </div>
      <div className="status-shell">
        <p>Status: {status}</p>
        {errorMessage && <p className="error">{errorMessage}</p>}
      </div>
    </section>
  );
}
