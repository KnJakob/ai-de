use serde::{Deserialize, Serialize};
use std::time::Duration;

// GitHub OAuth App Client ID — intentionally not a secret. Device Flow is
// designed for exactly this: installed/desktop apps ship the client_id in
// plain sight (there is no client_secret involved anywhere in this flow).
const GITHUB_CLIENT_ID: &str = "Ov23liEpzncRTulFyGuK";

// "repo" covers reading PRs/checks/comments on private repos and (later)
// posting reviews/comments — the full scope this app's PR features need.
const SCOPE: &str = "repo";

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct DeviceCodeInfo {
    pub device_code: String,
    pub user_code: String,
    pub verification_uri: String,
    pub interval: u64,
    pub expires_in: u64,
}

#[derive(Deserialize)]
struct DeviceCodeResponse {
    device_code: String,
    user_code: String,
    verification_uri: String,
    interval: u64,
    expires_in: u64,
}

#[derive(Deserialize)]
#[serde(untagged)]
enum TokenResponse {
    Success { access_token: String },
    Pending { error: String },
}

pub async fn start() -> Result<DeviceCodeInfo, String> {
    let client = reqwest::Client::new();
    let res: DeviceCodeResponse = client
        .post("https://github.com/login/device/code")
        .header("Accept", "application/json")
        .form(&[("client_id", GITHUB_CLIENT_ID), ("scope", SCOPE)])
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| format!("unexpected response from GitHub: {e}"))?;

    Ok(DeviceCodeInfo {
        device_code: res.device_code,
        user_code: res.user_code,
        verification_uri: res.verification_uri,
        interval: res.interval,
        expires_in: res.expires_in,
    })
}

/// Polls until the user approves the device code on github.com, or it
/// expires / is denied. Blocks for the lifetime of the call — the frontend
/// awaits this after showing the user_code, so it's expected to take
/// anywhere from a few seconds up to `expires_in`.
pub async fn poll(device_code: &str, mut interval: u64, expires_in: u64) -> Result<String, String> {
    let client = reqwest::Client::new();
    let deadline = std::time::Instant::now() + Duration::from_secs(expires_in);

    loop {
        tokio::time::sleep(Duration::from_secs(interval)).await;
        if std::time::Instant::now() >= deadline {
            return Err("Device code expired before sign-in completed — try again.".into());
        }

        let res: TokenResponse = client
            .post("https://github.com/login/oauth/access_token")
            .header("Accept", "application/json")
            .form(&[
                ("client_id", GITHUB_CLIENT_ID),
                ("device_code", device_code),
                ("grant_type", "urn:ietf:params:oauth:grant-type:device_code"),
            ])
            .send()
            .await
            .map_err(|e| e.to_string())?
            .json()
            .await
            .map_err(|e| format!("unexpected response from GitHub: {e}"))?;

        match res {
            TokenResponse::Success { access_token } => return Ok(access_token),
            TokenResponse::Pending { error } => match error.as_str() {
                "authorization_pending" => continue,
                "slow_down" => {
                    interval += 5;
                    continue;
                }
                "expired_token" => {
                    return Err("Device code expired before sign-in completed — try again.".into())
                }
                "access_denied" => return Err("Sign-in was declined.".into()),
                other => return Err(format!("GitHub sign-in failed: {other}")),
            },
        }
    }
}
