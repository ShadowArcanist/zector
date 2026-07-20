pub mod config;
pub mod connections;
pub mod fs;
pub mod fs_local;
pub mod local_info;
pub mod state;
pub mod term;

#[cfg(test)]
mod local_info_tests {
    #[test]
    fn local_machine_info_always_has_an_address_and_username() {
        let info = super::local_info::machine_info();
        assert!(!info.ip.is_empty());
        assert!(!info.username.is_empty());
    }
}

use axum::Router;
use axum::extract::DefaultBodyLimit;
use axum::routing::{delete, get, post, put};

use crate::state::AppState;

/// 512 MB cap for file uploads (fs write bodies are fully buffered in v1).
const MAX_BODY: usize = 512 * 1024 * 1024;

pub fn router() -> Router<AppState> {
    Router::new()
        .route(
            "/connections",
            get(connections::list).post(connections::create),
        )
        .route("/connections/reorder", put(connections::reorder))
        .route(
            "/connections/{id}",
            put(connections::update).delete(connections::delete),
        )
        .route("/connections/{id}/test", post(connections::test))
        .route("/fs/{target}/home", get(fs::home))
        .route("/fs/{target}/list", get(fs::list))
        .route("/fs/local/list-sudo", post(fs::list_sudo))
        .route("/fs/{target}/stat", get(fs::stat))
        .route("/fs/{target}/read", get(fs::read))
        .route("/fs/{target}/write", post(fs::write))
        .route("/fs/{target}/mkdir", post(fs::mkdir))
        .route("/fs/{target}/rename", post(fs::rename))
        .route("/fs/{target}/delete", post(fs::delete))
        .route("/config", get(config::get_config))
        .route("/local-info", get(local_info::get_local_info))
        .route("/state", get(state::get_state).put(state::put_state))
        .route("/term/ws", get(term::ws_handler))
        .route("/term/{term_id}", delete(term::delete))
        .layer(DefaultBodyLimit::max(MAX_BODY))
}
