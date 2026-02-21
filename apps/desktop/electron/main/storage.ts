import { app } from 'electron';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

type FaceDescriptorRecord = {
	user_id: string;
	descriptor: number[];
	created_at: string;
	updated_at: string;
};

type FaceDescriptorDatabase = {
	records: FaceDescriptorRecord[];
};

const databaseName = 'face-descriptors.json';

function getDatabaseFilePath(): string {
	const userDataPath = app.getPath('userData');
	return path.join(userDataPath, databaseName);
}

async function readDatabase(): Promise<FaceDescriptorDatabase> {
	const databasePath = getDatabaseFilePath();

	try {
		const content = await readFile(databasePath, 'utf8');
		const parsed = JSON.parse(content) as FaceDescriptorDatabase;
		if (!Array.isArray(parsed.records)) {
			return { records: [] };
		}
		return parsed;
	} catch {
		return { records: [] };
	}
}

async function writeDatabase(db: FaceDescriptorDatabase): Promise<void> {
	const databasePath = getDatabaseFilePath();
	await mkdir(path.dirname(databasePath), { recursive: true });
	await writeFile(databasePath, JSON.stringify(db, null, 2), 'utf8');
}

export async function saveFaceDescriptor(userId: string, descriptor: number[]): Promise<void> {
	const db = await readDatabase();
	const existingIndex = db.records.findIndex((record) => record.user_id === userId);
	const now = new Date().toISOString();

	if (existingIndex >= 0) {
		db.records[existingIndex] = {
			...db.records[existingIndex],
			descriptor,
			updated_at: now,
		};
	} else {
		db.records.push({
			user_id: userId,
			descriptor,
			created_at: now,
			updated_at: now,
		});
	}

	await writeDatabase(db);
}

export async function getFaceDescriptor(userId: string): Promise<number[] | null> {
	const db = await readDatabase();
	const record = db.records.find((item) => item.user_id === userId);
	return record?.descriptor ?? null;
}
