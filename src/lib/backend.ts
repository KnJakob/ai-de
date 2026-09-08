import { invoke } from '@tauri-apps/api/core';
import type { DiffLine, FileEntry } from '$lib/types';

export interface LiveDiff {
	files: FileEntry[];
	diffs: Record<string, DiffLine[]>;
}

export function getLiveDiff(): Promise<LiveDiff> {
	return invoke('get_live_diff');
}
