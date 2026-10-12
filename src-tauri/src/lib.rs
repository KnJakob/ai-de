mod git;
mod github;

use git::branch::BranchInfo;
use git::diff::LiveDiff;
use github::device_flow;
use github::pr::{self, PrOverview};
use tauri_plugin_keyring::KeyringExt;

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
async fn get_pr_overview(app: tauri::AppHandle, path: Option<String>) -> Result<PrOverview, String> {
    pr::get_overview(&app, path).await
}

#[tauri::command]
async fn github_start_device_flow() -> Result<device_flow::DeviceCodeInfo, String> {
    device_flow::start().await
}

#[tauri::command]
async fn github_poll_device_flow(
    app: tauri::AppHandle,
    device_code: String,
    interval: u64,
    expires_in: u64,
) -> Result<(), String> {
    let token = device_flow::poll(&device_code, interval, expires_in).await?;
    app.keyring()
        .set_password(pr::KEYRING_SERVICE, pr::KEYRING_USER, &token)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn github_sign_out(app: tauri::AppHandle) -> Result<(), String> {
    app.keyring()
        .delete_password(pr::KEYRING_SERVICE, pr::KEYRING_USER)
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_keyring::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_live_diff,
            get_branch_info,
            get_pr_overview,
            github_start_device_flow,
            github_poll_device_flow,
            github_sign_out
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
