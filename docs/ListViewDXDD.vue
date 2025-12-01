<template>
  <div class="list-view-root">
    <!-- 顶部大图 Banner：取列表第一个记录的封面 -->
    <div class="banner" v-if="records.length > 0">
      <img
        :src="records[0]!.thumbnail"
        :alt="records[0]!.title"
        class="banner-img"
        @error="handleImageError"
      />
    </div>

    <!-- 页签区域：只有 isTabbedModule 为 true 时显示 -->
    <div v-if="isTabbedModule" class="tabs-wrapper">
      <div
        v-for="g in groups"
        :key="g"
        class="tab-item"
        :class="{ active: g === activeGroup }"
        @click="activeGroup = g"
      >
        {{ g }}
      </div>
    </div>

    <div class="card-list">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else>
        <div
          v-for="room in filteredRecords"
          :key="room.id"
          class="live-card"
          @click="goPlay(room)"
        >
          <img
            :src="room.thumbnail"
            :alt="room.title"
            class="live-thumb"
            @error="handleImageError"
          />
          <div class="live-info">
            <div class="live-title">{{ room.title }}</div>
            <div class="live-meta">
              <div class="meta-date">{{ room.date }}</div>
              <div class="meta-views">{{ room.views }} 热度</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useRouter } from 'vue-router';
import { loadDXDDModuleCSV } from '../../../utils/dxddModuleList';
import type { LiveRecord } from '../../../utils/csv';

const route = useRoute();
const records = ref<LiveRecord[]>([]);
const loading = ref(true);

// 当前模块索引
const moduleIndex = computed(() => route.params.moduleIndex as string);

// 是否为“带页签”的模块：只要有一条记录的 group 不为空就算带页签
const isTabbedModule = computed(() =>
  records.value.some((r: any) => (r as any).group && (r as any).group !== '')
);

// 所有页签（所属模块）列表
const groups = computed<string[]>(() => {
  const set = new Set<string>();
  records.value.forEach((r: any) => {
    const g = (r as any).group as string | undefined;
    if (g && g.trim()) {
      set.add(g.trim());
    }
  });
  return Array.from(set);
});

// 当前激活的所属模块（页签）
const activeGroup = ref<string | undefined>(undefined);

// 当 groups 变化时，如果还没选中，就默认选第一个
watch(
  groups,
  (val) => {
    if (!activeGroup.value && val.length > 0) {
      activeGroup.value = val[0];
    }
  },
  { immediate: true }
);

// 实际渲染用的记录：
// - 带页签且 activeGroup 有值 → 只显示该 group 的记录
// - 否则 → 显示全部 records
const filteredRecords = computed(() => {
  if (!isTabbedModule.value || !activeGroup.value) {
    return records.value;
  }
  return records.value.filter((r: any) => (r as any).group === activeGroup.value);
});

onMounted(async () => {
  try {
    const idx = moduleIndex.value;
    records.value = await loadDXDDModuleCSV(idx);
  } catch (error) {
    console.error('加载数据失败:', error);
  } finally {
    loading.value = false;
  }
});

const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement;
  img.src =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%23999"%3E暂无封面%3C/text%3E%3C/svg%3E';
};

const router = useRouter();

const goPlay = (room: LiveRecord) => {
  router.push({
    name: 'dxddPlayer',
    params: { id: room.id },
    query: { moduleIndex: moduleIndex.value },
  });
};
</script>


<style scoped>
.list-view-root {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.banner {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
.banner-img {
  width: 480px;
  max-width: 90vw;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
}
.tabs-wrapper {
  width: 480px;
  max-width: 95vw;
  margin: 16px auto 12px auto;
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 4px 2px;
}

.tab-item {
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: 16px;
  background: #f5f7fa;
  font-size: 14px;
  color: #606266;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.tab-item:hover {
  background: #ecf5ff;
  color: #409eff;
}

.tab-item.active {
  background: #60affeff;
  color: #fff;
  border-color: #afc8e1ff;
}
.section-title {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 32px 0 24px 0;
}
.section-title .dotline {
  display: inline-block;
  width: 48px;
  border-bottom: 2px dashed #0475e7ff;
  margin: 0 10px;
}
.section-title .title {
  font-size: 24px;
  color: #0475e7ff;
  font-weight: bold;
  letter-spacing: 2px;
}
.card-list {
  width: 480px;
  max-width: 95vw;
  margin: 0 auto 48px auto;
  background: #f3f7fbff;
  padding: 10px;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(4, 117, 231, 0.08);
}
.loading {
  text-align: center;
  padding: 50px;
  font-size: 18px;
  color: #909399;
}
.live-card {
  display: flex;
  align-items: center;
  background: transparent;
  border-radius: 12px;
  box-shadow: none;
  margin-bottom: 0px;
  padding: 8px 10px;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.2s;
}
.live-card:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}
.live-thumb {
  width: 187px;
  height: 105px;
  border-radius: 8px;
  object-fit: cover;
  margin-right: 20px;
  background: #f0f0f0;
}
.live-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.live-title {
  font-size: 16px;
  color: #222;
  font-weight: 600;
  margin-bottom: 10px;
  line-height: 1.5;
  overflow: hidden;
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.live-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
  color: #888;
}
.meta-date {
  color: #888;
}
.meta-views {
  color: #888;
}
</style>