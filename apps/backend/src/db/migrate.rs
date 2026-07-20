use std::path::Path;

use anyhow::Context;

use super::StoreData;
use super::connections::SshConnection;

/// One-time import of the pre-JSON SQLite database (read-only; the caller
/// renames the file to .bak afterwards). rusqlite is kept only for this.
pub fn from_sqlite(db_path: &Path, data: &mut StoreData) -> anyhow::Result<()> {
    let conn = rusqlite::Connection::open_with_flags(
        db_path,
        rusqlite::OpenFlags::SQLITE_OPEN_READ_ONLY,
    )
    .with_context(|| format!("failed to open legacy db {}", db_path.display()))?;

    let mut stmt = conn.prepare("SELECT * FROM connections ORDER BY created_at ASC")?;
    let rows = stmt.query_map([], |row| {
        Ok(SshConnection {
            id: row.get("id")?,
            name: row.get("name")?,
            host: row.get("host")?,
            port: row.get("port")?,
            username: row.get("username")?,
            auth_type: row.get("auth_type")?,
            password: row.get("password")?,
            private_key: row.get("private_key")?,
            key_path: row.get("key_path").unwrap_or(None),
            key_passphrase: row.get("key_passphrase")?,
            icon_color: row.get("icon_color").unwrap_or(None),
            icon: None,
            created_at: row.get("created_at")?,
        })
    })?;
    data.connections = rows.collect::<Result<Vec<_>, _>>()?;

    let json: Option<String> = conn
        .query_row("SELECT json FROM ui_state WHERE id = 1", [], |row| row.get(0))
        .ok();
    if let Some(text) = json {
        data.ui_state = serde_json::from_str(&text).unwrap_or(serde_json::json!({}));
    }
    Ok(())
}
