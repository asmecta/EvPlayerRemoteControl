import { VideoFile, VideoInfo } from 'src/common/types'

/**
 * Get video infomation
 */
const getVideoInfo = (name: string, src: string): Promise<VideoInfo | null> => {
  return new Promise((resolve) => {
    const video = document.createElement('video')
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

      resolve({
        path: src,
        name,
        duration: (min >= 10 ? min : `0${min}`) + ':' + (sec >= 10 ? sec : `0${sec}`),
        current: 0,
        poster: dataUrl
      })
    }
    video.onerror = (): void => {
      resolve(null)
    }
  })
}

export const getVideoInfoList = async (videoFiles: VideoFile[]): Promise<VideoInfo[]> => {
  // Limit concurrency to prevent freezing the UI when processing many files
  const concurrency = 3
  const results: (VideoInfo | null)[] = new Array(videoFiles.length)
  let currentIndex = 0

  const worker = async (): Promise<void> => {
    while (currentIndex < videoFiles.length) {
      const index = currentIndex
      currentIndex++
      const f = videoFiles[index]
      if (f) {
        results[index] = await getVideoInfo(f.name, f.path)
      }
    }
  }

  await Promise.all(
    Array(Math.min(concurrency, videoFiles.length))
      .fill(null)
      .map(() => worker())
  )

  return results.filter((v): v is VideoInfo => v !== null)
}
