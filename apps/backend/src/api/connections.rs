use std::time::Duration;

use axum::Json;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use serde_json::json;

use crate::db::connections::{self, ConnectionInput, SshConnection};
use crate::error::{ApiError, ApiResult};
use crate::ssh::SshPool;
use crate::state::AppState;

pub async fn list(State(state): State<AppState>) -> ApiResult<Json<Vec<SshConnection>>> {
    Ok(Json(connections::list(&state.db)?))
}

pub async fn create(
    State(state): State<AppState>,
    Json(input): Json<ConnectionInput>,
) -> ApiResult<Json<SshConnection>> {
    validate(&input)?;
    Ok(Json(connections::insert(&state.db, &input)?))
}

pub async fn update(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(input): Json<ConnectionInput>,
) -> ApiResult<Json<SshConnection>> {
    validate(&input)?;
    let updated = connections::update(&state.db, &id, &input)?
        .ok_or_else(|| ApiError::not_found(format!("no connection with id {id}")))?;
    // Saved credentials may have changed; force a fresh connect next time.
    state.ssh.evict(&id).await;
    Ok(Json(updated))
}

pub async fn delete(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ApiResult<StatusCode> {
    if !connections::delete(&state.db, &id)? {
        return Err(ApiError::not_found(format!("no connection with id {id}")));
    }
    // Evict the pooled connection; its terminals die naturally when it drops.
    state.ssh.evict(&id).await;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn test(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ApiResult<Json<serde_json::Value>> {
    let conn = connections::get(&state.db, &id)?
        .ok_or_else(|| ApiError::not_found(format!("no connection with id {id}")))?;

    let result = tokio::time::timeout(Duration::from_secs(10), SshPool::test(&conn)).await;
    let body = match result {
        Ok(Ok(())) => json!({ "ok": true }),
        Ok(Err(err)) => json!({ "ok": false, "error": format!("{err:#}") }),
        Err(_) => json!({ "ok": false, "error": "connection timed out after 10s" }),
    };
    Ok(Json(body))
}

fn validate(input: &ConnectionInput) -> Result<(), ApiError> {
    match input.auth_type.as_str() {
        "password" | "key" => {}
        other => {
            return Err(ApiError::bad_request(format!(
                "auth_type must be 'password' or 'key', got '{other}'"
            )));
        }
    }
    if input.host.trim().is_empty() {
        return Err(ApiError::bad_request("host must not be empty"));
    }
    if input.username.trim().is_empty() {
        return Err(ApiError::bad_request("username must not be empty"));
    }
    Ok(())
}
