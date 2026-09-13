use std::borrow::Cow;
use std::fmt::Write as _;

use axum::body::Body;
use axum::http::{StatusCode, Uri, header};
use axum::response::{IntoResponse, Response};
use bytes::Bytes;
use rust_embed::{EmbeddedFile, RustEmbed};

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
        return serve(candidate, file);
    }
    // SPA fallback: unknown, extension-less routes get the app shell.
    if let Some(index) = Assets::get("index.html") {
        return serve("index.html", index);
    }
    (StatusCode::NOT_FOUND, "not found").into_response()
}

fn serve(path: &str, file: EmbeddedFile) -> Response {
    let mime = mime_guess::from_path(path).first_or_octet_stream();

    // Serve embedded bytes without copying when they are `'static` (the normal
    // release build); only a rare owned variant needs an allocation.
    let body = match file.data {
        Cow::Borrowed(bytes) => Bytes::from_static(bytes),
        Cow::Owned(bytes) => Bytes::from(bytes),
    };

    // ETag lets clients revalidate; the app shell must not be cached long or
    // deployments won't take effect, while fingerprinted assets can be.
    let is_html = mime.type_() == mime_guess::mime::TEXT && mime.subtype() == mime_guess::mime::HTML;
    let cache_control = if is_html {
        "no-cache"
    } else {
        "public, max-age=31536000, immutable"
    };

    let mut etag = String::with_capacity(2 + 64);
    etag.push('"');
    for byte in file.metadata.sha256_hash() {
        let _ = write!(etag, "{byte:02x}");
    }
    etag.push('"');

    Response::builder()
        .status(StatusCode::OK)
        .header(header::CONTENT_TYPE, mime.as_ref())
        .header(header::CACHE_CONTROL, cache_control)
        .header(header::ETAG, etag)
        .body(Body::from(body))
        .unwrap_or_else(|_| StatusCode::INTERNAL_SERVER_ERROR.into_response())
}
