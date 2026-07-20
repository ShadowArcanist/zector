pub mod connections;
mod defaults;
pub mod ui_state;

use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, MutexGuard};

use anyhow::Context;
use connections::SshConnection;

/// Storage split:
/// - `~/.config/zector` (config_dir): user-facing JSON — connections.json,
///   settings.json, terminal-themes.json, backgrounds.json. Easy to back up.
/// - data_dir/zector.db (sqlite): internal UI/layout state, not for sharing.
pub struct Store {
    config_dir: PathBuf,
    connections: Mutex<Vec<SshConnection>>,
    sqlite: Mutex<rusqlite::Connection>,
}

pub type Db = Arc<Store>;

pub fn init(config_dir: &Path, data_dir: &Path) -> anyhow::Result<Db> {
    std::fs::create_dir_all(config_dir)
        .with_context(|| format!("could not create {}", config_dir.display()))?;
    std::fs::create_dir_all(data_dir)
        .with_context(|| format!("could not create {}", data_dir.display()))?;

    let sqlite = rusqlite::Connection::open(data_dir.join("zector.db"))?;
    sqlite.execute_batch(
        "PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS ui_state (
            id   INTEGER PRIMARY KEY CHECK (id = 1),
            json TEXT NOT NULL
        );",
    )?;

    // Connections: JSON file, importing from a pre-JSON sqlite table once.
    let conns_path = config_dir.join("connections.json");
    let connections: Vec<SshConnection> = if conns_path.exists() {
        let text = std::fs::read_to_string(&conns_path)?;
        serde_json::from_str(&text)
            .with_context(|| format!("invalid JSON in {}", conns_path.display()))?
    } else {
        import_legacy_connections(&sqlite).unwrap_or_default()
    };

    // UI state briefly lived in config_dir/state.json — move it into sqlite.
    let state_path = config_dir.join("state.json");
    if state_path.exists()
        && let Ok(text) = std::fs::read_to_string(&state_path)
        && serde_json::from_str::<serde_json::Value>(&text).is_ok()
    {
        sqlite.execute(
            "INSERT INTO ui_state (id, json) VALUES (1, ?1)
             ON CONFLICT(id) DO UPDATE SET json = excluded.json",
            rusqlite::params![text],
        )?;
        let _ = std::fs::remove_file(&state_path);
        tracing::info!("moved state.json into the database");
    }

    defaults::seed_config_files(config_dir)?;

    let store = Store {
        config_dir: config_dir.to_path_buf(),
        connections: Mutex::new(connections),
        sqlite: Mutex::new(sqlite),
    };
    if !conns_path.exists() {
        store.save_connections(&store.lock_connections()?)?;
    }
    Ok(Arc::new(store))
}

/// Pre-JSON databases stored connections in sqlite; import them once.
fn import_legacy_connections(
    sqlite: &rusqlite::Connection,
) -> anyhow::Result<Vec<SshConnection>> {
    let mut stmt = sqlite.prepare("SELECT * FROM connections ORDER BY created_at ASC")?;
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
    let list = rows.collect::<Result<Vec<_>, _>>()?;
    tracing::info!(count = list.len(), "imported legacy sqlite connections");
    Ok(list)
}

impl Store {
    pub fn lock_connections(&self) -> anyhow::Result<MutexGuard<'_, Vec<SshConnection>>> {
        self.connections
            .lock()
            .map_err(|_| anyhow::anyhow!("connections lock poisoned"))
    }

    pub fn lock_sqlite(&self) -> anyhow::Result<MutexGuard<'_, rusqlite::Connection>> {
        self.sqlite
            .lock()
            .map_err(|_| anyhow::anyhow!("database lock poisoned"))
    }

    pub fn save_connections(&self, list: &[SshConnection]) -> anyhow::Result<()> {
        atomic_write(
            &self.config_dir.join("connections.json"),
            &serde_json::to_vec_pretty(list)?,
        )
    }

    /// Parse one of the user-editable config files fresh from disk.
    pub fn read_config_file(&self, name: &str) -> anyhow::Result<serde_json::Value> {
        let path = self.config_dir.join(name);
        let text = std::fs::read_to_string(&path)
            .with_context(|| format!("failed to read {}", path.display()))?;
        serde_json::from_str(&text).with_context(|| format!("invalid JSON in {name}"))
    }
}

/// Write via a temp file + rename so a crash never leaves a torn config.
fn atomic_write(path: &Path, bytes: &[u8]) -> anyhow::Result<()> {
    let tmp = path.with_extension("json.tmp");
    std::fs::write(&tmp, bytes).with_context(|| format!("failed to write {}", tmp.display()))?;
    std::fs::rename(&tmp, path)
        .with_context(|| format!("failed to replace {}", path.display()))?;
    Ok(())
}
