# File I/O Benchmark Comparison and Guidance

## Summary

- For large payloads (e.g., ~32MB bytes, large complex JSON), a Rust backend command that generates/serializes data in Rust and only returns small metadata is significantly faster than sending that payload from JS to Rust or using plugin-fs.
- For typical app saves (small/medium JSON), plugin-fs is simple and already fast enough.

## Why Rust Backend (fast) is faster

When the UI sends a huge string (tens of MB) to Rust, most time is lost crossing the JS↔Rust bridge (allocation, copying, serialization/deserialization). If Rust instead generates and handles the heavy payload itself (write/read/serialize), and returns only tiny metadata (timing, sizes, checksum), we avoid that overhead and stay close to the OS.

Observed patterns:

- 32MB bytes test:
  - plugin-fs: ~800ms (round‑trip)
  - Rust fast: ~330ms (round‑trip), ~35ms (backend‑only)
- Complex JSON test:
  - plugin-fs JSON: ~186ms (round‑trip)
  - Rust fast JSON: ~160ms (round‑trip), ~13ms (backend‑only)
- Typical FS (plugin-fs realistic board save): ~31ms (round‑trip)

Numbers vary by machine and build (debug vs release), but the pattern holds: avoid moving huge payloads through the bridge.

## What to use when

- Small/medium saves (typical app state, user actions):
  - Use plugin-fs.
  - It’s simple, good DX, and more than fast enough.

- Large files / exports / backups / migrations / bulk operations:
  - Use Rust commands that perform generation/serialization/write/read fully in Rust.
  - Send parameters/paths, not large content.
  - Return only minimal metadata (lengths, checksums, IDs, status).

## Practical tips to go faster

- Use release builds for the Rust backend when benchmarking performance.
- If you need durability guarantees, add explicit flush/fsync (will slow both approaches, but is sometimes required).
- For huge payloads that must be displayed in the UI, stream/chunk or return summaries/ids instead of entire content.

## Definitions of benchmarks implemented

- plugin-fs (bytes): write+read a large bytes string from JS via `@tauri-apps/plugin-fs`.
- Rust backend (basic): UI sends a large string to Rust; Rust writes/reads with `std::fs::File` (slower due to large IPC payload).
- Rust backend (fast bytes): UI sends only size; Rust generates bytes and writes/reads; returns minimal metadata.
- plugin-fs (JSON): UI generates large complex JSON and write+read via plugin-fs.
- Rust backend (fast JSON): UI sends item counts; Rust generates large JSON, write+read in Rust; returns minimal metadata.


