import { createSignal } from "solid-js";
import {
  writeTextFile,
  readTextFile,
  BaseDirectory,
} from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";

const FILE_NAME = "benchmark_test_large.txt";
const LARGE_CONTENT = "0123456789abcdef".repeat(2_000_000); // ~32 MB
const BENCHMARK_RUNS = 5; // Number of runs for statistical validity
const JSON_ITEMS = 6_000; // bigger JSON
const JSON_VALUES_PER_ITEM = 48; // bigger JSON

function BenchmarkTest() {
  const [fsTimes, setFsTimes] = createSignal<number[]>([]);
  const [rustTimes, setRustTimes] = createSignal<number[]>([]);
  const [fsResult, setFsResult] = createSignal<string | null>(null);
  const [rustResult, setRustResult] = createSignal<string | null>(null);
  const [isRunning, setIsRunning] = createSignal<boolean>(false);
  const [currentTest, setCurrentTest] = createSignal<string>("");
  const [rustBackendOnlyTimes, setRustBackendOnlyTimes] = createSignal<number[]>([]);
  const [fsJsonTimes, setFsJsonTimes] = createSignal<number[]>([]);
  const [rustJsonTimes, setRustJsonTimes] = createSignal<number[]>([]);
  const [jsonSummary, setJsonSummary] = createSignal<string | null>(null);
  const [typicalTimes, setTypicalTimes] = createSignal<number[]>([]);
  const [rustBasicTimes, setRustBasicTimes] = createSignal<number[]>([]);
  const [rustBasicSummary, setRustBasicSummary] = createSignal<string | null>(null);

  function calculateStats(times: number[]) {
    if (times.length === 0) return { mean: 0, min: 0, max: 0, stdDev: 0 };
    
    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    const variance = times.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / times.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      mean: mean,
      min: Math.min(...times),
      max: Math.max(...times),
      stdDev: stdDev
    };
  }

  async function benchmarkFs() {
    setIsRunning(true);
    setCurrentTest("plugin-fs");
    const times: number[] = [];
    
    try {
      for (let i = 0; i < BENCHMARK_RUNS; i++) {
        const start = performance.now();
        await writeTextFile(FILE_NAME, LARGE_CONTENT, {
          baseDir: BaseDirectory.AppData,
        });
        const result = await readTextFile(FILE_NAME, {
          baseDir: BaseDirectory.AppData,
        });
        const elapsed = performance.now() - start;
        times.push(elapsed);
        
        console.log(
          `[plugin-fs] Run ${i + 1}/${BENCHMARK_RUNS}: ${elapsed.toFixed(2)} ms, Result length: ${result.length}`,
        );
        
        // Small delay between runs to avoid system caching effects
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setFsTimes(times);
      const stats = calculateStats(times);
      setFsResult(`Mean: ${stats.mean.toFixed(2)}ms, Min: ${stats.min.toFixed(2)}ms, Max: ${stats.max.toFixed(2)}ms, StdDev: ${stats.stdDev.toFixed(2)}ms`);
      
      console.log(
        `[plugin-fs] Final Stats - Mean: ${stats.mean.toFixed(2)}ms, Min: ${stats.min.toFixed(2)}ms, Max: ${stats.max.toFixed(2)}ms, StdDev: ${stats.stdDev.toFixed(2)}ms`,
      );
    } catch (e: any) {
      setFsResult("Error: " + e.message);
      setFsTimes([]);
      console.error("[plugin-fs] Error:", e);
    } finally {
      setIsRunning(false);
      setCurrentTest("");
    }
  }

  async function benchmarkFsJson() {
    setIsRunning(true);
    setCurrentTest("plugin-fs (JSON)");
    const times: number[] = [];

    // Build complex JSON similar to backend shape
    const items = Array.from({ length: JSON_ITEMS }, (_, i) => ({
      id: i,
      name: `Item-${i}`,
      values: Array.from({ length: JSON_VALUES_PER_ITEM }, (_, j) => Math.sin((i + 1) * (j + 3.14159)) * 1000),
      flags: Array.from({ length: JSON_VALUES_PER_ITEM }, (_, j) => ((i + j) % 3) === 0),
      meta: {
        category: i % 2 === 0 ? "even" : "odd",
        index: i,
        tags: ["perf", "bench", "json"],
      },
    }));
    const payload = { version: "1.0", timestamp: Math.floor(Date.now() / 1000), items };
    const jsonString = JSON.stringify(payload);

    try {
      for (let i = 0; i < BENCHMARK_RUNS; i++) {
        const start = performance.now();
        await writeTextFile("fs_bench.json", jsonString, { baseDir: BaseDirectory.AppData });
        const result = await readTextFile("fs_bench.json", { baseDir: BaseDirectory.AppData });
        const elapsed = performance.now() - start;
        times.push(elapsed);
        console.log(`[plugin-fs JSON] Run ${i + 1}/${BENCHMARK_RUNS}: ${elapsed.toFixed(2)} ms, bytes: ${result.length}`);
        await new Promise(r => setTimeout(r, 100));
      }
      setFsJsonTimes(times);
    } catch (e: any) {
      console.error("[plugin-fs JSON] Error:", e);
      setFsJsonTimes([]);
    } finally {
      setIsRunning(false);
      setCurrentTest("");
    }
  }

  async function benchmarkRustJson() {
    setIsRunning(true);
    setCurrentTest("Rust backend (JSON)");
    const roundTrip: number[] = [];
    const backendOnly: number[] = [];
    try {
      for (let i = 0; i < BENCHMARK_RUNS; i++) {
        const start = performance.now();
        const res = await invoke<{ elapsed_ms: number; bytes_written: number; bytes_read: number; items: number }>(
          "save_and_load_json_fast",
          { items: JSON_ITEMS, valuesPerItem: JSON_VALUES_PER_ITEM },
        );
        const elapsed = performance.now() - start;
        roundTrip.push(elapsed);
        backendOnly.push(res.elapsed_ms);
        console.log(`[Rust JSON] Run ${i + 1}/${BENCHMARK_RUNS}: round-trip ${elapsed.toFixed(2)} ms, backend ${res.elapsed_ms.toFixed(2)} ms, bytes w${res.bytes_written}/r${res.bytes_read}`);
        await new Promise(r => setTimeout(r, 100));
      }
      setRustJsonTimes(roundTrip);
      const rt = calculateStats(roundTrip);
      const bo = calculateStats(backendOnly);
      setJsonSummary(`JSON - Round-trip mean ${rt.mean.toFixed(2)}ms (SD ${rt.stdDev.toFixed(2)}), Backend mean ${bo.mean.toFixed(2)}ms`);
    } catch (e: any) {
      console.error("[Rust JSON] Error:", e);
      setRustJsonTimes([]);
      setJsonSummary(null);
    } finally {
      setIsRunning(false);
      setCurrentTest("");
    }
  }

  // Typical app file save/read using plugin-fs in AppData/boards
  async function benchmarkTypicalFs() {
    setIsRunning(true);
    setCurrentTest("Typical FS (plugin-fs)");
    const times: number[] = [];
    const path = `boards/typical_bench_${Date.now()}.json`;

    // Example realistic content: board object with lists and tasks
    const makeBoard = (nLists: number, tasksPerList: number) => ({
      id: `board-${Date.now()}`,
      title: "Benchmark Board",
      lists: Array.from({ length: nLists }, (_, li) => ({
        id: `list-${li}`,
        header: `List ${li}`,
        tasks: Array.from({ length: tasksPerList }, (_, ti) => ({
          id: `task-${li}-${ti}`,
          header: `Task ${li}-${ti}`,
          description: `Lorem ipsum ${li}-${ti}`,
          createdAt: Date.now(),
          done: (li + ti) % 5 === 0,
        })),
      })),
    });

    const content = JSON.stringify(makeBoard(40, 150)); // sizeable realistic payload

    try {
      for (let i = 0; i < BENCHMARK_RUNS; i++) {
        const start = performance.now();
        await writeTextFile(path, content, { baseDir: BaseDirectory.AppData });
        const readBack = await readTextFile(path, { baseDir: BaseDirectory.AppData });
        const elapsed = performance.now() - start;
        times.push(elapsed);
        console.log(`[Typical FS] Run ${i + 1}/${BENCHMARK_RUNS}: ${elapsed.toFixed(2)} ms, bytes: ${readBack.length}`);
        await new Promise(r => setTimeout(r, 100));
      }
      setTypicalTimes(times);
    } catch (e: any) {
      console.error("[Typical FS] Error:", e);
      setTypicalTimes([]);
    } finally {
      setIsRunning(false);
      setCurrentTest("");
    }
  }
  async function benchmarkRust() {
    setIsRunning(true);
    setCurrentTest("Rust backend");
    const times: number[] = [];
    const backendTimes: number[] = [];
    
    try {
      for (let i = 0; i < BENCHMARK_RUNS; i++) {
        // Measure round-trip time
        const start = performance.now();
        const result = await invoke<{ elapsed_ms: number; bytes_written: number; bytes_read: number; checksum_xor64: number }>(
          "save_and_load_test_fast",
          {
            sizeBytes: LARGE_CONTENT.length,
          },
        );
        const elapsed = performance.now() - start;
        times.push(elapsed);
        backendTimes.push(result.elapsed_ms);
        console.log(
          `[Rust backend] Run ${i + 1}/${BENCHMARK_RUNS}: round-trip ${elapsed.toFixed(2)} ms, backend ${result.elapsed_ms.toFixed(
            2,
          )} ms, bytes: w${result.bytes_written}/r${result.bytes_read}, checksum: ${result.checksum_xor64.toString(16)}`,
        );
        
        // Small delay between runs to avoid system caching effects
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setRustTimes(times);
      setRustBackendOnlyTimes(backendTimes);
      const stats = calculateStats(times);
      const backendStats = calculateStats(backendTimes);
      setRustResult(
        `Round-trip Mean: ${stats.mean.toFixed(2)}ms (Min ${stats.min.toFixed(2)} / Max ${stats.max.toFixed(
          2,
        )} / SD ${stats.stdDev.toFixed(2)}), Backend-only Mean: ${backendStats.mean.toFixed(2)}ms`,
      );
      
      console.log(
        `[Rust backend] Final Stats - Mean: ${stats.mean.toFixed(2)}ms, Min: ${stats.min.toFixed(2)}ms, Max: ${stats.max.toFixed(2)}ms, StdDev: ${stats.stdDev.toFixed(2)}ms`,
      );
    } catch (e: any) {
      setRustResult("Error: " + e.message);
      setRustTimes([]);
      console.error("[Rust backend] Error:", e);
    } finally {
      setIsRunning(false);
      setCurrentTest("");
    }
  }

  async function benchmarkRustBasic() {
    setIsRunning(true);
    setCurrentTest("Rust backend (basic File)");
    const roundTrip: number[] = [];
    const backendOnly: number[] = [];
    try {
      for (let i = 0; i < BENCHMARK_RUNS; i++) {
        const start = performance.now();
        const res = await invoke<{ elapsed_ms: number; bytes_written: number; bytes_read: number }>(
          "save_and_load_file_basic",
          { content: LARGE_CONTENT },
        );
        const elapsed = performance.now() - start;
        roundTrip.push(elapsed);
        backendOnly.push(res.elapsed_ms);
        console.log(`[Rust basic] Run ${i + 1}/${BENCHMARK_RUNS}: round-trip ${elapsed.toFixed(2)} ms, backend ${res.elapsed_ms.toFixed(2)} ms, bytes w${res.bytes_written}/r${res.bytes_read}`);
        await new Promise(r => setTimeout(r, 100));
      }
      setRustBasicTimes(roundTrip);
      const rt = calculateStats(roundTrip);
      const bo = calculateStats(backendOnly);
      setRustBasicSummary(`Basic File - Round-trip mean ${rt.mean.toFixed(2)}ms (SD ${rt.stdDev.toFixed(2)}), Backend mean ${bo.mean.toFixed(2)}ms`);
    } catch (e: any) {
      console.error("[Rust basic] Error:", e);
      setRustBasicTimes([]);
      setRustBasicSummary(null);
    } finally {
      setIsRunning(false);
      setCurrentTest("");
    }
  }

  return (
    <div style={{ padding: "1rem", "font-family": "sans-serif" }}>
      <h2>File System Performance Benchmark</h2>
      <p style={{ color: "#666", "margin-bottom": "1rem" }}>
        Comparing plugin-fs vs Rust backend for file I/O operations (~{(LARGE_CONTENT.length/1_000_000).toFixed(0)}MB file, {BENCHMARK_RUNS} runs each)
      </p>
      
      <div style={{ "margin-bottom": "1rem" }}>
        <button 
          onClick={benchmarkFs} 
          disabled={isRunning()}
          style={{ 
            "margin-right": "1rem",
            "padding": "0.5rem 1rem",
            "background": isRunning() ? "#ccc" : "#007acc",
            "color": "white",
            "border": "none",
            "border-radius": "4px",
            "cursor": isRunning() ? "not-allowed" : "pointer"
          }}
        >
          Benchmark plugin-fs
        </button>
        <button 
          onClick={benchmarkRust}
          disabled={isRunning()}
          style={{ 
            "padding": "0.5rem 1rem",
            "background": isRunning() ? "#ccc" : "#28a745",
            "color": "white",
            "border": "none",
            "border-radius": "4px",
            "cursor": isRunning() ? "not-allowed" : "pointer"
          }}
        >
          Benchmark Rust backend
        </button>
        <div style={{ height: "0.5rem" }} />
        <button 
          onClick={benchmarkFsJson}
          disabled={isRunning()}
          style={{ 
            "margin-right": "1rem",
            "padding": "0.5rem 1rem",
            "background": isRunning() ? "#ccc" : "#6f42c1",
            "color": "white",
            "border": "none",
            "border-radius": "4px",
            "cursor": isRunning() ? "not-allowed" : "pointer"
          }}
        >
          Benchmark plugin-fs (JSON)
        </button>
        <button 
          onClick={benchmarkRustJson}
          disabled={isRunning()}
          style={{ 
            "padding": "0.5rem 1rem",
            "background": isRunning() ? "#ccc" : "#d63384",
            "color": "white",
            "border": "none",
            "border-radius": "4px",
            "cursor": isRunning() ? "not-allowed" : "pointer"
          }}
        >
          Benchmark Rust backend (JSON)
        </button>
        <div style={{ height: "0.5rem" }} />
        <button 
          onClick={benchmarkTypicalFs}
          disabled={isRunning()}
          style={{ 
            "padding": "0.5rem 1rem",
            "background": isRunning() ? "#ccc" : "#ff8c00",
            "color": "white",
            "border": "none",
            "border-radius": "4px",
            "cursor": isRunning() ? "not-allowed" : "pointer"
          }}
        >
          Benchmark Typical FS (plugin-fs)
        </button>
        <button 
          onClick={benchmarkRustBasic}
          disabled={isRunning()}
          style={{ 
            "margin-left": "1rem",
            "padding": "0.5rem 1rem",
            "background": isRunning() ? "#ccc" : "#20c997",
            "color": "white",
            "border": "none",
            "border-radius": "4px",
            "cursor": isRunning() ? "not-allowed" : "pointer"
          }}
        >
          Benchmark Rust backend (basic)
        </button>
      </div>

      {isRunning() && (
        <div style={{ "margin-bottom": "1rem", color: "#007acc" }}>
          Running {currentTest()} benchmark... Please wait.
        </div>
      )}

      <div style={{ "margin-top": "1rem" }}>
        <h3>plugin-fs Results:</h3>
        <div style={{ "margin-left": "1rem" }}>
          <strong>Statistics:</strong> {fsResult() ?? "N/A"}
        </div>
        {fsTimes().length > 0 && (
          <div style={{ "margin-left": "1rem", "font-size": "0.9em", color: "#666" }}>
            Individual times: {fsTimes().map(t => t.toFixed(2)).join(", ")} ms
          </div>
        )}
      </div>
      
      <div style={{ "margin-top": "1rem" }}>
        <h3>Rust backend Results:</h3>
        <div style={{ "margin-left": "1rem" }}>
          <strong>Statistics:</strong> {rustResult() ?? "N/A"}
        </div>
        {rustTimes().length > 0 && (
          <div style={{ "margin-left": "1rem", "font-size": "0.9em", color: "#666" }}>
            Individual times: {rustTimes().map(t => t.toFixed(2)).join(", ")} ms
          </div>
        )}
      </div>

      {(fsJsonTimes().length > 0 || rustJsonTimes().length > 0) && (
        <div style={{ "margin-top": "2rem", "padding": "1rem", "background": "#eef7ff", "border-radius": "4px" }}>
          <h3>JSON Results:</h3>
          <div style={{ "margin-left": "1rem" }}>
            {jsonSummary() ?? "N/A"}
          </div>
          {fsJsonTimes().length > 0 && (
            <div style={{ "margin-left": "1rem", "font-size": "0.9em", color: "#666" }}>
              plugin-fs JSON times: {fsJsonTimes().map(t => t.toFixed(2)).join(", ")} ms
            </div>
          )}
          {rustJsonTimes().length > 0 && (
            <div style={{ "margin-left": "1rem", "font-size": "0.9em", color: "#666" }}>
              Rust JSON round-trip times: {rustJsonTimes().map(t => t.toFixed(2)).join(", ")} ms
            </div>
          )}
        </div>
      )}

      {typicalTimes().length > 0 && (
        <div style={{ "margin-top": "1rem", "padding": "1rem", "background": "#fef7ee", "border-radius": "4px" }}>
          <h3>Typical FS Results:</h3>
          <div style={{ "margin-left": "1rem", "font-size": "0.9em", color: "#666" }}>
            {typicalTimes().map(t => t.toFixed(2)).join(", ")} ms
          </div>
        </div>
      )}

      {rustBasicTimes().length > 0 && (
        <div style={{ "margin-top": "1rem", "padding": "1rem", "background": "#edf9f6", "border-radius": "4px" }}>
          <h3>Rust Basic File Results:</h3>
          <div style={{ "margin-left": "1rem" }}>{rustBasicSummary() ?? "N/A"}</div>
          <div style={{ "margin-left": "1rem", "font-size": "0.9em", color: "#666" }}>
            Round-trip times: {rustBasicTimes().map(t => t.toFixed(2)).join(", ")} ms
          </div>
        </div>
      )}

      {fsTimes().length > 0 && rustTimes().length > 0 && (
        <div style={{ "margin-top": "2rem", "padding": "1rem", "background": "#f5f5f5", "border-radius": "4px" }}>
          <h3>Performance Comparison:</h3>
          <div style={{ "margin-left": "1rem" }}>
            {(() => {
              const fsStats = calculateStats(fsTimes());
              const rustStats = calculateStats(rustTimes());
              const faster = fsStats.mean < rustStats.mean ? "plugin-fs" : "Rust backend";
              const speedup = Math.max(fsStats.mean, rustStats.mean) / Math.min(fsStats.mean, rustStats.mean);
              return (
                <div>
                  <strong>{faster}</strong> is faster by <strong>{(speedup - 1).toFixed(1)}x</strong>
                  <br />
                  plugin-fs mean: {fsStats.mean.toFixed(2)}ms vs Rust backend mean: {rustStats.mean.toFixed(2)}ms
                </div>
              );
            })()}
          </div>
        </div>
      )}

      <div style={{ "margin-top": "2rem", color: "#888", "font-size": "0.9em" }}>
        <h4>Benchmark Methodology:</h4>
        <ul style={{ "margin-left": "1rem" }}>
          <li>File size: ~1.6MB (1,600,000 characters)</li>
          <li>Operations: Write + Read (round-trip)</li>
          <li>Runs: {BENCHMARK_RUNS} per method for statistical validity</li>
          <li>Delay: 100ms between runs to minimize caching effects</li>
          <li>Location: AppData directory (plugin-fs) vs current directory (Rust)</li>
          <li>Timing: High-resolution performance.now() for frontend, Instant::now() for Rust</li>
        </ul>
        <p>
          Results are logged to the browser console with detailed timing information.
        </p>
      </div>
    </div>
  );
}

export default BenchmarkTest;

/*
Explanation: Basic Rust file saving vs optimized Rust file saving (and when to use which)

What the two Rust benchmarks do:
- Rust backend (basic):
  - The frontend builds a large JS string (~32MB) and sends it across the JS↔Rust IPC boundary.
  - Rust writes the received string to disk using std::fs::File, then reads it back.
  - We return small metadata (elapsed_ms, bytes) to the frontend.
  - Observed: backend-only ~50ms, but round‑trip ~700ms because most time is spent crossing the IPC boundary with a huge payload (allocation, copying, serialization/deserialization).

- Rust backend (fast):
  - The frontend does NOT send the big payload. It only passes simple parameters (like size).
  - Rust generates the data (bytes or complex JSON) and performs write + read entirely on the backend.
  - The backend returns only a tiny struct with timings/byte counts.
  - Observed: backend-only tens of ms; round‑trip a few hundred ms (no massive JS↔Rust transfer).

Why such a difference:
- Large payloads sent from JS to Rust are expensive: copying 10s of MB across the boundary dominates time.
- Doing the heavy work purely in Rust (generate/serialize/read) and returning only small metadata avoids that overhead.

How plugin-fs compares:
- plugin-fs also crosses the JS↔Rust boundary with your content, so its performance is similar to the “basic” Rust path for large payloads.
- For small/typical saves, plugin-fs is convenient and already very fast.

Practical guidance (what to use when):
- Small to medium state saves (typical app data): plugin-fs is simplest and sufficiently fast.
- Large files, exports, backups, bulk operations, big JSON:
  - Prefer Rust commands that operate entirely on the backend.
  - Send parameters/paths, not the large content itself.
  - Return minimal metadata (lengths, checksums, IDs) to the UI.

Extras to go even faster:
- Use a release build for the Rust backend.
- If you need durability guarantees, add explicit flush/fsync (will slow both approaches).
- For huge payloads you must show in the UI, consider streaming/chunking or summarizing in Rust.
*/
