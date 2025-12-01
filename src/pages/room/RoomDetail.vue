<template>
  <view class="room-detail-page">
    <!-- 添加顶部用户信息区域 -->
    <UserInfoHeader />
    
    <!-- 固定页面标题 -->
    <view class="fixed-header">
      <view class="header-left">
        <AppButton type="primary" size="small" @click="goBackToList">返回直播列表页</AppButton>
      </view>
      <text class="page-title">房间详情</text>
      <view class="header-right">
        <!-- 预留右侧按钮位置 -->
      </view>
    </view>
    
    <!-- 1. 加载状态 -->
    <view v-if="loading" class="loading-container">
      <view class="spinner"></view>
      <text>加载中...</text>
    </view>

    <!-- 2. 错误状态 -->
    <view v-else-if="error" class="status-container">
      <text class="status-text">加载失败：{{ error.message }}</text>
      <AppButton type="primary" size="small" @click="goBack">返回</AppButton>
    </view>

    <!-- 3. 内容渲染 -->
    <view v-else-if="currentRoom" class="content-wrapper responsive-container">
      <view class="info-card responsive-card">
        <view class="room-info-grid responsive-grid">
          <view class="info-item">
            <text class="info-label responsive-text">房间名称</text>
            <text class="info-value responsive-text">{{ safeRoomTitle }}</text>
          </view>
          <view class="info-item">
            <text class="info-label responsive-text">简介</text>
            <text class="info-value responsive-text">{{ safeRoomDescription }}</text>
          </view>
          <view class="info-item">
            <text class="info-label responsive-text">状态</text>
            <text class="info-value responsive-text">
              <text class="status-icon">{{ currentRoom.is_private ? '🔒' : '🌍' }}</text>
              {{ currentRoom.is_private ? '私密房间' : '公开房间' }}
            </text>
          </view>
          <view class="info-item">
            <text class="info-label responsive-text">房间ID</text>
            <text class="info-value id-text responsive-text">{{ currentRoom.id }}</text>
          </view>
        </view>
      </view>

      <!-- 场次列表卡片 -->
      <view class="sessions-card responsive-card">
        <view class="sessions-header">
          <text class="sessions-title responsive-text">直播场次</text>
          <AppButton type="primary" size="small" @click="openCreateSessionModal">创建新场次</AppButton>
        </view>
        
        <!-- 场次列表 -->
        <view v-if="sessionsLoading && sessions.length === 0" class="loading-container">
          <view class="spinner"></view>
          <text class="responsive-text">正在加载场次...</text>
        </view>
        <view v-else-if="sessionsError" class="status-container">
          <text class="status-text responsive-text">加载失败：{{ sessionsError.message }}</text>
          <AppButton type="primary" size="small" @click="retryFetchSessions">点击重试</AppButton>
        </view>
        <view v-else-if="sessions.length === 0" class="status-container empty-state">
          <text class="status-text responsive-text">暂无场次信息</text>
        </view>
        <view v-else class="sessions-table responsive-table">
          <!-- 表格头部 -->
          <view class="table-header">
            <view class="table-cell header-cell responsive-text">场次ID</view>
            <view class="table-cell header-cell responsive-text">状态</view>
            <view class="table-cell header-cell responsive-text">开始时间</view>
            <view class="table-cell header-cell responsive-text">结束时间</view>
            <view class="table-cell header-cell responsive-text">视频ID</view>
            <view class="table-cell header-cell responsive-text">创建时间</view>
            <view class="table-cell header-cell responsive-text">更新时间</view>
            <view class="table-cell header-cell responsive-text">操作</view>
          </view>
          
          <!-- 表格内容 -->
          <view 
            v-for="session in sessions" 
            :key="session.id" 
            class="table-row"
            @click="goToSessionDetail(session.id)"
          >
            <view class="table-cell responsive-text" data-label="场次ID" style="display: flex; flex-direction: row; justify-content: flex-start; align-items: center; gap: 4px;">
              <view class="table-cell-content" style="flex: 0 1 auto; text-align: left;">{{ session.id }}</view>
            </view>
            <view class="table-cell" data-label="状态" style="display: flex; flex-direction: row; justify-content: flex-start; align-items: center; gap: 4px;">
              <view class="table-cell-content" style="flex: 0 1 auto; text-align: left;">
                <view class="status-badge" :class="getStatusClass(session.status)">
                  {{ getStatusText(session.status) }}
                </view>
              </view>
            </view>
            <view class="table-cell responsive-text" data-label="开始时间" style="display: flex; flex-direction: row; justify-content: flex-start; align-items: center; gap: 4px;">
              <view class="table-cell-content" style="flex: 0 1 auto; text-align: left;">{{ formatTime(session.start_time) }}</view>
            </view>
            <view class="table-cell responsive-text" data-label="结束时间" style="display: flex; flex-direction: row; justify-content: flex-start; align-items: center; gap: 4px;">
              <view class="table-cell-content" style="flex: 0 1 auto; text-align: left;">{{ formatTime(session.end_time) }}</view>
            </view>
            <view class="table-cell responsive-text" data-label="视频ID" style="display: flex; flex-direction: row; justify-content: flex-start; align-items: center; gap: 4px;">
              <view class="table-cell-content" style="flex: 0 1 auto; text-align: left;">{{ session.video_id || '无' }}</view>
            </view>
            <view class="table-cell responsive-text" data-label="创建时间" style="display: flex; flex-direction: row; justify-content: flex-start; align-items: center; gap: 4px;">
              <view class="table-cell-content" style="flex: 0 1 auto; text-align: left;">{{ formatTime(session.created_at) }}</view>
            </view>
            <view class="table-cell responsive-text" data-label="更新时间" style="display: flex; flex-direction: row; justify-content: flex-start; align-items: center; gap: 4px;">
              <view class="table-cell-content" style="flex: 0 1 auto; text-align: left;">{{ formatTime(session.updated_at) }}</view>
            </view>
            <view class="table-cell actions-cell" data-label="操作" @click.stop style="display: flex; flex-direction: row; justify-content: flex-start; align-items: center; gap: 4px;">
              <view class="table-cell-content" style="flex: 0 1 auto; text-align: left;">
                <view class="responsive-button-group" style="justify-content: flex-start; width: auto; gap: 8px;">
                  <AppButton type="default" size="small" @click="openEditModal(session)" class="action-btn">编辑</AppButton>
                  <AppButton type="danger" size="small" @click="handleDeleteSession(session)" class="action-btn">删除</AppButton>
                  <AppButton type="primary" size="small" @click="goToLiveView(session.id)" class="action-btn">播放</AppButton>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 分会场列表卡片 - 只在主会场显示 -->
      <view v-if="!currentRoom.parent_room_id" class="sub-venues-card responsive-card">
        <view class="sub-venues-header">
          <text class="sub-venues-title responsive-text">分会场</text>
          <AppButton type="primary" size="small" @click="openCreateSubVenueModal">创建分会场</AppButton>
        </view>
        
        <!-- 分会场列表 -->
        <view v-if="subVenuesLoading && subVenues.length === 0" class="loading-container">
          <view class="spinner"></view>
          <text class="responsive-text">正在加载分会场...</text>
        </view>
        <view v-else-if="subVenuesError" class="status-container">
          <text class="status-text responsive-text">加载失败：{{ subVenuesError.message }}</text>
          <AppButton type="primary" size="small" @click="retryFetchSubVenues">点击重试</AppButton>
        </view>
        <view v-else-if="subVenues.length === 0" class="status-container empty-state">
          <text class="status-text responsive-text">暂无分会场信息</text>
        </view>
        <!-- 修改开始：分会场在移动端复用场次的表格样式 -->
        <view v-else class="sub-venues-table responsive-table">
          <!-- 表格头部 (移动端隐藏，PC端显示) -->
          <view class="table-header">
            <view class="table-cell header-cell responsive-text">分会场ID</view>
            <view class="table-cell header-cell responsive-text">名称</view>
            <view class="table-cell header-cell responsive-text">简介</view>
            <view class="table-cell header-cell responsive-text">操作</view>
          </view>
          
          <!-- 表格内容 (复用场次的 .table-row 和 .table-cell 样式) -->
          <view 
            v-for="subVenue in subVenues" 
            :key="subVenue.id" 
            class="table-row"
            @click="goToSubVenueDetail(subVenue.id)"
          >
            <view class="table-cell responsive-text" data-label="分会场ID">
              <view class="table-cell-content">{{ subVenue.id }}</view>
            </view>
            <view class="table-cell responsive-text" data-label="名称">
              <view class="table-cell-content" v-html="safeSubVenueTitle(subVenue)"></view>
            </view>
            <view class="table-cell responsive-text" data-label="简介">
              <view class="table-cell-content" v-html="safeSubVenueDescription(subVenue)"></view>
            </view>
            <view class="table-cell actions-cell" data-label="操作" @click.stop>
              <view class="table-cell-content">
                <view class="responsive-button-group">
                  <AppButton type="default" size="small" @click="openEditSubVenueModal(subVenue)" class="action-btn">编辑</AppButton>
                  <AppButton type="danger" size="small" @click="handleDeleteSubVenue(subVenue)" class="action-btn">删除</AppButton>
                  <AppButton type="primary" size="small" @click="goToSubVenueDetail(subVenue.id)" class="action-btn">查看详情</AppButton>
                </view>
              </view>
            </view>
          </view>
        </view>
        <!-- 修改结束 -->
      </view>
    </view>
    
    <!-- 创建新场次的模态框 -->
    <ModalDialog
      :visible="isSessionModalVisible"
      title="创建新场次"
      confirmText="立即创建"
      :confirmLoading="isCreatingSession"
      @update:visible="isSessionModalVisible = $event"
      @confirm="handleCreateSession"
      @cancel="closeCreateSessionModal"
    >
      <view class="form">
        <view class="form-group">
          <text class="form-label">场次标题</text>
          <input class="form-input" v-model="newSession.title" placeholder="请输入场次标题" placeholder-class="placeholder" />
        </view>
        <view class="form-group">
          <text class="form-label">计划开始时间</text>
          <input 
            class="form-input" 
            v-model="newSession.start_time" 
            placeholder="请输入开始时间，如 2025-07-23 10:00"
          />
        </view>
      </view>
    </ModalDialog>

    <!-- 编辑场次的模态框 -->
    <ModalDialog
      :visible="isEditModalVisible"
      title="编辑场次"
      confirmText="保存更改"
      :confirmLoading="isUpdatingSession"
      @update:visible="isEditModalVisible = $event"
      @confirm="handleUpdateSession"
      @cancel="closeEditModal"
    >
      <view class="form">
        <view class="form-group">
          <text class="form-label">开始时间</text>
          <input 
            class="form-input" 
            v-model="editSession.start_time" 
            placeholder="请输入开始时间，如 2025-07-23 10:00"
          />
        </view>
      </view>
    </ModalDialog>

    <!-- 创建分会场的模态框 -->
    <ModalDialog
      :visible="isSubVenueModalVisible"
      title="创建分会场"
      confirmText="立即创建"
      :confirmLoading="isCreatingSubVenue"
      @update:visible="isSubVenueModalVisible = $event"
      @confirm="handleCreateSubVenue"
      @cancel="closeCreateSubVenueModal"
    >
      <view class="form">
        <view class="form-group">
          <text class="form-label">分会场标题</text>
          <input class="form-input" v-model="newSubVenue.title" placeholder="请输入分会场标题" placeholder-class="placeholder" />
        </view>
        <view class="form-group">
          <text class="form-label">分会场简介</text>
          <textarea class="form-textarea" v-model="newSubVenue.description" placeholder="请输入分会场简介（选填）" placeholder-class="placeholder" />
        </view>
      </view>
    </ModalDialog>

    <!-- 编辑分dalVisible"
      title="编辑分会场"
      confirmText="保存更改"
      :confirmLoading="isUpdatingSubVenue"
      @update:visible="isEditSubVenueModalVisible = $event"
      @confirm="handleUpdateSubVenue"
      @cancel="closeEditSubVenueModal"
    >
      <view class="form">
        <view class="form-group">
          <text class="form-label">分会场标题</text>
          <input class="form-input" v-model="editSubVenueModel.title" placeholder="请输入分会场标题" placeholder-class="placeholder" />
        </view>
        <view class="form-group">
          <text class="form-label">分会场简介</text>
          <textarea class="form-textarea" v-model="editSubVenueModel.description" placeholder="请输入分会场简介（选填）" placeholder-class="placeholder" />
        </view>
      </view>
    </ModalDialog>

    <!-- 编辑分会场的模态框 -->
    <ModalDialog
      :visible="isEditSubVenueModalVisible"
      title="编辑分会场"
      confirmText="保存更改"
      :confirmLoading="isUpdatingSubVenue"
      @update:visible="isEditSubVenueModalVisible = $event"
      @confirm="handleUpdateSubVenue"
      @cancel="closeEditSubVenueModal"
    >
      <view class="form">
        <view class="form-group">
          <text class="form-label">分会场标题</text>
          <input class="form-input" v-model="editSubVenueModel.title" placeholder="请输入分会场标题" placeholder-class="placeholder" />
        </view>
        <view class="form-group">
          <text class="form-label">分会场简介</text>
          <textarea class="form-textarea" v-model="editSubVenueModel.description" placeholder="请输入分会场简介（选填）" placeholder-class="placeholder" />
        </view>
      </view>
    </ModalDialog>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { storeToRefs } from 'pinia';
import { useRoomStore } from '../../store/room';
import UserInfoHeader from '@/components/UserInfoHeader.vue';
import { useSessionStore } from '../../store/session';
import AppButton from '../../components/AppButton.vue';
import ModalDialog from '../../components/ModalDialog.vue';

import { escapeHtml } from '@/utils/xss';
import { useAuthStore } from '@/store/auth';

const roomStore = useRoomStore();
const sessionStore = useSessionStore();
const { currentRoom, loading, error } = storeToRefs(roomStore);
const { sessions, loading: sessionsLoading, error: sessionsError } = storeToRefs(sessionStore);
const { subVenues, subVenuesLoading, subVenuesError } = storeToRefs(roomStore);



// 创建场次的模态框逻辑
const isSessionModalVisible = ref(false);

const isCreatingSession = ref(false);
const newSession = reactive({
  title: '',
  start_time: '',
});

// 编辑场次的模态框逻辑
const isEditModalVisible = ref(false);
const isUpdatingSession = ref(false);
const editSession = reactive({
  id: '',
  start_time: '',
});

// 创建分会场的模态框逻辑
const isSubVenueModalVisible = ref(false);
const isCreatingSubVenue = ref(false);
const newSubVenue = reactive({
  title: '',
  description: '',
});

// 编辑分会场的模态框逻辑
const isEditSubVenueModalVisible = ref(false);
const isUpdatingSubVenue = ref(false);
const editSubVenueModel = reactive({
  id: '',
  title: '',
  description: '',
});



// 格式化时间显示
const formatTime = (timeStr: string) => {
  if (!timeStr) return '---';
  let fixed = timeStr.replace('+00:00Z', 'Z').replace(/\+00:00$/, 'Z');
  const date = new Date(fixed);
  if (isNaN(date.getTime())) return '---';
  return date.toLocaleString();
};

// 已废弃的 datetime-local 转换，保留占位避免误用
// const toDatetimeLocal = (isoString: string) => { ... };

const openCreateSessionModal = () => {
  newSession.title = '';
  newSession.start_time = '';
  isSessionModalVisible.value = true;
};

//创建分会场
const openCreateSubVenueModal = () => {
  newSubVenue.title = '';
  newSubVenue.description = '';
  isSubVenueModalVisible.value = true;
};

const closeCreateSubVenueModal = () => {
  isSubVenueModalVisible.value = false;
  newSubVenue.title = '';
  newSubVenue.description = '';
};

//创建场次
const closeCreateSessionModal = () => {
  isSessionModalVisible.value = false;
  newSession.title = '';
  newSession.start_time = '';
};

const openEditModal = (session: any) => {
  editSession.id = session.id;
  // Directly use the ISO string for the input field
  editSession.start_time = session.start_time;
  isEditModalVisible.value = true;
};

const closeEditModal = () => {
  isEditModalVisible.value = false;
  editSession.id = '';
  editSession.start_time = '';
};

const handleCreateSession = async () => {
  if (!currentRoom.value) {
    uni.showToast({ title: '未能获取当前房间ID', icon: 'none' });
    return;
  }
  if (!newSession.title || !newSession.start_time) {
    uni.showToast({ title: '标题和开始时间均不能为空', icon: 'none' });
    return;
  }
  isCreatingSession.value = true;
  try {
    await sessionStore.createSession(currentRoom.value.id, {
      title: newSession.title,
      start_time: new Date(newSession.start_time).toISOString(),
    });
    uni.showToast({ title: '创建成功', icon: 'success' });
    closeCreateSessionModal();
    fetchSessions();
  } catch (e: any) {
    uni.showToast({ title: e?.message || '创建失败', icon: 'none' });
    console.error('创建场次失败:', e);
  } finally {
    isCreatingSession.value = false;
  }
};

const handleUpdateSession = async () => {
  if (!editSession.start_time) {
    uni.showToast({ title: '开始时间不能为空', icon: 'none' });
    return;
  }
  isUpdatingSession.value = true;
  try {
    const payload = {
      start_time: new Date(editSession.start_time).toISOString(),
    } as const;
    await sessionStore.updateSession(editSession.id, payload);
    uni.showToast({ title: '更新成功', icon: 'success' });
    closeEditModal();
    fetchSessions();
  } catch (e: any) {
    uni.showToast({ title: e?.message || '更新失败', icon: 'none' });
  } finally {
    isUpdatingSession.value = false;
  }
};

const handleDeleteSession = async (session: any) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个场次吗？',
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '删除中...' });
        try {
          await sessionStore.deleteSession(session.id, currentRoom.value?.id);
          await fetchSessions();
          uni.hideLoading();
          uni.showToast({ title: '删除成功', icon: 'success' });
        } catch (e: any) {
          uni.hideLoading();
          uni.showToast({ title: e?.message || '删除失败', icon: 'none' });
        }
      }
    }
  });
};

// 跳转到场次详情页
const goToSessionDetail = (sessionId: string) => {
  if (!sessionId) {
    uni.showToast({ title: '无效的场次ID', icon: 'none' });
    return;
  }
  uni.navigateTo({ url: `/pages/session/SessionDetail?id=${sessionId}` });
};

// 跳转到直播页面（仅当场次状态为 live 时允许）
const goToLiveView = (sessionId: string) => {
  if (!sessionId) {
    uni.showToast({ title: '无效的场次ID', icon: 'none' });
    return;
  }

  // 查找该场次并校验状态
  const session = sessions.value.find((s: any) => s.id === sessionId);
  if (!session) {
    uni.showToast({ title: '场次不存在', icon: 'none' });
    return;
  }

  if (session.status !== 'live') {
    // 使用已有的状态文案函数；如需中文可在 getStatusText 中映射
    const statusText = getStatusText(session.status);
    uni.showToast({ title: `当前状态：${statusText}，无法直播`, icon: 'none', duration: 3000 });
    return;
  }

  // 只有 live 才允许跳转
  uni.navigateTo({ url: `/pages/live/LiveView?id=${sessionId}` });
};

// 获取场次列表
const fetchSessions = () => {
  if (currentRoom.value?.id) {
    sessionStore.fetchSessionsByRoomId(currentRoom.value.id, { refresh: true });
  }
};

const retryFetchSessions = () => {
  fetchSessions();
};

// 获取状态样式类
const getStatusClass = (status: string) => {
  switch (status) {
    case 'scheduled':
      return 'status-scheduled';
    case 'live':
      return 'status-live';
    case 'ended':
      return 'status-ended';
    case 'archived':
      return 'status-archived';
    case 'finished':
      return 'status-ended';
    case 'ready':
      return 'status-scheduled';
    default:
      return 'status-default';
  }
};

// 获取状态文本
const getStatusText = (status: string) => {
  return status;
};

// 获取分会场状态样式类
const getSubVenueStatusClass = (subVenue: any) => {
  if (subVenue.live_status === 'live') {
    return 'status-live';
  } else if (subVenue.current_session_id) {
    return 'status-scheduled';
  } else {
    return 'status-default';
  }
};

// 获取分会场状态文本
const getSubVenueStatusText = (subVenue: any) => {
  if (subVenue.live_status === 'live') {
    return '直播中';
  } else if (subVenue.current_session_id) {
    return '有场次';
  } else {
    return '空闲';
  }
};

// 获取分会场列表
const fetchSubVenues = () => {
  if (currentRoom.value?.id) {
    roomStore.fetchSubVenues(currentRoom.value.id);
  }
};

const retryFetchSubVenues = () => {
  fetchSubVenues();
};

// 创建分会场
const handleCreateSubVenue = async () => {
  if (!currentRoom.value) {
    uni.showToast({ title: '未能获取当前房间ID', icon: 'none' });
    return;
  }
  // 检查是否为分会场
  if (currentRoom.value.parent_room_id) {
    uni.showToast({ title: '分会场不能创建子分会场', icon: 'none' });
    return;
  }
  if (!newSubVenue.title) {
    uni.showToast({ title: '分会场标题不能为空', icon: 'none' });
    return;
  }
  isCreatingSubVenue.value = true;
  try {
    await roomStore.createSubVenue({
      title: newSubVenue.title,
      description: newSubVenue.description,
      parent_room_id: currentRoom.value.id
    });
    uni.showToast({ title: '创建成功', icon: 'success' });
    closeCreateSubVenueModal();
    fetchSubVenues();
  } catch (e: any) {
    uni.showToast({ title: e?.message || '创建失败', icon: 'none' });
    console.error('创建分会场失败:', e);
  } finally {
    isCreatingSubVenue.value = false;
  }
};

// 编辑分会场
const handleUpdateSubVenue = async () => {
  if (!editSubVenueModel.title.trim()) {
    uni.showToast({ title: '分会场标题不能为空', icon: 'none' });
    return;
  }

  isUpdatingSubVenue.value = true;
  uni.showLoading({ title: '更新中...' });

  try {
    const payload: Partial<Room> = {
      title: editSubVenueModel.title.trim(),
      description: editSubVenueModel.description.trim(),
    };
    await roomStore.updateRoom(editSubVenueModel.id, payload);
    
    // Wait a bit for the backend to process the update before refetching.
    setTimeout(() => {
      fetchSubVenues();
      uni.hideLoading();
      uni.showToast({ title: '更新成功', icon: 'success' });
      closeEditSubVenueModal();
    }, 300); // 300ms delay

  } catch (e: any) {
    uni.hideLoading();
    uni.showToast({ title: e?.message || '更新失败', icon: 'none' });
  } finally {
    // The loading state is now managed by the timeout.
    isUpdatingSubVenue.value = false;
  }
};

const openEditSubVenueModal = (subVenue: any) => {
  editSubVenueModel.id = subVenue.id;
  editSubVenueModel.title = subVenue.title;
  editSubVenueModel.description = subVenue.description || '';
  isEditSubVenueModalVisible.value = true;
};

const closeEditSubVenueModal = () => {
  isEditSubVenueModalVisible.value = false;
  editSubVenueModel.id = '';
  editSubVenueModel.title = '';
  editSubVenueModel.description = '';
};

// 删除分会场
const handleDeleteSubVenue = (subVenue: any) => {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除分会场"${subVenue.title}"吗？`,
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '删除中...' });
        try {
          await roomStore.deleteSubVenue(subVenue.id, currentRoom.value?.id);
          // Wait a bit for the backend to process the deletion before refetching.
          setTimeout(() => {
            fetchSubVenues();
            uni.hideLoading();
            uni.showToast({ title: '删除成功', icon: 'success' });
          }, 300); // 300ms delay
        } catch (e: any) {
          uni.hideLoading();
          uni.showToast({ title: e?.message || '删除失败', icon: 'none' });
        }
      }
    }
  });
};

// 跳转到分会场详情页
const goToSubVenueDetail = (subVenueId: string) => {
  if (!subVenueId) {
    uni.showToast({ title: '无效的分会场ID', icon: 'none' });
    return;
  }
  uni.navigateTo({ url: `/pages/room/RoomDetail?id=${subVenueId}` });
};

// 获取参数与数据
onLoad((options) => {
  const authStore = useAuthStore();
  
  console.log('🚀 RoomDetail页面加载');
  console.log('🔍 当前认证状态:', {
    isAuthenticated: authStore.isAuthenticated,
    token: authStore.token,
    user: authStore.user
  });
  
  // 认证检查
  if (!authStore.isAuthenticated) {
    const currentPath = getCurrentPages()[getCurrentPages().length - 1].route;
    console.log('❌ 用户未认证，跳转到登录页面');
    authStore.forceReauth(`/pages/${currentPath}`);
    return;
  }
  
  console.log('✅ 用户已认证，加载房间详情');
  
  if (options && typeof options.id === 'string' && options.id) {
    roomStore.fetchRoomById(options.id);
  } else {
    error.value = new Error('无效的房间ID');
  }
});

// 监听房间数据变化，自动加载场次和分会场
watch(
  () => currentRoom.value?.id,
  (newRoomId) => {
    if (newRoomId) {
      fetchSessions();
      // 只有主会场才加载分会场数据
      if (!currentRoom.value?.parent_room_id) {
        fetchSubVenues();
      }
    }
  }
);

const goBack = () => {
  uni.navigateBack();
};

// 返回直播列表页
const goBackToList = () => {
  uni.navigateTo({ url: '/pages/room/new/RoomList' });
};

const safeRoomTitle = computed(() => escapeHtml(currentRoom.value?.title || '暂无标题'));
const safeRoomDescription = computed(() => escapeHtml(currentRoom.value?.description || '暂无简介'));
const safeSubVenueTitle = (subVenue: any) => escapeHtml(subVenue.title);
const safeSubVenueDescription = (subVenue: any) => escapeHtml(subVenue.description || '暂无简介');
</script>

<style lang="scss" scoped>
.room-detail-page {
  background-color: #f7f8fa;
  min-height: 100vh;
  padding-top: 120px; /* 为顶部用户信息区域和固定标题留出空间 */
  
  // 移动端不需要为自定义标题留空间
  @media (max-width: 767px) {
    padding-top: 0;
  }
}

.fixed-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 0 20px;
  
  // 移动端隐藏自定义标题，使用系统导航栏
  @media (max-width: 767px) {
    display: none;
  }
}

.page-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
}

.header-left {
  display: flex;
  align-items: center;
  position: relative;
  z-index: 2;
}

.header-right {
  display: flex;
  align-items: center;
  position: relative;
  z-index: 2;
}

.loading-container, .status-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding-top: 100px;
  text-align: center;
  color: var(--color-text-secondary);
}

.status-text {
  margin-bottom: var(--spacing-medium);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-primary-light-1);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-medium);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.content-wrapper {
  padding: 30px 112px;
  
  /* 移动端优化：减少左右留白，充分利用屏幕宽度 */
  @media (max-width: 767px) {
    padding: 20px 16px; /* 微信小程序：左右各16px，上下20px */
  }
  
  /* 平板端优化 */
  @media (min-width: 768px) and (max-width: 1024px) {
    padding: 25px 40px;
  }
}

.cover-section {
  width: 100%;
  height: 200px;
}

.cover-image {
  width: 100%;
  height: 100%;
  background-color: #e0e0e0;
}

.info-card, .sessions-card {
  background-color: var(--color-background);
  margin: 0 var(--spacing-medium);
  border-radius: var(--radius-large);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  
  /* PC端优化：更精致的边框和阴影 */
  @media (min-width: 768px) {
    border-radius: 8px; /* PC端圆角适中 */
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* PC端阴影更柔和 */
  }
  
  /* 移动端优化：减少左右边距，充分利用屏幕宽度 */
  @media (max-width: 767px) {
    margin: 0 0 var(--spacing-medium) 0; /* 左右无边距，只保留下边距 */
    border-radius: 8px; /* 移动端稍微减小圆角 */
  }
}

.info-card {
  margin-top: -30px;
  position: relative;
  z-index: 1;
  padding: var(--spacing-samall);
  margin-bottom: var(--spacing-medium);
}

.room-info-grid {
  width: 100%;
  gap: var(--spacing-medium);
  
  /* 移动端：垂直布局，每个信息项占一行 */
  display: flex;
  flex-direction: column;
  
  /* PC端：横向布局，信息项并排显示 */
  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: repeat(4, 1fr); /* 4列等宽布局 */
    gap: 16px; /* PC端减少间距，让卡片更紧凑 */
  }
  
  /* 移动端优化：减少间距，增加内容密度 */
  @media (max-width: 767px) {
    gap: 12px; /* 移动端减少网格间距 */
  }
}

.info-item {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  padding: var(--spacing-small);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  
  /* 移动端：重新设计的水平布局，更紧凑 */
  @media (max-width: 767px) {
    padding: 12px 16px; /* 移动端内边距适中 */
    border-radius: 12px; /* 移动端圆角更大，更现代 */
    align-items: center; /* 垂直居中对齐 */
    text-align: left; /* 左对齐 */
    border: 1px solid #e8eaed; /* 更柔和的边框 */
    background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%); /* 渐变背景 */
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06); /* 更柔和的阴影 */
    flex-direction: row; /* 水平排列 */
    justify-content: flex-start; /* 标签和值左对齐，紧凑布局 */
    gap: 8px; /* 标签和值之间的间距 */
    
    /* 移动端：标签和值水平排列，更紧凑 */
    .info-label {
      margin-bottom: 0; /* 移除底部间距 */
      font-size: 13px; /* 标签字体适中 */
      color: #5f6368; /* 更柔和的标签颜色 */
      font-weight: 500; /* 标签字体加粗 */
      text-transform: uppercase; /* 标签大写，更专业 */
      letter-spacing: 0.5px; /* 字母间距 */
      min-width: 60px; /* 标签最小宽度 */
      flex-shrink: 0; /* 标签不收缩 */
    }
    
    .info-value {
      font-size: 13px; /* 值字体大小与标签一致 */
      color: #202124; /* 更深的文字颜色 */
      font-weight: 600; /* 值字体加粗 */
      word-break: break-word; /* 智能换行 */
      line-height: 1.4; /* 行高适中 */
      flex: 1 1 auto; /* 允许值占据剩余空间 */
      text-align: left; /* 值左对齐 */
    }
    
    /* 移动端：房间ID特殊样式 */
    .id-text {
      font-size: 11px; /* 移动端房间ID字体更小 */
      color: #5f6368; /* 更柔和的颜色 */
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace; /* 更好的等宽字体 */
      background: #f1f3f4; /* 浅灰背景 */
      padding: 4px 8px; /* 内边距 */
      border-radius: 6px; /* 圆角 */
      border: 1px solid #e8eaed; /* 边框 */
      text-align: left; /* ID左对齐 */
    }
  }
  
  /* PC端：标签在上，值在下，字体大小调整 */
  @media (min-width: 768px) {
    flex-direction: column; /* 垂直布局 */
    align-items: flex-start; /* 左对齐 */
    text-align: left; /* 左对齐 */
    padding: 12px 16px; /* PC端内边距更紧凑 */
    border-width: 1px; /* 边框更细 */
    border-radius: 6px; /* 圆角更小，更精致 */
    
    /* PC端：标签和值垂直排列 */
    .info-label {
      margin-bottom: 4px; /* 标签和值之间的间距 */
      font-size: 14px; /* PC端标签字体 */
      color: var(--color-text-secondary);
      min-width: auto; /* 移除最小宽度限制 */
    }
    
    .info-value {
      font-size: 14px; /* PC端值字体与下方表格文字大小一致 */
      color: var(--color-text-primary);
      font-weight: 500;
      word-break: break-word; /* 允许在合适位置换行 */
      flex: none; /* 移除flex属性 */
    }
    
    /* PC端房间ID字体特别处理，让它更紧凑 */
    .id-text {
      font-size: 12px; /* PC端房间ID字体更小，更紧凑 */
      line-height: 1.3; /* 调整行高，避免过于拥挤 */
    }
  }
}

.info-label {
  font-size: var(--font-size-medium);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-medium);
  font-weight: 500;
}

.info-value {
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  font-weight: 500;
  word-break: break-word;
  line-height: 1.4;
}

.status-icon {
  margin-right: var(--spacing-small);
  font-size: 16px;
  
  /* PC端：图标和文字水平排列 */
  @media (min-width: 768px) {
    margin-right: 8px;
    font-size: 18px;
  }
  
  /* 移动端：图标和文字垂直排列时的调整 */
  @media (max-width: 767px) {
    margin-right: 6px;
    font-size: 16px;
  }
}

.id-text {
  color: var(--color-text-secondary);
  font-family: monospace;
  font-size: var(--font-size-medium);
  word-break: break-all;
  
  /* PC端：ID可以完整显示在一行 */
  @media (min-width: 768px) {
    font-size: 12px;
    word-break: break-word; /* 允许在合适位置换行 */
    max-width: 100%; /* 充分利用可用空间 */
  }
  
  /* 移动端：ID可能需要换行 */
  @media (max-width: 767px) {
    font-size: 11px; /* 移动端房间ID字体更小 */
    word-break: break-all; /* 强制换行 */
    line-height: 1.2; /* 移动端行高更紧凑 */
  }
}

.sessions-card, .sub-venues-card {
  background-color: var(--color-background);
  margin: 0 var(--spacing-medium);
  border-radius: var(--radius-large);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: var(--spacing-large);
  margin-bottom: var(--spacing-large);
  
  /* 移动端优化：减少左右边距，充分利用屏幕宽度 */
  @media (max-width: 767px) {
    margin: 0 0 var(--spacing-large) 0; /* 左右无边距，只保留下边距 */
    padding: 16px; /* 移动端减少内边距 */
    border-radius: 8px; /* 移动端稍微减小圆角 */
  }
}

.sub-venues-header {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: var(--spacing-large);
  min-height: 40px;
}

.sub-venues-title {
  font-size: var(--font-size-large);
  font-weight: bold;
  color: var(--color-text-primary);
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
}

/* 修改开始：分会场表格样式与场次表格样式统一 */
.sub-venues-table {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  overflow: hidden;
  background: #fff;
  table-layout: fixed;
  
  /* 复用 .table-header 和 .table-row 的样式 */
  .table-header {
    display: none; /* 默认隐藏表头 */
    
    /* 大屏幕显示表头 */
    @media (min-width: 768px) {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 2fr; /* 与分会场内容匹配的列宽 */
      background: #f8f9fa;
      border-bottom: 2px solid var(--color-border);
    }
  }
  
  .table-row {
    display: flex;
    flex-direction: column;
    padding: var(--spacing-medium);
    border-bottom: 1px solid var(--color-border);
    transition: background-color 0.2s;
    
    /* 斑马纹效果 */
    &:nth-child(odd) {
      background-color: #ffffff;
    }
    
    &:nth-child(even) {
      background-color: #f8f9fa;
    }

    &:hover {
      background-color: #e3f2fd !important;
    }
    
    &:last-child {
      border-bottom: none;
    }
    
    /* 大屏幕表格布局 */
    @media (min-width: 768px) {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 2fr; /* 与分会场内容匹配的列宽 */
      padding: 0;
    }
  }
}
/* 修改结束 */

.sessions-header {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: var(--spacing-large);
  min-height: 40px;
}

.sessions-title {
  font-size: var(--font-size-large);
  font-weight: bold;
  color: var(--color-text-primary);
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
}

.sessions-table {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  overflow: hidden;
  background: #fff;
}

/* 响应式表格布局 */
.table-header {
  display: none; /* 默认隐藏表头 */
  
  /* 大屏幕显示表头 */
  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 2fr; /* 增加操作列宽度 */
    background: #f8f9fa;
    border-bottom: 2px solid var(--color-border);
  }
}

.table-row {
  /* 移动端卡片布局 */
  display: flex;
  flex-direction: column;
  padding: var(--spacing-medium);
  border-bottom: 1px solid var(--color-border);
  transition: background-color 0.2s;
  
  /* 斑马纹效果 */
  &:nth-child(odd) {
    background-color: #ffffff;
  }
  
  &:nth-child(even) {
    background-color: #f8f9fa;
  }

  &:hover {
    background-color: #e3f2fd !important;
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  /* 大屏幕表格布局 */
  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 2fr; /* 增加操作列宽度 */
    padding: 0;
  }
}

.table-cell {
  /* 移动端卡片样式 */
  padding: var(--spacing-medium);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  font-size: var(--font-size-small);
  color: var(--color-text-primary);
  word-break: break-word;
  overflow: hidden;
  margin-bottom: var(--spacing-small);
  
  /* 添加标签 */
  &::before {
    content: attr(data-label);
    font-weight: bold;
    color: var(--color-text-secondary);
    font-size: var(--font-size-small);
    margin-bottom: 4px;
  }
  
  /* 大屏幕表格样式 */
  @media (min-width: 768px) {
    flex-direction: row;
    align-items: center;
    justify-content: center;
    margin-bottom: 0;
    border-right: 1px solid var(--color-border);
    
    &::before {
      display: none; /* 大屏幕不显示标签 */
    }
    
    &:last-child {
      border-right: none;
    }
  }
}

.header-cell {
  display: none; /* 移动端隐藏表头 */
  
  /* 大屏幕显示表头 */
  @media (min-width: 768px) {
    display: flex;
    font-weight: bold;
    background: #f8f9fa;
    color: var(--color-text-secondary);
  }
}

.actions-cell {
  justify-content: flex-start;
  gap: var(--spacing-small);
  position: relative;
  z-index: 10;
  
  .app-button {
    position: relative;
    z-index: 11;
  }
}

/* 操作按钮间距样式 */
.responsive-button-group {
  display: flex;
  gap: 8px; /* 按钮之间的间距 */
  flex-wrap: wrap; /* 在小屏幕上允许换行 */
  
  .action-btn {
    margin-right: 8px; /* 额外的右边距 */
    
    &:last-child {
      margin-right: 0; /* 最后一个按钮不需要右边距 */
    }
  }
}

/* 移动端按钮组样式优化 */
@media (max-width: 767px) {
  .responsive-button-group {
    gap: 8px !important; /* 移动端增加按钮间距，避免拥挤 */
    justify-content: flex-start !important; /* 按钮左对齐，紧凑布局 */
    
    .action-btn {
      margin-right: 0 !important; /* 移除右边距，使用gap控制间距 */
      flex: 0 1 auto !important; /* 按钮宽度自适应 */
      min-width: 70px !important; /* 增加最小宽度，避免按钮过小 */
      max-width: 80px !important; /* 限制最大宽度，保持美观 */
    }
  }
  
  /* 移动端表格单元格优化 - 紧凑水平布局 */
  .table-cell {
    padding: 12px 16px !important; /* 调整内边距 */
    border-bottom: 1px solid #f0f0f0 !important; /* 更柔和的边框 */
    display: flex !important; /* 水平布局 */
    flex-direction: row !important; /* 强制水平布局 */
    justify-content: flex-start !important; /* 标签和值左对齐 */
    align-items: center !important; /* 垂直居中 */
    gap: 4px !important; /* 标签和值之间的紧凑间距 */
    margin-bottom: 0 !important; /* 移除底部间距 */
    
    &::before {
      font-size: 12px !important; /* 标签字体大小 */
      margin-bottom: 0 !important; /* 移除底部间距 */
      color: #5f6368 !important; /* 标签颜色 */
      font-weight: 500 !important; /* 标签加粗 */
      letter-spacing: 0.3px !important; /* 字母间距 */
      min-width: 60px !important; /* 标签最小宽度 */
      flex-shrink: 0 !important; /* 标签不收缩 */
    }
    
    /* 表格单元格的值部分 - 紧凑布局，字体大小和颜色与标签一致 */
    .table-cell-content {
      flex: 0 1 auto !important; /* 值不占据剩余空间，只占用需要的空间 */
      text-align: left !important; /* 值左对齐 */
      word-break: break-all !important; /* 长文本换行 */
      font-size: 12px !important; /* 值与标签字体大小一致 */
      color: #5f6368 !important; /* 值与标签颜色一致 */
      font-weight: 500 !important; /* 值与标签字体粗细一致 */
    }
  }
  
  /* 强制覆盖所有可能的space-between */
  .table-cell[data-label] {
    justify-content: flex-start !important;
  }
  
  /* 强制覆盖所有可能的flex: 1 */
  .table-cell .table-cell-content {
    flex: 0 1 auto !important;
  }
  
  /* 微信小程序特殊处理 - 使用更强的选择器 */
  .table-row .table-cell {
    justify-content: flex-start !important;
    flex-direction: row !important;
  }
  
  .table-row .table-cell .table-cell-content {
    flex: 0 1 auto !important;
  }
  
  /* 确保按钮组也是紧凑的 */
  .table-row .table-cell.actions-cell .responsive-button-group {
    justify-content: flex-start !important;
    width: auto !important;
  }
  
  /* 移动端操作列优化 - 紧凑水平布局 */
  .actions-cell {
    padding: 12px 16px !important;
    justify-content: flex-start !important; /* 操作按钮左对齐 */
    
    .responsive-button-group {
      width: auto !important; /* 按钮组宽度自适应 */
      justify-content: flex-start !important; /* 按钮左对齐 */
      gap: 8px !important; /* 按钮之间的间距 */
    }
    
    /* 操作列的值部分不右对齐 */
    .table-cell-content {
      text-align: left !important;
      flex: 0 1 auto !important; /* 不占据剩余空间 */
    }
  }
  
  /* 移动端表格行优化 */
  .table-row {
    background: #ffffff;
    border-radius: 8px; /* 每行都有圆角 */
    margin-bottom: 8px; /* 行间距 */
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04); /* 轻微阴影 */
    border: 1px solid #f0f0f0; /* 边框 */
    
    &:hover {
      background: #f8f9fa; /* 悬停效果 */
      transform: translateY(-1px); /* 轻微上移 */
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08); /* 悬停时阴影加深 */
      transition: all 0.2s ease; /* 平滑过渡 */
    }
  }
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px !important; /* 与标签字体大小一致 */
  font-weight: 500 !important; /* 与标签字体粗细一致 */
  color: #5f6368 !important; /* 与标签颜色一致 */
  text-align: center;
  min-width: 60px;
  
  /* 移动端状态徽章优化 */
  @media (max-width: 767px) {
    padding: 6px 14px; /* 移动端增加内边距 */
    border-radius: 16px; /* 移动端圆角更大 */
    font-size: 12px !important; /* 与标签字体大小一致 */
    font-weight: 500 !important; /* 与标签字体粗细一致 */
    color: #5f6368 !important; /* 与标签颜色一致 */
    min-width: 70px; /* 移动端最小宽度 */
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); /* 轻微阴影 */
    text-transform: uppercase; /* 大写显示 */
    letter-spacing: 0.5px; /* 字母间距 */
  }
}

.status-scheduled {
  background-color:rgb(239, 193, 8);
}

.status-live {
  background-color:rgb(47, 173, 77);
}

.status-ended {
  background-color:rgb(152, 152, 3);
}

.status-archived {
  background-color: #17a2b8;
}

.status-default {
  background-color: #6c757d;
}

.session-item {
  background: #f4f8ff;
  border-radius: 8px;
  border-left: 3px solid #a0c4ff;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: #e8f2ff;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
}

.session-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-medium);
}

.session-info {
  flex: 1;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-large);
}

.session-status {
  font-size: var(--font-size-base);
  font-weight: bold;
  color: var(--color-primary);
  flex: 1;
  text-align: center;
}

.session-time-start {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  flex: 1;
  text-align: left;
}

.session-time-end {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  flex: 1;
  text-align: left;
}

.session-time {
  font-size: var(--font-size-small);
  color: var(--color-text-secondary);
}

.session-actions {
  display: flex;
  gap: var(--spacing-small);
}

.title {
  font-size: var(--font-size-xlarge);
  font-weight: bold;
  color: black;
  margin-bottom: var(--spacing-medium);
}

.description {
  font-size: var(--font-size-base);
  color: black;
  line-height: 1.7;
  margin-bottom: var(--spacing-xlarge);
  word-break: break-word;
}

.meta-list {
  border-top: 1px solid var(--color-border);
  padding-top: var(--spacing-medium);
}

.meta-item {
  display: flex;
  align-items: center;
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  
  &:not(:last-child) {
    margin-bottom: var(--spacing-medium);
  }
}

.meta-icon {
  margin-right: var(--spacing-medium);
  font-size: 18px;
}

.id-text {
  color: var(--color-text-secondary);
  font-family: monospace;
  word-break: break-all;
}

.empty-state {
  min-height: 120px;
}

.form {
  padding: var(--spacing-medium) 0;
}

.form-group {
  margin-bottom: var(--spacing-large);
}

.form-label {
  display: block;
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-small);
  font-weight: bold;
}

.form-input {
  width: 100%;
  padding: var(--spacing-medium);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background-color: var(--color-background-light);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  box-sizing: border-box;
}

.placeholder {
  color: var(--color-text-secondary);
}

@media (max-width: 600px) {
  .session-content, .sub-venue-content {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-small);
  }
  
  .session-actions, .sub-venue-actions {
    width: 100%;
    justify-content: flex-end;
  }
}

/* 移除重复的响应式样式，统一使用 responsive.scss */
</style>



