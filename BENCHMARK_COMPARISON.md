# File I/O Benchmark Comparison and Guidance

## Summary

- For large files, plugin-fs is currently faster than Rust backend (see benchmarks below).
- For small/medium saves, plugin-fs is simple and fast.

## Benchmarks

- plugin-fs: Mean ~480ms, Min ~455ms, Max ~508ms
- Rust backend: Mean ~593ms, Min ~580ms, Max ~604ms
- JSON benchmarks: N/A

plugin-fs is faster for large file writes in current tests.

## What to use when

- For most app saves, use plugin-fs.
- For very large/bulk operations, consider Rust backend if you need custom logic.

## Tips

- Use release builds for Rust backend.
- fsync/flush slows both approaches but may be needed for durability.

## Benchmarks

- plugin-fs: Write/read large string from JS.
- Rust backend: Write/read large string sent from JS.


