use axum::Json;
use axum::extract::State;
use axum::http::StatusCode;

use crate::db::ui_state;
use crate::error::ApiResult;
use crate::state::AppState;

pub async fn get_state(State(state): State<AppState>) -> ApiResult<Json<serde_json::Value>> {
    Ok(Json(ui_state::get(&state.db)?))
}

pub async fn put_state(
    State(state): State<AppState>,
    Json(value): Json<serde_json::Value>,
) -> ApiResult<StatusCode> {
    ui_state::set(&state.db, &value)?;
    Ok(StatusCode::NO_CONTENT)
}
