use std::net::UdpSocket;

use axum::Json;
use serde::Serialize;

#[derive(Serialize)]
pub struct LocalMachineInfo {
    pub ip: String,
    pub username: String,
}

fn local_ip() -> String {
    UdpSocket::bind("0.0.0.0:0")
        .and_then(|socket| {
            socket.connect("8.8.8.8:80")?;
            socket.local_addr()
        })
        .map(|address| address.ip().to_string())
        .unwrap_or_else(|_| "127.0.0.1".to_owned())
}

pub fn machine_info() -> LocalMachineInfo {
    LocalMachineInfo {
        ip: local_ip(),
        username: std::env::var("USER")
            .or_else(|_| std::env::var("USERNAME"))
            .unwrap_or_else(|_| "local".to_owned()),
    }
}

pub async fn get_local_info() -> Json<LocalMachineInfo> {
    Json(machine_info())
}
