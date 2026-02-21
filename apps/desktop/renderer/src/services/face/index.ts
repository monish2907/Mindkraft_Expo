import type { FaceEnrollResponse, FaceVerifyResponse } from '../../types';

function getFaceAuthBridge(): Window['faceAuth'] | null {
	if (typeof window === 'undefined' || !window.faceAuth) {
		return null;
	}

	return window.faceAuth;
}

export async function enrollIdentity(userId: string, descriptor: number[]): Promise<FaceEnrollResponse> {
	const faceAuth = getFaceAuthBridge();
	if (!faceAuth) {
		return {
			success: false,
			error: 'Face auth bridge unavailable. Start the app via Electron to use enrollment.',
		};
	}

	return faceAuth.enrollIdentity(userId, descriptor);
}

export async function verifyIdentity(userId: string, liveDescriptor: number[]): Promise<FaceVerifyResponse> {
	const faceAuth = getFaceAuthBridge();
	if (!faceAuth) {
		return {
			success: false,
			allow: false,
			reason: 'FACE_AUTH_BRIDGE_UNAVAILABLE',
			error: 'Face auth bridge unavailable. Start the app via Electron to use verification.',
		};
	}

	return faceAuth.verifyIdentity(userId, liveDescriptor);
}

export async function logAuthAttempt(payload: {
	userId: string;
	outcome: 'success' | 'failure' | 'lockout';
	reason?: string;
	distance?: number;
	threshold?: number;
	confidence?: number;
}): Promise<{ success: boolean; error?: string }> {
	const faceAuth = getFaceAuthBridge();
	if (!faceAuth?.logAuthAttempt) {
		return { success: false, error: 'logAuthAttempt is unavailable.' };
	}

	return faceAuth.logAuthAttempt(payload);
}

export async function lockSystem(payload?: {
	userId?: string;
	reason?: string;
}): Promise<{ success: boolean; error?: string }> {
	const faceAuth = getFaceAuthBridge();
	if (!faceAuth?.lockSystem) {
		return { success: false, error: 'lockSystem is unavailable.' };
	}

	return faceAuth.lockSystem(payload);
}

export async function setKioskMode(enable: boolean): Promise<{ success: boolean; error?: string }> {
	const faceAuth = getFaceAuthBridge();
	if (!faceAuth) {
		return { success: false, error: 'setKioskMode is unavailable.' };
	}

	return faceAuth.setKioskMode(enable);
}
