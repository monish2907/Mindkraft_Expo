import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('faceAuth', {
	enrollIdentity: (userId: string, descriptor: number[]) =>
		ipcRenderer.invoke('face-auth:enroll-identity', userId, descriptor),

	verifyIdentity: (userId: string, liveDescriptor: number[]) =>
		ipcRenderer.invoke('verify-face', userId, liveDescriptor),

	logAuthAttempt: (payload: {
		userId: string;
		outcome: 'success' | 'failure' | 'lockout';
		reason?: string;
		distance?: number;
		threshold?: number;
		confidence?: number;
	}) => ipcRenderer.invoke('log-auth-attempt', payload),

	lockSystem: (payload?: { userId?: string; reason?: string }) =>
		ipcRenderer.invoke('lock-system', payload),

	setKioskMode: (enable: boolean) => ipcRenderer.invoke('app:set-kiosk-mode', enable),
});
