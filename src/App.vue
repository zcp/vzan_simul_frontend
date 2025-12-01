<template>
  <!-- uni-app中App.vue不需要template内容 -->
</template>

<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { useAuthStore } from '@/store/auth';

onLaunch(() => {
  console.log("App Launch");
  // 增量开发：应用启动时初始化认证状态
  const authStore = useAuthStore();
  authStore.initializeAuth();
});

onShow(() => {
  console.log("App Show");
});

onHide(() => {
  console.log("App Hide");
});
</script>

<style lang="scss">
/* 注意：uni.scss 已通过 vite.config.js 全局注入，无需在此处 @import */

#app {
  width: 100%;
  height: 100vh;
}

.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
