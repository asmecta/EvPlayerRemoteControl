## 2024-05-24 - [Fix memory leak and renderer freeze on multiple video load]

**Learning:** In Electron, creating hidden `<video>` elements for metadata extraction requires removing their `src` attribute and calling `load()` after use to ensure proper garbage collection. Additionally, concurrent DOM-based video operations must be limited to prevent the renderer process from freezing.
**Action:** Always implement a chunking/concurrency-limiting mechanism when processing multiple video files using DOM elements. Also, always create a `cleanup` function for DOM elements to clear `src` and call `load()` on success and error paths.
