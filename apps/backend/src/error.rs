use axum::Json;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use serde_json::json;

/// API error type: any handler failure becomes `{"error": msg}` with a status code.
pub struct ApiError {
    pub status: StatusCode,
    pub message: String,
}

pub type ApiResult<T> = Result<T, ApiError>;

impl ApiError {
    pub fn new(status: StatusCode, message: impl Into<String>) -> Self {
        Self {
            status,
            message: message.into(),
        }
    }

    pub fn bad_request(message: impl Into<String>) -> Self {
        Self::new(StatusCode::BAD_REQUEST, message)
    }

    pub fn not_found(message: impl Into<String>) -> Self {
        Self::new(StatusCode::NOT_FOUND, message)
    }

    pub fn forbidden(message: impl Into<String>) -> Self {
        Self::new(StatusCode::FORBIDDEN, message)
    }

    pub fn internal(message: impl Into<String>) -> Self {
        Self::new(StatusCode::INTERNAL_SERVER_ERROR, message)
    }

    /// Map common IO failures to useful HTTP statuses for filesystem clients.
    pub fn from_anyhow(err: anyhow::Error) -> Self {
        for cause in err.chain() {
            if let Some(io) = cause.downcast_ref::<std::io::Error>() {
                match io.kind() {
                    std::io::ErrorKind::NotFound => return Self::not_found(format!("{err:#}")),
                    std::io::ErrorKind::PermissionDenied => {
                        return Self::forbidden(format!("{err:#}"));
                    }
                    _ => {}
                }
            }
        }
        Self::internal(format!("{err:#}"))
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        (self.status, Json(json!({ "error": self.message }))).into_response()
    }
}

impl From<anyhow::Error> for ApiError {
    fn from(err: anyhow::Error) -> Self {
        Self::from_anyhow(err)
    }
}

impl From<rusqlite::Error> for ApiError {
    fn from(err: rusqlite::Error) -> Self {
        Self::internal(format!("database error: {err}"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn permission_denied_errors_are_forbidden() {
        let err = anyhow::Error::new(std::io::Error::new(
            std::io::ErrorKind::PermissionDenied,
            "operation not permitted",
        ));

        assert_eq!(ApiError::from_anyhow(err).status, StatusCode::FORBIDDEN);
    }
}
