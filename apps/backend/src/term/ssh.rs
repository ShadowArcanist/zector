use std::sync::Arc;

use anyhow::Context;
use russh::ChannelMsg;
use tokio::sync::mpsc;

use crate::db::Db;
use crate::ssh::SshPool;

use super::{Output, TermCmd, TermManager, TermSession, new_session};

/// Spawn a shell on an SSH channel for the given saved connection.
/// Default PTY size 80x24 until the first resize.
pub async fn spawn(
    term_id: String,
    conn_id: &str,
    manager: TermManager,
    pool: &SshPool,
    db: &Db,
) -> anyhow::Result<TermSession> {
    let channel = pool.open_session(db, conn_id).await?;
    channel
        .request_pty(true, "xterm-256color", 80, 24, 0, 0, &[])
        .await
        .context("failed to request pty")?;
    channel
        .request_shell(true)
        .await
        .context("failed to request shell")?;

    let (mut read_half, write_half) = channel.split();

    let (input_tx, mut input_rx) = mpsc::channel::<TermCmd>(64);
    let output = Output::new();
    let session = new_session(input_tx, Arc::clone(&output));

    // Output pump: SSH channel -> ring buffer + broadcast.
    let pump_output = Arc::clone(&output);
    tokio::spawn(async move {
        loop {
            match read_half.wait().await {
                Some(ChannelMsg::Data { data }) => pump_output.push(&data),
                Some(ChannelMsg::ExtendedData { data, .. }) => pump_output.push(&data),
                // Exit status may precede trailing data; wait for Close/EOF.
                Some(ChannelMsg::ExitStatus { .. }) | Some(ChannelMsg::ExitSignal { .. }) => {}
                Some(ChannelMsg::Eof) | Some(ChannelMsg::Close) | None => break,
                Some(_) => {}
            }
        }
        pump_output.exit();
        manager.remove(&term_id);
    });

    // Command task: stdin, resize, kill.
    tokio::spawn(async move {
        while let Some(cmd) = input_rx.recv().await {
            match cmd {
                TermCmd::Data(data) => {
                    if write_half.data_bytes(data).await.is_err() {
                        break;
                    }
                }
                TermCmd::Resize { cols, rows } => {
                    let _ = write_half
                        .window_change(u32::from(cols), u32::from(rows), 0, 0)
                        .await;
                }
                TermCmd::Kill => break,
            }
        }
        let _ = write_half.close().await;
    });

    Ok(session)
}
