use std::path::Path;

/// Seed the user-editable config files on first run (never overwrites).
pub fn seed_config_files(config_dir: &Path) -> anyhow::Result<()> {
    // backgrounds.json was renamed to themes.json; carry old files over once
    let legacy = config_dir.join("backgrounds.json");
    let themes = config_dir.join("themes.json");
    if legacy.exists() && !themes.exists() {
        std::fs::rename(&legacy, &themes)?;
        tracing::info!("renamed backgrounds.json to themes.json");
    }
    for (name, content) in [
        ("settings.json", SETTINGS),
        ("terminal-themes.json", TERMINAL_THEMES),
        ("themes.json", BACKGROUNDS),
    ] {
        let path = config_dir.join(name);
        if !path.exists() {
            std::fs::write(&path, content)?;
            tracing::info!("created default {}", name);
        }
    }
    Ok(())
}

const SETTINGS: &str = r##"{
  "tab:preset": null,
  "term:fontsize": 13,
  "term:theme": "default",
  "block:bgcolor": "#000000",
  "block:blur": false,
  "block:opacity": 0.25,
  "block:highlight": true,
  "redact:ips": []
}
"##;

const TERMINAL_THEMES: &str = r##"{
  "zed-dark": {
    "display:name": "Zed Dark",
    "display:order": 3,
    "background": "#0E100F",
    "foreground": "#CECDC3",
    "cursor": "#CECDC3",
    "black": "#0E100F",
    "red": "#D14D41",
    "green": "#879A39",
    "yellow": "#D0A215",
    "blue": "#4385BE",
    "magenta": "#3AA99F",
    "cyan": "#3AA99F",
    "white": "#CECDC3",
    "brightBlack": "#1e201f",
    "brightRed": "#D14D41",
    "brightGreen": "#879A39",
    "brightYellow": "#D0A215",
    "brightBlue": "#4385BE",
    "brightMagenta": "#3AA99F",
    "brightCyan": "#3AA99F",
    "brightWhite": "#CECDC3"
  }
}
"##;

const BACKGROUNDS: &str = r##"{
  "shadows-midnight": {
    "display:name": "Midnight",
    "display:order": 1,
    "bg": "linear-gradient(135deg, #2a3b4c, rgba(42, 59, 76, 0.4))",
    "bg:opacity": 0.9,
    "accent": "#6d7a7c",
    "highlight:active": false,
    "highlight:color": "#6d7a7c",
    "highlight:width": 2
  },
  "shadows-golden-hour": {
    "display:name": "Golden Hour",
    "display:order": 2,
    "bg": "linear-gradient(135deg, #d58a42, rgba(213, 138, 66, 0.4))",
    "bg:opacity": 0.4,
    "accent": "#bf8c3c",
    "highlight:active": false,
    "highlight:color": "#bf8c3c",
    "highlight:width": 2
  },
  "shadows-cosmic-purple": {
    "display:name": "Cosmic Purple",
    "display:order": 3,
    "bg": "linear-gradient(135deg, #5d3e66, rgba(93, 62, 102, 0.4))",
    "bg:opacity": 0.8,
    "accent": "#A76DBE",
    "highlight:active": true,
    "highlight:color": "#A76DBE",
    "highlight:width": 2
  },
  "shadows-neon-glow": {
    "display:name": "Neon Glow",
    "display:order": 4,
    "bg": "linear-gradient(135deg, #f300a6, rgba(243, 0, 166, 0.3))",
    "bg:opacity": 0.45,
    "accent": "#DB425A",
    "highlight:active": true,
    "highlight:color": "#DB425A",
    "highlight:width": 2
  },
  "shadows-icy-mist": {
    "display:name": "Icy Mist",
    "display:order": 5,
    "bg": "linear-gradient(135deg, #d0d8e2, rgba(208, 216, 226, 0.2))",
    "bg:opacity": 0.5,
    "accent": "#93b7c4",
    "highlight:active": true,
    "highlight:color": "#93b7c4",
    "highlight:width": 2
  },
  "shadows-tropical-storm": {
    "display:name": "Tropical Storm",
    "display:order": 6,
    "bg": "linear-gradient(135deg, #00b894, #1fa771, #2ecc71, #27ae60)",
    "bg:opacity": 0.3,
    "accent": "#1fa771",
    "highlight:active": true,
    "highlight:color": "#1fa771",
    "highlight:width": 2
  },
  "shadows-golden-nebula": {
    "display:name": "Golden Nebula",
    "display:order": 7,
    "bg": "linear-gradient(135deg, #ffd700, #ff6347, #d4a20e, #ffcc00, #1f3d6f)",
    "bg:opacity": 0.44,
    "accent": "#d4a20e",
    "highlight:active": true,
    "highlight:color": "#d4a20e",
    "highlight:width": 2
  },
  "shadows-cosmic-lagoon": {
    "display:name": "Cosmic Lagoon",
    "display:order": 8,
    "bg": "linear-gradient(135deg, #1d2b64, #2f4f96, #00b5b8, #9c27b0, #8e24aa)",
    "bg:opacity": 0.59,
    "accent": "#00b5b8",
    "highlight:active": true,
    "highlight:color": "#00b5b8",
    "highlight:width": 2
  },
  "shadows-neon-nebula": {
    "display:name": "Neon Nebula",
    "display:order": 9,
    "bg": "linear-gradient(135deg, #00d9d9, #ff55aa, #1e1e2f, #2f3b57, #ff99ff)",
    "bg:opacity": 0.6,
    "accent": "#ff55aa",
    "highlight:active": true,
    "highlight:color": "#ff55aa",
    "highlight:width": 2
  },
  "shadows-transparent": {
    "display:name": "Blur Black",
    "display:order": 10,
    "bg": "rgba(0, 0, 0, 0.7)",
    "bg:opacity": 0.7,
    "accent": "#8C8E9C",
    "highlight:active": true,
    "highlight:color": "#8C8E9C",
    "highlight:width": 2
  }
}
"##;

#[cfg(test)]
mod tests {
    use super::BACKGROUNDS;

    #[test]
    fn bundled_theme_presets_use_public_display_names() {
        let presets: serde_json::Map<String, serde_json::Value> =
            serde_json::from_str(BACKGROUNDS).unwrap();

        assert_eq!(presets.len(), 10);
        assert!(presets.values().all(|preset| {
            !preset["display:name"]
                .as_str()
                .unwrap()
                .contains("Shadow's")
        }));
        assert_eq!(presets["shadows-midnight"]["highlight:active"], false);
        assert_eq!(presets["shadows-golden-hour"]["highlight:active"], false);
    }
}
