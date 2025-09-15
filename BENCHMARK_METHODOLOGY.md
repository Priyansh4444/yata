# File System Performance Benchmark Methodology

This benchmark compares plugin-fs and Rust backend file I/O for large files.

- Both methods use the same file size and location.
- 5 runs per method, 100ms delay between runs.
- Measures mean, min, max, and standard deviation.

**plugin-fs**: Faster for large payloads due to lower IPC overhead.
**Rust backend**: Direct system calls, but IPC is slower for big transfers.

Use plugin-fs for typical saves. Use Rust backend for bulk operations, but avoid sending large payloads across the JS↔Rust bridge.

Results help you choose the best approach for your app.
