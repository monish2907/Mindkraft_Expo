export type FaceEnrollResponse = {
	success: boolean;
	message?: string;
	error?: string;
};

export type FaceVerifyResponse = {
	success: boolean;
	allow: boolean;
	reason?: string;
	distance?: number;
	threshold?: number;
	confidence?: number;
	error?: string;
};

declare global {
	interface Window {
		faceAuth: {
			enrollIdentity: (userId: string, descriptor: number[]) => Promise<FaceEnrollResponse>;
			verifyIdentity: (userId: string, liveDescriptor: number[]) => Promise<FaceVerifyResponse>;
			logAuthAttempt?: (payload: {
				userId: string;
				outcome: 'success' | 'failure' | 'lockout';
				reason?: string;
				distance?: number;
				threshold?: number;
				confidence?: number;
			}) => Promise<{ success: boolean; error?: string }>;
			lockSystem?: (payload?: { userId?: string; reason?: string }) => Promise<{ success: boolean; error?: string }>;
			setKioskMode: (enable: boolean) => Promise<{ success: boolean; error?: string }>;
		};
	}
}
