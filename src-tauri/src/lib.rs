mod git;

use git::diff::LiveDiff;

#[tauri::command]
fn get_live_diff() -> Result<LiveDiff, String> {
    let repo = git2::Repository::discover(".").map_err(|e| e.message().to_string())?;
    git::diff::compute_live_diff(&repo).map_err(|e| e.message().to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_keyring::init())
        .invoke_handler(tauri::generate_handler![get_live_diff])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
