// Shapes mirror what the Rust backend will eventually return as structured
// JSON (see docs/stack.md) — the mock data in $lib/mock stands in for that
// until the git2/notify/octocrab commands exist.

export type ReviewMode = 'live' | 'pr' | 'history';
export type PrTab = 'conversation' | 'files' | 'commits' | 'checks';
export type SidePanelTab = 'notes' | 'pr' | 'blame';
export type ReviewDecision = 'approved' | 'changes' | null;

export interface FileEntry {
	dir: string;
	name: string;
	status: 'A' | 'M' | 'D';
	added: number;
	removed: number;
}

// dir is "" for root-level files — don't insert a slash then, or the path
// won't match the git-relative path the backend uses as its diffs map key.
export function filePath(f: FileEntry): string {
	return f.dir ? `${f.dir}/${f.name}` : f.name;
}

export interface CodeToken {
	text: string;
	color: string;
}

export type DiffLine =
	| { kind: 'hunk'; range: string; context: string }
	| { kind: 'add' | 'del' | 'ctx'; oldLine: number | null; newLine: number | null; text: string };

// Real commit log entry from get_commit_log (src-tauri/src/git/log.rs).
// authorDate is unix seconds — convert with `new Date(authorDate * 1000)`.
export interface CommitLogEntry {
	sha: string;
	subject: string;
	authorName: string;
	authorDate: number;
}

export interface BlameLine {
	line: number;
	sha: string;
	subject: string;
	author: string;
	when: string;
}

export interface Note {
	id: number;
	path: string;
	line: number;
	text: string;
	time: string;
	author: string;
}

export interface ShortcutGroup {
	name: string;
	items: { key: string; label: string }[];
}

// Real PR data from get_pr_overview (src-tauri/src/github/pr.rs) — distinct
// from the mock-shaped PullRequest/TimelineEvent above, which stay only
// until History/Blame get their own real backend.

export interface PrAuthor {
	login: string;
	avatarUrl: string;
}

export interface PrCheckRun {
	name: string;
	state: 'passed' | 'running' | 'failed';
	detail: string;
}

export interface PrCommentRow {
	author: PrAuthor;
	body: string;
	createdAt: string;
	file: string | null;
	line: number | null;
	diffHunk: string | null;
}

export interface PrCommitRow {
	sha: string;
	message: string;
	authorName: string;
	authorDate: string | null;
}

export interface PrSummary {
	number: number;
	title: string;
	body: string | null;
	htmlUrl: string;
	author: PrAuthor;
	createdAt: string;
	baseRef: string;
	headRef: string;
	comments: PrCommentRow[];
	reviewComments: PrCommentRow[];
	checks: PrCheckRun[];
	commits: PrCommitRow[];
	files: FileEntry[];
	diffs: Record<string, DiffLine[]>;
}

export interface PrListItem {
	number: number;
	title: string;
	author: PrAuthor;
	headRef: string;
	createdAt: string;
	isCurrentBranch: boolean;
}

export type PrListResult =
	| { kind: 'notAuthenticated' }
	| { kind: 'noRemote' }
	| { kind: 'found'; owner: string; repo: string; prs: PrListItem[] };

export type PrDetailsResult =
	| { kind: 'notAuthenticated' }
	| { kind: 'noRemote' }
	| { kind: 'notFound' }
	| ({ kind: 'found' } & PrSummary);

export interface DeviceCodeInfo {
	deviceCode: string;
	userCode: string;
	verificationUri: string;
	interval: number;
	expiresIn: number;
}

// Cheap relative-time formatting — avoids pulling in a date library for
// "3 min ago" style labels. Falls back to the raw ISO string if unparsable.
export function formatRelativeTime(iso: string): string {
	const then = new Date(iso).getTime();
	if (Number.isNaN(then)) return iso;
	const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
	if (seconds < 60) return 'just now';
	const minutes = Math.round(seconds / 60);
	if (minutes < 60) return `${minutes} min ago`;
	const hours = Math.round(minutes / 60);
	if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
	const days = Math.round(hours / 24);
	if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
	return new Date(iso).toLocaleDateString();
}

export function initialsFor(login: string): string {
	return login.slice(0, 2).toUpperCase();
}
