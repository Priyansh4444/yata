pub mod storage;
pub mod types;

use tauri::Manager;
use serde::Serialize;
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
struct BenchResult {
    elapsed_ms: f64,
    bytes_written: usize,
    bytes_read: usize,
    checksum_xor64: u64,
}

/// Optimized backend benchmark: generates data in Rust, uses byte buffers, returns small metadata
#[tauri::command]
fn save_and_load_test_fast(path: Option<String>, size_bytes: usize) -> Result<BenchResult, String> {
    use std::fs::File;
    use std::io::{Read, Write};
    use std::time::Instant;

    // Determine target path
    let target_path = path.unwrap_or_else(|| {
        let mut p = std::env::temp_dir();
        p.push("yata_benchmark.bin");
        p.to_string_lossy().to_string()
    });

    // Generate data pattern in memory without allocating twice
    let mut data = Vec::<u8>::with_capacity(size_bytes);
    for i in 0..size_bytes {
        data.push((i % 256) as u8);
    }

    let start = Instant::now();

    // Write data
    {
        let mut file = File::create(&target_path).map_err(|e| e.to_string())?;
        file.write_all(&data).map_err(|e| e.to_string())?;
        // Intentionally avoid fsync for maximum throughput measurements
    }

    // Read data back
    let mut read_back = Vec::<u8>::with_capacity(size_bytes);
    {
        let mut file = File::open(&target_path).map_err(|e| e.to_string())?;
        file.read_to_end(&mut read_back).map_err(|e| e.to_string())?;
    }

    let elapsed = start.elapsed().as_secs_f64() * 1000.0;

    // Compute a lightweight checksum (xor folding into u64)
    let mut checksum: u64 = 0;
    let mut chunk = [0u8; 8];
    let mut i = 0usize;
    while i + 8 <= read_back.len() {
        chunk.copy_from_slice(&read_back[i..i + 8]);
        checksum ^= u64::from_le_bytes(chunk);
        i += 8;
    }
    // Handle tail
    let mut tail: u64 = 0;
    for (idx, b) in read_back[i..].iter().enumerate() {
        tail |= (*b as u64) << (idx * 8);
    }
    checksum ^= tail;

    Ok(BenchResult {
        elapsed_ms: elapsed,
        bytes_written: data.len(),
        bytes_read: read_back.len(),
        checksum_xor64: checksum,
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
        .invoke_handler(tauri::generate_handler![greet, save_and_load_test, save_and_load_test_fast])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
