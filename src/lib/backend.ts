import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import type { DeviceCodeInfo, DiffLine, FileEntry, PrOverview } from '$lib/types';

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

export function getPrOverview(path?: string): Promise<PrOverview> {
	return invoke('get_pr_overview', { path: path ?? null });
}

export function startGithubDeviceFlow(): Promise<DeviceCodeInfo> {
	return invoke('github_start_device_flow');
}

// Resolves once the user approves on github.com, or rejects on
// denial/expiry — may take anywhere from seconds to minutes.
export function pollGithubDeviceFlow(info: DeviceCodeInfo): Promise<void> {
	return invoke('github_poll_device_flow', {
		deviceCode: info.deviceCode,
		interval: info.interval,
		expiresIn: info.expiresIn
	});
}

export function signOutGithub(): Promise<void> {
	return invoke('github_sign_out');
}
