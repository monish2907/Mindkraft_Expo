import { BrowserWindow } from 'electron';

const authenticatedWindowIds = new Set<number>();

export function markWindowAuthenticated(windowId: number): void {
	authenticatedWindowIds.add(windowId);
}

export function clearWindowAuthentication(windowId: number): void {
	authenticatedWindowIds.delete(windowId);
}

export function setKioskModeForWindow(window: BrowserWindow, enable: boolean): { success: boolean; error?: string } {
	if (!enable) {
		window.setKiosk(false);
		clearWindowAuthentication(window.webContents.id);
		return { success: true };
	}

	if (!authenticatedWindowIds.has(window.webContents.id)) {
		return { success: false, error: 'Kiosk mode requires successful authentication.' };
	}

	window.setKiosk(true);
	return { success: true };
}

