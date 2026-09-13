pub mod local;
pub mod ssh;
pub mod ws;

use std::collections::{HashMap, VecDeque};
use std::sync::{Arc, Mutex as StdMutex};

use bytes::Bytes;
use tokio::sync::{broadcast, mpsc, watch};

/// Cap on the replay ring buffer per terminal (~200 KB).
const BUFFER_CAP: usize = 200 * 1024;

/// Commands from the WebSocket (or DELETE handler) into a terminal backend.
#[derive(Debug)]
pub enum TermCmd {
    Data(Bytes),
    Resize { cols: u16, rows: u16 },
    Kill,
}

/// Events from a terminal backend out to attached sockets.
#[derive(Debug, Clone)]
pub enum TermEvent {
    Data(Bytes),
    Exit,
}

/// Replay ring: a deque of output chunks plus their running byte total, so a
/// full ring never triggers a large memmove (old chunks are popped whole).
#[derive(Default)]
struct Ring {
    chunks: VecDeque<Bytes>,
    total: usize,
}

/// Output side of a session. The ring buffer and the broadcast send happen
/// under the same lock so an attach can atomically subscribe + snapshot the
/// buffer without missing or duplicating bytes.
pub struct Output {
    buffer: StdMutex<Ring>,
    tx: broadcast::Sender<TermEvent>,
}

impl Output {
    pub fn new() -> Arc<Self> {
        let (tx, _) = broadcast::channel(1024);
        Arc::new(Self {
            buffer: StdMutex::new(Ring::default()),
            tx,
        })
    }

    pub fn push(&self, data: &[u8]) {
        // Build the shared chunk once; it serves both the ring and the broadcast.
        let bytes = Bytes::copy_from_slice(data);
        let mut buf = self.buffer.lock().unwrap();
        buf.chunks.push_back(bytes.clone());
        buf.total += bytes.len();
        // Trim to the cap by dropping whole oldest chunks (no memmove).
        while buf.total > BUFFER_CAP {
            match buf.chunks.pop_front() {
                Some(front) => buf.total -= front.len(),
                None => break,
            }
        }
        let _ = self.tx.send(TermEvent::Data(bytes));
    }

    pub fn exit(&self) {
        let buf = self.buffer.lock().unwrap();
        let _ = self.tx.send(TermEvent::Exit);
        drop(buf);
    }

    /// Subscribe and snapshot the replay buffer atomically as one frame.
    pub fn attach(&self) -> (Bytes, broadcast::Receiver<TermEvent>) {
        let buf = self.buffer.lock().unwrap();
        let rx = self.tx.subscribe();
        let mut snapshot = Vec::with_capacity(buf.total);
        for chunk in &buf.chunks {
            snapshot.extend_from_slice(chunk);
        }
        (Bytes::from(snapshot), rx)
    }
}

#[derive(Clone)]
pub struct TermSession {
    pub input: mpsc::Sender<TermCmd>,
    pub output: Arc<Output>,
    /// Bumped on every attach; older sockets observe the change and close.
    pub attach_gen: watch::Sender<u64>,
}

/// Session registry. Uses a std mutex (never held across await) so backend
/// threads can remove sessions without a tokio runtime.
#[derive(Clone, Default)]
pub struct TermManager {
    sessions: Arc<StdMutex<HashMap<String, TermSession>>>,
}

impl TermManager {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn get(&self, term_id: &str) -> Option<TermSession> {
        self.sessions.lock().unwrap().get(term_id).cloned()
    }

    pub fn insert(&self, term_id: String, session: TermSession) {
        self.sessions.lock().unwrap().insert(term_id, session);
    }

    pub fn remove(&self, term_id: &str) -> Option<TermSession> {
        self.sessions.lock().unwrap().remove(term_id)
    }

    /// Kill a session: send Kill to the backend and drop it from the map.
    pub async fn kill(&self, term_id: &str) {
        if let Some(session) = self.remove(term_id) {
            let _ = session.input.send(TermCmd::Kill).await;
        }
    }
}

pub fn new_session(input: mpsc::Sender<TermCmd>, output: Arc<Output>) -> TermSession {
    let (attach_gen, _) = watch::channel(0);
    TermSession {
        input,
        output,
        attach_gen,
    }
}
