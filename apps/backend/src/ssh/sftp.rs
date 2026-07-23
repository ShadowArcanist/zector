use anyhow::Context;
use russh_sftp::client::SftpSession;
use russh_sftp::protocol::OpenFlags;
use tokio::io::AsyncWriteExt;

use crate::api::fs::FsEntry;
use crate::db::Db;

use super::SshPool;

/// Open a fresh SFTP session on the pooled SSH connection.
/// Sessions are per-request: channels are cheap and this avoids staleness.
pub async fn open(pool: &SshPool, db: &Db, conn_id: &str) -> anyhow::Result<SftpSession> {
    let channel = pool.open_session(db, conn_id).await?;
    channel
        .request_subsystem(true, "sftp")
        .await
        .context("failed to request sftp subsystem")?;
    SftpSession::new(channel.into_stream())
        .await
        .context("failed to start sftp session")
}

pub async fn home(sftp: &SftpSession) -> anyhow::Result<String> {
    Ok(sftp.canonicalize(".").await?)
}

pub async fn list(sftp: &SftpSession, path: &str) -> anyhow::Result<Vec<FsEntry>> {
    let dir = sftp.read_dir(path).await?;
    let mut entries = Vec::new();
    for entry in dir {
        let name = entry.file_name();
        if name == "." || name == ".." {
            continue;
        }
        let meta = entry.metadata();
        let file_type = entry.file_type();
        entries.push(FsEntry {
            path: join(path, &name),
            name,
            is_dir: file_type.is_dir(),
            is_symlink: file_type.is_symlink(),
            size: meta.size.unwrap_or(0),
            modified: meta.mtime.map(u64::from),
            mode: meta.permissions,
        });
    }
    Ok(entries)
}

pub async fn stat(sftp: &SftpSession, path: &str) -> anyhow::Result<FsEntry> {
    let meta = sftp.symlink_metadata(path).await?;
    Ok(FsEntry {
        name: path
            .rsplit('/')
            .find(|part| !part.is_empty())
            .unwrap_or("/")
            .to_owned(),
        path: path.to_owned(),
        is_dir: meta.is_dir(),
        is_symlink: meta.is_symlink(),
        size: meta.size.unwrap_or(0),
        modified: meta.mtime.map(u64::from),
        mode: meta.permissions,
    })
}

pub async fn read(sftp: &SftpSession, path: &str) -> anyhow::Result<Vec<u8>> {
    Ok(sftp.read(path).await?)
}

pub async fn write(sftp: &SftpSession, path: &str, data: &[u8]) -> anyhow::Result<()> {
    // SftpSession::write does not create/truncate, so open explicitly.
    let mut file = sftp.create(path).await?;
    file.write_all(data).await?;
    file.shutdown().await?;
    Ok(())
}

pub async fn create_file(sftp: &SftpSession, path: &str) -> anyhow::Result<()> {
    let mut file = sftp
        .open_with_flags(
            path,
            OpenFlags::CREATE | OpenFlags::EXCLUDE | OpenFlags::WRITE,
        )
        .await?;
    file.shutdown().await?;
    Ok(())
}

pub async fn mkdir(sftp: &SftpSession, path: &str) -> anyhow::Result<()> {
    Ok(sftp.create_dir(path).await?)
}

pub async fn rename(sftp: &SftpSession, from: &str, to: &str) -> anyhow::Result<()> {
    Ok(sftp.rename(from, to).await?)
}

pub async fn delete(sftp: &SftpSession, path: &str) -> anyhow::Result<()> {
    let meta = sftp.symlink_metadata(path).await?;
    if meta.is_dir() {
        delete_dir_recursive(sftp, path).await
    } else {
        Ok(sftp.remove_file(path).await?)
    }
}

/// SFTP has no recursive remove; walk the tree manually.
async fn delete_dir_recursive(sftp: &SftpSession, path: &str) -> anyhow::Result<()> {
    let dir = sftp.read_dir(path).await?;
    for entry in dir {
        let name = entry.file_name();
        if name == "." || name == ".." {
            continue;
        }
        let child = join(path, &name);
        if entry.file_type().is_dir() {
            Box::pin(delete_dir_recursive(sftp, &child)).await?;
        } else {
            sftp.remove_file(&child).await?;
        }
    }
    Ok(sftp.remove_dir(path).await?)
}

fn join(dir: &str, name: &str) -> String {
    if dir.ends_with('/') {
        format!("{dir}{name}")
    } else {
        format!("{dir}/{name}")
    }
}
