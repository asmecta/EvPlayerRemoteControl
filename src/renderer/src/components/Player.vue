<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import videojs from 'video.js'
import throttle from 'lodash.throttle'

import { getVideoInfoList } from '../utils/video'
import Keyboard from '../utils/keyboard'

import { VideoFile, VideoInfo } from '../../../common/types'
import { IpcEvents } from '../../../common/ipcEvents'

const playerRef = ref<HTMLVideoElement>()
const player = ref<videojs.Player>()
const currentVideo = ref<VideoInfo | null>()
let saveProgress: ReturnType<typeof throttle> | null = null

const play = (video: VideoInfo): void => {
  if (currentVideo.value?.path !== video.path) {
    currentVideo.value = video
    if (video) {
      player.value?.pause()
      player.value?.src(`file:///${video.path}`)
      player.value?.on('loadeddata', () => {
        const lastPlayedTime = localStorage.getItem(video.path)
        if (lastPlayedTime) {
          player.value?.currentTime(parseFloat(lastPlayedTime))
        }
        player.value?.play()
      })
    }
  }
}

const pause = (): void => {
  player.value?.pause()
}

const handleDrop = async (e: DragEvent): Promise<void> => {
  e.preventDefault()

  const files: VideoFile[] = []
  if (e.dataTransfer) {
    for (const f of e.dataTransfer.files) {
      if (f.type.startsWith('video')) {
        files.push({
          path: f.path,
          name: f.name
        })
      }
    }
  }

  if (files.length) {
    const videoInfoList = await getVideoInfoList(files)
    window.electron.ipcRenderer.send(IpcEvents.EV_ADD_VIDEOS, videoInfoList)
  }
}

onMounted(() => {
  if (playerRef.value) {
    player.value = videojs(playerRef.value, {
      controls: false,
      autoplay: true,
      fill: true,
      controlBar: {
        volumePanel: { inline: false, volumeControl: { vertical: true } },
        children: [
          'playToggle',
          'volumePanel',
          'currentTimeDisplay',
          'progressControl',
          'durationDisplay',
          'fullscreenToggle'
        ]
      },
      userActions: {
        hotkeys: function (event): void {
          if (player.value) {
            Keyboard.handlerKeyCode(player.value, event.keyCode)
          }
        }
      }
    })
    const keyboard = new Keyboard(player.value)
    keyboard.bind()

    saveProgress = throttle(() => {
      if (currentVideo.value && player.value) {
        localStorage.setItem(currentVideo.value.path, player.value.currentTime().toString())
      }
    }, 1000)

    player.value.on('timeupdate', saveProgress)
    player.value.on('pause', saveProgress)
  }
})

onUnmounted(() => {
  if (player.value) {
    saveProgress?.flush()
    player.value.dispose()
  }
})

defineExpose({
  play,
  pause
})
</script>

<template>
  <div class="player" @drop="handleDrop" @dragenter.prevent @dragover.prevent>
    <video ref="playerRef" class="video-js"></video>
  </div>
</template>

<style>
@import 'video.js/dist/video-js.css';
@import '../assets/css/player.css';

.player {
  flex: 1;
}
</style>
