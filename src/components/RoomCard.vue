<template>
  <view class="room-card">
    <view class="card-main-content" @click="handleClick">
    <view class="cover-wrapper">
      <image 
        :src="room.cover_url" 
        class="cover-image" 
        mode="aspectFill"
        @error="handleImageError"
      />
      <view v-if="!imageLoaded" class="image-placeholder">
        <view class="placeholder-icon">📷</view>
        <text class="placeholder-text">暂无封面</text>
      </view>
      <view v-if="room.is_private" class="private-badge">
        <text>私密</text>
      </view>
      <!-- 新增：悬浮操作按钮 -->
      <view class="cover-actions">
        <slot name="actions"></slot>
      </view>
    </view>
    <view class="info-wrapper">
      <text class="title">{{ room.title }}</text>
        <text v-if="showDescription" class="description">{{ room.description || '暂无简介' }}</text>
      </view>
    </view>
    
    <!-- 新增：操作区域的插槽 -->
    <view class="actions-wrapper" v-if="$slots.actions">
      <slot name="actions"></slot>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Room } from '../types/room';

const props = withDefaults(defineProps<{
  room: Room;
  showDescription?: boolean;
}>(), {
  showDescription: true,
});

const emit = defineEmits<{
  (e: 'click'): void;
}>();

const imageLoaded = ref(false);

const handleImageError = () => {
  imageLoaded.value = false;
};

// 如果 props.room.cover_url 存在，则尝试加载图片
watch(() => props.room.cover_url, (newUrl) => {
  if (newUrl) {
    // uni-app 的 image 组件没有 onload 事件，这里用一个标志位模拟
    // 假设有 URL 就是能加载成功，如果失败会触发 @error
    imageLoaded.value = true; 
  } else {
    imageLoaded.value = false;
  }
}, { immediate: true });


const handleClick = () => {
  emit('click');
};
</script>

<style lang="scss" scoped>
.room-card {
  max-width: 340px;         // 限制最大宽度
  min-width: 260px;         // 限制最小宽度
  background-color: var(--color-background-light);
  border-radius: 16px; /* 加大圆角 */
  overflow: hidden;
  box-shadow: 0 6px 24px rgba(74,144,226,0.10); /* 更柔和更明显的阴影 */
  transition: var(--transition-base);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  border: none;
  margin-bottom: var(--spacing-xlarge); /* 卡片间距 */
  position: relative;
  min-width: 0;
  
  &:hover {
    border: 2px solid rgb(121, 175, 230);  
    transform: translateY(-6px) scale(1.02);
    box-shadow: 0 12px 32px rgba(74,144,226,0.16);
  }
}

.card-main-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.cover-wrapper {
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  background-color: var(--color-background);
  border-bottom: 1px solid var(--color-border);
}

.cover-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0;
}

.image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--color-text-secondary);
  background-color: #f0f4fa;
}

.placeholder-icon {
  font-size: 44px;
  opacity: 0.5;
}

.placeholder-text {
  margin-top: var(--spacing-small);
  font-size: var(--font-size-medium);
}

.private-badge {
  position: absolute;
  top: var(--spacing-medium);
  right: var(--spacing-medium);
  background-color: rgb(121, 175, 230);
  color: #fff;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: var(--font-size-small);
  font-weight: bold;
  letter-spacing: 1px;
}

.info-wrapper {
  padding: var(--spacing-medium) var(--spacing-medium) var(--spacing-medium) var(--spacing-medium);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-small);
}

.title {
  font-size: 20px;
  font-weight: 700;
  color: #222; /* 或 var(--color-text-primary) 确保不是白色 */
  margin-bottom: 2px;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.description {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  line-height: 1.5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.actions-wrapper {
  display: none;
}

.cover-actions {
  position: absolute;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  display: flex;
  gap: var(--spacing-medium);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s;
  z-index: 2;
}
.cover-wrapper:hover .cover-actions {
  opacity: 1;
  pointer-events: auto;
}
</style>