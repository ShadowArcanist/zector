use std::os::unix::fs::PermissionsExt;
use std::path::Path;
use std::time::UNIX_EPOCH;

use anyhow::Context;

use super::fs::FsEntry;

pub fn home() -> anyhow::Result<String> {
    let home = dirs::home_dir().context("could not determine home directory")?;
    Ok(home.to_string_lossy().into_owned())
}

pub async fn list(path: &str) -> anyhow::Result<Vec<FsEntry>> {
    let mut dir = tokio::fs::read_dir(path)
        .await
        .with_context(|| format!("failed to list {path}"))?;
    let mut entries = Vec::new();

    while let Some(entry) = dir.next_entry().await? {
        let name = entry.file_name().to_string_lossy().into_owned();
        let entry_path = entry.path();
        let file_type = entry.file_type().await?;
        let is_symlink = file_type.is_symlink();
        // Follow symlinks for dir/size/mtime so links to directories are
        // navigable; fall back to link metadata for dangling links.
        let meta = match tokio::fs::metadata(&entry_path).await {
            Ok(meta) => meta,
            Err(_) => entry.metadata().await?,
        };
        entries.push(FsEntry {
            path: entry_path.to_string_lossy().into_owned(),
            name,
            is_dir: meta.is_dir(),
            is_symlink,
            size: meta.len(),
            modified: meta
                .modified()
                .ok()
                .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                .map(|d| d.as_secs()),
            mode: Some(meta.permissions().mode()),
        });
    }
    Ok(entries)
}

pub async fn stat(path: &str) -> anyhow::Result<FsEntry> {
    let link_meta = tokio::fs::symlink_metadata(path)
        .await
        .with_context(|| format!("failed to stat {path}"))?;
    let is_symlink = link_meta.file_type().is_symlink();
    let meta = if is_symlink {
        tokio::fs::metadata(path).await.unwrap_or(link_meta)
    } else {
        link_meta
    };
    let name = Path::new(path)
        .file_name()
        .map(|name| name.to_string_lossy().into_owned())
        .unwrap_or_else(|| path.to_owned());
    Ok(FsEntry {
        name,
        path: path.to_owned(),
        is_dir: meta.is_dir(),
        is_symlink,
        size: meta.len(),
        modified: meta
            .modified()
            .ok()
            .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
            .map(|duration| duration.as_secs()),
        mode: Some(meta.permissions().mode()),
    })
}

pub async fn read(path: &str) -> anyhow::Result<Vec<u8>> {
    tokio::fs::read(path)
        .await
        .with_context(|| format!("failed to read {path}"))
}

pub async fn write(path: &str, data: &[u8]) -> anyhow::Result<()> {
    tokio::fs::write(path, data)
        .await
        .with_context(|| format!("failed to write {path}"))
}

pub async fn mkdir(path: &str) -> anyhow::Result<()> {
    tokio::fs::create_dir_all(path)
        .await
        .with_context(|| format!("failed to create directory {path}"))
}

pub async fn rename(from: &str, to: &str) -> anyhow::Result<()> {
    tokio::fs::rename(from, to)
        .await
        .with_context(|| format!("failed to rename {from} to {to}"))
}

pub async fn delete(path: &str) -> anyhow::Result<()> {
    let meta = tokio::fs::symlink_metadata(path)
        .await
        .with_context(|| format!("failed to stat {path}"))?;
    if meta.is_dir() {
        tokio::fs::remove_dir_all(path)
            .await
            .with_context(|| format!("failed to delete directory {path}"))
    } else {
        tokio::fs::remove_file(path)
            .await
            .with_context(|| format!("failed to delete {path}"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn stat_reports_files_and_directories() {
        let root = std::env::temp_dir().join(format!("zector-stat-{}", uuid::Uuid::new_v4()));
        let file = root.join("example.txt");
        tokio::fs::create_dir_all(&root).await.unwrap();
        tokio::fs::write(&file, b"hello").await.unwrap();

        let dir_entry = stat(root.to_str().unwrap()).await.unwrap();
        let file_entry = stat(file.to_str().unwrap()).await.unwrap();

        assert!(dir_entry.is_dir);
        assert_eq!(file_entry.name, "example.txt");
        assert_eq!(file_entry.size, 5);
        assert!(!file_entry.is_dir);

        tokio::fs::remove_dir_all(root).await.unwrap();
    }
}
