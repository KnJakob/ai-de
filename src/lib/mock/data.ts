import type {
	BlameLine,
	Commit,
	DiffLine,
	FileEntry,
	Note,
	PullRequest,
	ShortcutGroup,
	TimelineEvent
} from '$lib/types';

export function filePath(f: FileEntry): string {
	return `${f.dir}/${f.name}`;
}

export const FILES: FileEntry[] = [
	{ dir: 'src-tauri/src/git', name: 'watcher.rs', status: 'M', added: 24, removed: 6 },
	{ dir: 'src-tauri/src/git', name: 'diff.rs', status: 'A', added: 112, removed: 0 },
	{ dir: 'src-tauri/src/git', name: 'mod.rs', status: 'M', added: 3, removed: 1 },
	{ dir: 'src/lib/components', name: 'DiffPane.svelte', status: 'M', added: 48, removed: 12 },
	{ dir: 'src/lib/components', name: 'FileTree.svelte', status: 'M', added: 9, removed: 9 },
	{ dir: 'src-tauri', name: 'Cargo.toml', status: 'M', added: 2, removed: 0 }
];

export const DIFFS: Record<string, DiffLine[]> = {
	'src-tauri/src/git/watcher.rs': [
		{ kind: 'hunk', range: '@@ -12,6 +12,8 @@', context: 'mod watcher' },
		{ kind: 'ctx', oldLine: 12, newLine: 12, text: 'use notify::{Config, RecommendedWatcher, RecursiveMode, Watcher};' },
		{ kind: 'ctx', oldLine: 13, newLine: 13, text: 'use std::sync::mpsc::channel;' },
		{ kind: 'del', oldLine: 14, newLine: '', text: 'use std::time::Duration;' },
		{ kind: 'add', oldLine: '', newLine: 14, text: 'use std::time::{Duration, Instant};' },
		{ kind: 'add', oldLine: '', newLine: 15, text: 'use std::collections::HashMap;' },
		{ kind: 'ctx', oldLine: 15, newLine: 16, text: 'use tauri::{AppHandle, Emitter};' },
		{ kind: 'hunk', range: '@@ -41,9 +43,18 @@', context: 'impl WatcherRegistry' },
		{ kind: 'ctx', oldLine: 41, newLine: 43, text: '    pub fn watch(&mut self, tab: TabId, root: PathBuf) -> Result<()> {' },
		{ kind: 'del', oldLine: 42, newLine: '', text: '        let (tx, rx) = channel();' },
		{ kind: 'add', oldLine: '', newLine: 44, text: '        // Agents write in bursts; collapse them before we touch Git.' },
		{ kind: 'add', oldLine: '', newLine: 45, text: '        let (tx, rx) = channel();' },
		{ kind: 'add', oldLine: '', newLine: 46, text: '        let mut seen: HashMap<PathBuf, Instant> = HashMap::new();' },
		{ kind: 'add', oldLine: '', newLine: 47, text: '        let debounce = Duration::from_millis(120);' },
		{ kind: 'ctx', oldLine: 43, newLine: 48, text: '' },
		{ kind: 'ctx', oldLine: 44, newLine: 49, text: '        let mut watcher = RecommendedWatcher::new(tx, Config::default())?;' },
		{ kind: 'ctx', oldLine: 45, newLine: 50, text: '        watcher.watch(&root, RecursiveMode::Recursive)?;' },
		{ kind: 'ctx', oldLine: 46, newLine: 51, text: '' },
		{ kind: 'del', oldLine: 47, newLine: '', text: '        for event in rx {' },
		{ kind: 'del', oldLine: 48, newLine: '', text: '            self.app.emit("fs:changed", event.paths)?;' },
		{ kind: 'add', oldLine: '', newLine: 52, text: '        for event in rx.iter().flatten() {' },
		{ kind: 'add', oldLine: '', newLine: 53, text: '            let now = Instant::now();' },
		{ kind: 'add', oldLine: '', newLine: 54, text: '            let fresh: Vec<PathBuf> = event' },
		{ kind: 'add', oldLine: '', newLine: 55, text: '                .paths' },
		{ kind: 'add', oldLine: '', newLine: 56, text: '                .into_iter()' },
		{ kind: 'add', oldLine: '', newLine: 57, text: '                .filter(|p| match seen.get(p) {' },
		{ kind: 'add', oldLine: '', newLine: 58, text: '                    Some(last) => now.duration_since(*last) > debounce,' },
		{ kind: 'add', oldLine: '', newLine: 59, text: '                    None => true,' },
		{ kind: 'add', oldLine: '', newLine: 60, text: '                })' },
		{ kind: 'add', oldLine: '', newLine: 61, text: '                .collect();' },
		{ kind: 'add', oldLine: '', newLine: 62, text: '' },
		{ kind: 'add', oldLine: '', newLine: 63, text: '            if fresh.is_empty() { continue; }' },
		{ kind: 'add', oldLine: '', newLine: 64, text: '            for p in &fresh { seen.insert(p.clone(), now); }' },
		{ kind: 'add', oldLine: '', newLine: 65, text: '            self.app.emit("fs:changed", &fresh)?;' },
		{ kind: 'ctx', oldLine: 49, newLine: 66, text: '        }' },
		{ kind: 'ctx', oldLine: 50, newLine: 67, text: '    }' },
		{ kind: 'hunk', range: '@@ -58,4 +75,9 @@', context: 'impl WatcherRegistry' },
		{ kind: 'ctx', oldLine: 58, newLine: 75, text: '    pub fn unwatch(&mut self, tab: TabId) {' },
		{ kind: 'del', oldLine: 59, newLine: '', text: '        self.handles.remove(&tab);' },
		{ kind: 'add', oldLine: '', newLine: 76, text: '        if let Some(handle) = self.handles.remove(&tab) {' },
		{ kind: 'add', oldLine: '', newLine: 77, text: '            handle.stop();' },
		{ kind: 'add', oldLine: '', newLine: 78, text: '        }' },
		{ kind: 'ctx', oldLine: 60, newLine: 79, text: '    }' },
		{ kind: 'ctx', oldLine: 61, newLine: 80, text: '}' }
	],
	'src-tauri/src/git/diff.rs': [
		{ kind: 'hunk', range: '@@ -0,0 +1,112 @@', context: 'new file' },
		{ kind: 'add', oldLine: '', newLine: 1, text: 'use git2::{Diff, DiffOptions, Repository};' },
		{ kind: 'add', oldLine: '', newLine: 2, text: 'use serde::Serialize;' },
		{ kind: 'add', oldLine: '', newLine: 3, text: '' },
		{ kind: 'add', oldLine: '', newLine: 4, text: '#[derive(Serialize)]' },
		{ kind: 'add', oldLine: '', newLine: 5, text: 'pub struct FileDiff {' },
		{ kind: 'add', oldLine: '', newLine: 6, text: '    pub path: String,' },
		{ kind: 'add', oldLine: '', newLine: 7, text: '    pub hunks: Vec<Hunk>,' },
		{ kind: 'add', oldLine: '', newLine: 8, text: '    pub added: usize,' },
		{ kind: 'add', oldLine: '', newLine: 9, text: '    pub removed: usize,' },
		{ kind: 'add', oldLine: '', newLine: 10, text: '}' }
	],
	'src-tauri/src/git/mod.rs': [
		{ kind: 'hunk', range: '@@ -1,5 +1,7 @@', context: '' },
		{ kind: 'ctx', oldLine: 1, newLine: 1, text: 'pub mod blame;' },
		{ kind: 'add', oldLine: '', newLine: 2, text: 'pub mod diff;' },
		{ kind: 'ctx', oldLine: 2, newLine: 3, text: 'pub mod log;' },
		{ kind: 'del', oldLine: 3, newLine: '', text: 'pub mod watch;' },
		{ kind: 'add', oldLine: '', newLine: 4, text: 'pub mod watcher;' },
		{ kind: 'ctx', oldLine: 4, newLine: 5, text: '' }
	],
	'src/lib/components/DiffPane.svelte': [
		{ kind: 'hunk', range: '@@ -18,7 +18,12 @@', context: 'script' },
		{ kind: 'ctx', oldLine: 18, newLine: 18, text: '  let { file, notes }: Props = $props();' },
		{ kind: 'del', oldLine: 19, newLine: '', text: '  let rows = $derived(file.hunks.flatMap((h) => h.lines));' },
		{ kind: 'add', oldLine: '', newLine: 19, text: '  // Rows come pre-flattened from Rust — no diff logic here.' },
		{ kind: 'add', oldLine: '', newLine: 20, text: '  let rows = $derived(file.rows);' },
		{ kind: 'add', oldLine: '', newLine: 21, text: '  let pinned = $derived(new Map(notes.map((n) => [n.line, n])));' },
		{ kind: 'ctx', oldLine: 20, newLine: 22, text: '' },
		{ kind: 'ctx', oldLine: 21, newLine: 23, text: '  function pin(line: number) {' },
		{ kind: 'add', oldLine: '', newLine: 24, text: '    dispatch("pin", { path: file.path, line });' },
		{ kind: 'ctx', oldLine: 22, newLine: 25, text: '  }' }
	],
	'src/lib/components/FileTree.svelte': [
		{ kind: 'hunk', range: '@@ -7,9 +7,9 @@', context: 'markup' },
		{ kind: 'ctx', oldLine: 7, newLine: 7, text: '{#each groups as group (group.dir)}' },
		{ kind: 'del', oldLine: 8, newLine: '', text: '  <span class="dir">{group.dir}</span>' },
		{ kind: 'add', oldLine: '', newLine: 8, text: '  <span class="dir">{shortenDir(group.dir)}</span>' },
		{ kind: 'ctx', oldLine: 9, newLine: 9, text: '  {#each group.files as f (f.path)}' },
		{ kind: 'del', oldLine: 10, newLine: '', text: '    <FileRow {f} />' },
		{ kind: 'add', oldLine: '', newLine: 10, text: '    <FileRow {f} noteCount={counts[f.path] ?? 0} />' },
		{ kind: 'ctx', oldLine: 11, newLine: 11, text: '  {/each}' },
		{ kind: 'ctx', oldLine: 12, newLine: 12, text: '{/each}' }
	],
	'src-tauri/Cargo.toml': [
		{ kind: 'hunk', range: '@@ -21,2 +21,4 @@', context: 'dependencies' },
		{ kind: 'ctx', oldLine: 21, newLine: 21, text: 'notify = "6.1"' },
		{ kind: 'add', oldLine: '', newLine: 22, text: 'octocrab = "0.39"' },
		{ kind: 'add', oldLine: '', newLine: 23, text: 'keyring = "3.2"' },
		{ kind: 'ctx', oldLine: 22, newLine: 24, text: 'serde_json = "1.0"' }
	]
};

export const COMMITS: Commit[] = [
	{ sha: '4f1c9ab', subject: 'feat(git-watcher): debounce agent write bursts', author: 'agent/claude-code', when: '4 min ago' },
	{ sha: 'b02d117', subject: 'feat(git-diff): structured hunk payload from Rust', author: 'agent/claude-code', when: '38 min ago' },
	{ sha: '9ae4402', subject: 'refactor(ui): move diff flattening out of Svelte', author: 'K. Jakob', when: '2 hours ago' },
	{ sha: '77b1e5d', subject: 'fix(github-auth): retry device-flow polling on 428', author: 'K. Jakob', when: 'yesterday' },
	{ sha: 'c31f880', subject: 'feat(notes): JSON sidecar keyed by repo + commit + path', author: 'agent/claude-code', when: '2 days ago' },
	{ sha: '1d6aa93', subject: 'chore(tauri): drop Windows targets from bundle config', author: 'K. Jakob', when: '3 days ago' }
];

export const BLAME: BlameLine[] = [
	{ line: 43, sha: '9ae4402', subject: 'refactor(ui): move diff flattening out of Svelte', author: 'K. Jakob', when: '2 hours ago' },
	{ line: 44, sha: '4f1c9ab', subject: 'feat(git-watcher): debounce agent write bursts', author: 'agent/claude-code', when: '4 min ago' },
	{ line: 47, sha: '4f1c9ab', subject: 'feat(git-watcher): debounce agent write bursts', author: 'agent/claude-code', when: '4 min ago' },
	{ line: 49, sha: 'e88c204', subject: 'feat(watch): one notify handle per project tab', author: 'K. Jakob', when: '6 days ago' },
	{ line: 52, sha: '4f1c9ab', subject: 'feat(git-watcher): debounce agent write bursts', author: 'agent/claude-code', when: '4 min ago' },
	{ line: 66, sha: 'e88c204', subject: 'feat(watch): one notify handle per project tab', author: 'K. Jakob', when: '6 days ago' },
	{ line: 75, sha: '2ab7f19', subject: 'feat(tabs): close a project tab cleanly', author: 'K. Jakob', when: '5 days ago' },
	{ line: 76, sha: '4f1c9ab', subject: 'feat(git-watcher): debounce agent write bursts', author: 'agent/claude-code', when: '4 min ago' }
];

const PR_BODY =
	'The watcher emitted one fs:changed event per write, so a single agent edit pass fired 40+ Git diffs and the pane flickered. Writes are now collapsed per path inside a 120 ms window, and unwatch stops the handle instead of only dropping it from the map.';

export const PR: PullRequest = {
	number: 128,
	title: 'feat(git-watcher): debounce agent write bursts',
	author: 'agent/claude-code',
	opened: 'opened 12 minutes ago',
	body: PR_BODY,
	bullets: [
		'Watcher collapses repeated writes to the same path inside a 120 ms window before emitting fs:changed.',
		'unwatch() now stops the notify handle instead of only dropping it from the registry map.',
		'Diff flattening moved out of Svelte — DiffPane renders the rows Rust hands it.'
	],
	checks: [
		{ name: 'cargo test — src-tauri', detail: '84 tests, 0 failed', state: 'passed' },
		{ name: 'cargo clippy', detail: 'no warnings', state: 'passed' },
		{ name: 'svelte-check', detail: 'queued behind clippy', state: 'running' }
	],
	comments: [
		{ author: 'K. Jakob', initials: 'KJ', file: 'watcher.rs', line: 47, text: 'Pull the 120 ms out into a setting before this lands — different agents write at very different rates.', time: '6 min ago' },
		{ author: 'agent/claude-code', initials: 'AC', text: 'Noted. Threading it through WatcherConfig in the next pass; the constant stays as the default.', time: '4 min ago' },
		{ author: 'M. Weber', initials: 'MW', file: 'watcher.rs', line: 76, text: 'Good catch on the leaked handle. Worth a unit test for tab close.', time: '2 min ago' }
	]
};

export const DIFF_SNIPPETS: Record<number, { line: number; sign: '+' | ''; text: string }[]> = {
	47: [
		{ line: 45, sign: '+', text: '        let (tx, rx) = channel();' },
		{ line: 46, sign: '+', text: '        let mut seen: HashMap<PathBuf, Instant> = HashMap::new();' },
		{ line: 47, sign: '+', text: '        let debounce = Duration::from_millis(120);' }
	],
	76: [
		{ line: 75, sign: '', text: '    pub fn unwatch(&mut self, tab: TabId) {' },
		{ line: 76, sign: '+', text: '        if let Some(handle) = self.handles.remove(&tab) {' },
		{ line: 77, sign: '+', text: '            handle.stop();' }
	]
};

export const TIMELINE: TimelineEvent[] = [
	{ kind: 'body', author: 'agent/claude-code', initials: 'AC', time: '12 min ago', text: PR_BODY },
	{
		kind: 'comment',
		author: 'K. Jakob',
		initials: 'KJ',
		time: '6 min ago',
		verb: 'commented on watcher.rs',
		file: 'src-tauri/src/git/watcher.rs',
		line: 47,
		text: 'Pull the 120 ms out into a setting before this lands — different agents write at very different rates, and 120 ms is far too eager for a slow one.'
	},
	{
		kind: 'comment',
		author: 'agent/claude-code',
		initials: 'AC',
		time: '4 min ago',
		verb: 'replied',
		text: 'Noted. Threading it through WatcherConfig in the next pass; the constant stays as the default.'
	},
	{
		kind: 'event',
		icon: 'commit',
		time: '4 min ago',
		text: 'agent/claude-code pushed 2 commits — 4f1c9ab, b02d117'
	},
	{
		kind: 'comment',
		author: 'M. Weber',
		initials: 'MW',
		time: '2 min ago',
		verb: 'commented on watcher.rs',
		file: 'src-tauri/src/git/watcher.rs',
		line: 76,
		text: 'Good catch on the leaked handle. Worth a unit test for tab close before this merges.'
	},
	{ kind: 'event', icon: 'check', time: '1 min ago', text: 'cargo test and clippy passed on 4f1c9ab' }
];

export const SHORTCUTS: ShortcutGroup[] = [
	{
		name: 'Navigate',
		items: [
			{ key: 'j / k', label: 'Next / previous file' },
			{ key: '] / [', label: 'Next / previous hunk' },
			{ key: '⌘P', label: 'Jump to file' },
			{ key: '⌘K', label: 'Command palette' }
		]
	},
	{
		name: 'Review',
		items: [
			{ key: 'n', label: 'Pin note on line' },
			{ key: 'b', label: 'Blame for this line' },
			{ key: 'v', label: 'Mark file viewed' },
			{ key: 'w', label: 'Toggle word wrap' }
		]
	},
	{
		name: 'Panels',
		items: [
			{ key: '⌘1', label: 'Notes' },
			{ key: '⌘2', label: 'Pull request' },
			{ key: '⌘3', label: 'Blame' },
			{ key: '⌘\\', label: 'Hide side panel' }
		]
	},
	{
		name: 'Sources',
		items: [
			{ key: '⌘L', label: 'Live diff' },
			{ key: '⌘R', label: 'Refresh from Git' },
			{ key: '⌘H', label: 'History / log' },
			{ key: '⌘/', label: 'This sheet' }
		]
	}
];

export const INITIAL_NOTES: Note[] = [
	{
		id: 1,
		path: 'src-tauri/src/git/watcher.rs',
		line: 47,
		text: 'Debounce window is hard-coded. Should come from settings before merge.',
		time: '3 min ago',
		author: 'You'
	},
	{
		id: 2,
		path: 'src-tauri/src/git/watcher.rs',
		line: 76,
		text: 'This is the leak I saw on tab close last week — verify against a long agent run.',
		time: 'just now',
		author: 'You'
	}
];
