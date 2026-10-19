import type { ReviewState } from '$lib/state.svelte';

// The single source of truth for every keyboard shortcut: the engine
// (./engine.ts) dispatches keystrokes through this list, and ShortcutsDialog
// renders it — so the help sheet can never drift from what's actually bound.
// Flat vim-inspired bindings (no counts, no operators — there's nothing to
// edit here, just motions and search over a read-only diff).
export interface Command {
	id: string;
	group: string;
	label: string;
	/// Must match the token keyToken() produces in engine.ts.
	key: string;
	/// Human-readable form for the shortcuts sheet (e.g. "⌘L").
	display: string;
	when?: (state: ReviewState) => boolean;
	run: (state: ReviewState) => void;
}

const diffShowing = (state: ReviewState) =>
	state.mode === 'live' || (state.mode === 'pr' && state.prTab === 'files');

export const COMMANDS: Command[] = [
	{ id: 'next-file', group: 'Navigate', label: 'Next file', key: 'j', display: 'j', run: (s) => s.nextFile() },
	{ id: 'prev-file', group: 'Navigate', label: 'Previous file', key: 'k', display: 'k', run: (s) => s.prevFile() },
	{
		id: 'next-hunk',
		group: 'Navigate',
		label: 'Next hunk',
		key: ']',
		display: ']',
		when: diffShowing,
		run: (s) => s.nextHunk()
	},
	{
		id: 'prev-hunk',
		group: 'Navigate',
		label: 'Previous hunk',
		key: '[',
		display: '[',
		when: diffShowing,
		run: (s) => s.prevHunk()
	},
	{
		id: 'scroll-down',
		group: 'Navigate',
		label: 'Scroll file down',
		key: 'd',
		display: 'd',
		when: diffShowing,
		run: (s) => s.scrollDiffDown()
	},
	{
		id: 'scroll-up',
		group: 'Navigate',
		label: 'Scroll file up',
		key: 'u',
		display: 'u',
		when: diffShowing,
		run: (s) => s.scrollDiffUp()
	},
	{
		id: 'search',
		group: 'Search',
		label: 'Search this diff',
		key: '/',
		display: '/',
		when: diffShowing,
		run: (s) => s.openSearch()
	},
	{
		id: 'next-match',
		group: 'Search',
		label: 'Next match',
		key: 'n',
		display: 'n',
		when: (s) => s.searchQuery.trim().length > 0,
		run: (s) => s.nextMatch()
	},
	{
		id: 'prev-match',
		group: 'Search',
		label: 'Previous match',
		key: 'N',
		display: 'N',
		when: (s) => s.searchQuery.trim().length > 0,
		run: (s) => s.prevMatch()
	},
	{
		id: 'toggle-wrap',
		group: 'View',
		label: 'Toggle word wrap',
		key: 'w',
		display: 'w',
		when: diffShowing,
		run: (s) => s.toggleWrap()
	},
	{
		id: 'panel-notes',
		group: 'Panels',
		label: 'Notes',
		key: 'mod+1',
		display: '⌘1',
		run: (s) => s.setSidePanelTab('notes')
	},
	{
		id: 'panel-pr',
		group: 'Panels',
		label: 'Pull request',
		key: 'mod+2',
		display: '⌘2',
		when: (s) => s.mode !== 'pr',
		run: (s) => s.setSidePanelTab('pr')
	},
	{
		id: 'panel-blame',
		group: 'Panels',
		label: 'Blame',
		key: 'mod+3',
		display: '⌘3',
		run: (s) => s.setSidePanelTab('blame')
	},
	{ id: 'mode-live', group: 'Sources', label: 'Live diff', key: 'mod+l', display: '⌘L', run: (s) => s.setMode('live') },
	{ id: 'mode-pr', group: 'Sources', label: 'Pull requests', key: 'mod+p', display: '⌘P', run: (s) => s.setMode('pr') },
	{ id: 'refresh', group: 'Sources', label: 'Refresh from Git', key: 'mod+r', display: '⌘R', run: (s) => s.loadLiveDiff() },
	{
		id: 'mode-history',
		group: 'Sources',
		label: 'History / log',
		key: 'mod+h',
		display: '⌘H',
		run: (s) => s.setMode('history')
	},
	{
		id: 'toggle-shortcuts',
		group: 'Sources',
		label: 'This sheet',
		key: 'mod+/',
		display: '⌘/',
		run: (s) => s.toggleShortcuts()
	},
	{
		id: 'open-folder',
		group: 'Workspace',
		label: 'Open a different folder',
		key: 'mod+o',
		display: '⌘O',
		run: (s) => s.pickWorkspace()
	}
];
