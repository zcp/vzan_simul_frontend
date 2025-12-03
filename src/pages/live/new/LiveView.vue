<template>
  <el-container class="live-view-container">
    <!-- 左侧主内容区 -->
    <el-main class="main-content">
      <!-- 加载与错误态 -->
      <el-card v-if="loading" shadow="never" style="margin-top:12px;" v-loading="loading">
        <div class="loading-container"><div class="spinner"></div><span>正在进入直播间...</span></div>
      </el-card>
      <el-card v-else-if="error" shadow="never" style="margin-top:12px;">
        <div class="status-container">
          <span class="status-text">进入失败：{{ error.message }}</span>
          <el-button type="primary" size="small" @click="goBack">返回</el-button>
        </div>
      </el-card>

      <!-- 主内容 -->
      <el-row v-else-if="currentSession" :gutter="40" style="margin-top:12px;">
        <el-col :xs="24" :md="16">
          <!-- 顶部信息条（标题/状态/时间） -->
          <el-card shadow="never" class="top-info-bar" :body-style="{ padding: '0px' }">
            <el-row justify="space-between" align="middle" style="padding: 12px 16px;">
              <el-col :xs="24" :md="16">
                <div class="top-info">
                  <div class="top-info-title">
                    <el-text class="live-title">{{ roomDetail?.title || '' }}</el-text>
                  </div>
                  <div class="top-info-meta">
                    <el-tag class="status-tag" :type="currentSession?.status === 'live' ? 'success' : (currentSession?.status === 'scheduled' ? 'primary' : 'info')">
                      {{ getStatusText(currentSession?.status || 'scheduled') }}
                    </el-tag>
                    <span class="live-time">{{ formatTime(currentSession?.start_time || '') }}</span>
                  </div>
                </div>
              </el-col>
            </el-row>
          </el-card>

          <!-- 视频播放器区域 -->
          <el-card class="video-player-area" shadow="never">
            <template #default>
              <div class="video-area-wrap">
                <!-- 使用 VideoPlayer 组件播放 -->
                <!-- #ifdef H5 -->
                <div v-if="isH5 && playerSourceUrl" style="width: 100%; margin: 0 auto; box-sizing: border-box;">
                  <VideoPlayer :src="playerSourceUrl" />
                </div>
                <!-- #endif -->
                
                <!-- 非 H5 环境的备用播放器 -->
                <div v-else-if="!isH5 && playerSourceUrl" class="fallback-player" style="width: 100%; background: #000; line-height: 0; display: flex; justify-content: center;">
                  <video 
                    :src="playerSourceUrl" 
                    controls 
                    autoplay 
                    muted 
                    playsinline 
                    style="width: 100%; height: auto; max-height: 80vh;"
                  >
                    您的浏览器不支持视频播放
                  </video>
                </div>
                
                <!-- 占位/加载状态 -->
                <div v-if="!playerSourceUrl" class="status-container placeholder-video">
                  <div class="event-title">{{ roomDetail?.title || '直播活动' }}</div>
                  <div class="event-subtitle">回放生成中</div>
                  <div class="playback-status">
                    <el-tag type="info" size="large" effect="dark">{{ emptySourceHint }}</el-tag>
                  </div>
                </div>
              </div>
            </template>
          </el-card>

          <!-- 分会场卡片轮播区域（来自旧版 LiveView，精简版） -->
          <el-card shadow="never" style="margin-top:12px;" v-if="subVenueCards.length > 0">
            <template #header>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: 600; color: #303133;">分会场</span>
              </div>
            </template>
            <div class="sub-venue-carousel">
              <!-- 左侧控制按钮 -->
              <el-button
                v-if="subVenueCards.length > visibleCards"
                :disabled="subVenueCurrentIndex === 0"
                @click="subVenuePrevSlide"
                size="small"
                circle
                class="control-btn control-btn-left"
              >
                <el-icon><ArrowLeft /></el-icon>
              </el-button>

              <div class="carousel-container">
                <div class="carousel-track" :style="{ transform: `translateX(-${subVenueCurrentIndex * subVenueCardWidth}px)` }">
                  <div
                    v-for="venue in subVenueCards"
                    :key="venue.id"
                    class="venue-card"
                    @click="goToSubVenue(venue.id)"
                  >
                    <div class="venue-card-inner">
                      <el-image class="venue-cover" :src="getCoverSrc(venue.cover_url)" fit="cover">
                        <template #error>
                          <div class="img-error">No Image</div>
                        </template>
                      </el-image>
                      <div class="venue-info">
                        <div class="venue-title" :title="venue.title">{{ venue.title }}</div>
                        <div class="venue-meta">
                          <span>开始时间：{{ formatTime(venue._latestStartTime) }}</span>
                        </div>
                      </div>
                      <el-tag class="status-badge" size="small" :type="statusType(venue._latestStatus)">
                        {{ statusText(venue._latestStatus) }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 右侧控制按钮 -->
              <el-button
                v-if="subVenueCards.length > visibleCards"
                :disabled="subVenueCurrentIndex >= subVenueMaxIndex"
                @click="subVenueNextSlide"
                size="small"
                circle
                class="control-btn control-btn-right"
              >
                <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </el-card>

          <!-- 功能页签区域 -->
          <el-card shadow="never" style="margin-top:12px;">
            <el-tabs v-model="activeTabKey" @tab-click="handleRoomTabClick">
              <!-- 动态 Tabs（来自后端） -->
              <el-tab-pane
                v-for="tab in roomTabs"
                :key="tab.tab_key"
                :name="tab.tab_key"
                :label="tab.title"
              >
                <div class="tab-content-wrapper">
                  <!-- [管理员] 操作栏 -->
                  <div v-if="isAdmin" style="margin-bottom: 12px; text-align: right;">
                    <el-button type="primary" link size="small" @click="openTabEditor(tab)">
                      <el-icon><Edit /></el-icon> 编辑
                    </el-button>
                    <el-button type="danger" link size="small" @click="deleteTab(tab)">
                      <el-icon><Delete /></el-icon> 删除
                    </el-button>
                  </div>

                  <!-- 纯文本 -->
                  <el-scrollbar v-if="tab.content_type === 'text'" height="300px">
                    <div class="tab-text-content" v-html="tab.text_content"></div>
                  </el-scrollbar>

                  <!-- 纯图片 -->
                  <div v-else-if="tab.content_type === 'image'" class="tab-image-wrapper">
                    <el-image 
                      v-if="!imageErrorMap[tab.tab_key]"
                      :src="processImageUrl(tab.image_url)" 
                      fit="contain" 
                      :preview-src-list="tab.image_url ? [processImageUrl(tab.image_url)] : []"
                      @error="() => onTabImageError(tab.tab_key)"
                    />
                    <div v-else class="image-placeholder" style="width: 100%; height: 300px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999; border-radius: 4px;">
                      暂无图片
                    </div>
                  </div>

                  <!-- 图文混合 -->
                  <div v-else-if="tab.content_type === 'mixed'" class="tab-mixed-wrapper" style="display: flex; flex-direction: column; gap: 12px;">
                    <el-scrollbar max-height="150px" v-if="tab.text_content">
                      <div class="tab-text-content" style="white-space: pre-wrap;">{{ tab.text_content }}</div>
                    </el-scrollbar>
                    <div class="tab-image-wrapper">
                      <el-image 
                        v-if="!imageErrorMap[tab.tab_key]"
                        :src="processImageUrl(tab.image_url)" 
                        fit="contain" 
                        :preview-src-list="tab.image_url ? [processImageUrl(tab.image_url)] : []"
                        @error="() => onTabImageError(tab.tab_key)"
                      />
                      <div v-else class="image-placeholder" style="width: 100%; height: 200px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #999; border-radius: 4px;">
                        暂无图片
                      </div>
                    </div>
                  </div>
                </div>
              </el-tab-pane>

              <!-- 内置固定 Tab：直播介绍 -->
              <el-tab-pane label="直播介绍" name="builtin-intro">
                <el-scrollbar>
                  <div class="room-description-card">
                    <div class="description-content">{{ roomDetail?.description || '暂无简介' }}</div>
                  </div>
                </el-scrollbar>
              </el-tab-pane>

              <!-- 内置固定 返回主会场 -->
              <el-tab-pane label="返回主会场" name="builtin-back-main">
                <div style="padding: 20px; text-align: center;">
                  <el-button type="success" link @click="goToMainVenue">返回主会场</el-button>
                </div>
              </el-tab-pane>

              <!-- 内置固定 Tab：返回营销专题列表 -->
              <el-tab-pane label="返回营销专题" name="builtin-back-topic">
                <div style="padding: 20px; text-align: center;">
                   <el-button type="success" link @click="goToTopicDisplay">返回营销专题</el-button>
                </div>
              </el-tab-pane>
              
              <!-- [管理员] 添加 Tab 按钮 (模拟插槽效果) -->
              <el-tab-pane v-if="isAdmin" name="admin-add-tab" disabled>
                <template #label>
                   <el-button type="primary" link size="small" @click.stop="openTabEditor()">
                     <el-icon><Plus /></el-icon> 新增Tab
                   </el-button>
                </template>
              </el-tab-pane>
            </el-tabs>
          </el-card>
        </el-col>

        <!-- 右侧聊天互动区域 -->
        <el-col :xs="24" :md="8">
          <el-aside class="chat-sidebar" width="95%">
            <div class="chat-header">聊天互动</div>
            <!-- 用户消息列表 -->
            <div class="user-messages">
              <el-scrollbar style="height: 100%;">
                <div v-if="hasMoreMessages && messages.length > 0" class="load-more">
                  <el-button text size="small" :loading="messageLoading" @click="fetchRoomMessages(false)">
                    加载更多留言
                  </el-button>
                </div>
                <div v-if="messageLoading && messages.length === 0" style="padding: 20px; text-align: center;">
                  <div class="spinner"></div> 加载留言中...
                </div>
                <div v-else-if="messages.length === 0" style="padding: 20px; text-align: center; color: #909399;">
                  暂无留言，快来抢沙发吧~
                </div>
                <div
                  v-else
                  v-for="msg in messages"
                  :key="msg.id"
                  class="message-item"
                  :class="{ 'message-self': isSelfMessage(msg), 'message-other': !isSelfMessage(msg) }"
                >
                  <el-avatar class="user-avatar" size="small" :style="{ backgroundColor: stringToColor(msg.user_id) }">
                    {{ computeMessageAvatarText(msg) }}
                  </el-avatar>
                  <div class="message-main">
                    <div class="message-header">
                      <span class="user-name">{{ computeMessageUserName(msg) }}</span>
                      <!-- 使用辅助函数判定是否显示管理员标签 -->
                      <el-tag v-if="isAdminRole(msg.user_role)" size="small" type="success" effect="plain" style="margin-left: 4px;">
                        管理员
                      </el-tag>
                      <span class="message-time">{{ formatTime(msg.created_at) }}</span>
                    </div>
                    <div class="message-text">{{ msg.content }}</div>
                  </div>
                </div>

                <div v-if="hasMoreMessages && messages.length > 0" class="load-more">
                  <el-button text size="small" :loading="messageLoading" @click="fetchRoomMessages(false)">
                    加载更多留言
                  </el-button>
                </div>
              </el-scrollbar>
            </div>

            <!-- 输入区域 -->
            <div class="chat-input-area">
              <div class="input-with-icons">
                <div class="input-icons">
                  <el-button link size="small" @click="() => ElMessage.info('表情功能待开发')">
                    <el-icon><ChatDotRound /></el-icon>
                  </el-button>
                  <el-button link size="small" @click="() => ElMessage.info('收藏功能待开发')">
                    <el-icon><Star /></el-icon>
                  </el-button>
                </div>
                <el-input
                  v-model="messageInput"
                  placeholder="说点什么~"
                  @keyup.enter="sendMessage"
                  :disabled="sendingMessage"
                />
              </div>
              <el-button type="primary" size="small" @click="sendMessage" :loading="sendingMessage">发送</el-button>
            </div>
          </el-aside>
        </el-col>
      </el-row>
    </el-main>

    <!-- [管理员] Tab 编辑弹窗 -->
    <el-dialog
      v-model="isTabEditorVisible"
      :title="editingTabId ? '编辑 Tab' : '新增 Tab'"
      width="700px"
      append-to-body
    >
      <el-form :model="currentTabForm" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="currentTabForm.title" placeholder="例如：专家介绍" />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="currentTabForm.content_type">
            <el-radio label="text">纯文本</el-radio>
            <el-radio label="image">纯图片</el-radio>
            <el-radio label="mixed">图文混合</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="排序值">
          <el-input-number v-model="currentTabForm.sort_order" :min="1" />
          <span style="margin-left:8px;color:#909399;font-size:12px;">越小越靠前</span>
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="currentTabForm.is_active" />
        </el-form-item>
        
        <!-- 根据类型显示内容输入 -->
        <el-form-item label="文本内容" v-if="['text', 'mixed'].includes(currentTabForm.content_type)">
          <div class="tab-editor-wrapper">
            <RichTextEditor v-model="currentTabForm.text_content" />
          </div>
        </el-form-item>
        <el-form-item label="图片链接" v-if="['image', 'mixed'].includes(currentTabForm.content_type)">
          <el-input v-model="currentTabForm.image_url" placeholder="输入图片 URL" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="isTabEditorVisible = false">取消</el-button>
          <el-button type="primary" @click="saveTab" :loading="isSavingTab">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onBeforeUnmount, reactive } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { storeToRefs } from 'pinia';
import { useSessionStore } from '../../../store/session';
import { useRoomStore } from '../../../store/room';
import topicApi from '../../../api/topic';
import { 
  getRoomDetail, getRoomMessages, sendRoomMessage, updateRoom,
  createRoomTab, updateRoomTab, deleteRoomTab, getRoomTabList,
  getSubVenues
} from '../../../api/room';
import type { RoomMessage } from '../../../api/room';
import type { RoomTab } from '../../../types/room';
// #ifdef H5
import VideoPlayer from '../../../components/VideoPlayer.vue';
import { useAuthStore } from '@/store/auth';
// #endif
// Element Plus Components
import { 
  ElContainer, ElMain, ElAside, ElCard, ElRow, ElCol, 
  ElText, ElTag, ElSpace, ElButton, ElTabs, 
  ElTabPane, ElImage, ElIcon, ElAvatar, ElInput, ElScrollbar, ElMessage, ElLoading, ElMessageBox,
  ElDialog, ElForm, ElFormItem, ElRadioGroup, ElRadio, ElInputNumber, ElSwitch
} from 'element-plus';
import { 
  Connection, Warning, Share, VideoPlay, ChatDotRound, 
  Iphone, User, ArrowLeft, ArrowRight, Star, Plus, Edit, Delete
} from '@element-plus/icons-vue';
import { BASE_API_URL } from '@/constants/api';
import { getSessionList } from '@/api/session';
import RichTextEditor from '../../../components/RichTextEditor.vue';
const sessionStore = useSessionStore();
const { currentSession, loading, error } = storeToRefs(sessionStore);
const roomStore = useRoomStore();
const { rooms } = storeToRefs(roomStore);
const authStore = useAuthStore();

// [模拟] 假装是管理员
const isAdmin = ref(true);

const isH5 = process.env.UNI_PLATFORM === 'h5' || (typeof window !== 'undefined' && window.location.protocol === 'http:');
const roomDetail = ref<any>(null);
const currentTopicId = ref<string | null>(null);

// --- Tab 功能 (新增) ---
const activeTabKey = ref<string>('builtin-intro');
const adminTabs = ref<RoomTab[]>([]); // 独立存储 Admin API 获取的 Tabs

const fetchTabs = async (roomId: string) => {
  try {
    const res = await getRoomTabList(roomId);
    // res => { code, message, data: { items: [...], total } }
    const raw = res as any;
    const list = raw?.data?.items || [];
    adminTabs.value = Array.isArray(list) ? list : [];
  } catch (e) {
    console.error('获取 Tab 列表失败', e);
  }
};

const roomTabs = computed(() => {
  // 优先使用 adminTabs (如果已获取)，否则使用 roomDetail.tabs
  const backendTabs = (roomDetail.value?.tabs || []) as RoomTab[];
  return adminTabs.value.length > 0 ? adminTabs.value : backendTabs;
});

// --- Tab 管理逻辑 ---
const isTabEditorVisible = ref(false);
const isSavingTab = ref(false);
const editingTabId = ref<string | null>(null); // null 表示新增
const currentTabForm = reactive<RoomTab>({
  id: '',
  room_id: '',
  tab_key: '',
  title: '',
  content_type: 'text',
  sort_order: 10,
  is_active: true,
  text_content: '',
  image_url: ''
});

const openTabEditor = (tab?: RoomTab) => {
  if (tab) {
    // 编辑模式
    editingTabId.value = tab.id; // 使用 ID
    Object.assign(currentTabForm, tab);
  } else {
    // 新增模式
    editingTabId.value = null;
    // 重置表单
    currentTabForm.id = '';
    currentTabForm.room_id = '';
    currentTabForm.tab_key = `custom-${Date.now()}`; // 自动生成 key，后端可能会覆盖或使用
    currentTabForm.title = '';
    currentTabForm.content_type = 'text';
    currentTabForm.sort_order = (roomDetail.value?.tabs?.length || 0) + 10;
    currentTabForm.is_active = true;
    currentTabForm.text_content = '';
    currentTabForm.image_url = '';
  }
  isTabEditorVisible.value = true;
};

const saveTab = async () => {
  if (!currentTabForm.title) {
    ElMessage.warning('请输入标题');
    return;
  }
  
  isSavingTab.value = true;
  try {
    const roomId = currentSession.value?.room_id;
    if (!roomId) {
      ElMessage.error('无法获取房间 ID');
      return;
    }

    if (editingTabId.value) {
      // 编辑：调用 updateRoomTab (PATCH /admin/tabs/{id})
      // 注意：只发送需要更新的字段
      const updatePayload: Partial<RoomTab> = {
        title: currentTabForm.title,
        content_type: currentTabForm.content_type,
        sort_order: currentTabForm.sort_order,
        is_active: currentTabForm.is_active,
        text_content: currentTabForm.text_content,
        image_url: currentTabForm.image_url,
        // tab_key 通常不修改，除非有特定需求
      };
      await updateRoomTab(editingTabId.value, updatePayload);
    } else {
      // 新增：调用 createRoomTab (POST /admin/rooms/{id}/tabs)
      const createPayload: Partial<RoomTab> = {
        tab_key: currentTabForm.tab_key,
        title: currentTabForm.title,
        content_type: currentTabForm.content_type,
        sort_order: currentTabForm.sort_order,
        is_active: currentTabForm.is_active,
        text_content: currentTabForm.text_content,
        image_url: currentTabForm.image_url
      };
      await createRoomTab(roomId, createPayload);
    }
    
    ElMessage.success('Tab 配置已保存');
    isTabEditorVisible.value = false;
    
    // 刷新数据
    const detailResp = await getRoomDetail(roomId);
    roomDetail.value = detailResp.data;
    // 刷新 Tab 列表
    await fetchTabs(roomId);

  } catch (e) {
    console.error('保存 Tab 失败:', e);
    ElMessage.error('保存失败');
  } finally {
    isSavingTab.value = false;
  }
};

const deleteTab = async (tab: RoomTab) => {
  if (!tab.id) {
     ElMessage.error('Tab ID 不存在，无法删除'); // 防止操作本地 Mock 数据
     return;
  }

  try {
    await ElMessageBox.confirm(`确定要删除“${tab.title}”吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    });
    
    const roomId = currentSession.value?.room_id;
    if (!roomId) {
      ElMessage.error('无法获取房间 ID');
      return;
    }

    await deleteRoomTab(tab.id);

    // 本地先移除（乐观更新）
    adminTabs.value = adminTabs.value.filter(t => t.id !== tab.id);

    // 如果当前选中的就是被删的 tab，则重置到第一个或 builtin-intro
    if (activeTabKey.value === tab.tab_key) {
      if (adminTabs.value.length > 0) {
        activeTabKey.value = adminTabs.value[0].tab_key;
      } else {
        activeTabKey.value = 'builtin-intro';
      }
    }

    ElMessage.success('删除成功');

    // 刷新数据
    const detailResp = await getRoomDetail(roomId);
    roomDetail.value = detailResp.data;
    // 刷新 Tab 列表
    await fetchTabs(roomId);
    
  } catch (e) {
    if (e !== 'cancel') {
      console.error('删除 Tab 失败', e);
      ElMessage.error('删除失败');
    }
  }
};
// ------------------

// 记录哪些 tab 的图片加载失败了
const imageErrorMap = reactive<Record<string, boolean>>({});

const onTabImageError = (tabKey: string) => {
  imageErrorMap[tabKey] = true;
};

// --- 图片处理逻辑 (使用 /api/image 代理) ---
function processImageUrl(url: string | undefined): string {
  if (!url) return '';
  let thumb = url.trim();

  // 关键逻辑：如果是 vzan 的图片，替换为代理路径
  if (thumb.includes('vzan.com') || thumb.includes('vzan.cc')) {
    // 正则提取域名后的路径
    const m = thumb.match(/https?:\/\/[^\/]+(.*)/);
    if (m && m[1]) {
      // 替换特殊字符
      const path = m[1].replace(/\|/g, '&');
      // 拼接成前端代理路径
      thumb = `/api/image${path}`;
    }
  } else {
    // 非 vzan 图片，仅处理竖线
    thumb = thumb.replace(/\|/g, '&');
  }
  return thumb;
}

// --- 分会场轮播（基于主会场及其子房间） ---
const subVenueCurrentIndex = ref(0);
const subVenueCardWidth = ref(200); // 每张卡片宽度
const visibleCards = ref(4); // 一屏显示的卡片数量

// 主会场及其所有分会场房间
const mainRoomId = ref<string | null>(null);
const mainRoomDetail = ref<any | null>(null); // 主会场房间详情（用于在分会场视角下展示主会场卡片）
const subRooms = ref<any[]>([]); // 分会场房间列表
const roomSessionsMap = ref<Record<string, any | null>>({}); // room_id -> 最新场次
const roomCoverMap = ref<Record<string, string>>({}); // room_id -> 封面 URL（参考 MultiVenueManage 的 tempCoverUrls）

// 统一的分会场卡片数据
const subVenueCards = computed(() => {
  const cards: any[] = [];

  // 如果当前在分会场，且已获取主会场详情，则先拼一张主会场卡片
  const curRoomId = currentSession.value?.room_id;
  const parentId = (roomDetail.value as any)?.parent_room_id as string | null | undefined;
  if (parentId && mainRoomDetail.value) {
    const mainLatestSession = roomSessionsMap.value[mainRoomDetail.value.id] || null;
    cards.push({
      id: mainRoomDetail.value.id,
      title: mainRoomDetail.value.title || '主会场',
      cover_url: roomCoverMap.value[mainRoomDetail.value.id] || mainRoomDetail.value.cover_url || null,
      _latestStatus: mainLatestSession?.status || 'scheduled',
      _latestStartTime:
        mainLatestSession?.start_time || mainLatestSession?.created_at || mainRoomDetail.value.start_time,
    });
  }

  // 再拼接所有分会场房间卡片（分会场视角下排除当前会场自身）
  (subRooms.value || []).forEach((room: any) => {
    if (parentId && room.id === curRoomId) {
      return; // 分会场进入时，不重复展示自己
    }
    const latestSession = roomSessionsMap.value[room.id] || null;
    cards.push({
      id: room.id,
      title: room.title || '分会场',
      cover_url: roomCoverMap.value[room.id] || room.cover_url || null,
      _latestStatus: latestSession?.status || 'scheduled',
      _latestStartTime: latestSession?.start_time || latestSession?.created_at || room.start_time,
    });
  });

  return cards;
});

const subVenueMaxIndex = computed(() => {
  return Math.max(0, subVenueCards.value.length - visibleCards.value);
});

const getCoverSrc = (url?: string | null) => {
  const u = (url || '').toString();
  if (!u) return '';
  if (/^https?:\/\//.test(u)) return u;
  const base = BASE_API_URL.replace(/\/+$/, '');
  const origin = base.replace(/\/api\/.*/, '');
  return origin + (u.startsWith('/') ? u : '/' + u);
};

const statusType = (status: string) => {
  const map: Record<string, string> = {
    live: 'success',
    scheduled: 'info',
    finished: 'warning',
    archived: 'info',
  };
  return map[status] || 'info';
};

const statusText = (status: string) => {
  const map: Record<string, string> = {
    live: '直播中',
    scheduled: '计划中',
    finished: '已结束',
    archived: '已归档',
  };
  return map[status] || '未知';
};

const subVenuePrevSlide = () => {
  if (subVenueCurrentIndex.value > 0) {
    subVenueCurrentIndex.value -= 1;
  }
};

const subVenueNextSlide = () => {
  if (subVenueCurrentIndex.value < subVenueMaxIndex.value) {
    subVenueCurrentIndex.value += 1;
  }
};

// 点击分会场卡片：使用 uni.navigateTo 跳转到对应房间的 LiveView 页面
// H5 地址等价于：/#/pages/live/new/LiveView?room_id=xxx
const goToSubVenue = (subRoomId: string) => {
  if (!subRoomId) {
    ElMessage.warning('分会场信息缺失');
    return;
  }
  const url = `/pages/live/new/LiveView?room_id=${encodeURIComponent(subRoomId)}`;
  console.log('使用 uni.navigateTo 跳转分会场:', url);
  uni.navigateTo({
    url,
    fail(err) {
      console.error('uni.navigateTo 跳转分会场失败:', err);
      ElMessage.error('跳转分会场失败');
    },
  });
};

// --- 播放逻辑 ---
// 将后端返回的 playback_url 规范化：
// - 对于 vzan/vzan.cc 的 m3u8 链接，统一包装为 /api/m3u8?url=encodeURIComponent(rawUrl)
//   由后端/本地代理代为向 vzan 发起请求，带上正确的 Header，避免前端直接 403。
// - 其它情况直接返回原始链接。
function normalizePlaybackUrl(raw: string): string | null {
  let url = (raw || '').trim();
  if (!url) return null;

  // 只对明显是 m3u8 且来自 vzan 域名的地址做代理包装
  const lower = url.toLowerCase();
  const isM3u8 = lower.includes('.m3u8');
  const isVzan = lower.includes('vzan.com') || lower.includes('vzan.cc');

  if (isM3u8 && isVzan) {
    return `/api/m3u8?url=${encodeURIComponent(url)}`;
  }

  // 其它来源的流，保持原样
  return url;
}

const playerSourceUrl = computed(() => {
  // 现在正式逻辑：优先使用后端 session.playback_url
  const playback = (currentSession.value as any)?.playback_url as string | null | undefined;
  console.log('currentSession.playback_url =', playback);
  if (playback) {
    return normalizePlaybackUrl(playback) as string | null;
  }
  // 如果未来还有直播中的直播放流地址，可以在这里补充 fallback 逻辑
  return null;
});

const emptySourceHint = computed(() => {
  return '回放未就绪，请稍候...';
});

// 回放轮询
let playbackPollTimer: number | null = null;
function startPlaybackPolling() {
  stopPlaybackPolling();
  const tryFetch = async () => {
    const s = currentSession.value as any;
    if (!s?.id) return;
    try {
      await sessionStore.fetchSessionById(s.id);
      const updated = sessionStore.currentSession as any;
      if (updated?.playback_url) {
        stopPlaybackPolling();
      }
    } catch {}
  };
  tryFetch();
  let interval = 2000;
  playbackPollTimer = window.setInterval(async () => {
    await tryFetch();
    interval = Math.min(interval * 2, 30000);
  }, interval) as unknown as number;
}

function stopPlaybackPolling() {
  if (playbackPollTimer) {
    clearInterval(playbackPollTimer as unknown as number);
    playbackPollTimer = null;
  }
}

watch(() => currentSession.value?.status, (next) => {
  if (!next) return;
  if (next === 'ended' || next === 'archived') {
    startPlaybackPolling();
  } else if (next === 'live') {
    stopPlaybackPolling();
  }
}, { immediate: true });

onBeforeUnmount(() => {
  stopPlaybackPolling();
});

const goToMainVenue = () => {
  const curRoomId = currentSession.value?.room_id;
  const detail = roomDetail.value as any | null;

  if (!curRoomId || !detail) {
    ElMessage.warning('房间信息未加载完成，无法判断主会场');
    return;
  }

  const parentId = detail.parent_room_id as string | null | undefined;

  // 1. 当前就是主会场：没有 parent_room_id
  if (!parentId) {
    ElMessage.info('当前页为主会场');
    return;
  }

  // 2. 有 parent_room_id，但为空字符串之类的异常情况
  if (typeof parentId !== 'string' || !parentId.trim()) {
    ElMessage.warning('该直播无关联的主会场');
    return;
  }

  const mainId = parentId.trim();

  // 3. 跳转到主会场的 LiveView 页面
  const url = `/pages/live/new/LiveView?room_id=${encodeURIComponent(mainId)}`;
  console.log('[LiveView] goToMainVenue, mainRoomId =', mainId, 'url =', url);

  uni.navigateTo({
    url,
    fail(err) {
      console.error('跳转主会场失败:', err);
      ElMessage.error('跳转主会场失败');
    },
  });
};

// 根据当前房间信息确定主会场，并加载其所有分会场及最新场次
const loadSubVenuesForCurrentRoom = async () => {
  const curRoomId = currentSession.value?.room_id;
  if (!curRoomId || !roomDetail.value) {
    subRooms.value = [];
    roomSessionsMap.value = {};
    mainRoomId.value = null;
    mainRoomDetail.value = null;
    return;
  }

  // 根据 parent_room_id 判断当前是主会场还是分会场
  const parentId = (roomDetail.value as any).parent_room_id as string | null | undefined;
  const mainId = parentId || (roomDetail.value as any).id || curRoomId;
  mainRoomId.value = mainId;

  try {
    // 1. 获取主会场详情（仅在当前为分会场时需要展示主会场卡片）
    if (parentId) {
      try {
        const mainDetailResp = await getRoomDetail(mainId);
        // 兼容 { code, data } 或直接 Room
        const mRaw: any = mainDetailResp;
        mainRoomDetail.value = (mRaw && (mRaw as any).title) ? mRaw : mRaw.data || null;
      } catch (e) {
        console.error('获取主会场详情失败:', e);
        mainRoomDetail.value = null;
      }
    } else {
      // 当前就是主会场
      mainRoomDetail.value = roomDetail.value;
    }

    // 2. 获取主会场下所有分会场房间列表
    const res = await getSubVenues(mainId, { page: 1, size: 50 });
    const raw = res as any;
    const list = raw?.items || raw?.data?.items || raw?.data?.rooms || [];
    subRooms.value = Array.isArray(list) ? list : [];

    // 2.1 使用房间详情 API 补全封面地址（参考 MultiVenueManage.vue 的 fetchCoverUrlsForRooms）
    const coverTasks = subRooms.value.map((room: any) =>
      getRoomDetail(room.id)
        .then((res: any) => ({ id: room.id, res }))
        .catch(() => ({ id: room.id, res: null }))
    );
    const coverResults = await Promise.all(coverTasks);
    const coverMap: Record<string, string> = {};
    coverResults.forEach(({ id, res }) => {
      if (res && (res as any).cover_url) {
        coverMap[id] = (res as any).cover_url;
      } else if (res && (res as any).data?.cover_url) {
        coverMap[id] = (res as any).data.cover_url;
      }
    });
    roomCoverMap.value = coverMap;

    // 3. 为主会场和每个分会场房间获取其最新一条场次
    const sessionsMap: Record<string, any | null> = {};

    // 主会场场次
    try {
      const mainSessionsRes = await getSessionList(mainId, { page: 1, size: 1 });
      const msRaw = mainSessionsRes as any;
      const msItems = msRaw?.data?.items || msRaw?.data?.list || msRaw?.items || [];
      sessionsMap[mainId] = Array.isArray(msItems) && msItems.length > 0 ? msItems[0] : null;
    } catch (e) {
      console.error('获取主会场场次失败:', e);
      sessionsMap[mainId] = null;
    }

    // 分会场场次
    for (const room of subRooms.value) {
      try {
        const sRes = await getSessionList(room.id, { page: 1, size: 1 });
        const sRaw = sRes as any;
        const sItems = sRaw?.data?.items || sRaw?.data?.list || sRaw?.items || [];
        sessionsMap[room.id] = Array.isArray(sItems) && sItems.length > 0 ? sItems[0] : null;
      } catch (e) {
        console.error('获取分会场场次失败:', e);
        sessionsMap[room.id] = null;
      }
    }

    roomSessionsMap.value = sessionsMap;
  } catch (e) {
    console.error('加载分会场房间失败:', e);
    subRooms.value = [];
    roomSessionsMap.value = {};
    roomCoverMap.value = {};
    mainRoomDetail.value = null;
  }
};

// 当房间详情或当前场次变化时，刷新分会场数据
watch(
  () => [currentSession.value?.room_id, roomDetail.value?.id, (roomDetail.value as any)?.parent_room_id],
  () => {
    loadSubVenuesForCurrentRoom();
  },
  { immediate: true }
);


// 监听 Tabs 变化，自动设置默认选中项
watch(roomTabs, (tabs) => {
  if (tabs && tabs.length > 0) {
    // 如果已经有选中的且不是默认的，就不变（避免用户切换后被重置）
    if (activeTabKey.value && activeTabKey.value !== 'builtin-intro') {
       // 检查当前选中的还在不在列表里，如果不在了，才需要重置
       if (!tabs.find(t => t.tab_key === activeTabKey.value)) {
          activeTabKey.value = tabs[0].tab_key;
       }
       return;
    }

    // 优先选中 'room'，否则选第一个
    const roomTab = tabs.find(t => t.tab_key === 'room');
    if (roomTab) {
      activeTabKey.value = roomTab.tab_key;
    } else {
      activeTabKey.value = tabs[0].tab_key;
    }
  } else {
    // 没有自定义 Tab，默认选中直播介绍
    activeTabKey.value = 'builtin-intro';
  }
}, { immediate: true });

const handleRoomTabClick = (tab: any) => {
  // console.log('Tab clicked:', tab.props.name);
};

// --- 留言功能 (新增) ---
const messages = ref<RoomMessage[]>([]);
const messageLoading = ref(false);
const messageInput = ref('');
const messagePage = ref(1);
const messagePageSize = ref(20);
const hasMoreMessages = ref(true);
const sendingMessage = ref(false);

// 辅助函数：判定是否显示管理员标签
const isAdminRole = (role: string) => ['MODERATOR', 'ADMIN', 'SUPERADMIN'].includes(role);

// 辅助函数：生成头像文字
const computeMessageAvatarText = (msg: RoomMessage) => {
  // 暂时取 ID 前两位或根据 user_id 查询用户信息（如果 store 里有缓存）
  if (!msg.user_id) return '匿';
  return msg.user_id.substring(0, 1).toUpperCase();
};

// 辅助函数：生成用户名
const computeMessageUserName = (msg: RoomMessage) => {
  // 这里可以对接用户服务查询昵称，暂时用 ID 脱敏显示
  if (!msg.user_id) return '匿名用户';
  return `用户 ${msg.user_id.substring(0, 4)}`;
};
console.log('authStore.user =', authStore.user);
// 辅助函数：是否为当前登录用户的消息
const isSelfMessage = (msg: RoomMessage) => {
  const currentUserId = (authStore.user as any)?.user_id;
  console.log('check isSelfMessage: currentUserId =', currentUserId, 'msg.user_id =', msg.user_id);
  if (!currentUserId) return false;
  return msg.user_id === currentUserId;
};

// 辅助函数：生成随机颜色
const stringToColor = (str?: string) => {
  if (!str) return '#909399'; // 默认灰色
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

const fetchRoomMessages = async (initial = false) => {
  const roomId = currentSession.value?.room_id;
  if (!roomId) return;

  if (initial) {
    messagePage.value = 1;
    messages.value = [];
    hasMoreMessages.value = true;
  }

  if (!hasMoreMessages.value && !initial) return;

  messageLoading.value = true;
  try {
    const res = await getRoomMessages(roomId, {
      page: messagePage.value,
      size: messagePageSize.value
    });
    
    // 兼容处理：有些接口返回直接是 PaginatedResponse，有些包裹在 data 中
    const rawData = res as any;
    const data = rawData.data || rawData;
    if (data && Array.isArray(data.items)) {
      // 后端返回的是按时间倒序（最新的在前），为了符合聊天习惯（上旧下新），我们需要翻转数组
      // 注意：data.items 是只读的，需要复制一份
      const newMsgs = [...data.items].reverse();
      
      if (initial) {
        messages.value = newMsgs;
      } else {
        // 加载更多（历史记录）时，新获取的旧消息应该拼接到数组头部
        messages.value = [...newMsgs, ...messages.value];
      }

      if (newMsgs.length < messagePageSize.value) {
        hasMoreMessages.value = false;
      } else {
        messagePage.value++;
      }
    }
  } catch (e) {
    console.error('获取留言失败:', e);
    // ElMessage.error('获取留言失败'); // 静默失败以免刷屏
  } finally {
    messageLoading.value = false;
  }
};

const sendMessage = async () => {
  const content = messageInput.value.trim();
  if (!content) return;
  
  const roomId = currentSession.value?.room_id;
  if (!roomId) return;

  sendingMessage.value = true;
  try {
    await sendRoomMessage(roomId, { content });
    ElMessage.success('发送成功');
    messageInput.value = '';
    // 重新刷新列表
    await fetchRoomMessages(true);
  } catch (e: any) {
    console.error('发送留言失败:', e);
    // 4004 错误处理
    if (e.code === 4004 || (e.response && e.response.data && e.response.data.code === 4004)) {
       const msg = e.message || e.response?.data?.message || '普通用户不允许发送包含 URL 的留言';
       ElMessage.error(msg);
    } else {
       ElMessage.error('留言发送失败，请稍后重试');
    }
  } finally {
    sendingMessage.value = false;
  }
};

// --- 通用逻辑 ---
const goBack = () => {
  uni.navigateBack();
};

// UUID 校验
function isValidUuid(v?: string) {
  const s = (v || '').toString().trim();
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(s);
}

// 获取直播间关联的专题信息
const fetchRoomTopics = async (roomId: string) => {
  try {
    console.log('正在获取直播间关联的专题信息，room_id:', roomId);
    const resp = await topicApi.getRoomTopics(roomId);
    const list = resp?.data || [];
    console.log('房间关联专题列表:', list);
    const published = list.find((t: any) => (t.topic_status || t.status) === 'published' || t.is_published);
    const tid = published?.topic_id || published?.id;
    if (tid && isValidUuid(tid)) {
      currentTopicId.value = tid;
      console.log('找到已发布专题，topic_id:', tid);
    } else {
      currentTopicId.value = null;
    }
  } catch (error) {
    console.error('获取专题信息失败:', error);
    currentTopicId.value = null;
  }
};

const goToTopicDisplay = () => {
  const roomId = currentSession.value?.room_id;
  console.log('[LiveView] goToTopicDisplay clicked, roomId =', roomId);

  if (!roomId) {
    ElMessage.warning('当前直播间未关联房间ID，无法跳转专题');
    return;
  }

  uni.navigateTo({
    url: `/pages/topic/TopicDisplay?room_id=${roomId}`,
    fail(err) {
      console.error('跳转营销专题失败:', err);
      ElMessage.error('跳转营销专题失败');
    },
  });
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'live': '直播中',
    'scheduled': '计划中',
    'finished': '已结束',
    'processing': '转码中',
    'ready': '回放',
    'error': '异常',
    'archived': '已归档'
  };
  return statusMap[status] || '未知';
};

const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  let s = String(timeStr).trim().replace(/\s+/g, 'T').replace(/\.(\d{1,6})/, '').replace(/Z$/i, '');
  if (s.includes('+')) s = s.split('+')[0];
  if (s.includes('-')) s = s.replace('T', ' ');
  
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
  }
  return s.split('T')[0] || s;
};

// --- Lifecycle ---
onLoad(async (options) => {
  if (!authStore.isAuthenticated) {
    const currentPath = getCurrentPages()[getCurrentPages().length - 1].route;
    authStore.forceReauth(`/pages/${currentPath}`);
    return;
  }
  
  // 参数解析逻辑
  if ((!options || (!options.id && !(options as any).room_id)) && typeof window !== 'undefined') {
    try {
      const hash = window.location.hash || '';
      const queryStr = hash.includes('?') ? hash.split('?')[1] : '';
      const searchParams = new URLSearchParams(queryStr);
      const idFromUrl = searchParams.get('id') || '';
      const roomIdFromUrl = searchParams.get('room_id') || searchParams.get('roomId') || '';
      (options as any) = { ...(options || {}), id: idFromUrl || (options as any)?.id, room_id: roomIdFromUrl || (options as any)?.room_id } as any;
    } catch (e) {}
  }

  if (options && typeof options.id === 'string' && options.id) {
    await sessionStore.fetchSessionById(options.id);
  } else if (options && typeof (options as any).room_id === 'string' && (options as any).room_id) {
    const roomId = (options as any).room_id as string;
    await sessionStore.fetchSessionsByRoomId(roomId, { refresh: true });
    const sessions = sessionStore.sessions || [];
    if (sessions.length > 0) {
        const liveSession = sessions.find((s: any) => s.status === 'live');
        const picked = liveSession || sessions[0];
        // 使用详情接口刷新 currentSession，获取包含 playback_url 的完整数据
        await sessionStore.fetchSessionById(picked.id);
    }
  }

  // 获取详情并初始化
  const { currentSession } = storeToRefs(sessionStore);
  const session = currentSession.value;
  if (session && session.room_id) {
    try {
      const detailResp = await getRoomDetail(session.room_id);
      roomDetail.value = detailResp.data;
      
      // 初始化留言
      await fetchRoomMessages(true);
      // 获取专题
      await fetchRoomTopics(session.room_id);
      // 获取 Tab 列表
      await fetchTabs(session.room_id);
    } catch (e) {
      console.error('获取详情失败', e);
    }
  }
});

</script>

<style scoped lang="scss">
.live-view-container {
  height: 100vh;
  background-color: #f5f5f5;
  overflow-x: hidden; /* 防止横向滚动条 */
}

.main-content {
  padding-left: 20px;
  background-color: #ffffff;
  overflow-x: hidden; /* 双重保险 */
}

.top-info-bar {
  border-bottom: 1px solid #e4e7ed;
  
  .top-info {
    display: flex;
    flex-direction: column;
    
    .top-info-title {
      margin-bottom: 8px;
      .live-title {
        font-size: 18px;
        font-weight: 600;
        color: #303133;
      }
    }
    
    .top-info-meta {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      
      .view-count {
        display: flex;
        align-items: center;
        color: #606266;
        font-size: 14px;
      }
      
      .live-time {
        color: #909399;
        font-size: 14px;
      }
    }
  }
  
  .top-actions {
    display: flex;
    justify-content: flex-end;
  }
}

.video-player-area {
  position: relative;
  min-height: 400px;
  color: white;
  
  .video-area-wrap {
    width: 100%;
    height: 100%;
    min-height: 360px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .status-container {
    text-align: center;
    padding: 20px;
    
    .event-title {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 16px;
    }
    
    .event-subtitle {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 12px;
    }
    
    .event-date {
      font-size: 16px;
      margin-bottom: 16px;
    }
  }
}

/* Tabs Styles */
.tab-content-wrapper {
  padding: 16px;
  
  .tab-text-content {
    font-size: 14px;
    color: #606266;
    line-height: 1.6;
    white-space: pre-wrap; /* 保留换行 */
  }
  
  .tab-image-wrapper {
    width: 100%;
    text-align: center;
    
    .el-image {
      max-width: 100%;
      border-radius: 4px;
    }
  }
}

.room-description-card {
  padding: 16px;
  .description-content {
    font-size: 14px;
    color: #606266;
    line-height: 1.6;
    white-space: pre-wrap;
  }
}

/* Chat Sidebar Styles */
.chat-sidebar {
  background-color: #ffffff;
  border: 1px solid #e4e7ed; /* 改为全边框 */
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 700px; /* PC端固定高度 */

  .chat-header {
    padding: 16px;
    border-bottom: 1px solid #e4e7ed;
    text-align: center;
    font-weight: 600;
    flex-shrink: 0;
  }
  
  .qr-code-section {
    padding: 16px;
    text-align: center;
    border-bottom: 1px solid #f0f2f5;
    flex-shrink: 0;
  }
  
  .admin-messages {
    padding: 16px;
    border-bottom: 1px solid #e4e7ed;
    background-color: #fafafa;
    flex-shrink: 0;
    
    .admin-avatar {
      margin-right: 8px;
    }
    
    .admin-name {
      font-weight: 600;
      color: #303133;
      font-size: 14px;
    }
    
    .message-content {
      margin: 8px 0;
      line-height: 1.5;
      font-size: 13px;
      color: #606266;
    }
    
    .message-time {
      color: #909399;
      font-size: 12px;
    }
  }
  
  .user-messages {
    flex: 1;
    padding: 20px;
    overflow: hidden;
    
    .message-item {
      display: flex;
      margin-bottom: 16px;
      
      .user-avatar {
        margin-right: 12px;
        flex-shrink: 0;
      }
      
      .message-main {
        flex: 1;
        
        .message-header {
          display: flex;
          align-items: center;
          margin-bottom: 4px;
          
          .user-name {
            font-weight: 500;
            color: #303133;
            font-size: 13px;
            margin-right: 8px;
          }
          
          .message-time {
            margin-left: auto;
            font-size: 12px;
            color: #909399;
          }
        }
        
        .message-text {
          color: #606266;
          font-size: 14px;
          line-height: 1.5;
          background: #f4f4f5;
          padding: 8px 12px;
          border-radius: 4px;
          display: inline-block;
        }
      }
    }
    
    .load-more {
      text-align: center;
      margin-top: 12px;
    }
  }

  /* 聊天气泡左右布局：其他人在左，自己在右 */
  .message-item {
    display: flex;
  }

  .message-item.message-self {
    flex-direction: row-reverse;
  }

  .message-item.message-self .user-avatar {
    margin-left: 12px;
    margin-right: 0;
  }

  .message-item.message-self .message-main {
    text-align: right;
  }

  .message-item.message-self .message-header .message-time {
    margin-left: 0;
    margin-right: auto;
  }

  .message-item.message-self .message-text {
    background: #409eff;
    color: #fff;
  }
  
  .chat-input-area {
    padding: 16px;
    border-top: 1px solid #e4e7ed;
    background-color: #fff;
    flex-shrink: 0;
    
    .input-with-icons {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      
      .input-icons {
        margin-right: 8px;
        display: flex;
      }
    }
  }
  
  .floating-actions {
    position: absolute;
    right: 16px;
    bottom: 100px; /* 调整位置以免遮挡 */
    display: flex;
    flex-direction: column;
    gap: 12px;
    
    .action-button {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      margin-left: 0;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
      
      &.like-button {
        background-color: #ff4757;
        color: white;
        border-color: #ff4757;
      }
      
      &.mobile-button, &.profile-button {
        background-color: #ffffff;
        color: #606266;
      }
      
      span {
        font-size: 10px;
        margin-top: 2px;
      }
    }
  }
}

.tab-editor-wrapper {
  width: 100%;          
  min-height: 300px;   
  max-height: 500px;    
  overflow: visible;
  z-index: 20;
  
}

.tab-editor-wrapper :deep(.your-editor-root-class) {
  /* 如果 RichTextEditor 里面有明确根节点 class，可以在这里把高度也设成 100% */
  height: 100%;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .live-view-container {
    /* H5/移动端布局调整 */
    :deep(.el-container) {
      flex-direction: column;
    }
  }

  .top-info-bar {
    .top-actions {
      justify-content: flex-start;
      margin-top: 8px;
    }
  }
  
  .chat-sidebar {
    width: 100% !important;
    height: 60vh; /* 移动端自适应高度，或者可以使用固定高度如 500px */
    min-height: 400px;
    border-left: none;
    border-top: 1px solid #e4e7ed;
    
    .floating-actions {
      position: fixed;
      bottom: 20px;
      right: 20px;
      flex-direction: row;
    }
  }
  
  .video-player-area {
    min-height: 250px;
    .video-area-wrap {
      min-height: 250px;
    }
    .event-title {
      font-size: 20px !important;
    }
    .event-subtitle {
      font-size: 16px !important;
    }
  }
}

/* 分会场轮播样式（从 LiveView_old 复制） */
.sub-venue-carousel {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.carousel-container {
  flex: 1;
  overflow: hidden;
  border-radius: 8px;
}

.carousel-track {
  display: flex;
  transition: transform 0.3s ease;
  gap: 8px;
}

.venue-card {
  flex-shrink: 0;
  width: 200px;
  background: #ffffff;
  border-radius: 6px;
  padding: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  border: 1px solid #e0e0e0;
  cursor: pointer;
  transition: all 0.3s ease;
}

.venue-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
}

.venue-card-inner {
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
}

.venue-cover {
  width: 100%;
  height: 80px;
  border-radius: 4px;
  overflow: hidden;
  background: #fafafa;
}

.img-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #bbb;
  font-size: 10px;
}

.venue-info {
  flex: 1;
}

.venue-title {
  font-size: 12px;
  font-weight: 600;
  color: #303133;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 3px;
}

.venue-meta {
  color: #909399;
  font-size: 10px;
}

.status-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 10px;
  padding: 2px 4px;
}

.control-btn {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  background: #ffffff;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.control-btn:hover:not(:disabled) {
  background: #f5f7fa;
  border-color: #409eff;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 分会场轮播响应式 */
@media (max-width: 768px) {
  .sub-venue-carousel {
    gap: 4px;
  }
  .venue-card {
    width: 160px;
    padding: 6px;
  }
  .venue-cover {
    height: 60px;
  }
  .venue-title {
    font-size: 11px;
  }
  .venue-meta {
    font-size: 9px;
  }
  .control-btn {
    width: 24px;
    height: 24px;
  }
  .status-badge {
    font-size: 9px;
    padding: 1px 3px;
  }
}

.placeholder-video {
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: inherit;  /* 继承外层高度 */
  border-radius: 8px;
  background: linear-gradient(135deg, #4289d0ff 0%, #93a9d8ff 40%, #2563eb 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 32px 16px;
  position: relative;
  overflow: hidden;
}

/* 半透明光斑做一点氛围 */
.placeholder-video::before {
  content: '';
  position: absolute;
  width: 260px;
  height: 260px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%);
  top: -80px;
  right: -40px;
  pointer-events: none;
}

.placeholder-video::after {
  content: '';
  position: absolute;
  width: 220px;
  height: 220px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(59,130,246,0.35), transparent 70%);
  bottom: -100px;
  left: -60px;
  pointer-events: none;
}

.placeholder-video .event-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 8px;
  z-index: 1;
}

.placeholder-video .event-subtitle {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 12px;
  z-index: 1;
}

.placeholder-video .event-date {
  font-size: 13px;
  opacity: 0.8;
  margin-bottom: 18px;
  z-index: 1;
}

.placeholder-video .playback-status {
  z-index: 1;
}

/* 让 tag 看起来更像按钮 */
.placeholder-video .el-tag {
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(15,23,42,0.7);
  border-color: rgba(148, 163, 184, 0.7);
}
</style>
