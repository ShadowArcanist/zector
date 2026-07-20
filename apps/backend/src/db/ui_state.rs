use super::Db;

pub fn get(db: &Db) -> anyhow::Result<serde_json::Value> {
    Ok(db.lock()?.ui_state.clone())
}

pub fn set(db: &Db, value: &serde_json::Value) -> anyhow::Result<()> {
    let mut data = db.lock()?;
    data.ui_state = value.clone();
    db.save_state(&data)
}
