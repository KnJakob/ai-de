use octocrab::models::{self, Author};
use octocrab::params::{repos::Commitish, State};
use octocrab::Octocrab;
use serde::Serialize;
use tauri_plugin_keyring::KeyringExt;

use super::repo_ref::{self, RepoRefError};

pub const KEYRING_SERVICE: &str = "ai-de-github";
pub const KEYRING_USER: &str = "oauth-token";

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

#[derive(Serialize, Clone, Debug)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum PrOverview {
    NotAuthenticated,
    NoRemote,
    NoOpenPr { owner: String, repo: String, branch: String },
    Found(PrSummary),
}

pub async fn get_overview(app: &tauri::AppHandle, path: Option<String>) -> Result<PrOverview, String> {
    let repo_ref = match repo_ref::resolve(path.as_deref()) {
        Ok(r) => r,
        Err(RepoRefError::NoOriginRemote | RepoRefError::NotAGitHubRemote) => {
            return Ok(PrOverview::NoRemote)
        }
        Err(RepoRefError::NotAGitRepo | RepoRefError::DetachedHead) => return Ok(PrOverview::NoRemote),
    };

    let token = app
        .keyring()
        .get_password(KEYRING_SERVICE, KEYRING_USER)
        .map_err(|e| e.to_string())?;
    let Some(token) = token else {
        return Ok(PrOverview::NotAuthenticated);
    };

    let octocrab = Octocrab::builder()
        .personal_token(token)
        .build()
        .map_err(|e| e.to_string())?;

    let owner = repo_ref.owner;
    let repo = repo_ref.repo;
    let branch = repo_ref.branch;

    let prs = octocrab
        .pulls(&owner, &repo)
        .list()
        .head(format!("{owner}:{branch}"))
        .state(State::Open)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let Some(pr) = prs.items.into_iter().next() else {
        return Ok(PrOverview::NoOpenPr { owner, repo, branch });
    };

    let author = pr
        .user
        .as_deref()
        .map(PrAuthor::from)
        .unwrap_or_else(PrAuthor::unknown);

    let comments = octocrab
        .issues(&owner, &repo)
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
        .pulls(&owner, &repo)
        .list_comments(Some(pr.number))
        .send()
        .await
        .map_err(|e| e.to_string())?
        .items
        .iter()
        .map(|c| PrCommentRow {
            author: c
                .user
                .as_ref()
                .map(PrAuthor::from)
                .unwrap_or_else(PrAuthor::unknown),
            body: c.body.clone(),
            created_at: c.created_at.to_rfc3339(),
            file: Some(c.path.clone()),
            line: c.line.or(c.original_line),
            diff_hunk: Some(c.diff_hunk.clone()),
        })
        .collect();

    let checks = octocrab
        .checks(&owner, &repo)
        .list_check_runs_for_git_ref(Commitish(pr.head.sha.clone()))
        .send()
        .await
        .map_err(|e| e.to_string())?
        .check_runs
        .iter()
        .map(check_run_to_row)
        .collect();

    let commits = octocrab
        .pulls(&owner, &repo)
        .pr_commits(pr.number)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .items
        .iter()
        .map(|c| PrCommitRow {
            sha: c.sha.clone(),
            message: c.commit.message.clone(),
            author_name: c
                .commit
                .author
                .as_ref()
                .map(|a| a.name.clone())
                .unwrap_or_else(|| "unknown".into()),
            author_date: c
                .commit
                .author
                .as_ref()
                .and_then(|a| a.date)
                .map(|d| d.to_rfc3339()),
        })
        .collect();

    Ok(PrOverview::Found(PrSummary {
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
    }))
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

