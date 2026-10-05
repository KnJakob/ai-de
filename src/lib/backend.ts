import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import type { DiffLine, FileEntry } from '$lib/types';

export interface LiveDiff {
	files: FileEntry[];
	diffs: Record<string, DiffLine[]>;
}

export function getLiveDiff(path?: string): Promise<LiveDiff> {
	return invoke('get_live_diff', { path: path ?? null });
}

// Native OS folder picker. Returns null if the user cancels.
export async function pickWorkspaceFolder(): Promise<string | null> {
	const result = await open({ directory: true, multiple: false });
	return typeof result === 'string' ? result : null;
}
