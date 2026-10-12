use git2::Repository;
use serde::Serialize;

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct BranchInfo {
    pub branch: String,
    pub default_branch: Option<String>,
}

pub fn current_branch_name(repo: &Repository) -> Result<String, git2::Error> {
    Ok(repo.head()?.shorthand()?.to_string())
}

/// The repo's default branch, read from the "origin/HEAD" symbolic ref git
/// sets up on clone (`git remote set-head origin -a` if it's ever missing).
/// None rather than a guess like "main" when that ref isn't there — wrong
/// base branches are worse than an absent label.
pub fn default_branch_name(repo: &Repository) -> Option<String> {
    let reference = repo.find_reference("refs/remotes/origin/HEAD").ok()?;
    let target = reference.symbolic_target().ok().flatten()?;
    target.strip_prefix("refs/remotes/origin/").map(str::to_string)
}

pub fn info(repo: &Repository) -> Result<BranchInfo, git2::Error> {
    Ok(BranchInfo {
        branch: current_branch_name(repo)?,
        default_branch: default_branch_name(repo),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use git2::RepositoryInitOptions;
    use std::fs;
    use std::path::PathBuf;
    use std::sync::atomic::{AtomicU64, Ordering};

    fn temp_repo_dir() -> PathBuf {
        static COUNTER: AtomicU64 = AtomicU64::new(0);
        let nanos = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let n = COUNTER.fetch_add(1, Ordering::Relaxed);
        let mut dir = std::env::temp_dir();
        dir.push(format!("ai-de-branch-test-{nanos}-{n}"));
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn reads_current_branch_regardless_of_the_machine_s_git_defaults() {
        let dir = temp_repo_dir();
        // Real repos can default to "main" or "master" depending on the
        // machine's git config — pin a third name so this test can't pass
        // by accidentally matching whatever the sandbox happens to use.
        let mut opts = RepositoryInitOptions::new();
        opts.initial_head("agent/debounce-watcher");
        let repo = Repository::init_opts(&dir, &opts).unwrap();
        // The branch ref doesn't exist until the first commit — HEAD is a
        // symbolic ref to a not-yet-created branch until then.
        fs::write(dir.join("f.txt"), "x").unwrap();
        let mut index = repo.index().unwrap();
        index.add_path(std::path::Path::new("f.txt")).unwrap();
        index.write().unwrap();
        let tree = repo.find_tree(index.write_tree().unwrap()).unwrap();
        let sig = git2::Signature::now("Test", "test@example.com").unwrap();
        repo.commit(Some("HEAD"), &sig, &sig, "initial", &tree, &[])
            .unwrap();

        assert_eq!(current_branch_name(&repo).unwrap(), "agent/debounce-watcher");

        fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn default_branch_is_none_without_an_origin_remote() {
        let dir = temp_repo_dir();
        let repo = Repository::init(&dir).unwrap();

        assert_eq!(default_branch_name(&repo), None);

        fs::remove_dir_all(&dir).ok();
    }

    #[test]
    fn default_branch_reads_the_real_origin_head_symref() {
        let origin_dir = temp_repo_dir();
        let mut opts = RepositoryInitOptions::new();
        opts.initial_head("trunk");
        let origin = Repository::init_opts(&origin_dir, &opts).unwrap();
        fs::write(origin_dir.join("f.txt"), "x").unwrap();
        let mut index = origin.index().unwrap();
        index.add_path(std::path::Path::new("f.txt")).unwrap();
        index.write().unwrap();
        let tree = origin.find_tree(index.write_tree().unwrap()).unwrap();
        let sig = git2::Signature::now("Test", "test@example.com").unwrap();
        origin
            .commit(Some("HEAD"), &sig, &sig, "initial", &tree, &[])
            .unwrap();

        // Cloning sets up refs/remotes/origin/HEAD pointing at whatever the
        // source repo's HEAD branch was — exactly the real-world mechanism
        // default_branch_name reads.
        let clone_dir = temp_repo_dir();
        let cloned = Repository::clone(origin_dir.to_str().unwrap(), &clone_dir).unwrap();

        assert_eq!(default_branch_name(&cloned).as_deref(), Some("trunk"));

        fs::remove_dir_all(&origin_dir).ok();
        fs::remove_dir_all(&clone_dir).ok();
    }
}
