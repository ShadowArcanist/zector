use std::sync::Arc;
use std::time::Duration;

use anyhow::{Context, bail};
use russh::client;
use russh::keys::{PrivateKeyWithHashAlg, decode_secret_key, ssh_key};

use crate::db::connections::SshConnection;

pub type SshHandle = client::Handle<ClientHandler>;

pub struct ClientHandler;

impl client::Handler for ClientHandler {
    type Error = russh::Error;

    // SECURITY: host keys are not verified by design. Zector is a LAN-only
    // tool with no app auth; accepting any server key is an accepted risk
    // documented in .ai/architecture.md.
    async fn check_server_key(
        &mut self,
        _server_public_key: &ssh_key::PublicKey,
    ) -> Result<bool, Self::Error> {
        Ok(true)
    }
}

/// Open a TCP connection to the saved host and fully authenticate.
pub async fn connect(conn: &SshConnection) -> anyhow::Result<SshHandle> {
    let config = Arc::new(client::Config {
        keepalive_interval: Some(Duration::from_secs(15)),
        ..Default::default()
    });

    let mut handle = client::connect(config, (conn.host.as_str(), conn.port), ClientHandler)
        .await
        .with_context(|| format!("failed to connect to {}:{}", conn.host, conn.port))?;

    let auth = match conn.auth_type.as_str() {
        "password" => {
            let password = conn
                .password
                .as_deref()
                .context("connection has auth_type 'password' but no password saved")?;
            handle
                .authenticate_password(conn.username.clone(), password)
                .await
                .context("password authentication failed")?
        }
        "key" => {
            let key_text = load_key_text(conn).await?;
            let key = decode_secret_key(&key_text, conn.key_passphrase.as_deref())
                .context("failed to decode private key")?;
            let hash_alg = if key.algorithm().is_rsa() {
                handle
                    .best_supported_rsa_hash()
                    .await
                    .context("failed to negotiate RSA hash algorithm")?
                    .flatten()
            } else {
                None
            };
            handle
                .authenticate_publickey(
                    conn.username.clone(),
                    PrivateKeyWithHashAlg::new(Arc::new(key), hash_alg),
                )
                .await
                .context("public key authentication failed")?
        }
        other => bail!("unknown auth_type: {other}"),
    };

    if !auth.success() {
        bail!("authentication rejected by server");
    }
    Ok(handle)
}

/// Key material comes from a file path on the zector host (preferred) or a
/// pasted key kept for older saved connections.
async fn load_key_text(conn: &SshConnection) -> anyhow::Result<String> {
    if let Some(path) = conn.key_path.as_deref().filter(|p| !p.trim().is_empty()) {
        let expanded = expand_home(path.trim());
        return tokio::fs::read_to_string(&expanded)
            .await
            .with_context(|| format!("failed to read key file {expanded}"));
    }
    conn.private_key
        .clone()
        .filter(|k| !k.trim().is_empty())
        .context("connection has auth_type 'key' but no key path saved")
}

fn expand_home(path: &str) -> String {
    if let Some(rest) = path.strip_prefix("~/")
        && let Some(home) = dirs::home_dir()
    {
        return home.join(rest).to_string_lossy().into_owned();
    }
    path.to_string()
}
