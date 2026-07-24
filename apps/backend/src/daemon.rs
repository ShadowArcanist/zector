use std::fs::{File, OpenOptions};
use std::os::unix::process::CommandExt;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

use anyhow::Context;

use crate::config::Config;

pub fn pid_path(data_dir: &Path) -> PathBuf {
    data_dir.join("zector.pid")
}

pub fn log_path(data_dir: &Path) -> PathBuf {
    data_dir.join("zector.log")
}

pub fn read_pid(path: &Path) -> anyhow::Result<Option<u32>> {
    let value = match std::fs::read_to_string(path) {
        Ok(value) => value,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(error) => return Err(error.into()),
    };
    let pid = value
        .trim()
        .parse::<u32>()
        .with_context(|| format!("invalid PID in {}", path.display()))?;
    Ok(Some(pid))
}

fn process_is_running(pid: u32) -> bool {
    let result = unsafe { libc::kill(pid as i32, 0) };
    result == 0 || std::io::Error::last_os_error().raw_os_error() == Some(libc::EPERM)
}

fn running_pid(config: &Config) -> anyhow::Result<Option<u32>> {
    let path = pid_path(&config.data_dir);
    let Some(pid) = read_pid(&path)? else {
        return Ok(None);
    };
    if process_is_running(pid) {
        Ok(Some(pid))
    } else {
        let _ = std::fs::remove_file(path);
        Ok(None)
    }
}

pub struct PidGuard {
    path: PathBuf,
    pid: u32,
}

impl PidGuard {
    pub fn acquire(config: &Config) -> anyhow::Result<Self> {
        std::fs::create_dir_all(&config.data_dir)
            .with_context(|| format!("could not create {}", config.data_dir.display()))?;
        if let Some(pid) = running_pid(config)? {
            anyhow::bail!("zector is already running (PID {pid})");
        }

        let path = pid_path(&config.data_dir);
        let pid = std::process::id();
        std::fs::write(&path, format!("{pid}\n"))
            .with_context(|| format!("could not write {}", path.display()))?;
        Ok(Self { path, pid })
    }
}

impl Drop for PidGuard {
    fn drop(&mut self) {
        if read_pid(&self.path).ok().flatten() == Some(self.pid) {
            let _ = std::fs::remove_file(&self.path);
        }
    }
}

fn open_log(config: &Config) -> anyhow::Result<File> {
    std::fs::create_dir_all(&config.data_dir)
        .with_context(|| format!("could not create {}", config.data_dir.display()))?;
    OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_path(&config.data_dir))
        .context("could not open zector log")
}

pub fn start(config: &Config) -> anyhow::Result<()> {
    if let Some(pid) = running_pid(config)? {
        println!("zector is already running (PID {pid})");
        return Ok(());
    }

    let log = open_log(config)?;
    let stderr = log.try_clone()?;
    let mut command = Command::new(std::env::current_exe()?);
    command
        .arg("--serve")
        .stdin(Stdio::null())
        .stdout(Stdio::from(log))
        .stderr(Stdio::from(stderr));
    unsafe {
        command.pre_exec(|| {
            if libc::setsid() == -1 {
                return Err(std::io::Error::last_os_error());
            }
            Ok(())
        });
    }
    let mut child = command.spawn().context("could not start zector")?;

    let deadline = Instant::now() + Duration::from_secs(2);
    while Instant::now() < deadline {
        if let Some(status) = child.try_wait()? {
            anyhow::bail!(
                "zector failed to start ({status}); check {}",
                log_path(&config.data_dir).display()
            );
        }
        let ready = read_pid(&pid_path(&config.data_dir))? == Some(child.id())
            && std::net::TcpStream::connect(("127.0.0.1", config.port)).is_ok();
        if ready {
            println!(
                "zector started (PID {}) at http://localhost:{}",
                child.id(),
                config.port
            );
            println!("logs: {}", log_path(&config.data_dir).display());
            return Ok(());
        }
        std::thread::sleep(Duration::from_millis(25));
    }

    anyhow::bail!(
        "zector did not finish starting; check {}",
        log_path(&config.data_dir).display()
    )
}

pub fn stop(config: &Config) -> anyhow::Result<()> {
    let Some(pid) = running_pid(config)? else {
        println!("zector is not running");
        return Ok(());
    };

    if unsafe { libc::kill(pid as i32, libc::SIGTERM) } != 0 {
        return Err(std::io::Error::last_os_error()).context("could not stop zector");
    }

    let deadline = Instant::now() + Duration::from_secs(5);
    while process_is_running(pid) && Instant::now() < deadline {
        std::thread::sleep(Duration::from_millis(50));
    }
    if process_is_running(pid) {
        anyhow::bail!("zector did not stop (PID {pid})");
    }
    let _ = std::fs::remove_file(pid_path(&config.data_dir));
    println!("zector stopped");
    Ok(())
}

pub fn status(config: &Config) -> anyhow::Result<()> {
    match running_pid(config)? {
        Some(pid) => println!(
            "zector is running (PID {pid}) at http://localhost:{}",
            config.port
        ),
        None => println!("zector is not running"),
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use std::path::Path;

    use super::{log_path, pid_path, read_pid};

    #[test]
    fn runtime_files_live_in_the_data_directory() {
        let data_dir = Path::new("/tmp/zector-data");
        assert_eq!(pid_path(data_dir), data_dir.join("zector.pid"));
        assert_eq!(log_path(data_dir), data_dir.join("zector.log"));
    }

    #[test]
    fn reads_a_stored_process_id() {
        let path = std::env::temp_dir().join(format!("zector-pid-test-{}", std::process::id()));
        std::fs::write(&path, "1234\n").unwrap();
        assert_eq!(read_pid(&path).unwrap(), Some(1234));
        std::fs::remove_file(path).unwrap();
    }
}
