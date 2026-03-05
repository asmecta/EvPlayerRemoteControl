## 2026-02-26 - [Parallel Media Decoding Bottleneck]
**Learning:** `getVideoInfoList` was processing all video files in parallel using `Promise.all`. Creating dozens of `<video>` elements and seeking to a specific time simultaneously causes severe performance degradation and potential crashes in the renderer process.
**Action:** Implemented a concurrency limiter (worker pool pattern) to process videos in small batches (e.g., 3 at a time) to maintain UI responsiveness while processing large playlists.
