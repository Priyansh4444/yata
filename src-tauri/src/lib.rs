    use serde::{Deserialize, Serialize};
    use tauri::Manager;
    use window_vibrancy::*;
    
    #[tauri::command]
    fn greet(name: &str) -> String {
        format!("Hello, {}! You've been greeted from Rust!", name)
    }
    
    /// Writes and reads a large file for benchmarking Rust file IO performance.
    /// The file will be approximately 1.6 MB in size to match the frontend benchmark.
    #[tauri::command]
    fn save_and_load_test(path: String, content: String) -> Result<String, String> {
        use std::fs;
        use std::time::Instant;
    
        let start = Instant::now();
        // Write content to the file
        fs::write(&path, &content).map_err(|e| e.to_string())?;
        // Read content back from the file
        let result = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        let elapsed = start.elapsed();
        println!(
            "[Rust Benchmark] Time taken for write+read ({} bytes): {:.2} ms",
            result.len(),
            elapsed.as_secs_f64() * 1000.0
        );
        // Return the full result to match frontend behavior
        Ok(result)
    }
    
    #[derive(Serialize)]
    struct BasicFileResult {
        elapsed_ms: f64,
        bytes_written: usize,
        bytes_read: usize,
    }
    
    #[derive(Serialize, Deserialize)]
    struct ComplexItem {
        id: u64,
        name: String,
        values: Vec<f64>,
        flags: Vec<bool>,
        meta: serde_json::Value,
    }
    
    #[derive(Serialize, Deserialize)]
    struct ComplexPayload {
        version: String,
        timestamp: u64,
        items: Vec<ComplexItem>,
    }
    
    #[derive(Serialize)]
    struct JsonBenchResult {
        elapsed_ms: f64,
        bytes_written: usize,
        bytes_read: usize,
        items: usize,
    }
    
    #[tauri::command]
    fn save_and_load_file_basic(content: String, file_path: String) -> Result<BasicFileResult, String> {
        use std::fs::File;
        use std::io::{Read, Write};
        use std::time::Instant;
    
        let target_path = std::path::PathBuf::from(file_path);
    
        let start = Instant::now();
    
        {
            let mut file = File::create(&target_path).map_err(|e| e.to_string())?;
            file.write_all(content.as_bytes())
                .map_err(|e| e.to_string())?;
        }
    
        let mut read_back = Vec::with_capacity(content.len());
        {
            let mut file = File::open(&target_path).map_err(|e| e.to_string())?;
            file.read_to_end(&mut read_back)
                .map_err(|e| e.to_string())?;
        }
    
        let elapsed = start.elapsed().as_secs_f64() * 1000.0;
    
        Ok(BasicFileResult {
            elapsed_ms: elapsed,
            bytes_written: content.len(),
            bytes_read: read_back.len(),
        })
    }
    
    /// Generate, write, and read a large complex JSON payload; return backend-only timings/bytes
    #[tauri::command]
    fn save_and_load_json_fast(
        path: Option<String>,
        items: usize,
        values_per_item: usize,
    ) -> Result<JsonBenchResult, String> {
        use std::fs::File;
        use std::io::{Read, Write};
        use std::time::Instant;
    
        // Determine target path in temp directory by default
        let target_path = path.unwrap_or_else(|| {
            let mut p = std::env::temp_dir();
            p.push("yata_benchmark.json");
            p.to_string_lossy().to_string()
        });
    
        // Generate complex payload
        let mut payload_items = Vec::with_capacity(items);
        for i in 0..items {
            let mut values = Vec::with_capacity(values_per_item);
            for j in 0..values_per_item {
                // pseudorandom-ish values
                values.push((((i as f64 + 1.0) * (j as f64 + 3.14159)).sin() * 1000.0) as f64);
            }
            let flags = (0..values_per_item)
                .map(|j| (i + j) % 3 == 0)
                .collect::<Vec<bool>>();
            let meta = serde_json::json!({
                "category": if i % 2 == 0 { "even" } else { "odd" },
                "index": i,
                "tags": ["perf", "bench", "json"],
            });
            payload_items.push(ComplexItem {
                id: i as u64,
                name: format!("Item-{i}"),
                values,
                flags,
                meta,
            });
        }
        let payload = ComplexPayload {
            version: "1.0".into(),
            timestamp: (std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs()),
            items: payload_items,
        };
    
        // Serialize to JSON string
        let json_string = serde_json::to_string(&payload).map_err(|e| e.to_string())?;
    
        let start = Instant::now();
        // Write JSON
        {
            let mut f = File::create(&target_path).map_err(|e| e.to_string())?;
            f.write_all(json_string.as_bytes())
                .map_err(|e| e.to_string())?;
        }
        // Read JSON
        let mut read_back = String::new();
        {
            let mut f = File::open(&target_path).map_err(|e| e.to_string())?;
            f.read_to_string(&mut read_back)
                .map_err(|e| e.to_string())?;
        }
        let elapsed = start.elapsed().as_secs_f64() * 1000.0;
    
        Ok(JsonBenchResult {
            elapsed_ms: elapsed,
            bytes_written: json_string.len(),
            bytes_read: read_back.len(),
            items: payload.items.len(),
        })
    }
    
    #[cfg_attr(mobile, tauri::mobile_entry_point)]
    pub fn run() {
        tauri::Builder::default()
            .plugin(tauri_plugin_fs::init())
            .plugin(tauri_plugin_log::Builder::new().build())
            .setup(|app| {
                let window = app.get_webview_window("main").unwrap();
    
                #[cfg(target_os = "macos")]
                apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
                    .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");
    
                #[cfg(target_os = "windows")]
                apply_blur(&window, Some((250, 250, 250, 255)))
                    .expect("Unsupported platform! 'apply_blur' is only supported on Windows");
    
                Ok(())
            })
            .plugin(tauri_plugin_opener::init())
            .invoke_handler(tauri::generate_handler![
                greet,
                save_and_load_test,
                save_and_load_file_basic,
                save_and_load_json_fast
            ])
            .run(tauri::generate_context!())
            .expect("error while running tauri application");
    }
