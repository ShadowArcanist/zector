use axum::Json;
use axum::extract::{ConnectInfo, Path, Query, State};
use axum::http::{StatusCode, header};
use axum::response::Response;
use bytes::Bytes;
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;

use crate::error::{ApiError, ApiResult};
use crate::ssh::sftp;
use crate::state::AppState;

use super::fs_local as local;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FsEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub is_symlink: bool,
    pub size: u64,
    pub modified: Option<u64>,
    pub mode: Option<u32>,
}

#[derive(Debug, Serialize)]
pub struct ListResponse {
    pub path: String,
    pub entries: Vec<FsEntry>,
}

#[derive(Debug, Deserialize)]
pub struct PathQuery {
    pub path: String,
    #[serde(default)]
    pub download: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct PathBody {
    pub path: String,
}

#[derive(Debug, Deserialize)]
pub struct RenameBody {
    pub from: String,
    pub to: String,
}

#[derive(Deserialize)]
pub struct SudoListBody {
    pub path: String,
    pub password: String,
}

fn sort_entries(entries: &mut [FsEntry]) {
    entries.sort_by(|a, b| {
        b.is_dir
            .cmp(&a.is_dir)
            .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
    });
}

pub async fn home(
    State(state): State<AppState>,
    Path(target): Path<String>,
) -> ApiResult<Json<serde_json::Value>> {
    let path = if target == "local" {
        local::home()?
    } else {
        let sftp = sftp::open(&state.ssh, &state.db, &target).await?;
        sftp::home(&sftp).await?
    };
    Ok(Json(serde_json::json!({ "path": path })))
}

pub async fn list(
    State(state): State<AppState>,
    Path(target): Path<String>,
    Query(query): Query<PathQuery>,
) -> ApiResult<Json<ListResponse>> {
    let mut entries = if target == "local" {
        local::list(&query.path).await?
    } else {
        let sftp = sftp::open(&state.ssh, &state.db, &target).await?;
        sftp::list(&sftp, &query.path).await?
    };
    sort_entries(&mut entries);
    Ok(Json(ListResponse {
        path: query.path,
        entries,
    }))
}

fn sudo_allowed_from(peer: SocketAddr) -> bool {
    peer.ip().is_loopback()
}

pub async fn list_sudo(
    ConnectInfo(peer): ConnectInfo<SocketAddr>,
    Json(body): Json<SudoListBody>,
) -> ApiResult<Json<ListResponse>> {
    if !sudo_allowed_from(peer) {
        return Err(ApiError::forbidden(
            "sudo file access is available only from this machine",
        ));
    }
    if body.password.is_empty() {
        return Err(ApiError::bad_request("password is required"));
    }
    let mut entries = local::list_sudo(&body.path, &body.password).await?;
    sort_entries(&mut entries);
    Ok(Json(ListResponse {
        path: body.path,
        entries,
    }))
}

pub async fn stat(
    State(state): State<AppState>,
    Path(target): Path<String>,
    Query(query): Query<PathQuery>,
) -> ApiResult<Json<FsEntry>> {
    let entry = if target == "local" {
        local::stat(&query.path).await?
    } else {
        let sftp = sftp::open(&state.ssh, &state.db, &target).await?;
        sftp::stat(&sftp, &query.path).await?
    };
    Ok(Json(entry))
}

pub async fn read(
    State(state): State<AppState>,
    Path(target): Path<String>,
    Query(query): Query<PathQuery>,
) -> ApiResult<Response> {
    let data = if target == "local" {
        local::read(&query.path).await?
    } else {
        let sftp = sftp::open(&state.ssh, &state.db, &target).await?;
        sftp::read(&sftp, &query.path).await?
    };

    let mime = mime_guess::from_path(&query.path).first_or_octet_stream();
    let mut builder = Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, mime.as_ref());

    if query.download.as_deref() == Some("1") {
        let filename = query.path.rsplit('/').next().unwrap_or("download");
        builder = builder.header(
            header::CONTENT_DISPOSITION,
            format!("attachment; filename=\"{}\"", filename.replace('"', "")),
        );
    }

    builder
        .body(axum::body::Body::from(data))
        .map_err(|e| ApiError::internal(format!("failed to build response: {e}")))
}

pub async fn write(
    State(state): State<AppState>,
    Path(target): Path<String>,
    Query(query): Query<PathQuery>,
    body: Bytes,
) -> ApiResult<StatusCode> {
    if target == "local" {
        local::write(&query.path, &body).await?;
    } else {
        let sftp = sftp::open(&state.ssh, &state.db, &target).await?;
        sftp::write(&sftp, &query.path, &body).await?;
    }
    Ok(StatusCode::NO_CONTENT)
}

pub async fn create_file(
    State(state): State<AppState>,
    Path(target): Path<String>,
    Json(body): Json<PathBody>,
) -> ApiResult<StatusCode> {
    if target == "local" {
        local::create_file(&body.path).await?;
    } else {
        let sftp = sftp::open(&state.ssh, &state.db, &target).await?;
        sftp::create_file(&sftp, &body.path).await?;
    }
    Ok(StatusCode::NO_CONTENT)
}

pub async fn mkdir(
    State(state): State<AppState>,
    Path(target): Path<String>,
    Json(body): Json<PathBody>,
) -> ApiResult<StatusCode> {
    if target == "local" {
        local::mkdir(&body.path).await?;
    } else {
        let sftp = sftp::open(&state.ssh, &state.db, &target).await?;
        sftp::mkdir(&sftp, &body.path).await?;
    }
    Ok(StatusCode::NO_CONTENT)
}

pub async fn rename(
    State(state): State<AppState>,
    Path(target): Path<String>,
    Json(body): Json<RenameBody>,
) -> ApiResult<StatusCode> {
    if target == "local" {
        local::rename(&body.from, &body.to).await?;
    } else {
        let sftp = sftp::open(&state.ssh, &state.db, &target).await?;
        sftp::rename(&sftp, &body.from, &body.to).await?;
    }
    Ok(StatusCode::NO_CONTENT)
}

pub async fn delete(
    State(state): State<AppState>,
    Path(target): Path<String>,
    Json(body): Json<PathBody>,
) -> ApiResult<StatusCode> {
    if target == "local" {
        local::delete(&body.path).await?;
    } else {
        let sftp = sftp::open(&state.ssh, &state.db, &target).await?;
        sftp::delete(&sftp, &body.path).await?;
    }
    Ok(StatusCode::NO_CONTENT)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sudo_file_access_is_loopback_only() {
        assert!(sudo_allowed_from("127.0.0.1:4567".parse().unwrap()));
        assert!(sudo_allowed_from("[::1]:4567".parse().unwrap()));
        assert!(!sudo_allowed_from("192.168.1.20:4567".parse().unwrap()));
    }
}
