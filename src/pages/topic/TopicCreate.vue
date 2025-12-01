<template>
  <el-container class="topic-create-container">
    <!-- 页面头部 -->
    <el-page-header @back="goBack" :title="isEditMode ? '编辑专题' : '创建专题'">
      <template #extra>
        <el-button 
          type="primary" 
          @click="handleButtonClick" 
          :loading="saving"
        >
          {{ isEditMode ? '保存并发布' : '创建并发布专题' }}
        </el-button>
      </template>
    </el-page-header>

    <!-- 表单区域 -->
    <el-form 
      :model="formData" 
      :rules="formRules" 
      ref="formRef"
      label-width="100px"
      class="topic-form"
    >
      <!-- Banner上传区域 -->
      <el-card class="upload-card">
        <template #header>
          <div class="card-header">
            <span>专题Banner</span>
            <el-text type="info" size="small">建议尺寸：450x200px</el-text>
          </div>
        </template>
        <div class="banner-uploader" @click="selectBannerAndPreview">
          <img v-if="bannerPreviewUrl" :src="bannerPreviewUrl" class="banner-preview" />
          <img v-else-if="formData.banner_url" :src="getCoverSrc(formData.banner_url)" class="banner-preview" />
          <div v-else class="upload-placeholder">
            <el-icon class="upload-icon"><Plus /></el-icon>
            <div class="upload-text">点击选择图片进行本地预览</div>
            <div class="upload-hint">{{ isEditMode ? '选择新图片将替换现有横幅' : '创建成功后上传，最终以后端返回URL展示' }}</div>
          </div>
        </div>
        <div v-if="formData.banner_url" class="upload-actions">
          <el-button size="small" @click="removeBanner">删除图片</el-button>
          <el-button size="small" type="primary" @click="reuploadBanner">重新选择</el-button>
        </div>
      </el-card>

      <!-- 基本信息 -->
      <el-card class="basic-info-card">
        <template #header>
          <span>基本信息</span>
        </template>
        <el-form-item label="专题标题" prop="title">
          <el-input 
            v-model="formData.title" 
            placeholder="请输入专题标题"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="专题描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="4"
            placeholder="请输入专题描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-card>

      <!-- 分类管理区域 -->
      <el-card class="categories-card">
        <template #header>
          <div class="card-header">
            <span>分类管理</span>
            <el-button type="primary" size="small" @click="addCategory">
              <el-icon><Plus /></el-icon>
              添加分类
            </el-button>
          </div>
        </template>
        
        
        
        <div v-if="formData.categories.length === 0" class="empty-categories">
          <el-empty description="暂无分类">
            <el-button type="primary" @click="addCategory">添加第一个分类</el-button>
          </el-empty>
        </div>
        
        <div v-else class="categories-list">
          <el-card
            v-for="(category, index) in formData.categories"
            :key="index"
            class="category-card"
            shadow="hover"
          >
            <div class="category-content">
              <div class="category-header">
                <el-input
                  v-model="category.name"
                  placeholder="请输入分类名称"
                  class="category-name-input"
                  maxlength="20"
                  show-word-limit
                  @blur="onCategoryNameBlur(index)"
                />
                <el-button 
                  size="small" 
                  type="danger" 
                  @click="removeCategory(index)"
                  :disabled="formData.categories.length === 1"
                >
                  删除
                </el-button>
              </div>
              
              <div class="category-info">
                <div class="room-count">
                  <el-icon><VideoPlay /></el-icon>
                  <span>已选择 {{ category.rooms.length }} 个直播间</span>
                </div>
                <el-button 
                  size="small" 
                  type="primary" 
                  @click="openRoomSelection(index)"
                >
                  选择直播间
                </el-button>
              </div>
              
              <!-- 已选择的直播间预览 -->
              <div v-if="category.rooms.length > 0" class="selected-rooms-preview">
                <div class="preview-header">
                  <span>已选择的直播间</span>
                </div>
                <div class="rooms-list">
                  <div
                    v-for="room in category.rooms.slice(0, 3)"
                    :key="room.id"
                    class="room-item"
                  >
                    <el-image
                      :src="getCoverSrc(room.cover_url)"
                      fit="cover"
                      class="room-cover"
                    >
                      <template #error>
                        <div class="image-error">无图片</div>
                      </template>
                    </el-image>
                    <div class="room-info">
                      <div class="room-title">{{ room.title }}</div>
                      <el-tag :type="getStatusType(room.live_status)" size="small">
                        {{ getStatusText(room.live_status) }}
                      </el-tag>
                    </div>
                    <el-button
                      size="small"
                      type="danger"
                      text
                      @click="removeRoomFromCategory(index, room.id)"
                    >
                      <el-icon><Close /></el-icon>
                    </el-button>
                  </div>
                  <div v-if="category.rooms.length > 3" class="more-rooms">
                    +{{ category.rooms.length - 3 }} 个直播间
                  </div>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </el-card>
    </el-form>

    <!-- 直播间选择弹窗 -->
    <RoomSelectionDialog
      v-model:visible="roomSelectionVisible"
      :selected-rooms="currentCategoryRooms"
      :exclude-room-ids="getExcludedRoomIds()"
      @confirm="handleRoomSelection"
    />
  </el-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, VideoPlay, Close } from '@element-plus/icons-vue'
import { useTopicStore } from '@/store/topic'
import { useAuthStore, getToken } from '@/store/auth'
import RoomSelectionDialog from '@/components/RoomSelectionDialog.vue'
import type { TopicCreateForm, CategoryForm, RoomInCategory, RoomAssociation } from '@/types/topic'
// 统一采用与 RoomCreate.vue 一致的做法：先本地预览，真正上传放到后端保存逻辑中
import { BASE_API_URL } from '@/constants/api'

// Store
const topicStore = useTopicStore()
const authStore = useAuthStore()

// 响应式数据
const formRef = ref()
const saving = ref(false)
const isSubmitting = ref(false)
const topicId = ref<string>('')
// 编辑模式状态管理
const isEditMode = ref(false)
const editingTopicId = ref('')
// 映射本地分类索引 -> 后端分类ID（创建成功后填充）
const categoryIds = reactive<Record<number, string>>({})
const roomSelectionVisible = ref(false)
const currentCategoryIndex = ref(-1)

// 表单数据
const formData = reactive<TopicCreateForm>({
  title: '',
  description: '',
  banner_url: '',
  status: 'draft',
  categories: []
})

// Banner 选择的临时路径与本地预览URL（不影响最终 banner_url 展示）
const selectedBannerTempPath = ref<string>('')
const bannerPreviewUrl = ref<string>('')

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入专题标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 500, message: '描述长度不能超过 500 个字符', trigger: 'blur' }
  ]
}

// 计算属性
const currentCategoryRooms = computed(() => {
  if (currentCategoryIndex.value >= 0 && currentCategoryIndex.value < formData.categories.length) {
    return formData.categories[currentCategoryIndex.value].rooms
  }
  return []
})

// 方法
const handleButtonClick = () => {
  console.log('🖱️ [DEBUG] 按钮被点击')
  console.log('📊 [DEBUG] 按钮点击时状态:', {
    isEditMode: isEditMode.value,
    saving: saving.value,
    editingTopicId: editingTopicId.value,
    topicId: topicId.value
  })
  
  if (saving.value) {
    console.log('⚠️ [DEBUG] 正在保存中，忽略点击')
    return
  }
  
  if (isEditMode.value) {
    console.log('✏️ [DEBUG] 执行编辑模式：handleUpdateAndPublish')
    handleUpdateAndPublish()
  } else {
    console.log('➕ [DEBUG] 执行创建模式：handleCreateAndPublish')
    handleCreateAndPublish()
  }
}

const goBack = () => {
  if (hasUnsavedChanges()) {
    ElMessageBox.confirm(
      '您有未保存的更改，确定要离开吗？',
      '确认离开',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      uni.navigateBack()
    }).catch(() => {
      // 用户取消
    })
  } else {
    uni.navigateBack()
  }
}

const hasUnsavedChanges = () => {
  return formData.title || 
         formData.description || 
         formData.banner_url || 
         formData.categories.some(cat => cat.name || cat.rooms.length > 0)
}

const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt10M = file.size / 1024 / 1024 < 10
  const isValidFormat = file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg'

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isValidFormat) {
    ElMessage.error('仅支持上传 PNG, JPG 格式的图片!')
    return false
  }
  if (!isLt10M) {
    ElMessage.error('图片大小不能超过 10MB!')
    return false
  }
  return true
}

const handleUpload = async (options: any) => {
  // 不使用 el-upload 的直传；统一创建成功后再上传
  ElMessage.info('请选择图片进行本地预览，创建成功后将上传')
}

// 选择 Banner 并本地预览（不覆盖 banner_url）
const selectBannerAndPreview = () => {
  uni.chooseImage({
    count: 1,
    success: (chooseRes) => {
      const filePath = chooseRes.tempFilePaths?.[0]
      if (!filePath) return
      
      console.log('选择的文件路径:', filePath)
      console.log('文件路径类型:', typeof filePath)
      
      // 设置预览与待上传的临时路径；不修改 formData.banner_url
      selectedBannerTempPath.value = filePath
      bannerPreviewUrl.value = filePath
      ElMessage.info('已选择图片，创建成功后将上传，并以返回的URL展示')
    },
    fail: () => {
      ElMessage.error('选择图片失败')
    },
  })
}

const removeBanner = () => {
  formData.banner_url = ''
  bannerPreviewUrl.value = ''
  selectedBannerTempPath.value = ''
  ElMessage.success('已删除Banner图片')
}

const reuploadBanner = () => {
  // 统一走选择逻辑
  selectBannerAndPreview()
}

const addCategory = async () => {
  // 先在本地添加占位，若已有 topicId，则立即创建后端分类并记录其ID
  const idx = formData.categories.push({ name: '', rooms: [] }) - 1
  if (!topicId.value) return
  try {
    const name = `未命名分类${formData.categories.length}`
    formData.categories[idx].name = name
    const created = await topicStore.createCategory(topicId.value, { name })
    categoryIds[idx] = created.id
    // 创建后立即回填 rooms 列表
    await refreshCategoryRoomsByIndex(idx)
    ElMessage.success('分类已创建')
  } catch (e: any) {
    ElMessage.error(e?.message || '创建分类失败')
  }
}

const removeCategory = (index: number) => {
  if (formData.categories.length <= 1) {
    ElMessage.warning('至少需要保留一个分类')
    return
  }
  
  ElMessageBox.confirm(
    '确定要删除这个分类吗？分类下的所有直播间将被移除。',
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const cid = categoryIds[index]
    if (cid) {
      topicStore.deleteCategory(cid)
        .then(() => {
          formData.categories.splice(index, 1)
          delete categoryIds[index]
          ElMessage.success('分类已删除')
        })
        .catch((e: any) => ElMessage.error(e?.message || '删除分类失败'))
    } else {
      formData.categories.splice(index, 1)
      delete categoryIds[index]
      ElMessage.success('分类已删除')
    }
  }).catch(() => {
    // 用户取消
  })
}

const openRoomSelection = (index: number) => {
  currentCategoryIndex.value = index
  // 打开前尝试刷新该分类下的已关联直播间
  refreshCategoryRoomsByIndex(index)
  roomSelectionVisible.value = true
}

const handleRoomSelection = async (rooms: RoomInCategory[]) => {
  const idx = currentCategoryIndex.value
  if (idx < 0 || idx >= formData.categories.length) return
  const cid = categoryIds[idx]
  if (!cid) {
    // 仅本地保存，提交时统一落库
    formData.categories[idx].rooms = rooms.map((r, i) => ({ ...r, sort_order: i + 1 }))
    ElMessage.success(`已选择 ${rooms.length} 个直播间`)
    roomSelectionVisible.value = false
    return
  }
  // 已有后端分类ID：直接落库
  const associations: RoomAssociation[] = rooms.map((r, i) => ({ room_id: r.id, sort_order: i + 1 }))
  try {
    await topicStore.addRoomsToCategory(cid, associations)
    await refreshCategoryRoomsByIndex(idx)
    ElMessage.success(`已关联 ${rooms.length} 个直播间`)
  } catch (e: any) {
    ElMessage.error(e?.message || '关联直播间失败')
  }
}

const removeRoomFromCategory = async (categoryIndex: number, roomId: string) => {
  const cid = categoryIds[categoryIndex]
  if (!cid) {
    // 本地未创建到后端，直接本地移除
    const category = formData.categories[categoryIndex]
    category.rooms = category.rooms.filter(room => room.id !== roomId)
    ElMessage.success('已移除直播间')
    return
  }
  try {
    await topicStore.removeRoomsFromCategory(cid, [roomId])
    await refreshCategoryRoomsByIndex(categoryIndex)
    ElMessage.success('已移除直播间')
  } catch (e: any) {
    ElMessage.error(e?.message || '移除直播间失败')
  }
}

const getExcludedRoomIds = () => {
  const excludedIds: string[] = []
  formData.categories.forEach(category => {
    category.rooms.forEach(room => {
      excludedIds.push(room.id)
    })
  })
  return excludedIds
}

const getCoverSrc = (url?: string | null) => {
  if (!url) return '/public/logo.png'
  if (/^https?:\/\//.test(url)) return url
  const base = BASE_API_URL.replace(/\/+$/, '')
  const origin = base.replace(/\/api\/.*/, '')
  return origin + (url.startsWith('/') ? url : '/' + url)
}

const getStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    'live': 'success',
    'scheduled': 'primary',
    'ended': 'info',
    'archived': 'warning'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'live': '直播中',
    'scheduled': '计划中',
    'ended': '已结束',
    'archived': '已归档'
  }
  return statusMap[status] || '未知'
}

const validateForm = () => {
  return new Promise((resolve, reject) => {
    formRef.value.validate((valid: boolean) => {
      if (valid) {
        resolve(true)
      } else {
        reject(new Error('表单验证失败'))
      }
    })
  })
}

// 发布前的额外校验：至少一个分类且有直播间
const validateBeforePublish = () => {
  // 分类存在
  if (!formData.categories.length) throw new Error('请至少添加一个分类')
  // 分类名有效
  for (let i = 0; i < formData.categories.length; i++) {
    const category = formData.categories[i]
    if (!category.name || !category.name.trim()) throw new Error(`第 ${i + 1} 个分类的名称不能为空`)
  }
  // 至少一个直播间
  const hasRooms = formData.categories.some(category => category.rooms.length > 0)
  if (!hasRooms) throw new Error('请至少为一个分类添加直播间')
}

const handleSaveDraft = async () => {
  try {
    await validateForm()
    
    saving.value = true
    formData.status = 'draft'
    
    // 已有 topicId 则更新，否则创建
    if (topicId.value) {
      await topicStore.updateTopic(topicId.value, {
        title: formData.title,
        description: formData.description,
        banner_url: formData.banner_url,
        status: 'draft',
      } as any)
    } else {
      const result = await topicStore.createTopic({
        title: formData.title,
        description: formData.description,
        banner_url: formData.banner_url,
        status: 'draft',
        // categories 在后端是单独接口创建，这里不提交，避免 500
      } as any)
      topicId.value = result.id
    }
    // 若选择了本地 Banner，创建成功后上传并用后端返回 URL 覆盖
    if (selectedBannerTempPath.value) {
      try {
        await uploadBannerToServer(result.id, selectedBannerTempPath.value)
        ElMessage.success('Banner 已上传')
        // 清理本地预览
        bannerPreviewUrl.value = ''
        selectedBannerTempPath.value = ''
      } catch (e: any) {
        console.error('Banner 上传失败:', e)
        ElMessage.warning(e?.message || 'Banner 上传失败，可稍后在管理页重试')
      }
    }
    // 同步现有本地分类到后端（如果用户在创建前已输入）
    await syncLocalCategoriesToServer()
    await loadCategories()
    ElMessage.success('专题草稿保存成功，您现在可以管理分类和直播间了')
  } catch (error: any) {
    console.error('保存草稿失败:', error)
    ElMessage.error(error.message || '保存草稿失败')
  } finally {
    saving.value = false
  }
}

const handlePublish = async () => {
  try {
    await validateForm()
    
    saving.value = true
    formData.status = 'published'

    // 如果已创建过专题，则只更新状态为 published；否则创建
    if (topicId.value) {
      await topicStore.updateTopic(topicId.value, {
        title: formData.title,
        description: formData.description,
        banner_url: formData.banner_url,
        status: 'published',
      } as any)
    } else {
      const created = await topicStore.createTopic({
        title: formData.title,
        description: formData.description,
        banner_url: formData.banner_url,
        status: 'published',
      } as any)
      topicId.value = created.id
    }

    // 若选择了本地 Banner，创建/更新成功后上传并用后端返回 URL 覆盖
    if (selectedBannerTempPath.value && topicId.value) {
      try {
        await uploadBannerToServer(topicId.value, selectedBannerTempPath.value)
        ElMessage.success('Banner 已上传')
        // 清理本地预览
        bannerPreviewUrl.value = ''
        selectedBannerTempPath.value = ''
      } catch (e: any) {
        console.error('Banner 上传失败:', e)
        ElMessage.warning(e?.message || 'Banner 上传失败，可稍后在管理页重试')
      }
    }
    // 发布前同步/校验分类与直播间
    await syncLocalCategoriesToServer()
    await loadCategories()
    validateBeforePublish()
    
    ElMessage.success('专题发布成功')
    uni.navigateTo({
      url: `/pages/topic/TopicDisplay?topic_id=${topicId.value}`
    })
  } catch (error: any) {
    console.error('发布专题失败:', error)
    ElMessage.error(error.message || '发布专题失败')
  } finally {
    saving.value = false
  }
}

// 上传 Banner 到服务端，使用与封面一致的鉴权与返回值约定
const uploadBannerToServer = (topicId: string, filePath: string) => {
  return new Promise<void>((resolve, reject) => {
    const token = getToken()
    const uploadUrl = `${BASE_API_URL.replace(/\/+$/, '')}/topics/${topicId}/banner`
    
    console.log('上传横幅图到:', uploadUrl)
    console.log('文件路径:', filePath)
    console.log('专题ID:', topicId)
    
    uni.uploadFile({
      url: uploadUrl,
      filePath,
      name: 'file',
      header: {
        Authorization: `Bearer ${token || ''}`,
      },
      success: (res) => {
        console.log('上传响应:', res)
        try {
          const body = JSON.parse(res.data || '{}')
          console.log('解析后的响应体:', body)
          
          const ok = res.statusCode >= 200 && res.statusCode < 300 && (body?.code === 0 || body?.code === 200)
          if (ok) {
            // 根据新的API响应格式获取banner_url
            const returnedUrl = body?.data?.banner_url
            if (returnedUrl) {
              formData.banner_url = returnedUrl
              console.log('横幅图上传成功，banner_url:', returnedUrl)
              return resolve()
            }
            // 没有返回url也按失败处理，避免页面仍用默认图
            return reject(new Error('上传成功但未返回banner_url'))
          }
          
          // 处理具体的错误信息
          const errorMessage = body?.message || body?.data?.file || `上传失败(${res.statusCode})`
          reject(new Error(errorMessage))
        } catch (e) {
          console.error('响应解析失败:', e)
          reject(new Error('响应解析失败'))
        }
      },
      fail: (err) => {
        console.error('上传失败:', err)
        reject(err)
      },
    })
  })
}

// 页面加载
onLoad((options) => {
  console.log('📱 [DEBUG] 页面加载，options:', options)
  
  // 检查认证状态
  if (!authStore.isAuthenticated) {
    ElMessage.error('请先登录')
    uni.navigateTo({
      url: '/pages/auth/callback'
    })
    return
  }
  
  // 检查是否为编辑模式
  if (options.topic_id) {
    console.log('✏️ [DEBUG] 编辑模式，topic_id:', options.topic_id)
    
    // 检查 topicId 格式
    if (options.topic_id.includes('9088')) {
      console.error('🚨 [DEBUG] 检测到错误的 topicId 格式，尝试修复')
      const correctedTopicId = options.topic_id.replace('9088', 'a088')
      console.log('🔧 [DEBUG] 修复后的 topicId:', correctedTopicId)
      
      ElMessage.warning('检测到专题ID格式错误，正在修复...')
      setTimeout(() => {
        uni.redirectTo({
          url: `/pages/topic/TopicCreate?topic_id=${correctedTopicId}`
        })
      }, 1000)
      return
    }
    
    isEditMode.value = true
    editingTopicId.value = options.topic_id
    topicId.value = options.topic_id
    loadTopicForEdit(options.topic_id)
  } else {
    console.log('➕ [DEBUG] 创建模式')
    // 创建模式
    isEditMode.value = false
    editingTopicId.value = ''
    
    // 如果有传入的房间ID，可以预填充一些数据
    if (options.room_id) {
      console.log('预填充房间ID:', options.room_id)
      // 可以在这里预填充一些数据
    }
  }
})

// 监听 store.categories 变化，同步到本地 formData 展示
watch(
  () => topicStore.categories,
  (list) => {
    if (!topicId.value || isSubmitting.value) return
    // 将后端分类同步到本地（保持索引一致性尽力而为）
    formData.categories = list.map(c => ({ name: c.name, rooms: c.rooms || [] })) as any
    // 同步映射
    list.forEach((c, i) => { categoryIds[i] = c.id })
  },
  { deep: true }
)

// 加载分类列表
const loadCategories = async () => {
  if (!topicId.value) return
  await topicStore.fetchCategories(topicId.value)
}

// 创建后首次加载分类，填充本地映射
const loadCategoriesAfterCreate = async (id: string) => {
  topicId.value = id
  await loadCategories()
}

// 同步本地尚未创建到后端的分类
const syncLocalCategoriesToServer = async () => {
  if (!topicId.value) return
  for (let i = 0; i < formData.categories.length; i++) {
    if (!categoryIds[i]) {
      const cat = formData.categories[i]
      if (!cat.name || !cat.name.trim()) continue
      try {
        const created = await topicStore.createCategory(topicId.value, { name: cat.name.trim(), sort_order: i })
        categoryIds[i] = created.id
        if ((formData.categories[i].rooms || []).length > 0) {
          const payload: RoomAssociation[] = formData.categories[i].rooms.map((r, idx) => ({ room_id: r.id, sort_order: r.sort_order || idx + 1 }))
          await topicStore.addRoomsToCategory(categoryIds[i], payload)
        }
      } catch (e) {
        // 忽略单个失败，继续其他
      }
    }
  }
}

// 分类名编辑后落库
const onCategoryNameBlur = async (index: number) => {
  const name = formData.categories[index].name?.trim()
  if (!name) return
  const cid = categoryIds[index]
  if (!topicId.value || !cid) return
  try {
    await topicStore.updateCategory(cid, { name })
    ElMessage.success('分类已保存')
  } catch (e: any) {
    console.error('保存分类失败:', e)
    ElMessage.error(`保存分类失败: ${e?.message || '未知错误'}`)
  }
}

// 刷新指定索引分类的房间列表
const refreshCategoryRoomsByIndex = async (index: number) => {
  const cid = categoryIds[index]
  if (!cid) return
  const rooms = await topicStore.fetchCategoryRooms(cid)
  formData.categories[index].rooms = rooms
}

// 编辑模式：加载专题详情
const loadTopicForEdit = async (topicId: string) => {
  console.log('📖 [DEBUG] 开始加载专题详情，topicId:', topicId)
  console.log('🔍 [DEBUG] topicId 格式检查:', {
    topicId: topicId,
    length: topicId ? topicId.length : 'undefined',
    containsA088: topicId ? topicId.includes('a088') : false,
    contains9088: topicId ? topicId.includes('9088') : false
  })
  
  try {
    // 1. 加载专题基本信息
    console.log('📝 [DEBUG] 加载专题基本信息')
    const topicDetail = await topicStore.fetchTopicDetail(topicId)
    console.log('✅ [DEBUG] 专题基本信息加载成功:', topicDetail)
    
    // 填充表单数据
    formData.title = topicDetail.title
    formData.description = topicDetail.description || ''
    formData.banner_url = topicDetail.banner_url || ''
    formData.status = topicDetail.status
    
    // 2. 加载分类列表
    console.log('📂 [DEBUG] 加载分类列表')
    await topicStore.fetchCategories(topicId)
    
    // 3. 为每个分类加载关联的直播间
    console.log('🔗 [DEBUG] 加载分类关联的直播间')
    const categoriesWithRooms = []
    for (const category of topicStore.categories) {
      console.log(`📋 [DEBUG] 加载分类"${category.name}"的直播间`)
      const rooms = await topicStore.fetchCategoryRooms(category.id)
      categoriesWithRooms.push({
        id: category.id,
        name: category.name,
        sort_order: category.sort_order,
        rooms: rooms
      })
    }
    
    // 更新本地分类数据
    formData.categories = categoriesWithRooms
    
    // 4. 建立分类ID映射
    categoriesWithRooms.forEach((cat, index) => {
      categoryIds[index] = cat.id
    })
    
    console.log('✅ [DEBUG] 专题详情加载完成')
    
  } catch (error: any) {
    console.error('❌ [DEBUG] 加载专题详情失败:', error)
    ElMessage.error(error.message || '加载专题详情失败')
  }
}

// 编辑模式：更新专题信息
const handleUpdateAndPublish = async () => {
  console.log('🚀 [DEBUG] 开始执行保存并发布流程')
  console.log('📊 [DEBUG] 当前状态:', {
    isEditMode: isEditMode.value,
    editingTopicId: editingTopicId.value,
    saving: saving.value,
    formData: {
      title: formData.title,
      description: formData.description,
      categoriesCount: formData.categories.length,
      categories: formData.categories.map(c => ({ name: c.name, roomsCount: c.rooms.length }))
    }
  })
  
  try {
    console.log('✅ [DEBUG] 开始表单验证')
    await validateForm()
    console.log('✅ [DEBUG] 表单验证通过')
    
    console.log('✅ [DEBUG] 开始发布前校验')
    validateBeforePublish()
    console.log('✅ [DEBUG] 发布前校验通过')
    
    console.log('🔄 [DEBUG] 设置loading状态')
    saving.value = true
    
    // 1. 更新专题基本信息
    console.log('📝 [DEBUG] 开始更新专题基本信息')
    try {
      const updateData = {
        title: formData.title,
        description: formData.description,
        banner_url: formData.banner_url,
        status: formData.status
      }
      console.log('📤 [DEBUG] 发送更新数据:', updateData)
      
      await topicStore.updateTopic(editingTopicId.value, updateData)
      console.log('✅ [DEBUG] 专题基本信息更新成功')
    } catch (error: any) {
      console.error('❌ [DEBUG] 更新专题基本信息失败:', error)
      ElMessage.error(`更新专题失败: ${error.message || '未知错误'}`)
      saving.value = false // 确保清除loading状态
      return // 提前返回，不继续执行后续步骤
    }
    
    // 2. 处理横幅图上传（如果用户选择了新图片）
    if (selectedBannerTempPath.value) {
      console.log('🖼️ [DEBUG] 开始上传横幅图')
      try {
        await uploadBannerToServer(editingTopicId.value, selectedBannerTempPath.value)
        ElMessage.success('横幅图已更新')
        bannerPreviewUrl.value = ''
        selectedBannerTempPath.value = ''
        console.log('✅ [DEBUG] 横幅图上传成功')
      } catch (e: any) {
        console.error('⚠️ [DEBUG] 横幅图上传失败:', e)
        ElMessage.warning(`横幅图上传失败: ${e?.message || '未知错误'}，可稍后重试`)
        // 横幅图上传失败不阻止整个更新流程
      }
    }
    
    // 3. 处理分类更新
    console.log('📂 [DEBUG] 开始分类同步')
    try {
      await syncCategoriesForEdit()
      console.log('✅ [DEBUG] 分类同步成功')
    } catch (error: any) {
      console.error('❌ [DEBUG] 分类同步失败:', error)
      // 检查是否是移除操作失败，如果是则不阻止整个流程
      if (error.message && error.message.includes('移除直播间失败')) {
        console.warn('⚠️ [DEBUG] 移除直播间失败，但其他操作可能成功，继续执行')
        ElMessage.warning('部分操作失败，但主要更新已完成')
      } else {
        ElMessage.error(`分类更新失败: ${error.message || '未知错误'}`)
        saving.value = false // 确保清除loading状态
        return // 提前返回，不继续执行后续步骤
      }
    }
    
    console.log('🎉 [DEBUG] 所有操作完成，准备跳转')
    ElMessage.success('专题更新成功')
    uni.navigateTo({
      url: `/pages/topic/TopicDisplay?topic_id=${editingTopicId.value}`
    })
    
  } catch (error: any) {
    console.error('💥 [DEBUG] 更新专题失败:', error)
    ElMessage.error(`更新专题失败: ${error.message || '未知错误'}`)
  } finally {
    console.log('🏁 [DEBUG] 清除loading状态')
    saving.value = false
  }
}

// 编辑模式：分类同步逻辑
const syncCategoriesForEdit = async () => {
  const topicId = editingTopicId.value
  console.log(' [DEBUG] 开始分类同步，topicId:', topicId)
  console.log(' [DEBUG] topicId 类型检查:', {
    topicId: topicId,
    type: typeof topicId,
    length: topicId ? topicId.length : 'undefined',
    editingTopicId: editingTopicId.value,
    editingTopicIdType: typeof editingTopicId.value
  })
  
  // 验证 topicId 格式
  if (!topicId || typeof topicId !== 'string') {
    console.error('❌ [DEBUG] topicId 无效:', topicId)
    throw new Error('专题ID无效')
  }
  
  // 检查 topicId 是否包含错误字符
  if (topicId.includes('9088')) {
    console.error('🚨 [DEBUG] 检测到错误的 topicId 格式:', topicId)
    console.error('🚨 [DEBUG] 应该是 a088 而不是 9088')
    throw new Error('专题ID格式错误，请刷新页面重试')
  }
  
  try {
    // 获取当前后端分类列表
    console.log('🔍 [DEBUG] 准备调用 fetchCategories，参数:', topicId)
    const currentCategories = await topicStore.fetchCategories(topicId)
    console.log('📋 [DEBUG] fetchCategories 返回结果:', {
      result: currentCategories,
      type: typeof currentCategories,
      isArray: Array.isArray(currentCategories),
      length: currentCategories ? currentCategories.length : 'undefined'
    })
    
    if (!currentCategories || !Array.isArray(currentCategories)) {
      console.error('❌ [DEBUG] fetchCategories 返回无效数据:', currentCategories)
      
      // 尝试从store中获取分类数据
      console.log('🔄 [DEBUG] 尝试从store中获取分类数据:', topicStore.categories)
      if (topicStore.categories && Array.isArray(topicStore.categories)) {
        console.log('✅ [DEBUG] 使用store中的分类数据')
        const currentCategoryIds = topicStore.categories.map(cat => cat.id)
        console.log('📋 [DEBUG] 当前后端分类:', topicStore.categories.map(c => ({ id: c.id, name: c.name })))
        
        // 继续处理分类更新
        console.log('🔄 [DEBUG] 开始处理分类更新，本地分类数量:', formData.categories.length)
        for (let i = 0; i < formData.categories.length; i++) {
          const localCategory = formData.categories[i]
          const categoryId = categoryIds[i]
          
          console.log(`📝 [DEBUG] 处理第${i+1}个分类:`, {
            name: localCategory.name,
            categoryId: categoryId,
            roomsCount: localCategory.rooms.length,
            rooms: localCategory.rooms.map(r => ({ id: r.id, title: r.title }))
          })
          
          if (categoryId) {
            // 更新现有分类
            console.log(`✏️ [DEBUG] 更新现有分类: ${localCategory.name}`)
            try {
              await topicStore.updateCategory(categoryId, {
                name: localCategory.name,
                sort_order: i
              })
              console.log(`✅ [DEBUG] 分类"${localCategory.name}"更新成功`)
            } catch (error: any) {
              console.error(`❌ [DEBUG] 更新分类 ${localCategory.name} 失败:`, error)
              throw new Error(`更新分类"${localCategory.name}"失败: ${error.message || '未知错误'}`)
            }
            
            // 更新分类下的直播间关联
            console.log(`🔗 [DEBUG] 同步分类"${localCategory.name}"的直播间`)
            try {
              await syncCategoryRooms(categoryId, localCategory.rooms)
              console.log(`✅ [DEBUG] 分类"${localCategory.name}"直播间同步成功`)
            } catch (error: any) {
              console.error(`❌ [DEBUG] 同步分类"${localCategory.name}"的直播间失败:`, error)
              throw new Error(`同步分类"${localCategory.name}"的直播间失败: ${error.message || '未知错误'}`)
            }
          } else {
            // 创建新分类
            console.log(`➕ [DEBUG] 创建新分类: ${localCategory.name}`)
            try {
              const created = await topicStore.createCategory(topicId, {
                name: localCategory.name,
                sort_order: i
              })
              categoryIds[i] = created.id
              console.log(`✅ [DEBUG] 分类"${localCategory.name}"创建成功，ID: ${created.id}`)
            } catch (error: any) {
              console.error(`❌ [DEBUG] 创建分类"${localCategory.name}"失败:`, error)
              throw new Error(`创建分类"${localCategory.name}"失败: ${error.message || '未知错误'}`)
            }
            
            // 关联直播间
            if (localCategory.rooms.length > 0) {
              console.log(`🔗 [DEBUG] 为新分类"${localCategory.name}"关联直播间`)
              try {
                const associations = localCategory.rooms.map((room, idx) => ({
                  room_id: room.id,
                  sort_order: room.sort_order || idx + 1
                }))
                console.log('📤 [DEBUG] 发送关联数据:', associations)
                await topicStore.addRoomsToCategory(created.id, associations)
                console.log(`✅ [DEBUG] 分类"${localCategory.name}"直播间关联成功`)
              } catch (error: any) {
                console.error(`❌ [DEBUG] 为分类"${localCategory.name}"添加直播间失败:`, error)
                throw new Error(`为分类"${localCategory.name}"添加直播间失败: ${error.message || '未知错误'}`)
              }
            }
          }
        }
        
        // 删除不再需要的分类
        console.log('🗑️ [DEBUG] 检查需要删除的分类')
        const localCategoryIds = Object.values(categoryIds).filter(Boolean)
        const toDelete = currentCategoryIds.filter(id => !localCategoryIds.includes(id))
        console.log('📋 [DEBUG] 需要删除的分类ID:', toDelete)
        
        for (const categoryId of toDelete) {
          console.log(`🗑️ [DEBUG] 删除分类ID: ${categoryId}`)
          try {
            await topicStore.deleteCategory(categoryId)
            console.log(`✅ [DEBUG] 分类ID ${categoryId} 删除成功`)
          } catch (error: any) {
            console.error(`⚠️ [DEBUG] 删除分类失败:`, error)
            // 删除分类失败不阻止整个流程，但记录错误
            ElMessage.warning(`删除分类失败: ${error.message || '未知错误'}，但不影响整体更新`)
          }
        }
        
        console.log('✅ [DEBUG] 分类同步完成')
        return // 成功完成，直接返回
      } else {
        throw new Error('获取分类列表失败，返回数据格式错误')
      }
    }
    
    const currentCategoryIds = currentCategories.map(cat => cat.id)
    console.log('📋 [DEBUG] 当前后端分类:', currentCategories.map(c => ({ id: c.id, name: c.name })))
    
    // 处理分类更新
    console.log('🔄 [DEBUG] 开始处理分类更新，本地分类数量:', formData.categories.length)
    for (let i = 0; i < formData.categories.length; i++) {
      const localCategory = formData.categories[i]
      const categoryId = categoryIds[i]
      
      console.log(`📝 [DEBUG] 处理第${i+1}个分类:`, {
        name: localCategory.name,
        categoryId: categoryId,
        roomsCount: localCategory.rooms.length,
        rooms: localCategory.rooms.map(r => ({ id: r.id, title: r.title }))
      })
      
      if (categoryId) {
        // 更新现有分类
        console.log(`✏️ [DEBUG] 更新现有分类: ${localCategory.name}`)
        try {
          await topicStore.updateCategory(categoryId, {
            name: localCategory.name,
            sort_order: i
          })
          console.log(`✅ [DEBUG] 分类"${localCategory.name}"更新成功`)
        } catch (error: any) {
          console.error(`❌ [DEBUG] 更新分类 ${localCategory.name} 失败:`, error)
          throw new Error(`更新分类"${localCategory.name}"失败: ${error.message || '未知错误'}`)
        }
        
        // 更新分类下的直播间关联
        console.log(`🔗 [DEBUG] 同步分类"${localCategory.name}"的直播间`)
        try {
          await syncCategoryRooms(categoryId, localCategory.rooms)
          console.log(`✅ [DEBUG] 分类"${localCategory.name}"直播间同步成功`)
        } catch (error: any) {
          console.error(`❌ [DEBUG] 同步分类"${localCategory.name}"的直播间失败:`, error)
          throw new Error(`同步分类"${localCategory.name}"的直播间失败: ${error.message || '未知错误'}`)
        }
      } else {
        // 创建新分类
        console.log(`➕ [DEBUG] 创建新分类: ${localCategory.name}`)
        try {
          const created = await topicStore.createCategory(topicId, {
            name: localCategory.name,
            sort_order: i
          })
          categoryIds[i] = created.id
          console.log(`✅ [DEBUG] 分类"${localCategory.name}"创建成功，ID: ${created.id}`)
        } catch (error: any) {
          console.error(`❌ [DEBUG] 创建分类"${localCategory.name}"失败:`, error)
          throw new Error(`创建分类"${localCategory.name}"失败: ${error.message || '未知错误'}`)
        }
        
        // 关联直播间
        if (localCategory.rooms.length > 0) {
          console.log(`🔗 [DEBUG] 为新分类"${localCategory.name}"关联直播间`)
          try {
            const associations = localCategory.rooms.map((room, idx) => ({
              room_id: room.id,
              sort_order: room.sort_order || idx + 1
            }))
            console.log('📤 [DEBUG] 发送关联数据:', associations)
            await topicStore.addRoomsToCategory(created.id, associations)
            console.log(`✅ [DEBUG] 分类"${localCategory.name}"直播间关联成功`)
          } catch (error: any) {
            console.error(`❌ [DEBUG] 为分类"${localCategory.name}"添加直播间失败:`, error)
            throw new Error(`为分类"${localCategory.name}"添加直播间失败: ${error.message || '未知错误'}`)
          }
        }
      }
    }
    
    // 删除不再需要的分类
    console.log('🗑️ [DEBUG] 检查需要删除的分类')
    const localCategoryIds = Object.values(categoryIds).filter(Boolean)
    const toDelete = currentCategoryIds.filter(id => !localCategoryIds.includes(id))
    console.log('📋 [DEBUG] 需要删除的分类ID:', toDelete)
    
    for (const categoryId of toDelete) {
      console.log(`🗑️ [DEBUG] 删除分类ID: ${categoryId}`)
      try {
        await topicStore.deleteCategory(categoryId)
        console.log(`✅ [DEBUG] 分类ID ${categoryId} 删除成功`)
      } catch (error: any) {
        console.error(`⚠️ [DEBUG] 删除分类失败:`, error)
        // 删除分类失败不阻止整个流程，但记录错误
        ElMessage.warning(`删除分类失败: ${error.message || '未知错误'}，但不影响整体更新`)
      }
    }
    
    console.log('✅ [DEBUG] 分类同步完成')
  } catch (error: any) {
    console.error('💥 [DEBUG] 分类同步失败:', error)
    throw error // 重新抛出错误，让上层处理
  }
}

// 编辑模式：同步分类下的直播间
const syncCategoryRooms = async (categoryId: string, rooms: RoomInCategory[]) => {
  console.log('🔗 [DEBUG] 开始同步分类直播间，categoryId:', categoryId)
  console.log('📋 [DEBUG] 目标直播间:', rooms.map(r => ({ id: r.id, title: r.title })))
  
  try {
    // 获取当前分类的直播间
    console.log('🔍 [DEBUG] 获取当前分类的直播间')
    const currentRooms = await topicStore.fetchCategoryRooms(categoryId)
    const currentRoomIds = currentRooms.map(room => room.id)
    console.log('📋 [DEBUG] 当前分类直播间:', currentRooms.map(r => ({ id: r.id, title: r.title })))
    
    // 要添加的直播间
    const newRoomIds = rooms.map(room => room.id)
    const toAdd = newRoomIds.filter(id => !currentRoomIds.includes(id))
    const toRemove = currentRoomIds.filter(id => !newRoomIds.includes(id))
    
    console.log('📊 [DEBUG] 直播间变更分析:', {
      toAdd: toAdd,
      toRemove: toRemove,
      toAddCount: toAdd.length,
      toRemoveCount: toRemove.length
    })
    
    // 添加新直播间
    if (toAdd.length > 0) {
      console.log('➕ [DEBUG] 开始添加直播间:', toAdd)
      try {
        const associations = toAdd.map((roomId, idx) => ({
          room_id: roomId,
          sort_order: rooms.find(r => r.id === roomId)?.sort_order || idx + 1
        }))
        console.log('📤 [DEBUG] 发送添加关联数据:', associations)
        await topicStore.addRoomsToCategory(categoryId, associations)
        console.log('✅ [DEBUG] 直播间添加成功')
      } catch (error: any) {
        console.error('❌ [DEBUG] 添加直播间失败:', error)
        console.error('📋 [DEBUG] 错误详情:', {
          categoryId,
          toAdd,
          associations,
          errorMessage: error.message,
          errorResponse: error.response || error.data
        })
        throw new Error(`添加直播间失败: ${error.message || '未知错误'}`)
      }
    }
    
    // 移除不需要的直播间
    if (toRemove.length > 0) {
      console.log('➖ [DEBUG] 开始移除直播间:', toRemove)
      try {
        console.log('📤 [DEBUG] 发送移除请求，room_ids:', toRemove)
        await topicStore.removeRoomsFromCategory(categoryId, toRemove)
        console.log('✅ [DEBUG] 直播间移除成功')
      } catch (error: any) {
        console.error('❌ [DEBUG] 移除直播间失败:', error)
        console.error('📋 [DEBUG] 错误详情:', {
          categoryId,
          toRemove,
          errorMessage: error.message,
          errorResponse: error.response || error.data,
          errorStatus: error.status || error.statusCode
        })
        
        // 特别处理422错误
        if (error.message && error.message.includes('422')) {
          console.error('🚨 [DEBUG] 422错误详情分析:', {
            categoryId,
            roomIds: toRemove,
            possibleReasons: [
              '直播间不存在于该分类中',
              '直播间正在直播中，不允许移除',
              '分类下只剩最后一个直播间',
              '权限不足'
            ]
          })
          
          // 422错误不阻止整个流程，只显示警告
          console.warn('⚠️ [DEBUG] 移除直播间失败，但不影响整体更新，继续执行')
          ElMessage.warning(`移除直播间失败: ${error.message || '未知错误'}，但不影响整体更新`)
          return // 直接返回，不抛出错误
        }
        
        // 其他错误仍然抛出
        throw new Error(`移除直播间失败: ${error.message || '未知错误'}`)
      }
    }
    
    console.log('✅ [DEBUG] 直播间同步完成')
  } catch (error: any) {
    console.error('💥 [DEBUG] 直播间同步失败:', error)
    throw error // 重新抛出错误，让上层处理
  }
}

// 一次性创建并发布
const handleCreateAndPublish = async () => {
  try {
    await validateForm()
    validateBeforePublish()

    saving.value = true
    isSubmitting.value = true
    const created = await topicStore.createTopic({
      title: formData.title,
      description: formData.description,
      banner_url: formData.banner_url,
      status: 'published',
    } as any)
    topicId.value = created.id

    if (selectedBannerTempPath.value) {
      try {
        await uploadBannerToServer(created.id, selectedBannerTempPath.value)
        // 上传成功后，优先用后端返回的 banner_url；若仍无，则继续显示本地预览
        if (!formData.banner_url && bannerPreviewUrl.value) {
          // 保持预览，防止页面看起来像"丢失"
        } else {
          bannerPreviewUrl.value = ''
          selectedBannerTempPath.value = ''
        }
      } catch (e: any) {
        console.error('Banner 上传失败:', e)
        ElMessage.warning(e?.message || 'Banner 上传失败，可在管理页重试')
      }
    }

    for (let i = 0; i < formData.categories.length; i++) {
      try {
        const cat = formData.categories[i]
        if (!categoryIds[i]) {
          if (!cat.name || !cat.name.trim()) continue
          const createdCat = await topicStore.createCategory(topicId.value, { name: cat.name.trim(), sort_order: i })
          categoryIds[i] = createdCat.id
        }
        const cid = categoryIds[i]
        const payload: RoomAssociation[] = (cat.rooms || []).map((r, idx) => ({ room_id: r.id, sort_order: r.sort_order || idx + 1 }))
        if (cid && payload.length) {
          await topicStore.addRoomsToCategory(cid, payload)
        }
      } catch (e: any) {
        console.error('[TopicCreate] 同步分类失败：', { index: i, name: formData.categories[i]?.name, payload: (formData.categories[i]?.rooms||[]).map(r=>({id:r.id})), error: e })
        ElMessage.warning(e?.message || `第 ${i + 1} 个分类同步失败，已跳过`)
        continue
      }
    }

    // 提交完成后拉取一次服务端分类，核验数量
    await loadCategories()
    if (topicStore.categories.length !== formData.categories.length) {
      console.warn('[TopicCreate] 分类数量不一致', {
        localCount: formData.categories.length,
        serverCount: topicStore.categories.length,
        localNames: formData.categories.map(c=>c.name),
        serverNames: topicStore.categories.map((c:any)=>c.name),
      })
      ElMessage.warning(`后端仅保存了 ${topicStore.categories.length}/${formData.categories.length} 个分类，请检查日志或后端验证规则`)
    }

    ElMessage.success('专题发布成功')
    uni.navigateTo({ url: `/pages/topic/TopicDisplay?topic_id=${topicId.value}` })
  } catch (error: any) {
    ElMessage.error(error?.message || '创建并发布失败')
  } finally {
    saving.value = false
    isSubmitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.topic-create-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
}

.topic-form {
  max-width: 1200px;
  margin: 0 auto;
}

.upload-card,
.basic-info-card,
.categories-card {
  margin-bottom: 20px;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}

.banner-uploader {
  width: 100%;
  
  .banner-preview {
    width: 100%;
    max-height: 300px;
    object-fit: cover;
    border-radius: 8px;
  }
  
  .upload-placeholder {
    width: 100%;
    height: 200px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 2px dashed #d9d9d9;
    border-radius: 8px;
    background-color: #fafafa;
    transition: all 0.3s;
    
    &:hover {
      border-color: #409eff;
      background-color: #f0f9ff;
    }
    
    .upload-icon {
      font-size: 48px;
      color: #c0c4cc;
      margin-bottom: 16px;
    }
    
    .upload-text {
      font-size: 16px;
      color: #606266;
      margin-bottom: 8px;
    }
    
    .upload-hint {
      font-size: 12px;
      color: #909399;
    }
  }
}

.upload-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.empty-categories {
  text-align: center;
  padding: 40px 0;
}

.categories-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.category-card {
  .category-content {
    .category-header {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      
      .category-name-input {
        flex: 1;
      }
    }
    
    .category-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      
      .room-count {
        display: flex;
        align-items: center;
        gap: 4px;
        color: #606266;
        font-size: 14px;
      }
    }
    
    .selected-rooms-preview {
      .preview-header {
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        margin-bottom: 8px;
      }
      
      .rooms-list {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        
        .room-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
          background-color: #f5f7fa;
          border-radius: 6px;
          border: 1px solid #e4e7ed;
          
          .room-cover {
            width: 40px;
            height: 30px;
            border-radius: 4px;
            
            .image-error {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 100%;
              height: 100%;
              background-color: #f0f0f0;
              color: #c0c4cc;
              font-size: 12px;
            }
          }
          
          .room-info {
            flex: 1;
            min-width: 0;
            
            .room-title {
              font-size: 12px;
              color: #303133;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              margin-bottom: 4px;
            }
          }
        }
        
        .more-rooms {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          background-color: #e4e7ed;
          color: #606266;
          border-radius: 6px;
          font-size: 12px;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .topic-create-container {
    padding: 12px;
  }
  
  .category-card {
    .category-content {
      .category-header {
        flex-direction: column;
        gap: 8px;
      }
      
      .category-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
      
      .selected-rooms-preview {
        .rooms-list {
          .room-item {
            width: 100%;
          }
        }
      }
    }
  }
}
</style>
