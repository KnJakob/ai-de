use octocrab::models::{self, pulls::PullRequest, Author};
use octocrab::params::{repos::Commitish, State};
use octocrab::Octocrab;
use serde::Serialize;

use super::repo_ref::{self, RepoRefError};
use super::token_store;

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PrAuthor {
    pub login: String,
    pub avatar_url: String,
}

impl From<&Author> for PrAuthor {
    fn from(a: &Author) -> Self {
        PrAuthor {
            login: a.login.clone(),
            avatar_url: a.avatar_url.to_string(),
        }
    }
}

impl PrAuthor {
    // GitHub's API can omit the author on a comment/PR (e.g. a deleted
    // account) — the frontend treats an empty avatar_url as "no image".
    fn unknown() -> Self {
        PrAuthor { login: "unknown".into(), avatar_url: String::new() }
    }
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PrCheckRun {
    pub name: String,
    pub state: String, // "passed" | "running" | "failed"
    pub detail: String,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PrCommentRow {
    pub author: PrAuthor,
    pub body: String,
    pub created_at: String,
    pub file: Option<String>,
    pub line: Option<u64>,
    pub diff_hunk: Option<String>,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PrCommitRow {
    pub sha: String,
    pub message: String,
    pub author_name: String,
    pub author_date: Option<String>,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PrSummary {
    pub number: u64,
    pub title: String,
    pub body: Option<String>,
    pub html_url: String,
    pub author: PrAuthor,
    pub created_at: String,
    pub base_ref: String,
    pub head_ref: String,
    pub comments: Vec<PrCommentRow>,
    pub review_comments: Vec<PrCommentRow>,
    pub checks: Vec<PrCheckRun>,
    pub commits: Vec<PrCommitRow>,
}

// Lightweight row for the picker — listing every open PR would be far too
// expensive to also fetch each one's comments/checks/commits, so this only
// carries what the list view itself renders.
#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PrListItem {
    pub number: u64,
    pub title: String,
    pub author: PrAuthor,
    pub head_ref: String,
    pub created_at: String,
    pub is_current_branch: bool,
}

#[derive(Serialize, Clone, Debug)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum PrListResult {
    NotAuthenticated,
    NoRemote,
    Found { owner: String, repo: String, prs: Vec<PrListItem> },
}

#[derive(Serialize, Clone, Debug)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum PrDetailsResult {
    NotAuthenticated,
    NoRemote,
    NotFound,
    Found(PrSummary),
}

enum Gate {
    NotAuthenticated,
    NoRemote,
    Ready { octocrab: Octocrab, owner: String, repo: String, branch: String },
}

// Shared by both the list and the details fetch: resolve the repo from the
// workspace path, then build an authenticated client from the stored
// Device Flow token. Neither step talks to GitHub yet.
fn gate(path: Option<&str>) -> Result<Gate, String> {
    let repo_ref = match repo_ref::resolve(path) {
        Ok(r) => r,
        Err(
            RepoRefError::NoOriginRemote
            | RepoRefError::NotAGitHubRemote
            | RepoRefError::NotAGitRepo
            | RepoRefError::DetachedHead,
        ) => return Ok(Gate::NoRemote),
    };

    let Some(token) = token_store::read_token() else {
        return Ok(Gate::NotAuthenticated);
    };

    let octocrab = Octocrab::builder()
        .personal_token(token)
        .build()
        .map_err(|e| e.to_string())?;

    Ok(Gate::Ready { octocrab, owner: repo_ref.owner, repo: repo_ref.repo, branch: repo_ref.branch })
}

pub async fn list_prs(path: Option<String>) -> Result<PrListResult, String> {
    let (octocrab, owner, repo, current_branch) = match gate(path.as_deref())? {
        Gate::NotAuthenticated => return Ok(PrListResult::NotAuthenticated),
        Gate::NoRemote => return Ok(PrListResult::NoRemote),
        Gate::Ready { octocrab, owner, repo, branch } => (octocrab, owner, repo, branch),
    };

    let prs = octocrab
        .pulls(&owner, &repo)
        .list()
        .state(State::Open)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .items
        .iter()
        .map(|pr| PrListItem {
            number: pr.number,
            title: pr.title.clone().unwrap_or_default(),
            author: pr.user.as_deref().map(PrAuthor::from).unwrap_or_else(PrAuthor::unknown),
            head_ref: pr.head.ref_field.clone(),
            created_at: pr.created_at.map(|d| d.to_rfc3339()).unwrap_or_default(),
            is_current_branch: current_branch == pr.head.ref_field,
        })
        .collect();

    Ok(PrListResult::Found { owner, repo, prs })
}

pub async fn get_details(path: Option<String>, number: u64) -> Result<PrDetailsResult, String> {
    let (octocrab, owner, repo) = match gate(path.as_deref())? {
        Gate::NotAuthenticated => return Ok(PrDetailsResult::NotAuthenticated),
        Gate::NoRemote => return Ok(PrDetailsResult::NoRemote),
        Gate::Ready { octocrab, owner, repo, .. } => (octocrab, owner, repo),
    };

    let pr = match octocrab.pulls(&owner, &repo).get(number).await {
        Ok(pr) => pr,
        Err(octocrab::Error::GitHub { source, .. }) if source.status_code.as_u16() == 404 => {
            return Ok(PrDetailsResult::NotFound)
        }
        Err(e) => return Err(e.to_string()),
    };

    build_summary(&octocrab, &owner, &repo, pr).await.map(PrDetailsResult::Found)
}

async fn build_summary(
    octocrab: &Octocrab,
    owner: &str,
    repo: &str,
    pr: PullRequest,
) -> Result<PrSummary, String> {
    let author = pr.user.as_deref().map(PrAuthor::from).unwrap_or_else(PrAuthor::unknown);

    let comments = octocrab
        .issues(owner, repo)
        .list_comments(pr.number)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .items
        .iter()
        .map(|c| PrCommentRow {
            author: PrAuthor::from(&c.user),
            body: c.body.clone().unwrap_or_default(),
            created_at: c.created_at.to_rfc3339(),
            file: None,
            line: None,
            diff_hunk: None,
        })
        .collect();

    let review_comments = octocrab
        .pulls(owner, repo)
        .list_comments(Some(pr.number))
        .send()
        .await
        .map_err(|e| e.to_string())?
        .items
        .iter()
        .map(|c| PrCommentRow {
            author: c.user.as_ref().map(PrAuthor::from).unwrap_or_else(PrAuthor::unknown),
            body: c.body.clone(),
            created_at: c.created_at.to_rfc3339(),
            file: Some(c.path.clone()),
            line: c.line.or(c.original_line),
            diff_hunk: Some(c.diff_hunk.clone()),
        })
        .collect();

    let checks = octocrab
        .checks(owner, repo)
        .list_check_runs_for_git_ref(Commitish(pr.head.sha.clone()))
        .send()
        .await
        .map_err(|e| e.to_string())?
        .check_runs
        .iter()
        .map(check_run_to_row)
        .collect();

    let commits = octocrab
        .pulls(owner, repo)
        .pr_commits(pr.number)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .items
        .iter()
        .map(|c| PrCommitRow {
            sha: c.sha.clone(),
            message: c.commit.message.clone(),
            author_name: c.commit.author.as_ref().map(|a| a.name.clone()).unwrap_or_else(|| "unknown".into()),
            author_date: c.commit.author.as_ref().and_then(|a| a.date).map(|d| d.to_rfc3339()),
        })
        .collect();

    Ok(PrSummary {
        number: pr.number,
        title: pr.title.unwrap_or_default(),
        body: pr.body,
        html_url: pr.html_url.map(|u| u.to_string()).unwrap_or_default(),
        author,
        created_at: pr.created_at.map(|d| d.to_rfc3339()).unwrap_or_default(),
        base_ref: pr.base.ref_field,
        head_ref: pr.head.ref_field,
        comments,
        review_comments,
        checks,
        commits,
    })
}

fn check_run_to_row(run: &models::checks::CheckRun) -> PrCheckRun {
    let state = if run.completed_at.is_none() {
        "running"
    } else if run.conclusion.as_deref() == Some("success") {
        "passed"
    } else {
        "failed"
    };
    let detail = run.conclusion.clone().unwrap_or_else(|| "running".into());
    PrCheckRun {
        name: run.name.clone(),
        state: state.to_string(),
        detail,
    }
}
