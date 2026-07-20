use std::collections::HashMap;
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

fn reordered_connections(current: &[SshConnection], ids: &[String]) -> Option<Vec<SshConnection>> {
    if ids.len() != current.len() {
        return None;
    }

    let mut by_id: HashMap<_, _> = current
        .iter()
        .cloned()
        .map(|connection| (connection.id.clone(), connection))
        .collect();
    let mut reordered = Vec::with_capacity(current.len());
    for id in ids {
        reordered.push(by_id.remove(id)?);
    }
    by_id.is_empty().then_some(reordered)
}

pub fn reorder(db: &Db, ids: &[String]) -> anyhow::Result<Option<Vec<SshConnection>>> {
    let mut data = db.lock_connections()?;
    let Some(reordered) = reordered_connections(&data, ids) else {
        return Ok(None);
    };
    *data = reordered.clone();
    db.save_connections(&data)?;
    Ok(Some(reordered))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn connection(id: &str) -> SshConnection {
        SshConnection {
            id: id.to_string(),
            name: id.to_string(),
            host: "example.com".to_string(),
            port: 22,
            username: "user".to_string(),
            auth_type: "key".to_string(),
            password: None,
            private_key: None,
            key_path: None,
            key_passphrase: None,
            icon_color: None,
            icon: None,
            created_at: String::new(),
        }
    }

    #[test]
    fn reordered_connections_requires_an_exact_permutation() {
        let current = vec![connection("one"), connection("two"), connection("three")];

        let reordered =
            reordered_connections(&current, &["three".into(), "one".into(), "two".into()])
                .expect("valid order");
        assert_eq!(
            reordered
                .iter()
                .map(|connection| connection.id.as_str())
                .collect::<Vec<_>>(),
            ["three", "one", "two"]
        );

        assert!(reordered_connections(&current, &["one".into(), "two".into()]).is_none());
        assert!(
            reordered_connections(&current, &["one".into(), "one".into(), "three".into()])
                .is_none()
        );
    }
}
