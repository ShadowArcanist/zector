use std::io::{Read, Write};
use std::sync::Arc;

use anyhow::Context;
use portable_pty::{CommandBuilder, PtySize, native_pty_system};
use tokio::sync::mpsc;

use super::{Output, TermCmd, TermManager, TermSession, new_session};

fn pick_shell() -> String {
    if let Ok(shell) = std::env::var("SHELL")
        && !shell.is_empty()
    {
        return shell;
    }
    for candidate in ["/bin/zsh", "/bin/bash"] {
        if std::path::Path::new(candidate).exists() {
            return candidate.to_string();
        }
    }
    "/bin/sh".to_string()
}

/// Spawn a local PTY shell session. Default size 80x24 until first resize.
pub async fn spawn(term_id: String, manager: TermManager) -> anyhow::Result<TermSession> {
    let pty = native_pty_system();
    let pair = pty
        .openpty(PtySize {
            rows: 24,
            cols: 80,
            pixel_width: 0,
            pixel_height: 0,
        })
        .context("failed to open pty")?;

    let mut cmd = CommandBuilder::new(pick_shell());
    cmd.env("TERM", "xterm-256color");
    if let Some(home) = dirs::home_dir() {
        cmd.cwd(home);
    }

    let mut child = pair
        .slave
        .spawn_command(cmd)
        .context("failed to spawn shell")?;
    drop(pair.slave);

    let mut killer = child.clone_killer();
    let master = pair.master;
    let mut reader = master
        .try_clone_reader()
        .context("failed to clone pty reader")?;
    let mut writer = master.take_writer().context("failed to take pty writer")?;

    let (input_tx, mut input_rx) = mpsc::channel::<TermCmd>(64);
    let output = Output::new();
    let session = new_session(input_tx, Arc::clone(&output));

    // Blocking reader thread: PTY output -> ring buffer + broadcast.
    let read_output = Arc::clone(&output);
    let read_manager = manager.clone();
    let read_term_id = term_id.clone();
    std::thread::spawn(move || {
        let mut buf = [0u8; 8192];
        loop {
            match reader.read(&mut buf) {
                Ok(0) | Err(_) => break,
                Ok(n) => read_output.push(&buf[..n]),
            }
        }
        // Shell exited (or PTY closed): reap, notify, remove.
        let _ = child.wait();
        read_output.exit();
        read_manager.remove(&read_term_id);
    });

    // Command task: stdin writes, resize, kill. Owns the master (keeps PTY open).
    tokio::spawn(async move {
        while let Some(cmd) = input_rx.recv().await {
            match cmd {
                TermCmd::Data(data) => {
                    if writer.write_all(&data).and_then(|_| writer.flush()).is_err() {
                        break;
                    }
                }
                TermCmd::Resize { cols, rows } => {
                    let _ = master.resize(PtySize {
                        rows,
                        cols,
                        pixel_width: 0,
                        pixel_height: 0,
                    });
                }
                TermCmd::Kill => {
                    let _ = killer.kill();
                    break;
                }
            }
        }
        drop(master);
    });

    Ok(session)
}
