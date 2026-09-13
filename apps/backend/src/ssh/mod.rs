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
    /// Per-id locks that serialize connects for the same id (so duplicate
    /// requests share one connection) while different ids connect in parallel.
    connecting: Arc<Mutex<HashMap<String, Arc<Mutex<()>>>>>,
}

impl SshPool {
    pub fn new() -> Self {
        Self::default()
    }

    /// Open a session channel on the pooled connection for `conn_id`,
    /// connecting (or reconnecting once) as needed. Opening a channel doubles
    /// as the health check for cached handles. Network I/O never runs while the
    /// global handle-map lock is held.
    pub async fn open_session(&self, db: &Db, conn_id: &str) -> anyhow::Result<Channel<Msg>> {
        let conn = crate::db::connections::get(db, conn_id)?
            .with_context(|| format!("unknown connection id: {conn_id}"))?;

        // Fast path: reuse a cached, live connection.
        if let Some(channel) = self.try_open_cached(conn_id).await {
            return Ok(channel);
        }

        // Slow path: connect. Serialize connects per id so concurrent requests
        // for the same host don't each open a redundant connection.
        let connect_lock = self.connect_lock(conn_id).await;
        let _guard = connect_lock.lock().await;

        // Another task may have connected while we waited on the lock.
        if let Some(channel) = self.try_open_cached(conn_id).await {
            return Ok(channel);
        }

        // A failed connect inserts nothing, so the pool is never poisoned.
        let handle = Arc::new(client::connect(&conn).await?);
        let channel = handle.channel_open_session().await?;
        self.handles.lock().await.insert(conn_id.to_string(), handle);
        Ok(channel)
    }

    /// Clone out a cached handle (releasing the map lock immediately) and try to
    /// open a channel on it off-lock. Returns `None` when there is no usable
    /// cached connection; a dead handle is evicted.
    async fn try_open_cached(&self, conn_id: &str) -> Option<Channel<Msg>> {
        let handle = self.handles.lock().await.get(conn_id).cloned()?;

        if !handle.is_closed() {
            match handle.channel_open_session().await {
                Ok(channel) => return Some(channel),
                Err(err) => {
                    tracing::info!(conn_id, "cached SSH connection dead ({err}); reconnecting")
                }
            }
        }

        // Evict only if the map still holds this exact (dead) handle, so a fresh
        // connection installed by a concurrent reconnect is not clobbered.
        let mut handles = self.handles.lock().await;
        if let Some(current) = handles.get(conn_id)
            && Arc::ptr_eq(current, &handle)
        {
            handles.remove(conn_id);
        }
        None
    }

    /// Look up (or create) the per-id connect lock without holding it.
    async fn connect_lock(&self, conn_id: &str) -> Arc<Mutex<()>> {
        self.connecting
            .lock()
            .await
            .entry(conn_id.to_string())
            .or_insert_with(|| Arc::new(Mutex::new(())))
            .clone()
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
