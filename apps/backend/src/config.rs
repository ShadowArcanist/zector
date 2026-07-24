use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct Config {
    pub port: u16,
    pub data_dir: PathBuf,
    pub config_dir: PathBuf,
}

impl Config {
    pub fn load() -> anyhow::Result<Self> {
        let port = match std::env::var("ZECTOR_PORT") {
            Ok(v) => v
                .parse::<u16>()
                .map_err(|_| anyhow::anyhow!("invalid ZECTOR_PORT: {v}"))?,
            Err(_) => 7887,
        };

        // legacy data dir: only read for one-time sqlite migration
        let data_dir = match std::env::var("ZECTOR_DATA_DIR") {
            Ok(v) => PathBuf::from(v),
            Err(_) => dirs::data_dir()
                .ok_or_else(|| anyhow::anyhow!("could not determine OS data directory"))?
                .join("zector"),
        };

        // User-editable JSON configs live here for easy backup and sharing.
        let config_dir = match std::env::var("ZECTOR_CONFIG_DIR") {
            Ok(v) => PathBuf::from(v),
            Err(_) => dirs::home_dir()
                .ok_or_else(|| anyhow::anyhow!("could not determine home directory"))?
                .join(".config")
                .join("zector"),
        };

        Ok(Self {
            port,
            data_dir,
            config_dir,
        })
    }
}
