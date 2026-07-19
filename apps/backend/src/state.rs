use crate::db::Db;
use crate::ssh::SshPool;
use crate::term::TermManager;

#[derive(Clone)]
pub struct AppState {
    pub db: Db,
    pub ssh: SshPool,
    pub terms: TermManager,
}

impl AppState {
    pub fn new(db: Db) -> Self {
        Self {
            db,
            ssh: SshPool::new(),
            terms: TermManager::new(),
        }
    }
}
