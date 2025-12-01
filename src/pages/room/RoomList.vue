
<template>
  <view class="room-list-page">
    <!-- 添加顶部用户信息区域 -->
    <UserInfoHeader />
    
    <view class="page-content">
      <view class="page-title fade-in">直播房间列表</view>
    <view class="content-container">
      <view class="accordion-list">
        <view v-for="room in mainRooms" :key="room.id" class="room-item">
          <!-- 封面展示 -->
          <view style="padding: 0 24px 12px 24px;">
            <image 
              :src="getDisplayCover(room)"
              mode="aspectFill"
              style="width: 100%; max-width: 560px; height: 315px; border-radius: 8px; background: #f2f3f5;"
              @error="onCoverError(room.id)"
            />
          </view>
          <!-- 房间行 - 可点击跳转到详情页 -->
          <view class="room-header" @click="goToRoomDetail(room.id)">
            <span class="room-title" v-html="safeRoomTitle(room)"></span>
            <view class="room-actions" @click.stop>
              <!-- PC端和平板端：显示所有按钮 -->
              <view class="desktop-actions">
                <AppButton type="default" size="small" @click="openEditModal(room)">编辑</AppButton>
                <AppButton type="danger" size="small" @click="confirmDelete(room)">删除</AppButton>
                <AppButton type="primary" size="small" @click="goToRoomDetail(room.id)">查看详情</AppButton>
              </view>
              
              <!-- 手机端：只显示查看详情和更多按钮 -->
              <view class="mobile-actions">
                <AppButton type="primary" size="small" @click="goToRoomDetail(room.id)">查看详情</AppButton>
                <view class="more-button" @click="openActionMenu(room)">
                  <text class="more-icon">⋯</text>
                </view>
              </view>
            </view>
          </view>
          <!-- 房间简介（如有） -->
          <view v-if="room.description" style="margin-left: 32px; margin-bottom: 8px;">
            <span style="color: #888; font-size: 14px;" v-html="safeRoomDescription(room)"></span>
          </view>
        </view>
      </view>
    </view>
    <!-- 分页组件 - 多端适配 -->
    <view class="pagination-container" v-if="pagination.total > 0">
      <!-- 分页信息 -->
      <view class="pagination-info">
        <text class="pagination-text">
          共 {{ pagination.total }} 条记录，第 {{ pagination.page }} / {{ maxPage }} 页
        </text>
      </view>
      
      <!-- H5平台：完整分页控件 -->
      <!-- #ifdef H5 -->
      <!-- 页码显示区域 -->
      <view class="h5-pagination-wrapper">
        <!-- 页码按钮组 -->
        <view class="page-numbers h5-page-numbers">
          <!-- 第一页 -->
          <button 
            class="page-btn"
            :class="{ 'page-btn--active': pagination.page === 1 }"
            @click="goToPage(1)"
          >
            1
          </button>
          
          <!-- 省略号（当总页数 > 7 且当前页 > 4 时显示） -->
          <span class="page-ellipsis" v-if="maxPage > 7 && pagination.page > 4">...</span>
          
          <!-- 中间页码 -->
          <template v-if="maxPage > 7">
            <!-- 当前页附近的页码 -->
            <button 
              v-for="page in getVisiblePages()" 
              :key="page"
              class="page-btn"
              :class="{ 'page-btn--active': page === pagination.page }"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
          </template>
          
          <!-- 当总页数 <= 7 时显示所有页码 -->
          <template v-else>
            <button 
              v-for="page in getSimplePages()" 
              :key="page"
              class="page-btn"
              :class="{ 'page-btn--active': page === pagination.page }"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
          </template>
          
          <!-- 省略号（当总页数 > 7 且当前页 < maxPage - 3 时显示） -->
          <span class="page-ellipsis" v-if="maxPage > 7 && pagination.page < maxPage - 3">...</span>
          
          <!-- 最后一页（当总页数 > 1 时显示） -->
          <button 
            v-if="maxPage > 1"
            class="page-btn"
            :class="{ 'page-btn--active': pagination.page === maxPage }"
            @click="goToPage(maxPage)"
          >
            {{ maxPage }}
          </button>
        </view>
        
        <!-- 分页控制区域 -->
        <view class="pagination-controls h5-pagination">
          <!-- 上一页按钮 -->
          <button 
            class="nav-btn"
            :class="{ 'nav-btn--disabled': pagination.page <= 1 }"
            :disabled="pagination.page <= 1"
            @click="goPrevPage"
          >
            <text class="nav-btn-text">‹ 上一页</text>
          </button>
          
          <!-- 页码输入框 -->
          <view class="page-input-container">
            <text class="page-input-label">跳转到</text>
            <input 
              class="page-input" 
              v-model.number="jumpPage" 
              type="number" 
              :min="1" 
              :max="maxPage"
              @keyup.enter="jumpToPage"
              placeholder="页码"
            />
            <text class="page-input-label">页</text>
            <button class="jump-btn" @click="jumpToPage">跳转</button>
          </view>
          
          <!-- 下一页按钮 -->
          <button 
            class="nav-btn"
            :class="{ 'nav-btn--disabled': !pagination.hasMore }"
            :disabled="!pagination.hasMore"
            @click="goNextPage"
          >
            <text class="nav-btn-text">下一页 ›</text>
          </button>
        </view>
      </view>
      <!-- #endif -->
      
      <!-- App平台：简化分页控件 -->
      <!-- #ifdef APP-PLUS -->
      <view class="pagination-controls app-pagination">
        <AppButton 
          type="default" 
          size="small" 
          :disabled="pagination.page <= 1"
          @click="goPrevPage"
        >
          上一页
        </AppButton>
        
        <view class="page-info">
          <text class="page-info-text">{{ pagination.page }} / {{ maxPage }}</text>
        </view>
        
        <AppButton 
          type="default" 
          size="small" 
          :disabled="!pagination.hasMore"
          @click="goNextPage"
        >
          下一页
        </AppButton>
      </view>
      <!-- #endif -->
      
      <!-- 微信小程序：简化分页控件 -->
      <!-- #ifdef MP-WEIXIN -->
      <view class="pagination-controls mp-pagination">
        <AppButton 
          type="default" 
          size="small" 
          :disabled="pagination.page <= 1"
          @click="goPrevPage"
        >
          上一页
        </AppButton>
        
        <view class="page-info">
          <text class="page-info-text">{{ pagination.page }} / {{ maxPage }}</text>
        </view>
        
        <AppButton 
          type="default" 
          size="small" 
          :disabled="!pagination.hasMore"
          @click="goNextPage"
        >
          下一页
        </AppButton>
      </view>
      <!-- #endif -->
      
      <!-- 加载更多提示（App和小程序） -->
      <!-- #ifndef H5 -->
      <view class="load-more-tip" v-if="pagination.hasMore">
        <text class="load-more-text">上拉加载更多</text>
      </view>
      <view class="load-more-tip" v-else-if="pagination.total > 0">
        <text class="load-more-text">已加载全部内容</text>
      </view>
      <!-- #endif -->
    </view>
    
    <view class="fab-container">
      <AppButton type="primary" size="large" @click="openCreateModal">+</AppButton>
    </view>
    <ModalDialog
      :visible="isModalVisible"
      :title="modalTitle"
      :confirmText="modalConfirmText"
      :confirmLoading="isSubmitting"
      @update:visible="isModalVisible = $event"
      @confirm="handleConfirm"
      @cancel="closeModal"
    >
      <view class="form">
        <view class="form-group">
          <text class="form-label">房间标题 <text class="required">*</text></text>
          <input 
            class="form-input" 
            v-model="formModel.title" 
            placeholder="请输入房间标题" 
            :class="{ 'input-error': titleError }"
          />
          <text v-if="titleError" class="form-error">{{ titleError }}</text>
        </view>
        <view class="form-group">
          <text class="form-label">房间简介</text>
          <textarea 
            class="form-textarea" 
            v-model="formModel.description" 
            placeholder="请输入房间简介（选填）" 
            :class="{ 'input-error': descriptionError }"
          />
          <text v-if="descriptionError" class="form-error">{{ descriptionError }}</text>
        </view>
      </view>
    </ModalDialog>
    <ModalDialog
      :visible="isSessionModalVisible"
      title="新增场次"
      confirmText="立即创建"
      :confirmLoading="isSessionSubmitting"
      @update:visible="isSessionModalVisible = $event"
      @confirm="handleCreateSession"
      @cancel="closeSessionModal"
    >
      <view class="form">
        <view class="form-group">
          <text class="form-label">开始时间 <text class="required">*</text></text>
          <input 
            class="form-input" 
            v-model="sessionFormModel.start_time" 
            placeholder="请输入开始时间，如 2025-07-23 10:00" 
            :class="{ 'input-error': startTimeError }"
          />
          <text v-if="startTimeError" class="form-error">{{ startTimeError }}</text>
        </view>
        <view class="form-group">
          <text class="form-label">结束时间</text>
          <input 
            class="form-input" 
            v-model="sessionFormModel.end_time" 
            placeholder="请输入结束时间，如 2025-07-23 12:00" 
            :class="{ 'input-error': endTimeError }"
          />
          <text v-if="endTimeError" class="form-error">{{ endTimeError }}</text>
        </view>
      </view>
    </ModalDialog>
    
    <!-- 手机端操作菜单 -->
    <view v-if="isActionMenuVisible" class="action-menu-overlay" @click="closeActionMenu">
      <view class="action-menu" @click.stop>
        <view class="action-menu-header">
          <text class="action-menu-title">操作菜单</text>
        </view>
        <view class="action-menu-items">
          <view class="action-menu-item" @click="handleEditFromMenu">
            <text class="action-menu-icon">✏️</text>
            <text class="action-menu-text">编辑房间</text>
          </view>
          <view class="action-menu-item" @click="handleDeleteFromMenu">
            <text class="action-menu-icon">🗑️</text>
            <text class="action-menu-text">删除房间</text>
          </view>
        </view>
      </view>
    </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { storeToRefs } from 'pinia';
import { useRoomStore } from '../../store/room';
import { useSessionStore } from '../../store/session';
import UserInfoHeader from '@/components/UserInfoHeader.vue';
import RoomCard from '../../components/RoomCard.vue';
import AppButton from '../../components/AppButton.vue';
import ModalDialog from '../../components/ModalDialog.vue';
import { ref, reactive, computed, watch } from 'vue';
import type{ Room } from '../../types/room';
import { escapeHtml } from '@/utils/xss';
import { useAuthStore } from '@/store/auth';
import { BASE_API_URL } from '@/constants/api';
import { needsAuthForMedia, fetchAuthorizedImageBlobUrl } from '@/utils/auth-image';


// 计算属性：只显示主会场（没有 parent_room_id 的房间）
const mainRooms = computed(() => {
  return rooms.value.filter(room => !room.parent_room_id);
});
// XSS防护：安全渲染房间标题和简介
const safeRoomTitle = (room: Room) => escapeHtml(room.title);
const safeRoomDescription = (room: Room) => escapeHtml(room.description || '');

// 1. Store 和数据
const roomStore = useRoomStore();
const sessionStore = useSessionStore();
const { rooms, loading, error, pagination } = storeToRefs(roomStore);

// 封面兜底与规范化
const coverErrorMap = reactive<Record<string, boolean>>({});
const getCoverSrc = (room: Room) => {
  if (!room) return '/logo.png';
  if (coverErrorMap[room.id]) return '/logo.png';
  const url = room.cover_url || '';
  if (!url) return '/logo.png';
  if (/^https?:\/\//.test(url)) return url;
  const base = BASE_API_URL.replace(/\/+$/, '');
  const origin = base.replace(/\/api\/.*/, '');
  return origin + (url.startsWith('/') ? url : '/' + url);
};
const onCoverError = (roomId: string) => {
  coverErrorMap[roomId] = true;
};

// 带鉴权的封面计算：H5 下使用 fetch+blob 方式加载需要鉴权的媒体
const authCoverMap = reactive<Record<string, string>>({});
const getDisplayCover = (room: Room) => {
  const url = getCoverSrc(room);
  if (!url || coverErrorMap[room.id]) return '/logo.png';
  if (!needsAuthForMedia(url)) return url;
  // 如果已有缓存的 blob url，直接用
  const cached = authCoverMap[room.id];
  return cached || '/logo.png';
};

// 监听 rooms 列表变化，异步拉取受保护图片为 blob url
watch(
  () => rooms.value.map(r => ({ id: r.id, cover_url: r.cover_url })),
  async () => {
    for (const r of rooms.value) {
      if (!r?.id) continue;
      const raw = getCoverSrc(r as any);
      if (!raw || !needsAuthForMedia(raw)) continue;
      try {
        const blobUrl = await fetchAuthorizedImageBlobUrl(raw);
        authCoverMap[r.id] = blobUrl;
      } catch {
        // 忽略失败
      }
    }
  },
  { deep: true, immediate: true }
);

// 跳转到房间详情页
const goToRoomDetail = (roomId: string) => {
  uni.navigateTo({ url: `/pages/room/RoomDetail?id=${roomId}` });
};

const retryFetch = () => {
  roomStore.fetchRooms({ refresh: true });
};


// 模态框与表单逻辑 (重构以支持创建和编辑)
const isModalVisible = ref(false);
const isSubmitting = ref(false); // 通用的提交状态
const isEditMode = ref(false);

// 错误状态管理
const titleError = ref('');
const descriptionError = ref('');

const formModel = reactive({
  id: null as string | null,
  title: '',
  description: ''
});

// 用于比较，判断哪些字段被修改了
const originalRoomData = reactive({
  title: '',
  description: ''
});

// 计算属性动态改变模态框
const modalTitle = computed(() => isEditMode.value ? '编辑房间' : '创建新房间');
const modalConfirmText = computed(() => isEditMode.value ? '保存更改' : '立即创建');

// 清除错误状态
const clearErrors = () => {
  titleError.value = '';
  descriptionError.value = '';
};

// 表单验证
const validateForm = () => {
  clearErrors();
  let isValid = true;

  // 验证标题
  if (!formModel.title.trim()) {
    titleError.value = '房间标题不能为空';
    isValid = false;
  } else if (formModel.title.trim().length < 2) {
    titleError.value = '房间标题至少需要2个字符';
    isValid = false;
  } else if (formModel.title.trim().length > 50) {
    titleError.value = '房间标题不能超过50个字符';
    isValid = false;
  }

  // 验证简介（可选）
  if (formModel.description && formModel.description.length > 200) {
    descriptionError.value = '房间简介不能超过200个字符';
    isValid = false;
  }

  return isValid;
};

const openCreateModal = () => {
  isEditMode.value = false;
  // 重置表单
  formModel.id = null;
  formModel.title = '';
  formModel.description = '';
  clearErrors();
  isModalVisible.value = true;
};

const openEditModal = async (room: Room) => {
  uni.showLoading({ title: '加载中...', mask: true });
  try {
    await roomStore.fetchRoomById(room.id);
    if (roomStore.currentRoom) {
      isEditMode.value = true;
      // 填充表单模型和原始数据模型
      formModel.id = roomStore.currentRoom.id;
      formModel.title = roomStore.currentRoom.title;
      formModel.description = roomStore.currentRoom.description || '';
      
      originalRoomData.title = roomStore.currentRoom.title;
      originalRoomData.description = roomStore.currentRoom.description || '';
      
      clearErrors();
      isModalVisible.value = true;
    } else {
      throw new Error('未能获取房间详情');
    }
  } catch (e: any) {
    uni.showToast({ title: `获取房间信息失败: ${e.message || '请重试'}`, icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

const closeModal = () => {
  console.log('🚪 准备关闭弹窗，当前状态:', {
    isModalVisible: isModalVisible.value,
    isSubmitting: isSubmitting.value
  });
  isModalVisible.value = false;
  clearErrors();
  console.log('✅ 弹窗已关闭，isModalVisible:', isModalVisible.value);
};

const handleConfirm = () => {
  if (isEditMode.value) {
    handleUpdateRoom();
  } else {
    handleCreateRoom();
  }
};

// 3. CRUD 操作
const handleCreateRoom = async () => {
  if (!validateForm()) {
    return;
  }
  
  // 防止重复提交
  if (isSubmitting.value) {
    console.log('⚠️ 正在提交中，忽略重复请求');
    return;
  }
  
  isSubmitting.value = true;
  console.log('🚀 开始创建房间:', {
    title: formModel.title.trim(),
    description: formModel.description.trim(),
    timestamp: new Date().toISOString()
  });
  
  try {
    // addNewRoom 内部已经会调用 fetchRooms，所以这里不需要重复调用
    const success = await roomStore.addNewRoom({
      title: formModel.title.trim(),
      description: formModel.description.trim(),
      // 确保创建的是主会场（不设置 parent_room_id）
    });
    
    console.log('✅ 房间创建结果:', success);
    console.log('🔍 Store loading状态:', roomStore.loading);
    console.log('🔍 Store error状态:', roomStore.error);
    
    if (success) {
      console.log('🎉 创建成功，准备关闭弹窗');
      uni.showToast({ title: '创建成功', icon: 'success' });
      closeModal();
    } else {
      console.log('❌ 创建失败，success为false');
      // 即使请求失败，也尝试刷新列表，因为可能数据库已经创建成功
      console.log('🔄 尝试刷新房间列表以检查是否创建成功');
      try {
        await roomStore.fetchRooms({ refresh: true });
        // 检查是否有新房间被创建（通过标题匹配）
        const newRoom = roomStore.rooms.find(room => 
          room.title === formModel.title.trim() && 
          room.description === formModel.description.trim()
        );
        
        if (newRoom) {
          console.log('✅ 发现新创建的房间，数据库创建成功');
          uni.showToast({ title: '创建成功', icon: 'success' });
          closeModal();
        } else {
          console.log('❌ 未发现新房间，创建确实失败');
          // 即使没找到，也尝试关闭弹窗，因为可能是时序问题
          console.log('🔄 尝试强制关闭弹窗（可能是时序问题）');
          setTimeout(() => {
            closeModal();
            uni.showToast({ title: '创建可能成功，请刷新页面查看', icon: 'none' });
          }, 1000);
        }
      } catch (refreshError) {
        console.error('❌ 刷新列表失败:', refreshError);
        // 即使刷新失败，也尝试关闭弹窗
        console.log('🔄 刷新失败，尝试强制关闭弹窗');
        setTimeout(() => {
          closeModal();
          uni.showToast({ title: '创建可能成功，请刷新页面查看', icon: 'none' });
        }, 1000);
      }
    }
  } catch (e: any) {
    console.error('❌ 房间创建异常:', e);
    // 即使异常，也尝试刷新列表检查
    console.log('🔄 异常情况下尝试刷新房间列表');
    try {
      await roomStore.fetchRooms({ refresh: true });
      const newRoom = roomStore.rooms.find(room => 
        room.title === formModel.title.trim() && 
        room.description === formModel.description.trim()
      );
      
      if (newRoom) {
        console.log('✅ 异常情况下发现新房间，数据库创建成功');
        uni.showToast({ title: '创建成功', icon: 'success' });
        closeModal();
      } else {
        uni.showToast({ title: `创建失败: ${e.message || '请重试'}`, icon: 'none' });
      }
    } catch (refreshError) {
      console.error('❌ 异常情况下刷新列表也失败:', refreshError);
      uni.showToast({ title: `创建失败: ${e.message || '请重试'}`, icon: 'none' });
    }
  } finally {
    isSubmitting.value = false;
    console.log('🏁 创建流程结束，isSubmitting重置为false');
  }
};

const handleUpdateRoom = async () => {
  if (!validateForm()) {
    return;
  }
  
  if (!formModel.id) return;

  // 1. 构建只包含已修改字段的 payload
  const payload: Partial<Room> = {};
  if (formModel.title.trim() !== originalRoomData.title) {
    payload.title = formModel.title.trim();
  }
  if (formModel.description.trim() !== originalRoomData.description) {
    payload.description = formModel.description.trim();
  }

  // 2. 如果没有任何修改，则直接提示成功并关闭
  if (Object.keys(payload).length === 0) {
    closeModal();
    uni.showToast({ title: '没有检测到任何更改', icon: 'none' });
    return;
  }

  isSubmitting.value = true;
  try {
    await roomStore.updateRoom(formModel.id, payload);
    // 操作成功后，先关闭模态框，再刷新列表
    closeModal();
    await roomStore.fetchRooms({ refresh: true });
    uni.showToast({ title: '更新成功', icon: 'success' });
  } catch (e: any) {
    uni.showToast({ title: `更新失败: ${e.message || '请重试'}`, icon: 'none' });
  } finally {
    isSubmitting.value = false;
  }
};

const confirmDelete = async (room: Room) => {
  console.log("a")
  uni.showLoading({ title: '检查中...', mask: true });
  console.log("aa")
  try {
    console.log("aaa")
    const hasSessions = await roomStore.checkRoomHasSessions(room.id);
    console.log("aaaa")
    uni.hideLoading();

    if (hasSessions) {
      console.log("11")
      uni.showModal({
        title: '无法删除',
        content: '该房间下仍有关联的直播场次，请先清空场次后再尝试删除。',
        showCancel: false,
      });
    } else {
      console.log("12")
      uni.showModal({
        title: '确认删除',
        content: `您确定要删除房间"${room.title}"吗？此操作无法撤销。`,
        success: (res) => {
          if (res.confirm) {
            handleDeleteRoom(room.id);
          }
        },
      });
    }
  } catch (e: any) {
    uni.hideLoading();
    uni.showToast({ title: '检查失败，请重试', icon: 'none' });
  }
};

const handleDeleteRoom = async (roomId: string) => {
  uni.showLoading({ title: '删除中...' });
  try {
    await roomStore.deleteRoom(roomId);
    await roomStore.fetchRooms({ refresh: true });
    uni.hideLoading(); // 确保 hideLoading 在 fetchRooms 之后
    uni.showToast({ title: '删除成功', icon: 'success' });
  } catch (e: any) {
    uni.hideLoading(); // 确保在 catch 分支也能 hideLoading
    uni.showToast({ title: `删除失败: ${e.message || '请重试'}`, icon: 'none' });
  }
};

// 新增场次模态框逻辑
const isSessionModalVisible = ref(false);
const isSessionSubmitting = ref(false);
const currentRoomIdForSession = ref<string | null>(null);

// 手机端操作菜单逻辑
const isActionMenuVisible = ref(false);
const currentRoomForAction = ref<Room | null>(null);
const sessionFormModel = reactive({
  start_time: '',
  end_time: '',
});

// 场次表单错误状态
const startTimeError = ref('');
const endTimeError = ref('');

// 清除场次表单错误
const clearSessionErrors = () => {
  startTimeError.value = '';
  endTimeError.value = '';
};

// 场次表单验证
const validateSessionForm = () => {
  clearSessionErrors();
  let isValid = true;

  // 验证开始时间
  if (!sessionFormModel.start_time.trim()) {
    startTimeError.value = '开始时间不能为空';
    isValid = false;
  } else {
    // 验证时间格式
    const startTime = new Date(sessionFormModel.start_time);
    if (isNaN(startTime.getTime())) {
      startTimeError.value = '请输入有效的时间格式';
      isValid = false;
    } else if (startTime < new Date()) {
      startTimeError.value = '开始时间不能早于当前时间';
      isValid = false;
    }
  }

  // 验证结束时间（如果填写了）
  if (sessionFormModel.end_time.trim()) {
    const endTime = new Date(sessionFormModel.end_time);
    if (isNaN(endTime.getTime())) {
      endTimeError.value = '请输入有效的时间格式';
      isValid = false;
    } else if (sessionFormModel.start_time && new Date(sessionFormModel.start_time) >= endTime) {
      endTimeError.value = '结束时间必须晚于开始时间';
      isValid = false;
    }
  }

  return isValid;
};

const openCreateSessionModal = (roomId: string) => {
  currentRoomIdForSession.value = roomId;
  sessionFormModel.start_time = '';
  sessionFormModel.end_time = '';
  clearSessionErrors();
  isSessionModalVisible.value = true;
};

const closeSessionModal = () => {
  isSessionModalVisible.value = false;
  sessionFormModel.start_time = '';
  sessionFormModel.end_time = '';
  clearSessionErrors();
};

// 手机端操作菜单方法
const openActionMenu = (room: Room) => {
  currentRoomForAction.value = room;
  isActionMenuVisible.value = true;
};

const closeActionMenu = () => {
  isActionMenuVisible.value = false;
  currentRoomForAction.value = null;
};

const handleEditFromMenu = () => {
  if (currentRoomForAction.value) {
    openEditModal(currentRoomForAction.value);
    closeActionMenu();
  }
};

const handleDeleteFromMenu = () => {
  if (currentRoomForAction.value) {
    confirmDelete(currentRoomForAction.value);
    closeActionMenu();
  }
};

const handleCreateSession = async () => {
  if (!validateSessionForm()) {
    return;
  }
  
  if (!currentRoomIdForSession.value) return;
  isSessionSubmitting.value = true;
  try {
    await sessionStore.createSession(currentRoomIdForSession.value, {
      start_time: sessionFormModel.start_time.trim(),
    });
    closeSessionModal();
    uni.showToast({ title: '创建成功', icon: 'success' });
    // 可选：刷新 SessionList
  } catch (e: any) {
    uni.showToast({ title: `创建失败: ${e.message || '请重试'}`, icon: 'none' });
  } finally {
    isSessionSubmitting.value = false;
  }
};

// 4. 页面生命周期
onLoad(() => {
  const authStore = useAuthStore();
  
  console.log('🚀 RoomList页面加载');
  console.log('🔍 当前认证状态:', {
    isAuthenticated: authStore.isAuthenticated,
    token: authStore.token,
    user: authStore.user
  });
  
  // 测试模式：强制清除认证状态（仅用于测试）
  // 取消注释下面这行代码来测试未认证状态
  // authStore.clearAuth();
  
  // 检查URL参数，看是否是从认证回调跳转过来的
  const urlParams = new URLSearchParams(window.location.search);
  const hasToken = urlParams.get('token');
  const isCallback = urlParams.get('callback');
  
  console.log('📋 URL参数检查:', { hasToken, isCallback });
  
  // 统一的房间列表加载逻辑
  const loadRoomList = () => {
    if (authStore.isAuthenticated) {
      console.log('✅ 用户已认证，加载房间列表');
      roomStore.fetchRooms({ refresh: true });
    } else {
      console.log('❌ 用户未认证，跳转到登录页面');
      authStore.forceReauth('/pages/room/new/RoomList');
    }
  };
  
  if (hasToken || isCallback) {
    console.log('✅ 检测到认证回调，等待认证处理');
    // 如果是认证回调，给更多时间让认证流程完成
    setTimeout(loadRoomList, 3000); // 给3秒时间
  } else {
    // 正常访问，延迟检查认证状态
    setTimeout(loadRoomList, 2000); // 延迟2秒检查
  }
});

onPullDownRefresh(async () => {
  await roomStore.fetchRooms({ refresh: true });
  uni.stopPullDownRefresh();
});

onReachBottom(() => {
  if (pagination.value.hasMore && !loading.value) {
    roomStore.fetchRooms();
  }
});

const jumpPage = ref(1);

// 计算最大页数
const maxPage = computed(() => {
  if (pagination.value.total && pagination.value.size) {
    return Math.ceil(pagination.value.total / pagination.value.size);
  }
  return 1;
});

// 分页控制方法
const goPrevPage = () => {
  if (pagination.value.page > 1) {
    roomStore.fetchRooms({ refresh: true, page: pagination.value.page - 1 });
  }
};

const goNextPage = () => {
  if (pagination.value.hasMore) {
    roomStore.fetchRooms({ refresh: true, page: pagination.value.page + 1 });
  }
};

const goToPage = (page: number) => {
  if (page >= 1 && page <= maxPage.value && page !== pagination.value.page) {
    roomStore.fetchRooms({ refresh: true, page });
  }
};

const jumpToPage = () => {
  if (jumpPage.value >= 1 && jumpPage.value <= maxPage.value) {
    goToPage(jumpPage.value);
  } else {
    uni.showToast({
      title: `请输入1-${maxPage.value}之间的页码`,
      icon: 'none'
    });
  }
};

// 获取中间页码（用于省略号显示）
const getMiddlePages = () => {
  const current = pagination.value.page;
  const total = maxPage.value;
  const pages = [];
  
  if (current <= 3) {
    // 当前页在前3页，显示2-4页
    for (let i = 2; i <= Math.min(4, total - 1); i++) {
      pages.push(i);
    }
  } else if (current >= total - 2) {
    // 当前页在后3页，显示倒数2-4页
    for (let i = Math.max(2, total - 3); i <= total - 1; i++) {
      pages.push(i);
    }
  } else {
    // 当前页在中间，显示当前页前后各1页
    for (let i = current - 1; i <= current + 1; i++) {
      pages.push(i);
    }
  }
  
  return pages;
};

// 获取简单页码（总页数 <= 7 时）
const getSimplePages = () => {
  const pages = [];
  for (let i = 2; i < maxPage.value; i++) {
    pages.push(i);
  }
  return pages;
};

// 获取可见页码（总页数 > 7 时）
const getVisiblePages = () => {
  const current = pagination.value.page;
  const total = maxPage.value;
  const pages = [];
  
  if (current <= 4) {
    // 当前页在前4页，显示2-6页
    for (let i = 2; i <= Math.min(6, total - 1); i++) {
      pages.push(i);
    }
  } else if (current >= total - 3) {
    // 当前页在后4页，显示倒数2-6页
    for (let i = Math.max(2, total - 5); i <= total - 1; i++) {
      pages.push(i);
    }
  } else {
    // 当前页在中间，显示当前页前后各2页
    for (let i = current - 2; i <= current + 2; i++) {
      pages.push(i);
    }
  }
  
  return pages;
};
</script>

<style lang="scss" scoped>
.room-list-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #eaf0f7 100%);
  font-family: var(--font-family-sans-serif);
}

.page-content {
  padding: var(--spacing-md, 16px);
  padding-top: 60px; /* 为顶部用户信息区域留出空间 */
}
.page-title {
  font-size: 22px;
  font-weight: bold;
  text-align: center;
  margin: 24px 0 12px 0;
  color: #222;
  animation: fadeInTitle 0.6s;
}
.content-container {
  max-width: 1150px;
  margin: 0 auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(74,144,226,0.06);
  padding-bottom: 32px;
}
.accordion-list {
  width: 100%;
  padding: 0 0 24px 0;
}
.room-item {
  border-radius: 10px;
  box-shadow: 0 1px 6px rgba(74,144,226,0.04);
  margin: 18px 24px 0 24px;
  background: #f8fafc;
  transition: box-shadow 0.2s;
}
.room-header {
  display: flex;
  align-items: center;
  padding: 18px 24px;
  cursor: pointer;
  user-select: none;
  border-radius: 10px;
  background: #f8fafc;
  transition: background 0.2s;
  
  &:hover {
    background: #f0f6ff;
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(74,144,226,0.1);
  }
  
  &:active {
    transform: translateY(0);
  }
}
.room-title {
  font-size: 18px;
  font-weight: 600;
  color: #222;
  margin-right: 24px;
  flex: 1;
  min-width: 0;
  word-break: break-word;
  white-space: normal;
  line-height: 1.4;
}
.room-actions {
  display: flex;
  gap: 12px;
}

/* 响应式按钮显示 */
.desktop-actions {
  display: flex;
  gap: 12px;
}

.mobile-actions {
  display: none; /* 默认隐藏手机端按钮 */
  gap: 8px;
  align-items: center;
}

.more-button {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;
}

.more-button:hover {
  background-color: #e0e0e0;
}

.more-icon {
  font-size: 18px;
  color: #666;
  font-weight: bold;
  line-height: 1;
}
@keyframes fadeInTitle {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
.accordion-enter-active, .accordion-leave-active {
  transition: all 0.3s cubic-bezier(.25,.8,.25,1);
}
.accordion-enter-from, .accordion-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
/* 分页组件样式 */
.pagination-container {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(74,144,226,0.06);
  padding: 24px;
  margin: 24px;
  max-width: 1150px;
  margin-left: auto;
  margin-right: auto;
}

.pagination-info {
  text-align: center;
  margin-bottom: 20px;
}

.pagination-text {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

/* H5平台分页样式 */
.h5-pagination-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.h5-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
}

.h5-page-numbers {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-wrap: wrap;
}

/* 页码按钮样式 */
.page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d9d9d9;
  background-color: #ffffff;
  color: #333333;
  font-size: 14px;
  font-weight: 400;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  
  &:hover {
    border-color: #40a9ff;
    color: #40a9ff;
  }
  
  &:active {
    transform: translateY(1px);
  }
  
  &.page-btn--active {
    background-color: #1890ff;
    border-color: #1890ff;
    color: #ffffff;
    
    &:hover {
      background-color: #40a9ff;
      border-color: #40a9ff;
      color: #ffffff;
    }
  }
}

/* 导航按钮样式 */
.nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 12px;
  border: 1px solid #d9d9d9;
  background-color: #ffffff;
  color: #333333;
  font-size: 14px;
  font-weight: 400;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  
  &:hover:not(.nav-btn--disabled) {
    border-color: #40a9ff;
    color: #40a9ff;
  }
  
  &:active:not(.nav-btn--disabled) {
    transform: translateY(1px);
  }
  
  &.nav-btn--disabled {
    background-color: #f5f5f5;
    border-color: #d9d9d9;
    color: #bfbfbf;
    cursor: not-allowed;
  }
}

.nav-btn-text {
  font-size: 14px;
  line-height: 1;
}

.page-input-container {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8f9fa;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.page-input-label {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
}

.page-input {
  width: 60px;
  height: 32px;
  text-align: center;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  background-color: #ffffff;
  
  &:focus {
    border-color: #40a9ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
  
  &::placeholder {
    color: #bfbfbf;
    font-size: 12px;
  }
}

.jump-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 12px;
  border: 1px solid #d9d9d9;
  background-color: #ffffff;
  color: #333333;
  font-size: 14px;
  font-weight: 400;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  
  &:hover {
    border-color: #40a9ff;
    color: #40a9ff;
  }
  
  &:active {
    transform: translateY(1px);
  }
}

.page-ellipsis {
  font-size: 16px;
  color: #999;
  padding: 0 8px;
  user-select: none;
}

/* App平台分页样式 */
.app-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  padding: 0 20px;
}

.page-info {
  flex: 1;
  text-align: center;
}

.page-info-text {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

/* 微信小程序分页样式 */
.mp-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  padding: 0 20px;
}

/* 加载更多提示样式 */
.load-more-tip {
  text-align: center;
  padding: 16px;
  margin-top: 16px;
}

.load-more-text {
  font-size: 14px;
  color: #999;
  font-style: italic;
}

.fab-container {
  position: fixed;
  right: 40px;
  bottom: 48px;
  z-index: 100;
  .app-button {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    padding: 0;
    font-size: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(74,144,226,0.18);
  }
}
@media (max-width: 900px) {
  .content-container {
    max-width: 100vw;
    padding-left: 0;
    padding-right: 0;
  }
  .accordion-item {
    margin: 12px 4px 0 4px;
  }
  .accordion-header, .accordion-panel {
    padding-left: 8px;
    padding-right: 8px;
  }
}
@media (max-width: 600px) {
  .content-container {
    max-width: 100vw;
    padding-left: 0;
    padding-right: 0;
  }
  .accordion-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .accordion-title, .accordion-desc {
    margin-right: 0;
    max-width: 100%;
    white-space: normal;
  }
  .accordion-actions {
    justify-content: flex-start;
    gap: 8px;
    margin-top: 8px;
  }
  .fab-container {
    right: 16px;
    bottom: 16px;
  }
  
  /* 分页组件移动端适配 */
  .pagination-container {
    margin: 16px 8px;
    padding: 16px;
  }
  
  /* H5平台移动端适配 */
  .h5-pagination-wrapper {
    gap: 16px;
  }
  
  .h5-pagination {
    flex-direction: column;
    gap: 12px;
  }
  
  .page-input-container {
    order: 2;
    padding: 6px 10px;
  }
  
  .h5-page-numbers {
    gap: 2px;
  }
  
  .page-btn {
    min-width: 28px;
    height: 28px;
    font-size: 12px;
    padding: 0 6px;
  }
  
  .nav-btn {
    height: 28px;
    padding: 0 10px;
    font-size: 12px;
  }
  
  .page-input {
    width: 50px;
    height: 28px;
    font-size: 12px;
  }
  
  .page-input-label {
    font-size: 12px;
  }
  
  .jump-btn {
    height: 28px;
    padding: 0 10px;
    font-size: 12px;
  }
  
  /* App和小程序移动端适配 */
  .app-pagination,
  .mp-pagination {
    padding: 0 10px;
    gap: 12px;
  }
  
  .page-info-text {
    font-size: 14px;
  }
}

/* 手机端响应式布局 */
@media (max-width: 767px) {
  .desktop-actions {
    display: none; /* 隐藏PC端按钮 */
  }
  
  .mobile-actions {
    display: flex; /* 显示手机端按钮 */
  }
  
  .room-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .room-title {
    margin-right: 0;
    margin-bottom: 8px;
    font-size: 16px;
    line-height: 1.4;
    word-break: break-word; /* 允许换行 */
    white-space: normal; /* 允许换行 */
  }
  
  .room-actions {
    width: 100%;
    justify-content: flex-end; /* 改为右对齐 */
    gap: 8px; /* 按钮之间的间距 */
  }
}

/* 操作菜单样式 */
.action-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-menu {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 20px;
  min-width: 280px;
  max-width: 90vw;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.action-menu-header {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.action-menu-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.action-menu-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-menu-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.action-menu-item:hover {
  background-color: #f5f5f5;
}

.action-menu-icon {
  font-size: 20px;
  margin-right: 12px;
}

.action-menu-text {
  font-size: 16px;
  color: #333;
}
</style> 