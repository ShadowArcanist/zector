#[derive(Debug, PartialEq)]
pub enum Command {
    Start,
    Foreground,
    Stop,
    Status,
    Help,
    Serve,
    SudoList(String),
}

pub fn parse(mut args: impl Iterator<Item = String>) -> anyhow::Result<Command> {
    let Some(command) = args.next() else {
        return Ok(Command::Help);
    };

    let command = match command.as_str() {
        "start" => Command::Start,
        "stop" => Command::Stop,
        "status" => Command::Status,
        "-f" | "--foreground" | "foreground" => Command::Foreground,
        "-h" | "--help" | "help" => Command::Help,
        "--serve" => Command::Serve,
        "--sudo-list" => Command::SudoList(
            args.next()
                .ok_or_else(|| anyhow::anyhow!("missing path for privileged file listing"))?,
        ),
        other => anyhow::bail!("unknown command: {other}\n\n{}", help()),
    };

    if args.next().is_some() {
        anyhow::bail!("too many arguments\n\n{}", help());
    }
    Ok(command)
}

pub fn help() -> &'static str {
    "Zector — terminal and file workspace for your local network

Usage:
  zector start          Start Zector in the background
  zector -f             Run Zector in the foreground
  zector stop           Stop the background server
  zector status         Show whether Zector is running
  zector help           Show this help"
}

#[cfg(test)]
mod tests {
    use super::{Command, parse};

    fn args(values: &[&str]) -> impl Iterator<Item = String> {
        values.iter().map(|value| value.to_string())
    }

    #[test]
    fn parses_lifecycle_commands() {
        assert_eq!(parse(args(&["start"])).unwrap(), Command::Start);
        assert_eq!(parse(args(&["stop"])).unwrap(), Command::Stop);
        assert_eq!(parse(args(&["status"])).unwrap(), Command::Status);
        assert_eq!(parse(args(&["-f"])).unwrap(), Command::Foreground);
        assert_eq!(parse(args(&["--foreground"])).unwrap(), Command::Foreground);
    }

    #[test]
    fn parses_help_and_internal_commands() {
        assert_eq!(parse(args(&[])).unwrap(), Command::Help);
        assert_eq!(parse(args(&["--help"])).unwrap(), Command::Help);
        assert_eq!(parse(args(&["--serve"])).unwrap(), Command::Serve);
        assert_eq!(
            parse(args(&["--sudo-list", "/tmp"])).unwrap(),
            Command::SudoList("/tmp".into())
        );
    }

    #[test]
    fn rejects_unknown_commands() {
        assert!(parse(args(&["restart"])).is_err());
    }
}
