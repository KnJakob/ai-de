# TODO

Audit of what's real vs. placeholder, as of this commit. "Real" means wired
to the Rust backend or to actual component state — not just rendering mock
data from `src/lib/mock/data.ts`.

## Dead controls (render, do nothing on click)

- **Settings button** (`TitleBar.svelte`, sliders icon) — no `onclick` at
  all. No settings panel or settings state exists anywhere in the app.

## Mock data with no backend behind it

- `CommitLogView.svelte` (History mode only now) — fake commit log, not
  `git log`.
- `BlamePanel.svelte` — fake blame data, not `git blame`.
- The PR mode "Files changed" tab — still `src/lib/mock/data.ts`'s `FILES`/
  `DIFFS` (same fake `watcher.rs` diff regardless of the real PR). Real PR
  file diffs need parsing GitHub's unified-diff `patch` text into the same
  `DiffRow` shape `git2` already produces — deliberately deferred, see
  "Real PR overview" below.

PR header/conversation/checks/commits are real now (see below) — the
`PR`/`TIMELINE`/`DIFF_SNIPPETS` mock constants and their one-off types were
removed along with the old PR #128 placeholder.

## Real PR overview (implemented)

`get_pr_overview` (`src-tauri/src/github/pr.rs`) detects the repo's GitHub
owner/repo + current branch from the `origin` remote (`repo_ref.rs`), signs
in via GitHub Device Flow (`device_flow.rs`, token stored through
`tauri-plugin-keyring`), and fetches the open PR for that branch: title,
author, body, issue + review comments (with `diff_hunk` snippets), check
runs, and commits. Verified against real GitHub API responses (octocrab's
own repo) during development, not just compiled.

Still explicitly out of scope:
- **Approve / Request changes / Comment** (`PrHeader.svelte` /
  `PrConversationView.svelte`) — still call `state.approve()` /
  `requestChanges()` / `postReply()`, which only flip local UI state. No
  write calls to the GitHub API exist yet.
- **Files changed** tab (see above).
- **Sign-out** — `github_sign_out` command exists but nothing in the UI
  calls it yet; there's no way to switch GitHub accounts from the app.

## Buttons that update local UI state only (look real, aren't)

These call a real `ReviewState` method, but that method only flips
in-memory state — nothing is sent anywhere (see "Real PR overview" above
for the write-action gap this covers):

- **Pin note / delete note** (`NotesPanel.svelte`, `DiffView.svelte` →
  `state.pinNote()` / `deleteNote()`) — notes live in a `$state` array only.
  No JSON sidecar persistence (the plan in `docs/stack.md`), so all notes
  are lost on restart.

## Backend dependencies with zero wiring

- **`notify`** — no filesystem watcher. Live mode currently polls
  `get_live_diff` every 10s (`+page.svelte`) instead of reacting to
  real file-change events.

(`octocrab` and `tauri-plugin-keyring` are now wired — see "Real PR
overview" above.)

## Hardcoded display values (not derived from real state)

- **Branch name** (`ModeBar.svelte`) — `"agent/debounce-watcher"` / `"main"`
  are literal strings, not the real repo's current branch. (The real branch
  is already fetched for PR matching in `repo_ref.rs` — just not surfaced
  here yet.)
- **"Agent writing · 2s ago" badge** (`ModeBar.svelte`) — decorative,
  always on, not tied to any real agent-activity signal.

## Feature ideas

- **Quick file hopping** — LSP-style "go to definition" / "go to references"
  jump mechanics for navigating between files in diffs/blame. Read-only
  (jump, no edit), fits the viewer-only scope. Needs discussion first: see
  `CLAUDE.md` "Don'ts" — LSP/code-jumping explicitly deferred to phase 2.

## Known correct-but-partial backend behavior

- **`get_live_diff`** only diffs workdir vs. `HEAD` (uncommitted changes).
  No branch-comparison, no commit-range diff — both mentioned as goals in
  `docs/stack.md` but not implemented.
- **Multi-project tabs** (`TitleBar.svelte`) — only one real workspace
  exists at a time (picked via the folder selector); the UI shows one tab,
  not the multi-tab system the original design mocked.
