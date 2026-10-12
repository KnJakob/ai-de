mod git;
mod github;

use git::branch::BranchInfo;
use git::diff::LiveDiff;
use github::device_flow;
use github::pr::{self, PrDetailsResult, PrListResult};
use github::token_store;

#[tauri::command]
fn get_live_diff(path: Option<String>) -> Result<LiveDiff, String> {
    let repo = git2::Repository::discover(path.as_deref().unwrap_or("."))
        .map_err(|e| e.message().to_string())?;
    git::diff::compute_live_diff(&repo).map_err(|e| e.message().to_string())
}

#[tauri::command]
fn get_branch_info(path: Option<String>) -> Result<BranchInfo, String> {
    let repo = git2::Repository::discover(path.as_deref().unwrap_or("."))
        .map_err(|e| e.message().to_string())?;
    git::branch::info(&repo).map_err(|e| e.message().to_string())
}

#[tauri::command]
async fn get_pr_list(path: Option<String>) -> Result<PrListResult, String> {
    pr::list_prs(path).await
}

#[tauri::command]
async fn get_pr_details(path: Option<String>, number: u64) -> Result<PrDetailsResult, String> {
    pr::get_details(path, number).await
}

#[tauri::command]
async fn github_start_device_flow() -> Result<device_flow::DeviceCodeInfo, String> {
    device_flow::start().await
}

#[tauri::command]
async fn github_poll_device_flow(
    device_code: String,
    interval: u64,
    expires_in: u64,
) -> Result<(), String> {
    let token = device_flow::poll(&device_code, interval, expires_in).await?;
    token_store::write_token(&token).map_err(|e| e.to_string())
}

#[tauri::command]
fn github_sign_out() -> Result<(), String> {
    token_store::clear_token().map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_live_diff,
            get_branch_info,
            get_pr_list,
            get_pr_details,
            github_start_device_flow,
            github_poll_device_flow,
            github_sign_out
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
