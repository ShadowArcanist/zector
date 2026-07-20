pub mod connections;
mod migrate;
pub mod ui_state;

use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, MutexGuard};

use anyhow::Context;
use connections::SshConnection;

/// JSON-file config store (~/.config/zector): connections.json + state.json.
/// Human-readable so users can back up or share their setup.
pub struct Store {
    dir: PathBuf,
    data: Mutex<StoreData>,
}

#[derive(Default)]
pub struct StoreData {
    pub connections: Vec<SshConnection>,
    pub ui_state: serde_json::Value,
}

pub type Db = Arc<Store>;

pub fn init(config_dir: &Path, legacy_db: &Path) -> anyhow::Result<Db> {
    std::fs::create_dir_all(config_dir)
        .with_context(|| format!("could not create {}", config_dir.display()))?;
    let conns_path = config_dir.join("connections.json");
    let state_path = config_dir.join("state.json");

    let mut data = StoreData {
        connections: Vec::new(),
        ui_state: serde_json::json!({}),
    };

    if conns_path.exists() || state_path.exists() {
        if conns_path.exists() {
            let text = std::fs::read_to_string(&conns_path)?;
            data.connections = serde_json::from_str(&text)
                .with_context(|| format!("invalid JSON in {}", conns_path.display()))?;
        }
        if state_path.exists() {
            let text = std::fs::read_to_string(&state_path)?;
            data.ui_state = serde_json::from_str(&text)
                .with_context(|| format!("invalid JSON in {}", state_path.display()))?;
        }
    } else if legacy_db.exists() {
        // One-time import from the pre-JSON SQLite database.
        migrate::from_sqlite(legacy_db, &mut data)?;
        let store = Store {
            dir: config_dir.to_path_buf(),
            data: Mutex::new(data),
        };
        {
            let guard = store.lock()?;
            store.save_connections(&guard)?;
            store.save_state(&guard)?;
        }
        let _ = std::fs::rename(legacy_db, legacy_db.with_extension("db.bak"));
        tracing::info!("migrated legacy sqlite data to {}", config_dir.display());
        return Ok(Arc::new(store));
    }

    Ok(Arc::new(Store {
        dir: config_dir.to_path_buf(),
        data: Mutex::new(data),
    }))
}

impl Store {
    pub fn lock(&self) -> anyhow::Result<MutexGuard<'_, StoreData>> {
        self.data
            .lock()
            .map_err(|_| anyhow::anyhow!("config store lock poisoned"))
    }

    pub fn save_connections(&self, data: &StoreData) -> anyhow::Result<()> {
        atomic_write(
            &self.dir.join("connections.json"),
            &serde_json::to_vec_pretty(&data.connections)?,
        )
    }

    pub fn save_state(&self, data: &StoreData) -> anyhow::Result<()> {
        atomic_write(
            &self.dir.join("state.json"),
            &serde_json::to_vec_pretty(&data.ui_state)?,
        )
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
