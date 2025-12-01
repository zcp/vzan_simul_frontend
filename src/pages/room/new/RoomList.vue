<template>
  <AdminLayout>
    <div class="room-list-container">
    <!-- 1. 信息提示条 -->
      <el-alert type="info" :closable="false" show-icon>
        <template #title>
          <div class="alert-content">
            <span>当前直播间分数：100分（正常）</span>
            <a href="#" @click.prevent="showComingSoonToast">查看分数明细</a>
          </div>
        </template>
      </el-alert>

      <!-- 2. 统一的操作/标签/搜索区域 -->
      <el-card>
        <el-row justify="space-between" align="middle">
          <el-col>
            <el-space :size="8">
              <el-button type="primary" @click="goToCreatePage">创建直播</el-button>
              <el-button @click="showComingSoonToast">批量创建直播</el-button>
              <el-button :icon="Setting" @click="showComingSoonToast">直播全局设置</el-button>
              <el-button :icon="Collection" @click="showComingSoonToast">直播教程</el-button>
              <el-button @click="goToTopicList">营销内容</el-button>
            </el-space>
          </el-col>
          <el-col>
            <el-tabs v-model="activeTab">
              <el-tab-pane label="待整改直播内容 (0)" name="1"></el-tab-pane>
              <el-tab-pane label="分类管理" name="2"></el-tab-pane>
              <el-tab-pane label="回收站" name="3"></el-tab-pane>
            </el-tabs>
          </el-col>
        </el-row>
        <el-divider style="margin: 16px 0;" />
        <el-form :inline="true">
          <el-form-item label="所有筛选">
            <el-select style="width: 120px" @change="showComingSoonToast"><el-option label="所有筛选" value="all" /></el-select>
          </el-form-item>
          <el-form-item label="直播名称">
             <el-select style="width: 120px" @change="showComingSoonToast"><el-option label="直播名称" value="name" /></el-select>
          </el-form-item>
          <el-form-item>
            <el-input placeholder="请输入直播名称" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="showComingSoonToast">搜索</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 3. 数据表格 -->
      <el-card>
        <el-alert v-if="hasSelected" type="info" :closable="false" style="margin-bottom: 16px">
            <template #title>
                已选 {{ selectedRows.length }} 条
            </template>
            <el-space :spacer="spacer">
                <el-button type="primary" link size="small" v-for="action in batchActions" :key="action" @click="showComingSoonToast">{{ action }}</el-button>
            </el-space>
        </el-alert>
        <el-table
          v-loading="loading"
          :data="mainRooms"
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" fixed />
          <el-table-column prop="id" label="直播ID" width="140" />
          <el-table-column label="直播" width="350" header-align="center">
            <template #default="{ row }">
              <el-space>
                <el-image style="width: 100px; height: 60px" :src="getCoverSrc(row.cover_url)" fit="cover">
                  <template #error>
                    <div style="width:100px;height:60px;display:flex;align-items:center;justify-content:center;background:#f5f7fa;color:#c0c4cc;font-size:12px">无图片</div>
                  </template>
                </el-image>
                <div>
                  <el-tooltip :content="row.title" placement="top">
                    <p class="room-title">{{ row.title }}</p>
                  </el-tooltip>
                  <el-space :size="4" style="margin-top: 4px">
                    <el-tag :type="row.is_private ? 'warning' : 'success'" size="small">{{ row.is_private ? '加密' : '公开' }}</el-tag>
                    <el-tag type="success" size="small">上架</el-tag>
                  </el-space>
                </div>
              </el-space>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="直播类型" width="120" align="center" />
          <el-table-column prop="format" label="直播形式" width="120" align="center" />
          <el-table-column label="直播状态" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatus(row.status).type">{{ getStatus(row.status).text }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="channel" label="频道" width="150" align="center" />
          <el-table-column label="开始时间" width="180" align="center">
            <template #default="{ row }">
              {{ formatStartTime(row.start_time) }}
            </template>
          </el-table-column>
          <el-table-column prop="category" label="直播分类" width="150" align="center" />
          <el-table-column prop="heat" label="热度" width="100" align="center" />
          <el-table-column prop="sortOrder" label="排序" width="80" align="center" />
          <el-table-column label="操作" width="240" align="right" fixed="right">
            <template #default="{ row }">
              <el-space :size="0" :spacer="spacer">
                <el-button type="primary" link size="small" @click="showComingSoonToast">去开播</el-button>
                <el-button type="primary" link size="small" @click="showComingSoonToast">群发</el-button>
                <el-button type="primary" link size="small" @click="goToRoomDetail(row.id)">管理</el-button>
                <el-dropdown>
                  <el-button type="primary" link size="small">更多<el-icon class="el-icon--right"><arrow-down /></el-icon></el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="goToBasicSettings(row.id)">编辑</el-dropdown-item>
                      <el-dropdown-item @click="confirmDelete(row)">删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </el-space>
            </template>
          </el-table-column>
        </el-table>
        <el-row justify="end" style="margin-top: 16px">
            <el-pagination
                v-if="pagination.total > 0"
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :total="pagination.total"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                @size-change="handlePageSizeChange"
                @current-change="handlePageChange"
            />
        </el-row>
      </el-card>
    </div>

    <!-- 创建/编辑模态框 -->
    <el-dialog v-model="isModalVisible" :title="isEditMode ? '编辑房间' : '创建直播'" width="500px">
        <el-form :model="formModel" label-position="top" style="margin-top: 24px">
            <el-form-item label="房间标题" required :error="titleError">
                <el-input v-model="formModel.title" placeholder="请输入房间标题" />
            </el-form-item>
            <el-form-item label="房间简介" :error="descriptionError">
                <el-input v-model="formModel.description" type="textarea" :rows="4" placeholder="请输入房间简介（选填）" />
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="closeModal">取消</el-button>
            <el-button type="primary" :loading="isSubmitting" @click="handleConfirm">保存</el-button>
        </template>
    </el-dialog>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, h } from 'vue';
import { storeToRefs } from 'pinia';
import { useRoomStore } from '../../../store/room';
import { useSessionStore } from '../../../store/session';
import type { Room } from '../../../types/room';
import type { Session } from '../../../types/session';
import { useAuthStore } from '@/store/auth';
import dayjs from 'dayjs';
import { BASE_API_URL } from '@/constants/api';

// 导入布局和Element Plus组件/图标
import AdminLayout from '@/layouts/AdminLayout.vue';
import { ElMessage, ElMessageBox, ElDivider } from 'element-plus';
import { Setting, Collection, ArrowDown } from '@element-plus/icons-vue';

// --- 静态交互与数据 ---
const activeTab = ref('1');
const batchActions = ['移入分类', '所属频道', '上架', '下架', '回收', '结束', '恢复未开始', '复制', '下载二维码', '下载话题链接'];
const showComingSoonToast = () => ElMessage.info('功能待开发，敬请期待');
const spacer = h(ElDivider, { direction: 'vertical' });

// --- 沿用并适配的核心业务逻辑 ---

// 1. Store 和数据
const roomStore = useRoomStore();
const sessionStore = useSessionStore();
const { rooms, loading, error, pagination } = storeToRefs(roomStore);

// 存储每个房间的最近session信息
const roomSessions = ref<Record<string, Session | null>>({});

// 本地分页状态
const currentPage = ref(1);
const pageSize = ref(10);

// 计算属性：只显示主会场，并包含session信息
const mainRooms = computed(() => rooms.value.map(room => {
    const latestSession = roomSessions.value[room.id];
    return {
        ...room,
        // 使用session数据或默认值
        start_time: latestSession?.start_time || null,
        status: latestSession?.status || 'unknown',
        // Mock data for UI display
        type: '视频直播',
        format: '直播',
        channel: '--',
        category: '--',
        heat: 100,
        sortOrder: '1',
    };
}));

// 跳转到房间管理页
const goToRoomDetail = (roomId: string) => uni.navigateTo({ url: `/pages/room/new/RoomManage?room_id=${roomId}` });

// 跳转到基础设置页（代替原来的弹窗编辑）
const goToBasicSettings = (roomId: string) => {
  if (!roomId) return;
  uni.navigateTo({ url: `/pages/room/new/RoomBasicSettings?room_id=${roomId}` });
};

// 跳转到新建直播页面
const goToCreatePage = () => uni.navigateTo({ url: '/pages/room/new/RoomCreate' });
// 跳转到营销内容（展示所有专题）
const goToTopicList = () => uni.navigateTo({ url: '/pages/topic/TopicList' });
// 统一封面地址
function getCoverSrc(url?: string | null) {
  const u = (url || '').toString();
  if (!u) return '/public/logo.png';
  if (/^https?:\/\//.test(u)) return u;
  const base = BASE_API_URL.replace(/\/+$/, '');
  const origin = base.replace(/\/api\/.*/, '');
  return origin + (u.startsWith('/') ? u : '/' + u);
}

// 获取每个房间的最近session
const fetchLatestSessions = async () => {
  console.log('🔍 开始获取session数据，房间数量:', rooms.value.length);
  
  for (const room of rooms.value) {
    try {
      console.log(`📡 正在获取房间 ${room.id} 的session数据...`);
      await sessionStore.fetchSessionsByRoomId(room.id, { refresh: true });
      const sessions = sessionStore.sessions;
      console.log(`📊 房间 ${room.id} 的session数据:`, sessions);
      
      if (sessions.length > 0) {
        // 按开始时间排序，获取最近的session
        const sortedSessions = sessions.sort((a, b) => {
          const timeA = new Date(a.start_time).getTime();
          const timeB = new Date(b.start_time).getTime();
          return timeB - timeA; // 降序，最新的在前
        });
        const latestSession = sortedSessions[0];
        console.log(`✅ 房间 ${room.id} 的最近session:`, latestSession);
        roomSessions.value[room.id] = latestSession;
      } else {
        console.log(`❌ 房间 ${room.id} 没有session数据`);
        roomSessions.value[room.id] = null;
      }
    } catch (error) {
      console.error(`❌ 获取房间 ${room.id} 的session失败:`, error);
      roomSessions.value[room.id] = null;
    }
  }
  
  console.log('📋 最终roomSessions数据:', roomSessions.value);
};

// 2. 表格行选择
const selectedRows = ref<Room[]>([]);
const hasSelected = computed(() => selectedRows.value.length > 0);
const handleSelectionChange = (selection: Room[]) => selectedRows.value = selection;

// 3. 模态框与表单逻辑（仅用于“创建直播”，编辑改为跳转单独页面）
const isModalVisible = ref(false);
const isSubmitting = ref(false);
const titleError = ref('');
const descriptionError = ref('');
const formModel = reactive({ id: null as string | null, title: '', description: '' });
const originalRoomData = reactive({ title: '', description: '' });
const isEditMode = ref(false);

const validateForm = () => {
  let isValid = true;
  titleError.value = '';
  descriptionError.value = '';
  if (!formModel.title.trim()) {
    titleError.value = '房间标题不能为空';
    isValid = false;
  } else if (formModel.title.trim().length > 50) {
    titleError.value = '房间标题不能超过50个字符';
    isValid = false;
  }
  if (formModel.description && formModel.description.length > 200) {
    descriptionError.value = '房间简介不能超过200个字符';
    isValid = false;
  }
  return isValid;
};

// 新建弹窗
const openCreateModal = () => {
  isEditMode.value = false;
  Object.assign(formModel, { id: null, title: '', description: '' });
  Object.assign(originalRoomData, { title: '', description: '' });
  isModalVisible.value = true;
};

const closeModal = () => isModalVisible.value = false;

const handleConfirm = async () => {
  if (!validateForm()) return;
  isSubmitting.value = true;
  try {
    // 这里只处理“创建直播”，编辑已经改为跳转 RoomBasicSettings
    await roomStore.addNewRoom({
      title: formModel.title.trim(),
      description: formModel.description.trim() || undefined,
    } as any);
    ElMessage.success('创建成功');
    // 创建成功后刷新session信息
    await roomStore.fetchRooms({ refresh: true, page: pagination.value.page });
    await fetchLatestSessions();
    closeModal();
  } catch (e: any) {
    ElMessage.error(`操作失败: ${e.message || '请重试'}`);
  } finally {
    isSubmitting.value = false;
  }
};

// 4. 删除逻辑
const confirmDelete = (room: Room) => {
  ElMessageBox.confirm(
    `您确定要删除房间“${room.title}”吗？此操作无法撤销。`,
    '确认删除',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => handleDeleteRoom(room.id));
};

const handleDeleteRoom = async (roomId: string) => {
  try {
    await roomStore.deleteRoom(roomId);
    ElMessage.success('删除成功');
    // 删除成功后跳转到第一页
    currentPage.value = 1;
    await roomStore.fetchRooms({ refresh: true, page: 1 });
    // 重新获取session信息
    await fetchLatestSessions();
  } catch (e: any) {
    ElMessage.error(`删除失败: ${e.message || '请重试'}`);
    // 即使删除失败，也刷新列表以确保数据一致性
    currentPage.value = 1;
    await roomStore.fetchRooms({ refresh: true, page: 1 });
    await fetchLatestSessions();
  }
};

// 5. 分页处理
const handlePageChange = async (page: number) => {
  currentPage.value = page;
  await roomStore.fetchRooms({ refresh: true, page });
  await fetchLatestSessions();
};
const handlePageSizeChange = async (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  await roomStore.fetchRooms({ refresh: true, page: 1, size });
  await fetchLatestSessions();
};

// 6. 状态显示辅助函数
const getStatus = (status: string | undefined) => {
    if (!status) return { type: 'info', text: '未知' };
    const map: Record<string, { type: 'success' | 'warning' | 'info' | 'danger', text: string }> = {
        scheduled: { type: 'warning', text: '未开始' },
        live: { type: 'success', text: '直播中' },
        finished: { type: 'info', text: '已结束' },
        processing: { type: 'warning', text: '转码中' },
        ready: { type: 'success', text: '可回放' },
        error: { type: 'danger', text: '异常' },
        archived: { type: 'info', text: '已归档' }
    };
    return map[status] || { type: 'info', text: status };
};

// 时间格式化函数
const formatStartTime = (startTime: string | null | undefined) => {
  if (!startTime) return 'N/A';
  
  try {
    // 清理日期字符串，移除微秒和重复的时区标识符
    let cleanTime = startTime;
    
    // 移除微秒部分（6位数字）
    cleanTime = cleanTime.replace(/\.\d{6}/, '');
    
    // 修复重复的时区标识符（+00:00Z -> Z）
    cleanTime = cleanTime.replace(/\+00:00Z$/, 'Z');
    
    console.log('🔧 原始时间:', startTime);
    console.log('🔧 清理后时间:', cleanTime);
    
    const date = dayjs(cleanTime);
    if (date.isValid()) {
      return date.format('YYYY-MM-DD HH:mm:ss');
    } else {
      console.warn('Invalid date format after cleaning:', cleanTime);
      return 'Invalid Date';
    }
  } catch (error) {
    console.error('Date formatting error:', error, 'for time:', startTime);
    return 'Invalid Date';
  }
};

// 7. 页面生命周期
watch(() => useAuthStore().isAuthenticated, async (isAuth) => {
    if(isAuth) {
        // 重置分页状态
        currentPage.value = 1;
        pageSize.value = 10;
        await roomStore.fetchRooms({ refresh: true });
        // 获取房间列表后，获取每个房间的session信息
        await fetchLatestSessions();
    }
}, { immediate: true });

</script>

<style scoped>
.room-list-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.room-list-container :deep(.el-card) {
  --el-card-padding: 12px;
}

.room-title {
  margin: 0;
  font-weight: 500;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.el-table th.el-table__cell) {
  background-color:rgb(244, 244, 244) !important;
}

:deep(.el-table__cell) {
  padding: 2px;
}

.room-list-container :deep(.el-alert) {
  background-color:rgb(229, 240, 255) !important;
}

.room-list-container :deep(.el-alert__content) {
  flex: 1;
}

.alert-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  font-weight: bold; /* 字体加粗 */
}

.alert-content span {
  color: #303133; /* 设置分数为深灰色/黑色 */
}

.alert-content a {
  color: #409EFF; /* 设置链接为蓝色 */
  text-decoration: none; /* 去掉下划线 */
  font-weight: bold; /* 字体加粗 */
}
</style>