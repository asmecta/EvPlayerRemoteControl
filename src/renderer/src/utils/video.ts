import { VideoFile, VideoInfo } from 'src/common/types'

/**
 * Get video infomation
 */
const getVideoInfo = (name: string, src: string): Promise<VideoInfo | null> => {
  return new Promise((resolve) => {
    const video = document.createElement('video')

    // Cleanup function to ensure proper garbage collection of DOM elements and prevent memory leaks
    const cleanup = (): void => {
      video.removeAttribute('src')
      video.load()
    }

    video.setAttribute('src', `file:///${src}`)
    video.onloadedmetadata = (): void => {
      video.currentTime = 1
    }
    video.onseeked = (): void => {
      const { duration, videoHeight, videoWidth } = video
      let w = videoWidth
      let h = videoHeight
      if (w > h) {
        if (w > 640) {
          const scale = 640 / videoWidth
          w = 640
          h = Math.ceil(h * scale)
        }
      } else {
        const scale = 480 / videoHeight
        h = 480
        w = Math.ceil(w * scale)
      }
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = w
      canvas.height = h
      ctx?.drawImage(video, 0, 0, w, h)
      const dataUrl = ctx?.canvas.toDataURL('image/jpeg', 0.9) || ''

      const min = Math.floor(duration / 60)
      const sec = Math.floor(duration % 60)

      cleanup()
      resolve({
        path: src,
        name,
        duration: (min >= 10 ? min : `0${min}`) + ':' + (sec >= 10 ? sec : `0${sec}`),
        current: 0,
        poster: dataUrl
      })
    }
    video.onerror = (): void => {
      cleanup()
      resolve(null)
    }
  })
}

export const getVideoInfoList = async (videoFiles: VideoFile[]): Promise<VideoInfo[]> => {
  const videoInfoList: VideoInfo[] = []
  // Process videos in chunks to avoid blocking the main thread / freezing the renderer
  const CONCURRENCY_LIMIT = 4

  for (let i = 0; i < videoFiles.length; i += CONCURRENCY_LIMIT) {
    const chunk = videoFiles.slice(i, i + CONCURRENCY_LIMIT)
    const ps = chunk.map((f) => getVideoInfo(f.name, f.path))

    const results = await Promise.all(ps)
    results.forEach((videoInfo) => {
      if (videoInfo) videoInfoList.push(videoInfo)
    })
  }

  return videoInfoList
}
