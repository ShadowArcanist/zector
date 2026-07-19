use axum::http::{StatusCode, Uri, header};
use axum::response::{IntoResponse, Response};
use rust_embed::RustEmbed;

/// Embedded frontend build. The folder must exist at compile time; a
/// placeholder index.html is checked in generation-side if the frontend has
/// not been built yet.
#[derive(RustEmbed)]
#[folder = "../frontend/dist"]
struct Assets;

/// Serve embedded static files at `/` with SPA fallback to index.html.
pub async fn handler(uri: Uri) -> Response {
    let path = uri.path().trim_start_matches('/');
    let candidate = if path.is_empty() { "index.html" } else { path };

    if let Some(file) = Assets::get(candidate) {
        return serve(candidate, file.data.into_owned());
    }
    // SPA fallback: unknown, extension-less routes get the app shell.
    if let Some(index) = Assets::get("index.html") {
        return serve("index.html", index.data.into_owned());
    }
    (StatusCode::NOT_FOUND, "not found").into_response()
}

fn serve(path: &str, data: Vec<u8>) -> Response {
    let mime = mime_guess::from_path(path).first_or_octet_stream();
    ([(header::CONTENT_TYPE, mime.to_string())], data).into_response()
}
