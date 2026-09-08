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

export interface Commit {
	sha: string;
	subject: string;
	author: string;
	when: string;
}

export interface BlameLine {
	line: number;
	sha: string;
	subject: string;
	author: string;
	when: string;
}

export interface PrCheck {
	name: string;
	detail: string;
	state: 'passed' | 'running';
}

export interface PrComment {
	author: string;
	initials: string;
	file?: string;
	line?: number;
	text: string;
	time: string;
}

export interface PullRequest {
	number: number;
	title: string;
	author: string;
	opened: string;
	body: string;
	bullets: string[];
	checks: PrCheck[];
	comments: PrComment[];
}

export interface TimelineEvent {
	kind: 'body' | 'comment' | 'event';
	author?: string;
	initials?: string;
	time: string;
	text: string;
	verb?: string;
	file?: string;
	line?: number;
	icon?: 'commit' | 'check';
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
