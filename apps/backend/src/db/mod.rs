pub mod connections;
pub mod ui_state;

use std::path::Path;
use std::sync::{Arc, Mutex};

use rusqlite::Connection;

/// Shared SQLite handle. Traffic is tiny, so a single connection behind a
/// mutex (locked briefly per query) is plenty.
pub type Db = Arc<Mutex<Connection>>;

pub fn init(path: &Path) -> anyhow::Result<Db> {
    let conn = Connection::open(path)?;
    conn.execute_batch(
        "PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS connections (
            id             TEXT PRIMARY KEY,
            name           TEXT NOT NULL,
            host           TEXT NOT NULL,
            port           INTEGER NOT NULL DEFAULT 22,
            username       TEXT NOT NULL,
            auth_type      TEXT NOT NULL,
            password       TEXT,
            private_key    TEXT,
            key_passphrase TEXT,
            created_at     TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ui_state (
            id   INTEGER PRIMARY KEY CHECK (id = 1),
            json TEXT NOT NULL
        );",
    )?;
    // Additive migrations; each fails harmlessly once the column exists.
    let _ = conn.execute("ALTER TABLE connections ADD COLUMN key_path TEXT", []);
    let _ = conn.execute("ALTER TABLE connections ADD COLUMN icon_color TEXT", []);
    Ok(Arc::new(Mutex::new(conn)))
}

/// Lock the DB, mapping a poisoned mutex into an error instead of panicking.
pub fn lock(db: &Db) -> anyhow::Result<std::sync::MutexGuard<'_, Connection>> {
    db.lock().map_err(|_| anyhow::anyhow!("database lock poisoned"))
}
