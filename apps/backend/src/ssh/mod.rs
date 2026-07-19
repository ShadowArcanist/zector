pub mod client;
pub mod sftp;

use std::collections::HashMap;
use std::sync::Arc;

use anyhow::Context;
use russh::Channel;
use russh::client::Msg;
use tokio::sync::Mutex;

use crate::db::Db;
use crate::db::connections::SshConnection;
use client::SshHandle;

/// Pool of authenticated SSH connections, one per saved connection id.
/// Reconnects on demand when a cached connection turns out to be dead.
#[derive(Clone, Default)]
pub struct SshPool {
    handles: Arc<Mutex<HashMap<String, Arc<SshHandle>>>>,
}

impl SshPool {
    pub fn new() -> Self {
        Self::default()
    }

    /// Open a session channel on the pooled connection for `conn_id`,
    /// connecting (or reconnecting once) as needed. Opening a channel doubles
    /// as the health check for cached handles.
    pub async fn open_session(&self, db: &Db, conn_id: &str) -> anyhow::Result<Channel<Msg>> {
        let conn = crate::db::connections::get(db, conn_id)?
            .with_context(|| format!("unknown connection id: {conn_id}"))?;

        let mut handles = self.handles.lock().await;

        if let Some(handle) = handles.get(conn_id) {
            if !handle.is_closed() {
                match handle.channel_open_session().await {
                    Ok(channel) => return Ok(channel),
                    Err(err) => {
                        tracing::info!(conn_id, "cached SSH connection dead ({err}); reconnecting")
                    }
                }
            }
            handles.remove(conn_id);
        }

        let handle = Arc::new(client::connect(&conn).await?);
        let channel = handle.channel_open_session().await?;
        handles.insert(conn_id.to_string(), handle);
        Ok(channel)
    }

    /// Drop the cached connection for an id (e.g. when it is deleted).
    pub async fn evict(&self, conn_id: &str) {
        self.handles.lock().await.remove(conn_id);
    }

    /// Full connect + auth + channel open, used by the "test" endpoint.
    /// Does not touch the pool.
    pub async fn test(conn: &SshConnection) -> anyhow::Result<()> {
        let handle = client::connect(conn).await?;
        let channel = handle.channel_open_session().await?;
        let _ = channel.close().await;
        Ok(())
    }
}
