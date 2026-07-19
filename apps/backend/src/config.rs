use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct Config {
    pub port: u16,
    pub data_dir: PathBuf,
}

impl Config {
    pub fn load() -> anyhow::Result<Self> {
        let port = match std::env::var("ZECTOR_PORT") {
            Ok(v) => v
                .parse::<u16>()
                .map_err(|_| anyhow::anyhow!("invalid ZECTOR_PORT: {v}"))?,
            Err(_) => 7887,
        };

        let data_dir = match std::env::var("ZECTOR_DATA_DIR") {
            Ok(v) => PathBuf::from(v),
            Err(_) => dirs::data_dir()
                .ok_or_else(|| anyhow::anyhow!("could not determine OS data directory"))?
                .join("zector"),
        };
        std::fs::create_dir_all(&data_dir)?;

        Ok(Self { port, data_dir })
    }

    pub fn db_path(&self) -> PathBuf {
        self.data_dir.join("zector.db")
    }
}
