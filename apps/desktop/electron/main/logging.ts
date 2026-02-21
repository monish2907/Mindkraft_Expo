import { app } from 'electron';
import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

export type AuthAttemptOutcome = 'success' | 'failure' | 'lockout';

export type AuthAttemptRecord = {
	userId: string;
	outcome: AuthAttemptOutcome;
	timestamp: string;
	reason?: string;
	distance?: number;
	threshold?: number;
	confidence?: number;
};

function getAuthLogFilePath(): string {
	return path.join(app.getPath('userData'), 'auth-attempts.log');
}

export async function logAuthAttempt(
	entry: Omit<AuthAttemptRecord, 'timestamp'> & { timestamp?: string }
): Promise<void> {
	const record: AuthAttemptRecord = {
		...entry,
		timestamp: entry.timestamp ?? new Date().toISOString(),
	};

	const logPath = getAuthLogFilePath();
	await mkdir(path.dirname(logPath), { recursive: true });
	await appendFile(logPath, `${JSON.stringify(record)}\n`, 'utf8');
}

