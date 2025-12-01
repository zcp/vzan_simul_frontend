<template>
  <view class="redirect-page">
    <view class="loading-container">
      <view class="loading-spinner"></view>
      <text class="loading-text">正在跳转...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/store/auth';
import { onLoad } from '@dcloudio/uni-app';

onLoad(() => {
  const authStore = useAuthStore();
  
  console.log('🚀 RoomList页面加载');
  console.log('🔍 当前认证状态:', {
    isAuthenticated: authStore.isAuthenticated,
    token: authStore.token,
    user: authStore.user
  });
  
  
  console.log('🔄 根路径访问，自动跳转到房间列表');
  
  // 延迟跳转，给用户看到加载动画的时间
  setTimeout(() => {
    uni.reLaunch({
      url: '/pages/room/new/RoomList',
      success: () => {
        console.log('✅ 跳转到房间列表成功');
      },
      fail: (err) => {
        console.error('❌ 跳转失败:', err);
        // 如果跳转失败，尝试使用 navigateTo
        uni.navigateTo({
          url: '/pages/room/new/RoomList'
        });
      }
    });
  }, 500); // 延迟500ms
});
</script>

<style lang="scss" scoped>
.redirect-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #eaf0f7 100%);
}

.loading-container {
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4a90e2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

.loading-text {
  font-size: 16px;
  color: #666;
  font-family: var(--font-family-sans-serif);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
