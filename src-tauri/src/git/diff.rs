use std::cell::RefCell;
use std::collections::HashMap;

use git2::{Delta, DiffHunk, DiffOptions, Repository};
use serde::Serialize;

#[derive(Serialize, Clone, Debug)]
pub struct FileEntry {
    pub dir: String,
    pub name: String,
    pub status: String, // "A" | "M" | "D"
    pub added: u32,
    pub removed: u32,
}

#[derive(Serialize, Clone, Debug)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum DiffRow {
    #[serde(rename = "hunk")]
    Hunk { range: String, context: String },
    #[serde(rename = "add")]
    Add {
        old_line: Option<u32>,
        new_line: Option<u32>,
        text: String,
    },
    #[serde(rename = "del")]
    Del {
        old_line: Option<u32>,
        new_line: Option<u32>,
        text: String,
    },
    #[serde(rename = "ctx")]
    Ctx {
        old_line: Option<u32>,
        new_line: Option<u32>,
        text: String,
    },
}

#[derive(Serialize, Clone, Debug, Default)]
pub struct LiveDiff {
    pub files: Vec<FileEntry>,
    pub diffs: HashMap<String, Vec<DiffRow>>,
}

/// Workdir-vs-HEAD diff (staged, unstaged, and untracked changes) — the
/// "live view" from docs/stack.md. Returns rows shaped to match the
/// frontend's DiffLine union directly so the diff pane needs no
/// backend-specific parsing.
pub fn compute_live_diff(repo: &Repository) -> Result<LiveDiff, git2::Error> {
    let head_tree = repo.head()?.peel_to_tree()?;

    let mut opts = DiffOptions::new();
    opts.include_untracked(true).recurse_untracked_dirs(true);
    let diff = repo.diff_tree_to_workdir(Some(&head_tree), Some(&mut opts))?;

    // git2's foreach takes up to four separate closures that all need to
    // write into the same accumulators. A RefCell lets each closure hold a
    // shared reference instead of the borrow checker seeing four competing
    // `&mut` borrows of the same variables.
    struct Accum {
        files: Vec<FileEntry>,
        paths: Vec<String>,
        diffs: HashMap<String, Vec<DiffRow>>,
    }
    let acc = RefCell::new(Accum {
        files: Vec::new(),
        paths: Vec::new(),
        diffs: HashMap::new(),
    });

    diff.foreach(
        &mut |delta, _progress| {
            let path = delta_path(&delta);
            let (dir, name) = split_path(&path);
            let mut acc = acc.borrow_mut();
            acc.files.push(FileEntry {
                dir,
                name,
                status: status_letter(delta.status()).to_string(),
                added: 0,
                removed: 0,
            });
            acc.paths.push(path.clone());
            acc.diffs.entry(path).or_default();
            true
        },
        None,
        Some(&mut |delta, hunk| {
            let path = delta_path(&delta);
            let (range, context) = split_hunk_header(&hunk);
            acc.borrow_mut()
                .diffs
                .entry(path)
                .or_default()
                .push(DiffRow::Hunk { range, context });
            true
        }),
        Some(&mut |delta, _hunk, line| {
            let path = delta_path(&delta);
            let text = String::from_utf8_lossy(line.content())
                .trim_end_matches('\n')
                .to_string();
            let row = match line.origin() {
                '+' => DiffRow::Add {
                    old_line: None,
                    new_line: line.new_lineno(),
                    text,
                },
                '-' => DiffRow::Del {
                    old_line: line.old_lineno(),
                    new_line: None,
                    text,
                },
                ' ' => DiffRow::Ctx {
                    old_line: line.old_lineno(),
                    new_line: line.new_lineno(),
                    text,
                },
                // file/hunk header pseudo-lines ('F' / 'H') — the hunk
                // callback above already captured the header we need.
                _ => return true,
            };
            acc.borrow_mut().diffs.entry(path).or_default().push(row);
            true
        }),
    )?;

    let Accum {
        mut files,
        paths,
        diffs,
    } = acc.into_inner();

    for (file, path) in files.iter_mut().zip(paths.iter()) {
        if let Some(rows) = diffs.get(path) {
            file.added = rows
                .iter()
                .filter(|r| matches!(r, DiffRow::Add { .. }))
                .count() as u32;
            file.removed = rows
                .iter()
                .filter(|r| matches!(r, DiffRow::Del { .. }))
                .count() as u32;
        }
    }

    Ok(LiveDiff { files, diffs })
}

fn delta_path(delta: &git2::DiffDelta) -> String {
    delta
        .new_file()
        .path()
        .or_else(|| delta.old_file().path())
        .map(|p| p.to_string_lossy().replace('\\', "/"))
        .unwrap_or_default()
}

fn split_path(path: &str) -> (String, String) {
    match path.rsplit_once('/') {
        Some((dir, name)) => (dir.to_string(), name.to_string()),
        None => (String::new(), path.to_string()),
    }
}

fn status_letter(status: Delta) -> &'static str {
    match status {
        Delta::Added | Delta::Untracked => "A",
        Delta::Deleted => "D",
        _ => "M",
    }
}

/// git2 hands us the raw hunk header line, e.g.
/// `@@ -12,6 +12,8 @@ mod watcher\n` — split it into the `@@ ... @@`
/// range and the trailing context text.
fn split_hunk_header(hunk: &DiffHunk) -> (String, String) {
    let header = String::from_utf8_lossy(hunk.header())
        .trim_end()
        .to_string();
    match header.rfind("@@") {
        Some(idx) => {
            let range = header[..idx + 2].trim().to_string();
            let context = header[idx + 2..].trim().to_string();
            (range, context)
        }
        None => (header, String::new()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;

    fn temp_repo_dir() -> PathBuf {
        use std::sync::atomic::{AtomicU64, Ordering};
        // Nanosecond timestamps alone can collide between tests running
        // concurrently on coarser clocks; a per-process counter guarantees
        // uniqueness regardless of clock resolution.
        static COUNTER: AtomicU64 = AtomicU64::new(0);
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let n = COUNTER.fetch_add(1, Ordering::Relaxed);
        let mut dir = std::env::temp_dir();
        dir.push(format!("ai-de-diff-test-{nanos}-{n}"));
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    fn commit_all(repo: &Repository, message: &str) {
        let mut index = repo.index().unwrap();
        index
            .add_all(["*"], git2::IndexAddOption::DEFAULT, None)
            .unwrap();
        index.write().unwrap();
        let tree_id = index.write_tree().unwrap();
        let tree = repo.find_tree(tree_id).unwrap();
        let sig = git2::Signature::now("Test", "test@example.com").unwrap();
        let parent = repo.head().ok().and_then(|h| h.peel_to_commit().ok());
        let parents: Vec<&git2::Commit> = parent.iter().collect();
        repo.commit(Some("HEAD"), &sig, &sig, message, &tree, &parents)
            .unwrap();
    }

    #[test]
    fn detects_modified_added_and_deleted_files() {
        let dir = temp_repo_dir();
        let repo = Repository::init(&dir).unwrap();

        fs::write(dir.join("keep.rs"), "fn main() {}\n").unwrap();
        fs::write(dir.join("remove.rs"), "// going away\n").unwrap();
        commit_all(&repo, "initial");

        // modify a tracked file, delete another, add an untracked one
        fs::write(dir.join("keep.rs"), "fn main() {\n    println!(\"hi\");\n}\n").unwrap();
        fs::remove_file(dir.join("remove.rs")).unwrap();
        fs::write(dir.join("new.rs"), "// brand new\n").unwrap();

        let live = compute_live_diff(&repo).unwrap();

        let modified = live.files.iter().find(|f| f.name == "keep.rs").unwrap();
        assert_eq!(modified.status, "M");
        assert!(modified.added > 0, "expected at least one added line");
        assert!(live.diffs.contains_key("keep.rs"));

        let deleted = live.files.iter().find(|f| f.name == "remove.rs").unwrap();
        assert_eq!(deleted.status, "D");

        let added = live.files.iter().find(|f| f.name == "new.rs").unwrap();
        assert_eq!(added.status, "A");

        fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn root_level_paths_have_no_leading_slash() {
        let dir = temp_repo_dir();
        let repo = Repository::init(&dir).unwrap();
        fs::write(dir.join("README.md"), "# hi\n").unwrap();
        commit_all(&repo, "initial");
        fs::write(dir.join("README.md"), "# hi there\n").unwrap();

        let live = compute_live_diff(&repo).unwrap();
        let f = live.files.iter().find(|f| f.name == "README.md").unwrap();
        assert_eq!(f.dir, "");
        assert!(live.diffs.contains_key("README.md"));

        fs::remove_dir_all(&dir).ok();
    }
}
