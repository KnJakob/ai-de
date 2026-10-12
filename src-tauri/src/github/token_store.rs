use std::fs;
use std::path::PathBuf;

// Plain-text .env at the ai-de project root — NOT the workspace the user has
// open (the GitHub login is one account for the whole app, not per-repo).
// Deliberately not the OS keychain: macOS ties "always allow" to the exact
// code signature of the requesting binary, which changes on every dev
// rebuild, so `tauri dev` re-prompted for the Keychain password on every
// run. The project's .gitignore already excludes .env.
const KEY: &str = "GITHUB_TOKEN";

// CARGO_MANIFEST_DIR is resolved at COMPILE time, to whatever machine/path
// built this binary — fine for `cargo run`/`tauri dev` on one dev's own
// checkout, completely broken for any compiled app that runs somewhere
// else: it'd try to read/write a path from the build machine that doesn't
// exist on the end user's system. Not a signing problem — a from-scratch
// rework (e.g. Tauri's app_data_dir(), resolved at runtime) before this
// goes anywhere near a distributed build.
fn env_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("..").join(".env")
}

pub fn read_token() -> Option<String> {
    let contents = fs::read_to_string(env_path()).ok()?;
    for line in contents.lines() {
        if let Some(value) = line.strip_prefix(&format!("{KEY}=")) {
            let value = value.trim();
            if !value.is_empty() {
                return Some(value.to_string());
            }
        }
    }
    None
}

pub fn write_token(token: &str) -> std::io::Result<()> {
    fs::write(env_path(), format!("{KEY}={token}\n"))
}

pub fn clear_token() -> std::io::Result<()> {
    match fs::remove_file(env_path()) {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(e),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;

    // env_path() is fixed at compile time (CARGO_MANIFEST_DIR), so every
    // test in this module touches the same real file — cargo test runs
    // tests in parallel by default, so without this lock they'd race on
    // that one path (one test's save-and-restore could capture another's
    // in-progress write).
    static ENV_FILE_LOCK: Mutex<()> = Mutex::new(());

    // Save/restore whatever was already there (including "nothing") instead
    // of clobbering a real token.
    fn with_clean_env(f: impl FnOnce()) {
        let _guard = ENV_FILE_LOCK.lock().unwrap();
        let path = env_path();
        let original = fs::read_to_string(&path).ok();
        f();
        match original {
            Some(contents) => fs::write(&path, contents).unwrap(),
            None => {
                let _ = fs::remove_file(&path);
            }
        }
    }

    #[test]
    fn write_then_read_round_trips() {
        with_clean_env(|| {
            write_token("ghu_test_token_123").unwrap();
            assert_eq!(read_token(), Some("ghu_test_token_123".to_string()));
        });
    }

    #[test]
    fn clear_removes_it() {
        with_clean_env(|| {
            write_token("ghu_test_token_123").unwrap();
            clear_token().unwrap();
            assert_eq!(read_token(), None);
        });
    }

    #[test]
    fn missing_file_reads_as_none() {
        with_clean_env(|| {
            let _ = fs::remove_file(env_path());
            assert_eq!(read_token(), None);
        });
    }
}
