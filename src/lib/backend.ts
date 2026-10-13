import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import type {
	CommitLogEntry,
	DeviceCodeInfo,
	DiffLine,
	FileEntry,
	PrDetailsResult,
	PrListResult
} from '$lib/types';

export interface LiveDiff {
	files: FileEntry[];
	diffs: Record<string, DiffLine[]>;
}

export function getLiveDiff(path?: string): Promise<LiveDiff> {
	return invoke('get_live_diff', { path: path ?? null });
}

export interface BranchInfo {
	branch: string;
	defaultBranch: string | null;
}

export function getBranchInfo(path?: string): Promise<BranchInfo> {
	return invoke('get_branch_info', { path: path ?? null });
}

export function getCommitLog(path?: string): Promise<CommitLogEntry[]> {
	return invoke('get_commit_log', { path: path ?? null });
}

// Native OS folder picker. Returns null if the user cancels.
export async function pickWorkspaceFolder(): Promise<string | null> {
	const result = await open({ directory: true, multiple: false });
	return typeof result === 'string' ? result : null;
}

export function getPrList(path?: string): Promise<PrListResult> {
	return invoke('get_pr_list', { path: path ?? null });
}

export function getPrDetails(number: number, path?: string): Promise<PrDetailsResult> {
	return invoke('get_pr_details', { path: path ?? null, number });
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
