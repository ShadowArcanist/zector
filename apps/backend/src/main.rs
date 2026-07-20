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
    let mut args = std::env::args();
    let _executable = args.next();
    if args.next().as_deref() == Some("--sudo-list") {
        let path = args
            .next()
            .ok_or_else(|| anyhow::anyhow!("missing path for privileged file listing"))?;
        let entries = api::fs_local::list(&path).await?;
        println!("{}", serde_json::to_string(&entries)?);
        return Ok(());
    }

    // Default-feature tracing-subscriber (no env-filter); INFO is plenty here.
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    let config = config::Config::load()?;
    tracing::info!(data_dir = %config.data_dir.display(), "using data directory");

    let db = db::init(&config.config_dir, &config.data_dir)?;
    let state = state::AppState::new(db);

    let app = Router::new()
        .nest("/api", api::router())
        .fallback(static_files::handler)
        .with_state(state);

    let addr = std::net::SocketAddr::from(([0, 0, 0, 0], config.port));
    let listener = tokio::net::TcpListener::bind(addr).await?;
    tracing::info!("zector listening on http://{addr}");
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<std::net::SocketAddr>(),
    )
    .await?;
    Ok(())
}
