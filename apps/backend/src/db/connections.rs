use rusqlite::{Row, params};
use serde::{Deserialize, Serialize};

use super::Db;

#[derive(Debug, Clone, Serialize)]
pub struct SshConnection {
    pub id: String,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub auth_type: String,
    pub password: Option<String>,
    pub private_key: Option<String>,
    pub key_path: Option<String>,
    pub key_passphrase: Option<String>,
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
}

fn from_row(row: &Row<'_>) -> rusqlite::Result<SshConnection> {
    Ok(SshConnection {
        id: row.get("id")?,
        name: row.get("name")?,
        host: row.get("host")?,
        port: row.get("port")?,
        username: row.get("username")?,
        auth_type: row.get("auth_type")?,
        password: row.get("password")?,
        private_key: row.get("private_key")?,
        key_path: row.get("key_path")?,
        key_passphrase: row.get("key_passphrase")?,
        created_at: row.get("created_at")?,
    })
}

pub fn list(db: &Db) -> anyhow::Result<Vec<SshConnection>> {
    let conn = super::lock(db)?;
    let mut stmt = conn.prepare("SELECT * FROM connections ORDER BY created_at ASC")?;
    let rows = stmt.query_map([], from_row)?;
    Ok(rows.collect::<Result<Vec<_>, _>>()?)
}

pub fn get(db: &Db, id: &str) -> anyhow::Result<Option<SshConnection>> {
    let conn = super::lock(db)?;
    let mut stmt = conn.prepare("SELECT * FROM connections WHERE id = ?1")?;
    let mut rows = stmt.query_map(params![id], from_row)?;
    Ok(rows.next().transpose()?)
}

pub fn insert(db: &Db, input: &ConnectionInput) -> anyhow::Result<SshConnection> {
    let id = uuid::Uuid::new_v4().to_string();
    let conn = super::lock(db)?;
    conn.execute(
        "INSERT INTO connections
            (id, name, host, port, username, auth_type, password, private_key, key_path, key_passphrase, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))",
        params![
            id,
            input.name,
            input.host,
            input.port,
            input.username,
            input.auth_type,
            input.password,
            input.private_key,
            input.key_path,
            input.key_passphrase,
        ],
    )?;
    let mut stmt = conn.prepare("SELECT * FROM connections WHERE id = ?1")?;
    Ok(stmt.query_row(params![id], from_row)?)
}

pub fn update(db: &Db, id: &str, input: &ConnectionInput) -> anyhow::Result<Option<SshConnection>> {
    let conn = super::lock(db)?;
    let changed = conn.execute(
        "UPDATE connections SET
            name = ?2, host = ?3, port = ?4, username = ?5, auth_type = ?6,
            password = ?7, private_key = ?8, key_path = ?9, key_passphrase = ?10
         WHERE id = ?1",
        params![
            id,
            input.name,
            input.host,
            input.port,
            input.username,
            input.auth_type,
            input.password,
            input.private_key,
            input.key_path,
            input.key_passphrase,
        ],
    )?;
    if changed == 0 {
        return Ok(None);
    }
    let mut stmt = conn.prepare("SELECT * FROM connections WHERE id = ?1")?;
    Ok(Some(stmt.query_row(params![id], from_row)?))
}

pub fn delete(db: &Db, id: &str) -> anyhow::Result<bool> {
    let conn = super::lock(db)?;
    let changed = conn.execute("DELETE FROM connections WHERE id = ?1", params![id])?;
    Ok(changed > 0)
}
