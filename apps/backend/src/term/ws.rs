use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::{Query, State};
use axum::response::Response;
use serde::Deserialize;
use serde_json::json;
use tokio::sync::broadcast::error::RecvError;

use crate::state::AppState;

use super::{TermCmd, TermEvent, TermSession, local, ssh};

#[derive(Debug, Deserialize)]
pub struct WsQuery {
    pub term_id: String,
    pub target: String,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
enum ClientMsg {
    Resize { cols: u16, rows: u16 },
}

pub async fn ws_handler(
    State(state): State<AppState>,
    Query(query): Query<WsQuery>,
    ws: WebSocketUpgrade,
) -> Response {
    ws.on_upgrade(move |socket| handle_socket(state, query, socket))
}

async fn get_or_spawn(state: &AppState, query: &WsQuery) -> anyhow::Result<TermSession> {
    if let Some(session) = state.terms.get(&query.term_id) {
        return Ok(session);
    }
    let session = if query.target == "local" {
        local::spawn(query.term_id.clone(), state.terms.clone()).await?
    } else {
        ssh::spawn(
            query.term_id.clone(),
            &query.target,
            state.terms.clone(),
            &state.ssh,
            &state.db,
        )
        .await?
    };
    state.terms.insert(query.term_id.clone(), session.clone());
    Ok(session)
}

async fn handle_socket(state: AppState, query: WsQuery, mut socket: WebSocket) {
    let session = match get_or_spawn(&state, &query).await {
        Ok(session) => session,
        Err(err) => {
            let msg = json!({ "type": "error", "message": format!("{err:#}") }).to_string();
            let _ = socket.send(Message::text(msg)).await;
            return;
        }
    };

    // Take over as the only active socket: bump the attach generation so any
    // previous socket observes the change and closes.
    let mut gen_rx = session.attach_gen.subscribe();
    session.attach_gen.send_modify(|g| *g += 1);
    let my_gen = *gen_rx.borrow_and_update();

    // Atomically subscribe to live output and snapshot the replay buffer.
    let (replay, mut out_rx) = session.output.attach();
    if !replay.is_empty() && socket.send(Message::Binary(replay.into())).await.is_err() {
        return;
    }

    loop {
        tokio::select! {
            msg = socket.recv() => match msg {
                Some(Ok(Message::Binary(data))) => {
                    if session.input.send(TermCmd::Data(data.to_vec())).await.is_err() {
                        break;
                    }
                }
                Some(Ok(Message::Text(text))) => {
                    if let Ok(ClientMsg::Resize { cols, rows }) = serde_json::from_str(&text) {
                        let _ = session.input.send(TermCmd::Resize { cols, rows }).await;
                    }
                }
                Some(Ok(Message::Close(_))) | Some(Err(_)) | None => break, // socket gone; session survives
                Some(Ok(_)) => {}
            },
            ev = out_rx.recv() => match ev {
                Ok(TermEvent::Data(bytes)) => {
                    if socket.send(Message::Binary(bytes)).await.is_err() {
                        break;
                    }
                }
                Ok(TermEvent::Exit) => {
                    let _ = socket.send(Message::text(r#"{"type":"exit"}"#)).await;
                    break;
                }
                Err(RecvError::Lagged(_)) => continue,
                Err(RecvError::Closed) => break,
            },
            changed = gen_rx.changed() => {
                if changed.is_err() || *gen_rx.borrow_and_update() != my_gen {
                    break; // a newer socket attached to this term_id
                }
            }
        }
    }
}
