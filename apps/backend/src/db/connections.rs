use std::time::{SystemTime, UNIX_EPOCH};

use serde::{Deserialize, Serialize};

use super::Db;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SshConnection {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub auth_type: String,
    #[serde(default)]
    pub password: Option<String>,
    #[serde(default)]
    pub private_key: Option<String>,
    #[serde(default)]
    pub key_path: Option<String>,
    #[serde(default)]
    pub key_passphrase: Option<String>,
    #[serde(default)]
    pub icon_color: Option<String>,
    #[serde(default)]
    pub icon: Option<String>,
    #[serde(default)]
    pub created_at: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ConnectionInput {
    pub name: String,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub auth_type: String,
    pub password: Option<String>,
    pub private_key: Option<String>,
    pub key_path: Option<String>,
    pub key_passphrase: Option<String>,
    #[serde(default)]
    pub icon_color: Option<String>,
    #[serde(default)]
    pub icon: Option<String>,
}

fn apply(conn: &mut SshConnection, input: &ConnectionInput) {
    conn.name = input.name.clone();
    conn.host = input.host.clone();
    conn.port = input.port;
    conn.username = input.username.clone();
    conn.auth_type = input.auth_type.clone();
    conn.password = input.password.clone();
    conn.private_key = input.private_key.clone();
    conn.key_path = input.key_path.clone();
    conn.key_passphrase = input.key_passphrase.clone();
    conn.icon_color = input.icon_color.clone();
    conn.icon = input.icon.clone();
}

fn now_unix() -> String {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs().to_string())
        .unwrap_or_default()
}

pub fn list(db: &Db) -> anyhow::Result<Vec<SshConnection>> {
    Ok(db.lock_connections()?.clone())
}

pub fn get(db: &Db, id: &str) -> anyhow::Result<Option<SshConnection>> {
    Ok(db.lock_connections()?.iter().find(|c| c.id == id).cloned())
}

pub fn insert(db: &Db, input: &ConnectionInput) -> anyhow::Result<SshConnection> {
    let mut data = db.lock_connections()?;
    let mut conn = SshConnection {
        id: uuid::Uuid::new_v4().to_string(),
        name: String::new(),
        host: String::new(),
        port: 22,
        username: String::new(),
        auth_type: String::new(),
        password: None,
        private_key: None,
        key_path: None,
        key_passphrase: None,
        icon_color: None,
        icon: None,
        created_at: now_unix(),
    };
    apply(&mut conn, input);
    data.push(conn.clone());
    db.save_connections(&data)?;
    Ok(conn)
}

pub fn update(db: &Db, id: &str, input: &ConnectionInput) -> anyhow::Result<Option<SshConnection>> {
    let mut data = db.lock_connections()?;
    let Some(conn) = data.iter_mut().find(|c| c.id == id) else {
        return Ok(None);
    };
    apply(conn, input);
    let updated = conn.clone();
    db.save_connections(&data)?;
    Ok(Some(updated))
}

pub fn delete(db: &Db, id: &str) -> anyhow::Result<bool> {
    let mut data = db.lock_connections()?;
    let before = data.len();
    data.retain(|c| c.id != id);
    let changed = data.len() != before;
    if changed {
        db.save_connections(&data)?;
    }
    Ok(changed)
}
