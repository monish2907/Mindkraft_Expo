import { BrowserWindow, ipcMain } from 'electron';
import { enrollIdentity, verifyIdentity } from './faceIdentityService.js';
import { clearWindowAuthentication, markWindowAuthenticated, setKioskModeForWindow } from './kiosk.js';
import { logAuthAttempt } from './logging.js';
import { getFaceDescriptor, saveFaceDescriptor } from './storage.js';

const DESCRIPTOR_LENGTH = 128;

function resolveActiveWindow(sender: Electron.WebContents): BrowserWindow | null {
	return BrowserWindow.fromWebContents(sender) ?? BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null;
}

function isValidDescriptor(descriptor: unknown): descriptor is number[] {
	return Array.isArray(descriptor)
		&& descriptor.length === DESCRIPTOR_LENGTH
		&& descriptor.every((value) => Number.isFinite(value));
}

function isValidUserId(userId: unknown): userId is string {
	return typeof userId === 'string' && userId.trim().length > 0;
}

export function registerIpcHandlers(): void {
	const handleVerifyFace = async (
		event: Electron.IpcMainInvokeEvent,
		userId: string,
		liveDescriptor: number[]
	) => {
		const activeWindow = resolveActiveWindow(event.sender);
		if (!activeWindow) {
			return {
				success: false,
				allow: false,
				reason: 'UNAUTHORIZED_WINDOW',
				error: 'No active authenticated window found.',
			};
		}

		if (!isValidUserId(userId)) {
			return {
				success: false,
				allow: false,
				reason: 'INVALID_USER_ID',
				error: 'Invalid userId.',
			};
		}

		if (!isValidDescriptor(liveDescriptor)) {
			return {
				success: false,
				allow: false,
				reason: 'INVALID_LIVE_DESCRIPTOR',
				error: 'Live descriptor must be a 128D numeric vector.',
			};
		}

		const result = await verifyIdentity(getFaceDescriptor, userId, liveDescriptor);
		if (result.success && result.allow) {
			markWindowAuthenticated(activeWindow.webContents.id);
			const kioskResult = setKioskModeForWindow(activeWindow, true);
			if (!kioskResult.success) {
				return {
					...result,
					error: kioskResult.error,
				};
			}
			return result;
		}

		clearWindowAuthentication(activeWindow.webContents.id);
		return result;
	};

	ipcMain.handle('face-auth:enroll-identity', async (_event, userId: string, descriptor: number[]) => {
		try {
			return await enrollIdentity(saveFaceDescriptor, userId, descriptor);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to save face descriptor.';
			return { success: false, error: message };
		}
	});

	ipcMain.handle('verify-face', async (event, userId: string, liveDescriptor: number[]) => {
		try {
			return await handleVerifyFace(event, userId, liveDescriptor);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to verify identity.';
			return {
				success: false,
				allow: false,
				reason: 'VERIFY_ERROR',
				error: message,
			};
		}
	});

	ipcMain.handle('face-auth:verify-identity', async (event, userId: string, liveDescriptor: number[]) => {
		try {
			return await handleVerifyFace(event, userId, liveDescriptor);
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to verify identity.';
			return {
				success: false,
				allow: false,
				reason: 'VERIFY_ERROR',
				error: message,
			};
		}
	});

	ipcMain.handle('log-auth-attempt', async (_event, payload: {
		userId: string;
		outcome: 'success' | 'failure' | 'lockout';
		reason?: string;
		distance?: number;
		threshold?: number;
		confidence?: number;
	}) => {
		try {
			if (!payload || !isValidUserId(payload.userId)) {
				return { success: false, error: 'Invalid auth log payload.' };
			}

			if (!['success', 'failure', 'lockout'].includes(payload.outcome)) {
				return { success: false, error: 'Invalid auth outcome.' };
			}

			await logAuthAttempt(payload);
			return { success: true };
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to log auth attempt.';
			return { success: false, error: message };
		}
	});

	ipcMain.handle('lock-system', async (event, payload?: { userId?: string; reason?: string }) => {
		try {
			const activeWindow = resolveActiveWindow(event.sender);
			if (!activeWindow) {
				return { success: false, error: 'No active window found.' };
			}

			clearWindowAuthentication(activeWindow.webContents.id);
			const kioskResult = setKioskModeForWindow(activeWindow, false);

			await logAuthAttempt({
				userId: isValidUserId(payload?.userId) ? payload.userId : 'unknown',
				outcome: 'lockout',
				reason: payload?.reason ?? 'MAX_ATTEMPTS_REACHED',
			});

			if (!kioskResult.success) {
				return kioskResult;
			}

			return { success: true };
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to lock system.';
			return { success: false, error: message };
		}
	});

	ipcMain.handle('app:set-kiosk-mode', (_event, enable: boolean) => {
		try {
			const activeWindow = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
			if (!activeWindow) {
				return { success: false, error: 'No active window found.' };
			}

			return setKioskModeForWindow(activeWindow, Boolean(enable));
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : 'Failed to set kiosk mode.';
			return { success: false, error: message };
		}
	});
}
