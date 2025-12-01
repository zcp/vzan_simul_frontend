<!-- 文件路径: d:\live_static_viewer\src\pages\PlayerView1.vue -->
<template>
  <div class="player-view-flex-root">
    <div class="player-main-content">
      <!-- 顶部信息条（标题/状态/时间） -->
      <div class="top-info-bar gradient-bar">
        <div class="top-bar-flex">
          <div class="left-info">
            <el-icon class="live-status-icon" :style="{color: statusType(record?.status)==='success'?'#67c23a':'#e6a23c'}">
              <component :is="statusType(record?.status)==='success' ? 'Promotion' : 'Clock'" />
            </el-icon>
            <span class="live-title">{{ record?.title }}</span>
            <el-tag
              class="status-tag"
              :type="statusType(record?.status)"
              :style="statusText(record?.status)==='回放中'
                ? 'background:rgba(64,158,255,0.12);color:#409eff;border:none;font-weight:normal;border-radius:12px;padding:0 18px;font-size:15px;letter-spacing:1px;box-shadow:none;'
                : ''"
            >
              <template v-if="statusText(record?.status)==='回放中'">
                <span style="display:inline-block;vertical-align:middle;">{{ statusText(record?.status) }}</span>
              </template>
              <template v-else>
                {{ statusText(record?.status) }}
              </template>
            </el-tag>
            <span class="live-time">{{ formatTime(record?.date) }}</span>
          </div>
        </div>
      </div>
      <!-- 视频播放器区域 -->
      <div class="video-player-area-fixed">
        <div class="video-area-wrap-fixed" style="width: 100%; margin: 0 auto; display: flex; flex-direction: column; align-items: stretch; box-sizing: border-box;">
          <div v-if="playerSourceUrl" style="position: relative;">
            <VideoPlayer :src="playerSourceUrl" />
          </div>
          <div v-else class="status-container placeholder-video">
            <span class="status-text">暂无视频源</span>
          </div>
        </div>
      </div>
      <!-- 功能页签区域 -->
      <div class="tab-card-area custom-tab-card" style="background:#fff;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.06);margin:24px 0 0 0;padding:0 0 24px 0;">
        <el-tabs v-model="activeTab" type="card" class="custom-tabs" @tab-click="onTabClick">
          <el-tab-pane label="直播介绍" name="desc">
            <div class="tab-pane-content">
              {{ record?.description || ' ' }}
            </div>
          </el-tab-pane>
          <el-tab-pane label="病例介绍" name="case">
            <div class="tab-pane-content" style="color:#909399;">
              内容待补充
            </div>
          </el-tab-pane>
          <el-tab-pane label="返回主会场" name="main">
            <!-- 空内容，点击即跳转 -->
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getDXDDRecordById } from '../../../utils/dxddModuleList';
import type { LiveRecord } from '../../../utils/csv';
import VideoPlayer from '../../../components/VideoPlayer.vue';

const activeTab = ref('desc');

const route = useRoute();
const router = useRouter();
const record = ref<LiveRecord | null>(null);

const playerSourceUrl = computed(() => {
  if (!record.value) return null;
  return record.value.m3u8_url;
});

onMounted(async () => {
  const id = route.params.id as string;
  // 这里假设固定某个 moduleIndex，或者后面再扩展
  const moduleIndex = (route.query.moduleIndex as string) || '0';

  try {
    record.value = await getDXDDRecordById(id, moduleIndex);
  } catch (e) {
    console.error(e);
  }
});

const goBack = () => {
  // 从当前路由的 query 中取回 moduleIndex
  const moduleIndex = (route.query.moduleIndex as string) || '0';

  router.push({
    name: 'dxddList',
    params: { moduleIndex },
  });
};
const statusText = (status: string | undefined) => {
  const map: Record<string, string> = {
    scheduled: '未开始',
    live: '直播中',
    ended: '已结束',
    archived: '回放中',
  };
  return status ? (map[status] || '回放中') : '回放中';
};

const statusType = (status: string | undefined) => {
  const map: Record<string, string> = {
    scheduled: 'primary',
    live: 'success',
    ended: 'info',
    archived: 'info',
  };
  return status ? (map[status] || 'info') : 'info';
};

const formatTime = (dateStr: string | undefined) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
};
function onTabClick(pane: any) {
  const name = pane?.props?.name ?? pane?.paneName ?? pane?.name;
  if (name === 'main') {
    goBack();
  }
}
</script>

<style scoped>
.player-view-flex-root {
  padding: 20px 0 0 0;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  background: #fff;
  min-height: 100vh;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
  gap: 24px;
}

@media (max-width: 1100px) {
  .player-view-flex-root {
    flex-direction: column;
    align-items: stretch;
    gap: 0;
  }
}


.player-main-content {
  width: 100%;
  max-width: 900px;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 0 0 32px 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px 0 rgba(0,0,0,0.06);
  margin: 0 auto;
  box-sizing: border-box;
}

@media (max-width: 1100px) {
  .player-main-content {
    max-width: 100%;
    margin: 0;
    border-radius: 0;
  }
}



/* 加载态 */
.loading-container,
.status-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  text-align: center;
}

.status-text {
  margin-top: 16px;
  color: #909399;
  font-size: 14px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e4e7ed;
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 顶部信息条 */
.top-info-bar {
  padding: 0px 10px;
  background: #fff;
  border-radius: 10px;
  margin-bottom: 0;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
  border: 1px solid #f0f1f3;
  display: flex;
  align-items: center;
  min-height: 56px;
}
.top-bar-flex {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.left-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.live-title {
  font-size: 14px;
  font-weight: normal;
  color: #222;
  margin-right: 14px;
  max-width: none;
  overflow: visible;
  text-overflow: initial;
  white-space: normal;
}

.status-tag {
  margin-right: 16px;
  vertical-align: middle;
  padding: 0px 0px;
}

.live-time {
  color: #333333cc;
  font-size: 14px;
  margin-left: 8px;
  vertical-align: middle;
}

.right-ops {
  font-size: 14px;
  gap: 2px;
  display: flex;
  align-items: center;
}
.right-ops .el-button:not(:first-child) {
  margin-left: 8px;
}

.top-info-bar .el-space {
  align-items: center;
  gap: 8px;
}

.top-info-bar .el-button {
  font-size: 14px;
  padding: 0 10px;
  margin-left: 8px;
  letter-spacing: 0.5px;
}

@media (max-width: 480px) {
  .top-info-bar {
    padding: 6px 8px;
    border-radius: 0;
  }

  .left-info {
    flex-wrap: wrap;
    row-gap: 4px;
  }

  .live-title {
    font-size: 13px;
  }

  .status-tag {
    margin-right: 8px;
  }

  .live-time {
    font-size: 12px;
  }
}

.top-info-bar .el-icon {
  vertical-align: -2px;
  margin-right: 3px;
}

/* 视频播放器 */
.video-player-area {
  margin-bottom: 18px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  overflow: hidden;
}

.video-area-wrap {
  width:950px;
  height:500px;
  margin:0 auto;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.player-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #222;
}

.player-title {
  font-size: 14px;
  font-weight: 600;
  color: #333333cc;
  margin-right: 8px;
  max-width: 360px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-time {
  color: #333333cc;
  font-size: 14px;
  margin-left: 8px;
}

.player-bottom-bar {
  padding: 8px 0 0 0;
  display: flex;
  justify-content: flex-start;
}

.placeholder-video {
  min-height: 400px;
  background-color: #f0f0f0;
}

/* 直播介绍 */
.room-description-card {
  background: #fff;
  border-radius: 10px;
  padding: 16px 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  border: 1px solid #e6eaf2;
}

.description-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.description-content {
  font-size: 14px;
  color: #444;
  line-height: 1.5;
}

/* 功能页签 */
.tab-card-area.custom-tab-card {
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin: 24px 0 0 0;
  padding: 0 0 24px 0;
  width: 100%;
  box-sizing: border-box;
}


.custom-tabs .el-tabs__header {
  background: #fff;
  border-bottom: 1.5px solid #e6eaf2;
  border-radius: 10px 10px 0 0;
  margin-bottom: 0;
  box-shadow: none;
  z-index: 2;
  position: relative;
}
.custom-tabs .el-tabs__nav {
  gap: 24px;
}
.custom-tabs .el-tabs__item {
  font-size: 16px;
  color: #222;
  font-weight: 500;
  background: #f8faff;
  border: none;
  border-radius: 8px 8px 0 0;
  margin-right: 8px;
  padding: 0 20px;
  transition: color 0.2s;
  transition: color 0.2s, background 0.2s;
  position: relative;
  z-index: 3;
}
.custom-tabs .el-tabs__item:hover {
  color: #409eff;
  background: #f4f8ff;
}
.custom-tabs .el-tabs__item.is-active {
  color: #409eff;
  background: #fff;
  font-weight: 600;
}
.custom-tabs .el-tabs__active-bar {
  height: 3px;
  border-radius: 2px 2px 0 0;
  background: #409eff;
  bottom: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .video-area-wrap {
    min-height: 250px;
  }
  .placeholder-video {
    min-height: 250px;
  }
}
.tab-pane-content {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  margin-top: 12px;
  padding: 22px 24px 20px 24px;
  font-size: 15px;
  color: #444;
  min-height: 48px;
  line-height: 1.7;
}

.custom-tabs .el-tabs__content {
  padding: 0;
  margin-top: -8px;
}

/* 平板 & 手机：播放器宽度占满，适配高度 */
@media (max-width: 768px) {
  .player-main-content {
    max-width: 100%;
    margin: 0;
    border-radius: 0;
    box-shadow: none;
  }

  .video-area-wrap-fixed {
    width: 100% !important;
    height: auto !important;
    min-height: 220px;
    height: 500px;
  }
  @media (max-width: 768px) {
  .video-area-wrap-fixed {
    height: auto;
    min-height: 220px;
  }
}

  .placeholder-video {
    min-height: 220px;
  }
}

/* 小屏手机：高度再压缩一点，注意避免太高 */
@media (max-width: 480px) {
  .video-area-wrap-fixed {
    min-height: 200px;
  }

  .placeholder-video {
    min-height: 200px;
  }
}

</style>