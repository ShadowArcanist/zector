use rusqlite::OptionalExtension;

use super::Db;

pub fn get(db: &Db) -> anyhow::Result<serde_json::Value> {
    let conn = db.lock_sqlite()?;
    let json: Option<String> = conn
        .query_row("SELECT json FROM ui_state WHERE id = 1", [], |row| row.get(0))
        .optional()?;
    match json {
        Some(text) => Ok(serde_json::from_str(&text)?),
        None => Ok(serde_json::json!({})),
    }
}

pub fn set(db: &Db, value: &serde_json::Value) -> anyhow::Result<()> {
    let text = serde_json::to_string(value)?;
    let conn = db.lock_sqlite()?;
    conn.execute(
        "INSERT INTO ui_state (id, json) VALUES (1, ?1)
         ON CONFLICT(id) DO UPDATE SET json = excluded.json",
        rusqlite::params![text],
    )?;
    Ok(())
}
