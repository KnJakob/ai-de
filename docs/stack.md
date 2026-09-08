# Stack — Agent Code Review App

Tauri desktop app for viewing code, diffs, and PRs from agent runs. **Read-only, not a code editor.**

## Purpose of the app

- Live view of running agent runs: a filesystem watcher observes the working directory, diffs come from Git (workdir vs. HEAD)
- Historical view: branch comparison, blame, commit log over existing commits
- GitHub PR view: diff, description, existing comments; own comments post back through the GitHub API
- Own free-text notes on local diffs (separate from PR comments)
- Multiple project folders open at once, usually one agent run per folder at a time

## Target platforms

- macOS and Linux (no Windows support needed)

## Frontend

- **Framework:** Svelte + TypeScript
- **UI components:** shadcn-svelte (Tailwind-based, Bits UI instead of Radix) — for tabs, resizable panels, dropdowns, dialogs
- **Styling:** Tailwind CSS
- **Syntax highlighting:** Shiki (TextMate grammars, no LSP integration)
  - No go-to-definition/code-jumping for now — if needed later, build a separate subproject with an LSP client (lsp-types crate, one language-server process per language)
- **Large lists/diffs:** svelte-virtual-list for virtual scrolling
- **State management:** no external store framework needed — one Svelte store per open project tab is enough

## Backend (Rust / Tauri v2)

- **Filesystem watcher:** `notify` crate, one watcher handle per open project folder, reports changes to the frontend as Tauri events
- **Git operations:** `git2` crate (libgit2 bindings) — covers:
  - Workdir-vs-HEAD diff (live view)
  - Branch comparison
  - Blame
  - Commit log search
- **GitHub integration:** `octocrab` crate
  - Fetch PR metadata (description, status)
  - Fetch existing PR comments
  - Post own comments back through the API
  - **Auth:** OAuth Device Flow — no client secret needed (fits desktop apps), user logs in with their own GitHub account, app gets a user-scoped access token
  - Token storage: through Tauri's `keyring` plugin (no plaintext)
- **Own notes:** JSON sidecar files (`serde_json`), no SQLite, no database overhead
  - Keying: repo path + commit hash + file path
  - Free-text notes on local diffs only, kept separate from PR comments (which go through GitHub)

## Architecture principles

- One `notify` watcher handle per open project tab in the Rust backend, plus one Svelte store per tab in the frontend
- Two diff modes in the UI:
  1. **Local live diff** — filesystem-watcher-based, Git workdir diff
  2. **PR diff** — GitHub-API-based, including description and comment thread
- Tauri commands return only structured JSON (files, hunks, lines, added/removed/context, comments, blame info) — the frontend is a pure display and interaction layer, no diff logic of its own
- No code-editing feature — the app only displays

## Explicitly out of scope (for now)

- No Windows support
- No GitLab support
- No LSP / code-jumping (maybe phase 2)
- No SQL database
