# CLAUDE.md — AI-DE

## Project Goal

AI-DE is a lightweight, **read-only** Tauri desktop app for reviewing code produced by AI coding agents. It shows:

- Live diffs while an agent is working (filesystem watcher)
- Git history: branch comparison, blame, commit log
- GitHub PRs: description, diff, existing comments
- Your own free-text notes on local diffs

**What AI-DE explicitly is not:** not a code editor, not an IDE replacement, not a replacement for Git CLI workflows. The name deliberately plays on "AI" + "IDE", but the function stays viewing, not editing.

Stack details: see `docs/stack.md`.

## Architecture Principle

Strict separation:
- **Rust (`src-tauri/`)**: all logic — Git operations (`git2`), filesystem watching (`notify`), GitHub API (`octocrab`), notes persistence (JSON sidecar files). Returns only fully structured JSON via Tauri commands.
- **Svelte (`src/`)**: display and interaction layer only. No diffing, no Git parsing, no business logic in the frontend.

When unsure whether something belongs in frontend or backend: if it transforms data or talks to the filesystem/Git/GitHub → Rust. If it only renders or holds local UI state (expanded panels, active tab) → Svelte.

## Do's

- Tauri commands always return structured, typed JSON (file, hunks, lines with added/removed/context, comments, blame info) — never raw Git output or unparsed strings
- One `notify` watcher handle per open project tab, cleaned up properly when the tab is closed
- Keep Rust structs and TS interfaces in sync (e.g. via `ts-rs` or `specta`) so backend and frontend don't drift apart
- Handle errors explicitly at the boundaries: Git errors (no repo, corrupted state), GitHub rate limits, network errors — surface them clearly in the UI, don't just log them
- Store the GitHub token only via the `keyring` plugin, never in plaintext, never in logs or error messages
- Write Rust unit tests for diff logic, Git operations, and notes persistence
- Briefly justify new dependencies (bundle size/compile time matter in Tauri)

## Don'ts

- Don't add an editing feature — not even "small" inline edits, that contradicts the core principle
- Don't add SQL/a database — notes stay JSON sidecar files
- Don't implement LSP/code-jumping without discussing it explicitly first (deliberately deferred to phase 2)
- Don't add GitLab or any other provider support — GitHub only
- Don't add Windows-specific code (no `cfg(windows)` path to maintain) — target platforms are macOS and Linux
- Don't put diff or Git logic in Svelte code — that belongs in the Rust backend
- Don't write business-logic tests for pure rendering (Svelte components that just display JSON don't need unit tests for that)

## Conventions

- **Commits:** Angular Commit Convention, always with a scope (e.g. `feat(git-diff): add blame view`, `fix(github-auth): handle token refresh`)
- **Folder structure:** `src/` for Svelte/TS, `src-tauri/` for Rust, `docs/` for project documentation (incl. `stack.md`)
- **Code comments/docs:** English for code comments and commit messages

## Known Scope Boundaries (as of now)

- No Windows support
- No GitLab support
- No LSP / code-jumping
- No SQL database

These are deliberate decisions, not open TODOs — check in explicitly before changing any of them.
