mod api;
mod cli;
mod config;
mod daemon;
mod db;
mod error;
mod ssh;
mod state;
mod static_files;
mod term;

use axum::Router;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let command = cli::parse(std::env::args().skip(1))?;
    match command {
        cli::Command::Help => println!("{}", cli::help()),
        cli::Command::Start => daemon::start(&config::Config::load()?)?,
        cli::Command::Stop => daemon::stop(&config::Config::load()?)?,
        cli::Command::Status => daemon::status(&config::Config::load()?)?,
        cli::Command::Foreground | cli::Command::Serve => serve(config::Config::load()?).await?,
        cli::Command::SudoList(path) => {
            let entries = api::fs_local::list(&path).await?;
            println!("{}", serde_json::to_string(&entries)?);
        }
    }
    Ok(())
}

async fn serve(config: config::Config) -> anyhow::Result<()> {
    let _pid = daemon::PidGuard::acquire(&config)?;
    // Default-feature tracing-subscriber (no env-filter); INFO is plenty here.
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

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
    .with_graceful_shutdown(shutdown_signal())
    .await?;
    Ok(())
}

async fn shutdown_signal() {
    let mut terminate = tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
        .expect("could not install SIGTERM handler");
    tokio::select! {
        _ = tokio::signal::ctrl_c() => {}
        _ = terminate.recv() => {}
    }
}
