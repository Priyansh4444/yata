import { createSignal } from "solid-js";
import {
  writeTextFile,
  readTextFile,
  BaseDirectory,
} from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { appDataDir, join } from "@tauri-apps/api/path";

const FILE_NAME = "benchmark_test_large.txt";
const JSON_FILE_NAME = "benchmark_test_large.json";
const LARGE_CONTENT = "0123456789abcdef".repeat(2_000_000); // ~32 MB
const BENCHMARK_RUNS = 5;
const JSON_ITEMS = 6000;
const JSON_VALUES_PER_ITEM = 48;

function BenchmarkTest() {
  const [fsTimes, setFsTimes] = createSignal<number[]>([]);
  const [fsResult, setFsResult] = createSignal<string | null>(null);
  const [fsJsonTimes, setFsJsonTimes] = createSignal<number[]>([]);
  const [fsJsonResult, setFsJsonResult] = createSignal<string | null>(null);
  const [rustTimes, setRustTimes] = createSignal<number[]>([]);
  const [rustResult, setRustResult] = createSignal<string | null>(null);
  const [rustJsonTimes, setRustJsonTimes] = createSignal<number[]>([]);
  const [rustJsonResult, setRustJsonResult] = createSignal<string | null>(null);
  const [isRunning, setIsRunning] = createSignal<boolean>(false);

  function calculateStats(times: number[]) {
    if (times.length === 0) return { mean: 0, min: 0, max: 0, stdDev: 0 };
    const mean = times.reduce((a, b) => a + b, 0) / times.length;
    const variance =
      times.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / times.length;
    const stdDev = Math.sqrt(variance);
    return { mean, min: Math.min(...times), max: Math.max(...times), stdDev };
  }

  async function benchmarkFs() {
    setIsRunning(true);
    const times: number[] = [];
    try {
      for (let i = 0; i < BENCHMARK_RUNS; i++) {
        const start = performance.now();
        await writeTextFile(FILE_NAME, LARGE_CONTENT, {
          baseDir: BaseDirectory.AppData,
        });
        // await readTextFile(FILE_NAME, { baseDir: BaseDirectory.AppData });
        const elapsed = performance.now() - start;
        times.push(elapsed);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      setFsTimes(times);
      const stats = calculateStats(times);
      setFsResult(
        `Mean: ${stats.mean.toFixed(2)}ms, Min: ${stats.min.toFixed(2)}ms, Max: ${stats.max.toFixed(2)}ms`,
      );
    } catch (e: any) {
      setFsResult("Error: " + e.message);
      setFsTimes([]);
    } finally {
      setIsRunning(false);
    }
  }

  async function benchmarkFsJson() {
    setIsRunning(true);
    const times: number[] = [];
    const items = Array.from({ length: JSON_ITEMS }, (_, i) => ({
      id: i,
      name: `Item-${i}`,
      values: Array.from(
        { length: JSON_VALUES_PER_ITEM },
        (_, j) => Math.sin((i + 1) * (j + 3.14159)) * 1000,
      ),
      flags: Array.from(
        { length: JSON_VALUES_PER_ITEM },
        (_, j) => (i + j) % 3 === 0,
      ),
      meta: {
        category: i % 2 === 0 ? "even" : "odd",
        index: i,
        tags: ["perf", "bench", "json"],
      },
    }));
    const payload = {
      version: "1.0",
      timestamp: Math.floor(Date.now() / 1000),
      items,
    };
    const jsonString = JSON.stringify(payload);

    try {
      for (let i = 0; i < BENCHMARK_RUNS; i++) {
        const start = performance.now();
        await writeTextFile(JSON_FILE_NAME, jsonString, {
          baseDir: BaseDirectory.AppData,
        });
        // await readTextFile(JSON_FILE_NAME, { baseDir: BaseDirectory.AppData });
        const elapsed = performance.now() - start;
        times.push(elapsed);
        await new Promise((r) => setTimeout(r, 100));
      }
      setFsJsonTimes(times);
      const stats = calculateStats(times);
      setFsJsonResult(
        `Mean: ${stats.mean.toFixed(2)}ms, Min: ${stats.min.toFixed(2)}ms, Max: ${stats.max.toFixed(2)}ms`,
      );
    } catch (e: any) {
      setFsJsonResult("Error: " + e.message);
      setFsJsonTimes([]);
    } finally {
      setIsRunning(false);
    }
  }

  async function benchmarkRustFs() {
    setIsRunning(true);
    const times: number[] = [];
    try {
      const appDataPath = await appDataDir();
      const filePath = await join(appDataPath, FILE_NAME);
      for (let i = 0; i < BENCHMARK_RUNS; i++) {
        const start = performance.now();
        await invoke("save_and_load_file_basic", {
          content: LARGE_CONTENT,
          filePath,
        });
        const elapsed = performance.now() - start;
        times.push(elapsed);
        await new Promise((r) => setTimeout(r, 100));
      }
      setRustTimes(times);
      const stats = calculateStats(times);
      setRustResult(
        `Mean: ${stats.mean.toFixed(2)}ms, Min: ${stats.min.toFixed(2)}ms, Max: ${stats.max.toFixed(2)}ms`,
      );
    } catch (e: any) {
      setRustResult("Error: " + e.message);
      setRustTimes([]);
    } finally {
      setIsRunning(false);
    }
  }

  async function benchmarkRustJson() {
    setIsRunning(true);
    const times: number[] = [];
    try {
      const appDataPath = await appDataDir();
      const filePath = await join(appDataPath, JSON_FILE_NAME);
      for (let i = 0; i < BENCHMARK_RUNS; i++) {
        const start = performance.now();
        await invoke("save_and_load_json_fast", {
          path: filePath,
          items: JSON_ITEMS,
          valuesPerItem: JSON_VALUES_PER_ITEM,
        });
        const elapsed = performance.now() - start;
        times.push(elapsed);
        await new Promise((r) => setTimeout(r, 100));
      }
      setRustJsonTimes(times);
      const stats = calculateStats(times);
      setRustJsonResult(
        `Mean: ${stats.mean.toFixed(2)}ms, Min: ${stats.min.toFixed(2)}ms, Max: ${stats.max.toFixed(2)}ms`,
      );
    } catch (e: any) {
      setRustJsonResult("Error: " + e.message);
      setRustJsonTimes([]);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div style={{ padding: "1rem", color: "#222" }}>
      <h2>File System Performance Benchmark</h2>
      <div style={{ "margin-right": "1rem" }}>
        <button
          onClick={benchmarkFs}
          disabled={isRunning()}
          style={{ "margin-right": "1rem" }}
        >
          Benchmark plugin-fs
        </button>
        <button
          onClick={benchmarkFsJson}
          disabled={isRunning()}
          style={{ "margin-right": "1rem" }}
        >
          Benchmark plugin-fs (JSON)
        </button>
        <button
          onClick={benchmarkRustFs}
          disabled={isRunning()}
          style={{ "margin-right": "1rem" }}
        >
          Benchmark Rust backend
        </button>
        <button onClick={benchmarkRustJson} disabled={isRunning()}>
          Benchmark Rust backend (JSON)
        </button>
      </div>
      <div>
        <h3>plugin-fs Results:</h3>
        <div>{fsResult() ?? "N/A"}</div>
        {fsTimes().length > 0 && (
          <div style={{ "font-size": "0.9em", color: "#666" }}>
            Individual times:{" "}
            {fsTimes()
              .map((t) => t.toFixed(2))
              .join(", ")}{" "}
            ms
          </div>
        )}
      </div>
      <div>
        <h3>plugin-fs JSON Results:</h3>
        <div>{fsJsonResult() ?? "N/A"}</div>
        {fsJsonTimes().length > 0 && (
          <div style={{ "font-size": "0.9em", color: "#666" }}>
            Individual times:{" "}
            {fsJsonTimes()
              .map((t) => t.toFixed(2))
              .join(", ")}{" "}
            ms
          </div>
        )}
      </div>
      <div>
        <h3>Rust backend Results:</h3>
        <div>{rustResult() ?? "N/A"}</div>
        {rustTimes().length > 0 && (
          <div style={{ "font-size": "0.9em", color: "#666" }}>
            Individual times:{" "}
            {rustTimes()
              .map((t) => t.toFixed(2))
              .join(", ")}{" "}
            ms
          </div>
        )}
      </div>
      <div>
        <h3>Rust backend JSON Results:</h3>
        <div>{rustJsonResult() ?? "N/A"}</div>
        {rustJsonTimes().length > 0 && (
          <div style={{ "font-size": "0.9em", color: "#666" }}>
            Individual times:{" "}
            {rustJsonTimes()
              .map((t) => t.toFixed(2))
              .join(", ")}{" "}
            ms
          </div>
        )}
      </div>
    </div>
  );
}

export default BenchmarkTest;

/*
Performance notes:

- For large files, plugin-fs is currently faster than Rust backend due to IPC overhead.
- Rust backend is best when all file work is done in Rust, not when sending big payloads from JS.
- For typical app saves, plugin-fs is simple and fast.
- Use release builds for best Rust performance.
- For huge files, consider chunking or streaming.
*/
