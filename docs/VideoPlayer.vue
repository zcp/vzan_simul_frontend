<!-- 文件路径: d:\live_static_viewer\src\components\VideoPlayer.vue -->
<template>
  <div class="video-player-container" ref="containerRef"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, withDefaults, watch } from 'vue';
import Artplayer from 'artplayer';
import Hls from 'hls.js';

const props = withDefaults(defineProps<{ src?: string; muted?: boolean }>(), {
  muted: false,
});

const containerRef = ref<HTMLDivElement | null>(null);
let art: Artplayer | null = null;
let currentHls: Hls | null = null;

onMounted(() => {
  if (!containerRef.value || !props.src) return;
  art = new Artplayer({
    container: containerRef.value,
    url: props.src,
    autoplay: false,
    muted: !!props.muted,
    volume: 1,
    setting: true,
    playbackRate: true,
    fullscreen: true,
    fullscreenWeb: true,
    pip: true,
    theme: '#1e80ff',
    type: props.src.endsWith('.m3u8') ? 'm3u8' : undefined as any,
    customType: {
      m3u8(video: HTMLVideoElement, url: string) {
        if (Hls.isSupported()) {
          if (currentHls) {
            try { currentHls.destroy(); } catch {}
            currentHls = null;
          }
          const hls = new Hls();
          hls.loadSource(url);
          hls.attachMedia(video);
          currentHls = hls;
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url;
        }
      },
    },
  });
});

onBeforeUnmount(() => {
  if (art) {
    try { art.destroy(false); } catch {}
    art = null;
  }
  if (currentHls) {
    try { currentHls.destroy(); } catch {}
    currentHls = null;
  }
});

// 当外部传入的 src 发生变化时，安全地切换播放源
watch(() => props.src, (next) => {
  if (!art) {
    if (containerRef.value && next) {
      art = new Artplayer({
        container: containerRef.value,
        url: next,
        autoplay: false,
        muted: !!props.muted,
        volume: 1,
        setting: true,
        playbackRate: true,
        fullscreen: true,
        fullscreenWeb: true,
        pip: true,
        theme: '#1e80ff',
        type: next.endsWith('.m3u8') ? 'm3u8' : undefined as any,
        customType: {
          m3u8(video: HTMLVideoElement, url: string) {
            if (Hls.isSupported()) {
              if (currentHls) { try { currentHls.destroy(); } catch {}; currentHls = null; }
              const hls = new Hls();
              hls.loadSource(url);
              hls.attachMedia(video);
              currentHls = hls;
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
              video.src = url;
            }
          },
        },
      });
    }
    return;
  }
  // 已有播放器，执行切换
  try {
    // 清理旧的 HLS 实例
    if (currentHls) { currentHls.destroy(); currentHls = null; }
    // 通过 Artplayer API 切换 URL
    // @ts-ignore
    art.switchUrl(next || '');
  } catch (e) {
    // 兜底：完全销毁后重建
    try { art.destroy(false); } catch {}
    art = null;
    if (containerRef.value && next) {
      art = new Artplayer({
        container: containerRef.value,
        url: next,
        autoplay: false,
        muted: !!props.muted,
        volume: 1,
        setting: true,
        playbackRate: true,
        fullscreen: true,
        fullscreenWeb: true,
        pip: true,
        theme: '#1e80ff',
        type: next.endsWith('.m3u8') ? 'm3u8' : undefined as any,
        customType: {
          m3u8(video: HTMLVideoElement, url: string) {
            if (Hls.isSupported()) {
              if (currentHls) { try { currentHls.destroy(); } catch {}; currentHls = null; }
              const hls = new Hls();
              hls.loadSource(url);
              hls.attachMedia(video);
              currentHls = hls;
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
              video.src = url;
            }
          },
        },
      });
    }
  }
});
</script>

<style scoped>
.video-player-container {
  width: 100%;
  /* 用 aspect-ratio 控制 16:9，高度自动 */
  aspect-ratio: 16 / 9;
  height: auto;
  position: relative;
  max-height: 70vh; /* 防止特别长的屏幕上过高，可按需要调整或删除 */
}
</style>