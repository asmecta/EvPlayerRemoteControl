## 2024-05-18 - Electron Renderer Freeze with Concurrent DOM Operations
**Learning:** Processing multiple video/canvas DOM operations simultaneously (like generating video thumbnails) can quickly freeze the Electron renderer process or cause OOM errors. Creating too many `<video>` elements at once is very expensive on the main thread.
**Action:** When processing files using DOM elements (like loading video metadata and drawing to canvas), always use a concurrency limit (e.g., max 3-5 concurrent tasks) rather than `Promise.all` over the entire array of files.
