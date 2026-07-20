use axum::Json;
use axum::extract::State;

use crate::error::ApiResult;
use crate::state::AppState;

/// User-editable config files, parsed fresh so hand edits show up on refresh.
pub async fn get_config(State(state): State<AppState>) -> ApiResult<Json<serde_json::Value>> {
    let settings = state.db.read_config_file("settings.json")?;
    let term_themes = state.db.read_config_file("terminal-themes.json")?;
    let backgrounds = state.db.read_config_file("themes.json")?;
    Ok(Json(serde_json::json!({
        "settings": settings,
        "termThemes": term_themes,
        "backgrounds": backgrounds,
    })))
}
