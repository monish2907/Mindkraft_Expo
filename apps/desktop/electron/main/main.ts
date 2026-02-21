import { app, BrowserWindow, globalShortcut } from 'electron';
import path from 'node:path';
import { registerIpcHandlers } from './ipc.js';

const isDev = !app.isPackaged;

async function createWindow(): Promise<void> {
	const mainWindow = new BrowserWindow({
		width: 1280,
		height: 800,
		show: false,
		kiosk: false,
		autoHideMenuBar: true,
		webPreferences: {
			preload: path.join(__dirname, '../preload/index.js'),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
			devTools: false,
		},
	});

	mainWindow.once('ready-to-show', () => {
		mainWindow.show();
	});

	mainWindow.webContents.on('before-input-event', (event, input) => {
		const key = input.key?.toUpperCase();
		const isCtrlShiftI = input.control && input.shift && key === 'I';
		const isF12 = key === 'F12';
		if (isCtrlShiftI || isF12) {
			event.preventDefault();
		}
	});

	mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

	if (isDev) {
		await mainWindow.loadURL('http://localhost:5173');
	} else {
		await mainWindow.loadFile(path.join(__dirname, '../../renderer/dist/index.html'));
	}
}

app.whenReady().then(async () => {
	registerIpcHandlers();

	globalShortcut.register('CommandOrControl+Shift+I', () => {});
	globalShortcut.register('F12', () => {});

	await createWindow();

	app.on('activate', async () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			await createWindow();
		}
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('will-quit', () => {
	globalShortcut.unregisterAll();
});
