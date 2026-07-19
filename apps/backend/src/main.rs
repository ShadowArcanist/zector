mod api;
mod config;
mod db;
mod error;
mod ssh;
mod state;
mod static_files;
mod term;

use axum::Router;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Default-feature tracing-subscriber (no env-filter); INFO is plenty here.
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    let config = config::Config::load()?;
    tracing::info!(data_dir = %config.data_dir.display(), "using data directory");

    let db = db::init(&config.db_path())?;
    let state = state::AppState::new(db);

    let app = Router::new()
        .nest("/api", api::router())
        .fallback(static_files::handler)
        .with_state(state);

    let addr = std::net::SocketAddr::from(([0, 0, 0, 0], config.port));
    let listener = tokio::net::TcpListener::bind(addr).await?;
    tracing::info!("zector listening on http://{addr}");
    axum::serve(listener, app).await?;
    Ok(())
}
