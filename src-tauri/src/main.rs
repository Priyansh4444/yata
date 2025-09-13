use std::time::Instant;
use serde::{Serialize, Deserialize};
use tauri::Manager;

/// Writes and reads a large file for benchmarking Rust file IO performance.
/// The file will be approximately 1.6 MB in size to match the frontend benchmark.
#[tauri::command]
fn save_and_load_test(path: String, content: String) -> Result<String, String> {
    use std::fs;

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

/// Generate, write, and read a large complex JSON payload; return backend-only timings/bytes
#[tauri::command]
fn save_and_load_json_fast(path: Option<String>, items: usize, values_per_item: usize) -> Result<JsonBenchResult, String> {
    use std::fs::File;
    use std::io::{Read, Write};

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
        let flags = (0..values_per_item).map(|j| (i + j) % 3 == 0).collect::<Vec<bool>>();
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
        timestamp: (std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs()),
        items: payload_items,
    };

    // Serialize to JSON string
    let json_string = serde_json::to_string(&payload).map_err(|e| e.to_string())?;

    let start = Instant::now();
    // Write JSON
    {
        let mut f = File::create(&target_path).map_err(|e| e.to_string())?;
        f.write_all(json_string.as_bytes()).map_err(|e| e.to_string())?;
    }
    // Read JSON
    let mut read_back = String::new();
    {
        let mut f = File::open(&target_path).map_err(|e| e.to_string())?;
        f.read_to_string(&mut read_back).map_err(|e| e.to_string())?;
    }
    let elapsed = start.elapsed().as_secs_f64() * 1000.0;

    Ok(JsonBenchResult {
        elapsed_ms: elapsed,
        bytes_written: json_string.len(),
        bytes_read: read_back.len(),
        items: payload.items.len(),
    })
}

#[derive(Serialize)]
struct BasicBenchResult {
    elapsed_ms: f64,
    bytes_written: usize,
    bytes_read: usize,
}

/// Basic file save/read using std::fs::File and provided content; returns backend-only timing
#[tauri::command]
fn save_and_load_file_basic(path: Option<String>, content: String) -> Result<BasicBenchResult, String> {
    use std::fs::File;
    use std::io::{Read, Write};

    let target_path = path.unwrap_or_else(|| {
        let mut p = std::env::temp_dir();
        p.push("yata_basic_benchmark.txt");
        p.to_string_lossy().to_string()
    });

    let start = Instant::now();
    {
        let mut f = File::create(&target_path).map_err(|e| e.to_string())?;
        f.write_all(content.as_bytes()).map_err(|e| e.to_string())?;
    }
    let mut read_back = String::new();
    {
        let mut f = File::open(&target_path).map_err(|e| e.to_string())?;
        f.read_to_string(&mut read_back).map_err(|e| e.to_string())?;
    }
    let elapsed = start.elapsed().as_secs_f64() * 1000.0;

    Ok(BasicBenchResult { elapsed_ms: elapsed, bytes_written: content.len(), bytes_read: read_back.len() })
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![save_and_load_test, save_and_load_test_fast, save_and_load_json_fast, save_and_load_file_basic])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
