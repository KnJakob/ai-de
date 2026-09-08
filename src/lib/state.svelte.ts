import { getLiveDiff } from '$lib/backend';
import { FILES, INITIAL_NOTES } from '$lib/mock/data';
import type { DiffLine, FileEntry, Note, PrTab, ReviewDecision, ReviewMode, SidePanelTab } from '$lib/types';
import { filePath } from '$lib/types';

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
	composerLine = $state<number | null>(52);
	composerText = $state('');
	notes = $state<Note[]>(INITIAL_NOTES);
	#nextNoteId = 3;

	// Real workdir-vs-HEAD diff from the Rust backend (git2) — Live mode and
	// the always-visible file tree read from these, not from mock data.
	// PR/History/Blame stay mock until GitHub/log integration exists.
	files = $state<FileEntry[]>([]);
	diffs = $state<Record<string, DiffLine[]>>({});
	liveDiffLoading = $state(false);
	liveDiffError = $state<string | null>(null);

	async loadLiveDiff() {
		this.liveDiffLoading = true;
		this.liveDiffError = null;
		try {
			const { files, diffs } = await getLiveDiff();
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
		this.composerLine = this.composerLine ?? 52;
		this.sidePanelTab = 'notes';
		this.replyText = '';
	}
}
