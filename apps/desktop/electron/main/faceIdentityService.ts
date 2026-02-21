import { logAuthAttempt } from './logging.js';

const DESCRIPTOR_LENGTH = 128;
const STRICT_THRESHOLD = 0.45;

export type EnrollResponse = {
  success: boolean;
  message?: string;
  error?: string;
};

export type VerifyResponse = {
  success: boolean;
  allow: boolean;
  reason?: string;
  distance?: number;
  threshold?: number;
  confidence?: number;
  error?: string;
};

function resolveThreshold(): number {
  return STRICT_THRESHOLD;
}

function toConfidence(distance: number, threshold: number): number {
  if (!Number.isFinite(distance) || !Number.isFinite(threshold) || threshold <= 0) {
    return 0;
  }

  const raw = 1 - distance / threshold;
  if (raw < 0) {
    return 0;
  }

  if (raw > 1) {
    return 1;
  }

  return raw;
}

export function validateDescriptor(descriptor: number[]): boolean {
  if (!Array.isArray(descriptor) || descriptor.length !== DESCRIPTOR_LENGTH) {
    return false;
  }

  return descriptor.every((value) => Number.isFinite(value));
}

export function euclideanDistance(vectorA: number[], vectorB: number[]): number {
  if (!validateDescriptor(vectorA) || !validateDescriptor(vectorB)) {
    return Number.POSITIVE_INFINITY;
  }

  let sum = 0;
  for (let index = 0; index < vectorA.length; index += 1) {
    const difference = vectorA[index] - vectorB[index];
    sum += difference * difference;
  }

  return Math.sqrt(sum);
}

export async function enrollIdentity(
  saveDescriptor: (userId: string, descriptor: number[]) => Promise<void>,
  userId: string,
  descriptor: number[]
): Promise<EnrollResponse> {
  if (!userId || typeof userId !== 'string') {
    return { success: false, error: 'Invalid userId.' };
  }

  if (!validateDescriptor(descriptor)) {
    return { success: false, error: 'Descriptor must be a 128D numeric vector.' };
  }

  await saveDescriptor(userId, descriptor);
  return { success: true, message: 'Identity enrolled successfully.' };
}

export async function verifyIdentity(
  loadDescriptor: (userId: string) => Promise<number[] | null>,
  userId: string,
  liveDescriptor: number[]
): Promise<VerifyResponse> {
  if (!userId || typeof userId !== 'string') {
    const response: VerifyResponse = {
      success: false,
      allow: false,
      reason: 'INVALID_USER_ID',
      error: 'Invalid userId.',
    };
    await logAuthAttempt({ userId: userId || 'unknown', outcome: 'failure', reason: response.reason });
    return response;
  }

  if (!validateDescriptor(liveDescriptor)) {
    const response: VerifyResponse = {
      success: false,
      allow: false,
      reason: 'INVALID_LIVE_DESCRIPTOR',
      error: 'Live descriptor must be a 128D numeric vector.',
    };
    await logAuthAttempt({ userId, outcome: 'failure', reason: response.reason });
    return response;
  }

  const storedDescriptor = await loadDescriptor(userId);
  if (!storedDescriptor || !validateDescriptor(storedDescriptor)) {
    const response: VerifyResponse = {
      success: false,
      allow: false,
      reason: 'IDENTITY_NOT_ENROLLED',
      error: 'No valid enrolled identity found for this user.',
    };
    await logAuthAttempt({ userId, outcome: 'failure', reason: response.reason });
    return response;
  }

  const threshold = resolveThreshold();
  const distance = euclideanDistance(liveDescriptor, storedDescriptor);
  const allow = distance <= threshold;
  const confidence = toConfidence(distance, threshold);

  await logAuthAttempt({
    userId,
    outcome: allow ? 'success' : 'failure',
    reason: allow ? 'MATCH' : 'MISMATCH',
    distance,
    threshold,
    confidence,
  });

  return {
    success: true,
    allow,
    reason: allow ? 'MATCH' : 'MISMATCH',
    distance,
    threshold,
    confidence,
  };
}
