import { VideoFile, VideoInfo } from 'src/common/types'

/**
 * Get video infomation
 */
const getVideoInfo = (name: string, src: string): Promise<VideoInfo | null> => {
  return new Promise((resolve) => {
    const video = document.createElement('video')

    // Cleanup function to prevent memory leaks and free up resources
    // The browser might keep the video in memory if we don't clear the src
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
  // Concurrency limit to prevent renderer freezing when processing many videos
  const concurrencyLimit = 3
  const results: (VideoInfo | null)[] = new Array(videoFiles.length)
  let currentIndex = 0

  const worker = async (): Promise<void> => {
    while (currentIndex < videoFiles.length) {
      const index = currentIndex++
      const f = videoFiles[index]
      results[index] = await getVideoInfo(f.name, f.path)
    }
  }

  const workers: Promise<void>[] = []
  for (let i = 0; i < Math.min(concurrencyLimit, videoFiles.length); i++) {
    workers.push(worker())
  }

  await Promise.all(workers)

  const videoInfoList: VideoInfo[] = []
  results.forEach((videoInfo) => {
    if (videoInfo) videoInfoList.push(videoInfo)
  })

  return videoInfoList
}
