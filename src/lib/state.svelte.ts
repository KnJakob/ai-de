import { openUrl } from '@tauri-apps/plugin-opener';
import {
	getBranchInfo,
	getLiveDiff,
	getPrOverview,
	pickWorkspaceFolder,
	pollGithubDeviceFlow,
	startGithubDeviceFlow
} from '$lib/backend';
import { DIFFS, FILES, INITIAL_NOTES } from '$lib/mock/data';
import type {
	DeviceCodeInfo,
	DiffLine,
	FileEntry,
	Note,
	PrOverview,
	PrTab,
	ReviewDecision,
	ReviewMode,
	SidePanelTab
} from '$lib/types';
import { filePath } from '$lib/types';

// What "page" the user was looking at — persisted to sessionStorage (see
// +page.svelte) so a reload lands back where it was instead of resetting to
// Live mode on the first file. Deliberately excludes notes/composer/review:
// those aren't backed by real persistence yet either (see TODO.md).
export interface PersistedUiState {
	workspacePath: string | null;
	mode: ReviewMode;
	active: string;
	prTab: PrTab;
	sidePanelTab: SidePanelTab;
	wrap: boolean;
}

const REVIEW_MODES: ReviewMode[] = ['live', 'pr', 'history'];
const PR_TABS: PrTab[] = ['conversation', 'files', 'commits', 'checks'];
const SIDE_PANEL_TABS: SidePanelTab[] = ['notes', 'pr', 'blame'];

// Single reactive store for the one open project tab. Mirrors the design's
// Component.state — kept as one class because every panel in this layout
// reacts to the same handful of selections (active file, mode, review
// decision). Real persistence (notes as JSON sidecar files) is a Tauri
// command away; for now notes just live in memory.
export class ReviewState {
	active = $state(filePath(FILES[0]));
	mode = $state<ReviewMode>('live');
	prTab = $state<PrTab>('conversation');
	sidePanelTab = $state<SidePanelTab>('notes');
	review = $state<ReviewDecision>(null);
	replyText = $state('');
	wrap = $state(false);
	shortcutsOpen = $state(false);
	composerLine = $state<number | null>(null);
	composerText = $state('');
	notes = $state<Note[]>(INITIAL_NOTES);
	#nextNoteId = 3;

	// Real workdir-vs-HEAD diff from the Rust backend (git2) — Live mode and
	// the always-visible file tree read from these, not from mock data.
	// PR/History/Blame stay mock until GitHub/log integration exists.
	// workspacePath is null until the user picks a folder, meaning "whatever
	// repo the app's cwd sits in" — the same default get_live_diff always had.
	workspacePath = $state<string | null>(null);
	files = $state<FileEntry[]>([]);
	diffs = $state<Record<string, DiffLine[]>>({});
	liveDiffLoading = $state(false);
	liveDiffError = $state<string | null>(null);

	// The real current branch (and the repo's default branch, if one is
	// configured — e.g. via "origin/HEAD"). Doesn't change mid-session the
	// way the diff does, so it's only (re)loaded on mount and on workspace
	// switch, not on the 10s live-diff poll.
	branch = $state<string | null>(null);
	defaultBranch = $state<string | null>(null);

	async loadBranchInfo() {
		try {
			const info = await getBranchInfo(this.workspacePath ?? undefined);
			this.branch = info.branch;
			this.defaultBranch = info.defaultBranch;
		} catch {
			this.branch = null;
			this.defaultBranch = null;
		}
	}

	// `restored` comes from sessionStorage (untrusted — could be stale from
	// an older build) — validate each field against its known-good values
	// instead of trusting it wholesale.
	constructor(restored?: Partial<PersistedUiState>) {
		if (!restored) return;
		if (typeof restored.workspacePath === 'string' || restored.workspacePath === null) {
			this.workspacePath = restored.workspacePath;
		}
		if (typeof restored.active === 'string' && restored.active) this.active = restored.active;
		if (restored.mode && REVIEW_MODES.includes(restored.mode)) this.mode = restored.mode;
		if (restored.prTab && PR_TABS.includes(restored.prTab)) this.prTab = restored.prTab;
		if (restored.sidePanelTab && SIDE_PANEL_TABS.includes(restored.sidePanelTab)) {
			this.sidePanelTab = restored.sidePanelTab;
		}
		if (typeof restored.wrap === 'boolean') this.wrap = restored.wrap;
	}

	async loadLiveDiff() {
		this.liveDiffLoading = true;
		this.liveDiffError = null;
		try {
			const { files, diffs } = await getLiveDiff(this.workspacePath ?? undefined);
			this.files = files;
			this.diffs = diffs;
			if (files.length && !files.some((f) => filePath(f) === this.active)) {
				this.active = filePath(files[0]);
			}
		} catch (e) {
			this.liveDiffError = e instanceof Error ? e.message : String(e);
		} finally {
			this.liveDiffLoading = false;
		}
	}

	async pickWorkspace() {
		const picked = await pickWorkspaceFolder();
		if (!picked) return;
		this.workspacePath = picked;
		await Promise.all([this.loadLiveDiff(), this.loadBranchInfo()]);
		if (this.mode === 'pr') await this.loadPrOverview();
	}

	// Real PR for the current branch (src-tauri/src/github/pr.rs) — only
	// fetched in PR mode, not eagerly on mount, since it needs a signed-in
	// GitHub token the user may not have set up yet.
	prOverview = $state<PrOverview | null>(null);
	prOverviewLoading = $state(false);
	prOverviewError = $state<string | null>(null);

	async loadPrOverview() {
		this.prOverviewLoading = true;
		this.prOverviewError = null;
		try {
			this.prOverview = await getPrOverview(this.workspacePath ?? undefined);
		} catch (e) {
			this.prOverviewError = e instanceof Error ? e.message : String(e);
		} finally {
			this.prOverviewLoading = false;
		}
	}

	// GitHub Device Flow sign-in (see src-tauri/src/github/device_flow.rs).
	// signInInfo holds the user_code to display while pollGithubDeviceFlow
	// blocks in the background waiting for approval on github.com.
	signInInfo = $state<DeviceCodeInfo | null>(null);
	signInPolling = $state(false);
	signInError = $state<string | null>(null);

	async startGithubSignIn() {
		this.signInError = null;
		try {
			const info = await startGithubDeviceFlow();
			this.signInInfo = info;
			await openUrl(info.verificationUri);
			this.signInPolling = true;
			await pollGithubDeviceFlow(info);
			this.signInInfo = null;
			this.signInPolling = false;
			await this.loadPrOverview();
		} catch (e) {
			this.signInError = e instanceof Error ? e.message : String(e);
			this.signInPolling = false;
		}
	}

	// Only hides the modal — the Rust-side poll has no cancellation token, so
	// it keeps polling in the background until GitHub's device code expires
	// (~15 min) or the user actually approves it elsewhere.
	cancelGithubSignIn() {
		this.signInInfo = null;
		this.signInPolling = false;
		this.signInError = null;
	}

	// Live mode (and the always-visible file tree) show the real git2 diff;
	// PR mode keeps its own fictional file list rather than colliding with
	// whatever the repo's actual working tree looks like. DiffFileHeader and
	// DiffView both need this same selection, so it lives here once.
	// Falls back to "ai-de" before a folder is picked, matching the app's
	// own repo — the one get_live_diff defaults to discovering from cwd.
	get workspaceName(): string {
		if (!this.workspacePath) return 'ai-de';
		return this.workspacePath.replace(/\/+$/, '').split('/').pop() || this.workspacePath;
	}

	get activeFiles(): FileEntry[] {
		return this.mode === 'pr' ? FILES : this.files;
	}

	get activeDiffs(): Record<string, DiffLine[]> {
		return this.mode === 'pr' ? DIFFS : this.diffs;
	}

	notesFor(path: string): Note[] {
		return this.notes.filter((n) => n.path === path);
	}

	setActive(path: string) {
		this.active = path;
		this.composerLine = null;
	}

	setMode(mode: ReviewMode) {
		this.mode = mode;
		this.sidePanelTab = mode === 'history' ? 'blame' : 'notes';
		if (mode === 'pr' && !this.prOverview && !this.prOverviewLoading) {
			this.loadPrOverview();
		}
	}

	toggleWrap() {
		this.wrap = !this.wrap;
	}

	toggleShortcuts() {
		this.shortcutsOpen = !this.shortcutsOpen;
	}

	pinLine(line: number) {
		this.composerLine = line;
		this.sidePanelTab = 'notes';
	}

	pinNote() {
		const text = this.composerText.trim();
		if (!text || this.composerLine === null) return;
		this.notes.push({
			id: this.#nextNoteId++,
			path: this.active,
			line: this.composerLine,
			text,
			time: 'just now',
			author: 'You'
		});
		this.composerText = '';
	}

	deleteNote(id: number) {
		this.notes = this.notes.filter((n) => n.id !== id);
	}

	approve() {
		this.review = 'approved';
	}

	requestChanges() {
		this.review = 'changes';
	}

	undoReview() {
		this.review = null;
	}

	postReply() {
		this.replyText = '';
	}

	divertReplyToNote() {
		this.composerText = this.replyText;
		this.sidePanelTab = 'notes';
		this.replyText = '';
	}
}
