use axum::extract::{Path, State};
use axum::http::StatusCode;

use crate::error::ApiResult;
use crate::state::AppState;

pub use crate::term::ws::ws_handler;

pub async fn delete(
    State(state): State<AppState>,
    Path(term_id): Path<String>,
) -> ApiResult<StatusCode> {
    state.terms.kill(&term_id).await;
    Ok(StatusCode::NO_CONTENT)
}
