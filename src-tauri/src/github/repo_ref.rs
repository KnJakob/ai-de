/// Which GitHub repo + branch the workspace at `path` is on, derived from
/// the "origin" remote and the current HEAD — no GitHub API call involved.
pub struct RepoRef {
    pub owner: String,
    pub repo: String,
    pub branch: String,
}

pub enum RepoRefError {
    NotAGitRepo,
    NoOriginRemote,
    NotAGitHubRemote,
    DetachedHead,
}

pub fn resolve(path: Option<&str>) -> Result<RepoRef, RepoRefError> {
    let repo = git2::Repository::discover(path.unwrap_or(".")).map_err(|_| RepoRefError::NotAGitRepo)?;

    let head = repo.head().map_err(|_| RepoRefError::DetachedHead)?;
    let branch = head
        .shorthand()
        .map_err(|_| RepoRefError::DetachedHead)?
        .to_string();

    let remote = repo
        .find_remote("origin")
        .map_err(|_| RepoRefError::NoOriginRemote)?;
    let url = remote.url().map_err(|_| RepoRefError::NoOriginRemote)?;
    let (owner, repo_name) = parse_github_owner_repo(url).ok_or(RepoRefError::NotAGitHubRemote)?;

    Ok(RepoRef {
        owner,
        repo: repo_name,
        branch,
    })
}

/// Handles both remote URL forms git actually uses:
/// `https://github.com/{owner}/{repo}.git` and `git@github.com:{owner}/{repo}.git`
/// (the `.git` suffix is optional in both).
fn parse_github_owner_repo(url: &str) -> Option<(String, String)> {
    let rest = url
        .strip_prefix("https://github.com/")
        .or_else(|| url.strip_prefix("http://github.com/"))
        .or_else(|| url.strip_prefix("git@github.com:"))
        .or_else(|| url.strip_prefix("ssh://git@github.com/"))?;
    let rest = rest.strip_suffix(".git").unwrap_or(rest);
    let (owner, repo) = rest.split_once('/')?;
    if owner.is_empty() || repo.is_empty() {
        return None;
    }
    Some((owner.to_string(), repo.to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_https_remote() {
        let (o, r) = parse_github_owner_repo("https://github.com/KnJakob/ai-de.git").unwrap();
        assert_eq!(o, "KnJakob");
        assert_eq!(r, "ai-de");
    }

    #[test]
    fn parses_ssh_remote() {
        let (o, r) = parse_github_owner_repo("git@github.com:KnJakob/ai-de.git").unwrap();
        assert_eq!(o, "KnJakob");
        assert_eq!(r, "ai-de");
    }

    #[test]
    fn parses_without_git_suffix() {
        let (o, r) = parse_github_owner_repo("https://github.com/KnJakob/ai-de").unwrap();
        assert_eq!(o, "KnJakob");
        assert_eq!(r, "ai-de");
    }

    #[test]
    fn rejects_non_github_remote() {
        assert!(parse_github_owner_repo("https://gitlab.com/KnJakob/ai-de.git").is_none());
    }
}
