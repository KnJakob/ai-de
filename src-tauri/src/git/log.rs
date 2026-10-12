use git2::{Repository, Sort};
use serde::Serialize;

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct CommitLogEntry {
    pub sha: String,
    pub subject: String,
    pub author_name: String,
    /// Unix seconds — the frontend does the calendar math via `Date`
    /// rather than pulling in a Rust date-formatting crate for this alone.
    pub author_date: i64,
}

// ponytail: caps the walk at the most recent 200 commits — a log view, not
// a paged browser. Add pagination if a full-history view is ever needed.
const MAX_COMMITS: usize = 200;

/// HEAD's commit history, newest first — the "History" mode's commit log.
pub fn commit_log(repo: &Repository) -> Result<Vec<CommitLogEntry>, git2::Error> {
    let mut revwalk = repo.revwalk()?;
    revwalk.push_head()?;
    revwalk.set_sorting(Sort::TIME)?;

    revwalk
        .take(MAX_COMMITS)
        .map(|oid| {
            let commit = repo.find_commit(oid?)?;
            let author = commit.author();
            let subject = commit
                .summary_bytes()
                .map(|b| String::from_utf8_lossy(b).into_owned())
                .unwrap_or_default();
            Ok(CommitLogEntry {
                sha: commit.id().to_string(),
                subject,
                author_name: author.name().unwrap_or("unknown").to_string(),
                author_date: commit.time().seconds(),
            })
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;

    fn temp_repo_dir() -> PathBuf {
        use std::sync::atomic::{AtomicU64, Ordering};
        static COUNTER: AtomicU64 = AtomicU64::new(0);
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let n = COUNTER.fetch_add(1, Ordering::Relaxed);
        let mut dir = std::env::temp_dir();
        dir.push(format!("ai-de-log-test-{nanos}-{n}"));
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
    fn walks_history_newest_first() {
        let dir = temp_repo_dir();
        let repo = Repository::init(&dir).unwrap();

        fs::write(dir.join("f.txt"), "1").unwrap();
        commit_all(&repo, "first");
        fs::write(dir.join("f.txt"), "2").unwrap();
        commit_all(&repo, "second");

        let log = commit_log(&repo).unwrap();

        assert_eq!(log.len(), 2);
        assert_eq!(log[0].subject, "second");
        assert_eq!(log[1].subject, "first");
        assert_eq!(log[0].author_name, "Test");

        fs::remove_dir_all(&dir).ok();
    }
}
