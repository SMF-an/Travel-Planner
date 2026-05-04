<template>
  <div class="plan-detail">
    <n-card 
      class="detail-card"
      :bordered="false"
      size="large"
    >
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <h1 class="detail-title">{{ store.currentPlan ? store.currentPlan.title : '规划详情' }}</h1>
            <n-tag 
              v-if="store.currentPlan" 
              :type="getStatusType(store.currentPlan.status)"
              size="small"
              class="status-tag"
            >
              {{ getStatusText(store.currentPlan.status) }}
            </n-tag>
          </div>
          <div class="header-actions" v-if="store.currentPlan">
            <n-space :size="12">
              <div class="export-section">
                <n-button
                  type="primary"
                  @click="toggleExportPopover"
                  size="small"
                  class="action-button export-button"
                  :loading="exportLoading"
                  :disabled="exportLoading"
                  ref="exportBtnRef"
                >
                  <template #icon>
                    <n-icon :component="DownloadIcon" />
                  </template>
                  导出行程单
                </n-button>
                <div v-if="showExportPopover" ref="exportPopoverRef" class="export-popover">
                  <n-button size="small" class="export-pop-btn" @click="selectExportFormat('markdown')">
                    <div class="export-pop-inner">
                      <n-icon :component="FileTextIcon" />
                      <span class="export-pop-label">Markdown</span>
                    </div>
                  </n-button>
                  <n-button size="small" class="export-pop-btn" @click="selectExportFormat('pdf')">
                    <div class="export-pop-inner">
                      <n-icon :component="FilePdfIcon" />
                      <span class="export-pop-label">PDF</span>
                    </div>
                  </n-button>
                </div>
              </div>
              <n-button 
                type="primary" 
                @click="navigateToEdit"
                size="small"
                class="action-button"
              >
                <template #icon>
                  <n-icon :component="EditIcon" />
                </template>
                编辑
              </n-button>
              <n-button 
                type="error" 
                @click="handleDelete"
                size="small"
                class="action-button"
              >
                <template #icon>
                  <n-icon :component="DeleteIcon" />
                </template>
                删除
              </n-button>
            </n-space>
          </div>
        </div>
      </template>
      
      <n-spin v-if="store.loading" class="loading-container">
        <template #description>
          <span>加载中...</span>
        </template>
      </n-spin>
      
      <n-result 
        v-else-if="store.error" 
        class="error-container"
        status="error"
        title="加载失败"
        :description="store.error"
      >
        <template #footer>
          <n-space justify="center">
            <n-button type="primary" @click="handleRetry">
              <template #icon>
                <n-icon :component="RefreshIcon" />
              </template>
              重试
            </n-button>
            <n-button @click="navigateToList">
              返回列表
            </n-button>
          </n-space>
        </template>
      </n-result>
      
      <div v-else-if="store.currentPlan" class="detail-content">
        <div class="info-grid">
          <div class="info-row">
            <div class="info-item">
              <n-icon size="18" class="info-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </n-icon>
              <div class="info-content">
                <div class="info-label">目的地</div>
                <div class="info-value">{{ store.currentPlan.destination }}</div>
              </div>
            </div>
            
            <div class="info-item">
              <n-icon size="18" class="info-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
              </n-icon>
              <div class="info-content">
                <div class="info-label">出发地点</div>
                <div class="info-value">{{ store.currentPlan.start_location }}</div>
              </div>
            </div>
          </div>
          
          <div class="info-row">
            <div class="info-item">
              <n-icon size="18" class="info-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </n-icon>
              <div class="info-content">
                <div class="info-label">出行日期</div>
                <div class="info-value">{{ formatDate(store.currentPlan.start_date) }} 至 {{ formatDate(store.currentPlan.end_date) }}</div>
              </div>
            </div>
            
            <div class="info-item">
              <n-icon size="18" class="info-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line><circle cx="12" cy="12" r="10"></circle></svg>
              </n-icon>
              <div class="info-content">
                <div class="info-label">预算范围</div>
                <div class="info-value">¥{{ store.currentPlan.budget_min }} - ¥{{ store.currentPlan.budget_max }}</div>
              </div>
            </div>
          </div>
          
          <div class="info-row">
            <div class="info-item">
              <n-icon size="18" class="info-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </n-icon>
              <div class="info-content">
                <div class="info-label">出行人数</div>
                <div class="info-value">{{ store.currentPlan.num_people }}人</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h3 class="section-title">出行偏好</h3>
          <div class="preferences">
            <n-tag 
              v-for="(preference, index) in store.currentPlan.preferences" 
              :key="index" 
              type="info" 
              class="preference-tag"
              size="small"
            >
              {{ preference }}
            </n-tag>
            <div v-if="store.currentPlan.preferences.length === 0" class="empty-text">暂无偏好设置</div>
          </div>
        </div>
        
        <div class="section">
          <h3 class="section-title">规划描述</h3>
          <div class="description-card">
            {{ store.currentPlan.description || '暂无描述' }}
          </div>
        </div>
        
        <div class="section">
          <TripTimeline
            :items="scheduledLocations"
            :weather-by-location-id="weatherByLocationId"
            :loading="timelineLoading"
            :loading-more="timelineLoadingMore"
            :has-more="timelineHasMore"
            :error="timelineError"
            :page-size="10"
            @load-more="handleLoadMore"
            @retry="loadTimeline"
          />
        </div>
        
        <p class="updated-at">最后更新时间：{{ formatDateTime(store.currentPlan.updated_at) }}</p>
        
        <div class="action-section">
          <n-button 
            type="default" 
            @click="navigateToList"
            size="large"
            class="back-button"
          >
            <template #icon>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"></path><path d="m12 19-7-7 7-7"></path></svg>
            </template>
            返回列表
          </n-button>
        </div>
      </div>
      
      <n-empty v-else class="empty-container" description="规划不存在">
        <template #extra>
          <n-button type="primary" @click="navigateToList">
            返回列表
          </n-button>
        </template>
      </n-empty>
    </n-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, h } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useTravelPlanStore } from '../stores/travelPlan';
import { useLocationStore } from '../stores/location';
import { useWeatherStore } from '../stores/weather';
import { formatPlainDate } from '../utils/date';
import { NCard, NButton, NSpin, NEmpty, NTag, NIcon, NSpace, NResult } from 'naive-ui';
import { useMessage } from 'naive-ui';
import TripTimeline from '../components/TripTimeline.vue';
import { exportUtils } from '../utils/exportUtils';

// 图标组件
const EditIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '18',
      height: '18',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round'
    }, [
      h('path', { d: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' }),
      h('path', { d: 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' })
    ]);
  }
};

const DeleteIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '18',
      height: '18',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round'
    }, [
      h('path', { d: 'M3 6h18' }),
      h('path', { d: 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' }),
      h('path', { d: 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' }),
      h('line', { x1: '10', y1: '11', x2: '10', y2: '17' }),
      h('line', { x1: '14', y1: '11', x2: '14', y2: '17' })
    ]);
  }
};

const DownloadIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '18',
      height: '18',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round'
    }, [
      h('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }),
      h('polyline', { points: '7 10 12 15 17 10' }),
      h('line', { x1: '12', y1: '15', x2: '12', y2: '3' })
    ]);
  }
};

const RefreshIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '18',
      height: '18',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round'
    }, [
      h('polyline', { points: '23 4 23 10 17 10' }),
      h('polyline', { points: '1 20 1 14 7 14' }),
      h('path', { d: 'M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15' })
    ]);
  }
};

const router = useRouter();
const route = useRoute();
const store = useTravelPlanStore();
const locationStore = useLocationStore();
const weatherStore = useWeatherStore();
const NMessage = useMessage();

const planId = computed(() => route.params.id);

const getPlanId = () => {
  return planId.value;
};

const timelineLoading = ref(false);
const timelineLoadingMore = ref(false);
const timelineHasMore = ref(false);
const timelineError = ref(null);
const weatherByLocationId = ref({});

// 导出相关
const exportLoading = ref(false);
const showExportPopover = ref(false);
const exportBtnRef = ref(null);
const exportPopoverRef = ref(null);

const onDocumentKeydown = (event) => {
  if (event.key === 'Escape') {
    showExportPopover.value = false;
  }
};

const onDocumentClick = (event) => {
  if (!showExportPopover.value) return;

  const popover = exportPopoverRef.value;
  const button = exportBtnRef.value;
  const target = event.target;

  if (popover && (popover === target || (popover.contains && popover.contains(target)))) {
    return;
  }

  if (button && (button === target || (button.$el && button.$el.contains && button.$el.contains(target)) || (button.contains && button.contains(target)))) {
    return;
  }

  showExportPopover.value = false;
};

const toggleExportPopover = () => {
  showExportPopover.value = !showExportPopover.value;
};

watch(showExportPopover, (visible) => {
  if (visible) {
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onDocumentKeydown);
  } else {
    document.removeEventListener('click', onDocumentClick);
    document.removeEventListener('keydown', onDocumentKeydown);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick);
  document.removeEventListener('keydown', onDocumentKeydown);
});

const scheduledLocations = computed(() => {
  return locationStore.locations
    .filter(loc => loc.visit_date && loc.visit_time_slot)
    .sort((a, b) => {
      const dateCompare = a.visit_date.localeCompare(b.visit_date);
      if (dateCompare !== 0) return dateCompare;
      const slotOrder = { '上午': 0, '下午': 1, '晚上': 2 };
      return (slotOrder[a.visit_time_slot] || 0) - (slotOrder[b.visit_time_slot] || 0);
    });
});

const loadTimeline = async () => {
  timelineLoading.value = true;
  timelineError.value = null;
  try {
    await locationStore.fetchPlanLocations(getPlanId());
    await loadTimelineWeather();
    timelineHasMore.value = scheduledLocations.value.length > 10;
  } catch (err) {
    timelineError.value = '加载行程失败，请重试';
    console.error('Timeline load error:', err);
  } finally {
    timelineLoading.value = false;
  }
};

const handleLoadMore = () => {
  if (timelineLoadingMore.value) return;
  timelineLoadingMore.value = true;
  setTimeout(() => {
    timelineHasMore.value = false;
    timelineLoadingMore.value = false;
  }, 500);
};

const loadTimelineWeather = async () => {
  const nextWeatherMap = {};
  const jobs = scheduledLocations.value.map(async (item) => {
    const lat = item?.location?.latitude;
    const lon = item?.location?.longitude;
    if (lat == null || lon == null) return;
    try {
      const weatherData = await weatherStore.fetchWeatherData(lat, lon);
      nextWeatherMap[item.id] = weatherData;
    } catch (error) {
      console.error('Load timeline weather failed:', item.id, error);
    }
  });
  await Promise.allSettled(jobs);
  weatherByLocationId.value = nextWeatherMap;
};

// 格式化日期
const formatDate = (dateString) => {
  return formatPlainDate(dateString);
};

// 格式化日期时间
const formatDateTime = (dateTimeString) => {
  return new Date(dateTimeString).toLocaleString();
};

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    draft: '草稿',
    in_progress: '进行中',
    completed: '已完成',
    archived: '已归档'
  };
  return statusMap[status] || status;
};

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    draft: 'info',
    in_progress: 'warning',
    completed: 'success',
    archived: 'default'
  };
  return typeMap[status] || 'default';
};

// 导航到编辑页面
const navigateToEdit = () => {
  router.push({ name: 'PlanEdit', params: { id: getPlanId() } });
};

// 导航到列表页面
const navigateToList = () => {
  router.push({ name: 'PlanList' });
};

// 删除规划
const handleDelete = async () => {
  if (confirm('确定要删除这个规划吗？')) {
    try {
      await store.deletePlan(getPlanId());
      alert('删除成功');
      router.push({ name: 'PlanList' });
    } catch (err) {
      alert('删除失败，请重试');
    }
  }
};

// 重试加载
const handleRetry = async () => {
  await store.fetchPlan(getPlanId());
  if (store.currentPlan) {
    await loadTimeline();
  }
};

// 导出行程单
const handleExport = async (format) => {
  if (!store.currentPlan) {
    NMessage.error('没有可导出的规划数据');
    return;
  }

  exportLoading.value = true;
  NMessage.info('正在导出，请稍候...');

  try {
    const planData = store.currentPlan;
    const locations = locationStore.locations;

    if (format === 'markdown') {
      const result = await exportUtils.downloadTripMarkdown(planData, locations);
      NMessage.success(`导出成功！文件已保存到浏览器下载目录`);
      console.log('Markdown导出成功:', result);
    } else if (format === 'pdf') {
      const result = await exportUtils.downloadTripPdf(planData, locations);
      NMessage.success(`导出成功！文件已保存到浏览器下载目录`);
      console.log('PDF导出成功:', result);
    }
  } catch (error) {
    console.error('导出失败:', error);
    NMessage.error(`导出失败：${error.message || '未知错误'}`);
  } finally {
    exportLoading.value = false;
  }
};

const selectExportFormat = async (format) => {
  showExportPopover.value = false;
  await handleExport(format);
};

// 加载规划详情和地点
onMounted(async () => {
  if (!getPlanId()) {
    store.error = '规划不存在';
    return;
  }

  await store.fetchPlan(getPlanId());
  await loadTimeline();
});
</script>

<style scoped>
.plan-detail {
  width: 100%;
}

.detail-card {
  box-shadow: var(--shadow-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-normal);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  animation: cardAppear 0.4s ease-out;
}

.detail-card:hover {
  box-shadow: var(--shadow-hover);
}

@keyframes cardAppear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 28px 32px;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(135deg, rgba(139, 157, 195, 0.05) 0%, rgba(212, 165, 165, 0.05) 100%);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.detail-title {
  font-size: 26px;
  font-weight: 700;
  margin: 0;
  color: var(--color-text);
  letter-spacing: 0.5px;
}

.status-tag {
  font-size: 13px;
  padding: 4px 12px;
  border-radius: var(--radius-sm);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-button {
  border-radius: var(--radius-sm);
  transition: var(--transition-normal);
  font-weight: 500;
  padding: 10px 20px;
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.export-section {
  position: relative;
  display: flex;
  align-items: center;
}

.export-button {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
}

.export-button:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.export-popover {
  position: absolute;
  top: 42px;
  left: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px;
  background: transparent;
  z-index: 40;
}

.export-pop-btn {
  min-width: 140px;
  height: 40px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 12px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: none;
  cursor: pointer;
  gap: 10px;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.export-pop-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
}

.export-pop-inner {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
}

.export-pop-btn :deep(.n-icon) {
  font-size: 18px;
  color: var(--color-text);
}

.export-pop-label {
  font-size: 13px;
  color: var(--color-text);
  font-weight: 600;
  line-height: 1;
}

.loading-container {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-container {
  padding: 60px 0;
}

@media (max-width: 768px) {
  .export-popover {
    display: none;
  }
}

.detail-content {
  padding: 32px;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 40px;
}

.info-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 18px;
  background-color: var(--color-background);
  border-radius: var(--radius-md);
  transition: var(--transition-normal);
  border: 1px solid transparent;
  animation: infoItemAppear 0.3s ease-out;
}

.info-item:hover {
  background-color: #ECEAE8;
  border-color: var(--color-border);
  transform: translateY(-2px);
  box-shadow: var(--shadow-card);
}

.info-icon {
  color: var(--color-primary);
  flex-shrink: 0;
  margin-top: 2px;
}

.info-content {
  flex: 1;
}

.info-label {
  font-size: 13px;
  color: var(--color-text-light);
  margin-bottom: 6px;
  font-weight: 500;
}

.info-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--color-primary);
  display: inline-block;
}

.preferences {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.preference-tag {
  border-radius: var(--radius-sm);
  font-size: 13px;
  padding: 6px 14px;
  background: linear-gradient(135deg, rgba(139, 157, 195, 0.1) 0%, rgba(159, 193, 169, 0.1) 100%);
  border: 1px solid var(--color-border);
}

.empty-text {
  color: var(--color-text-light);
  font-style: italic;
}

.description-card {
  padding: 24px;
  background-color: var(--color-background);
  border-radius: var(--radius-md);
  line-height: 1.7;
  color: var(--color-text);
  min-height: 120px;
  border-left: 4px solid var(--color-primary);
  box-shadow: var(--shadow-card);
}

.locations-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.location-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background-color: var(--color-background);
  border-radius: var(--radius-md);
  transition: var(--transition-normal);
  border: 1px solid transparent;
  animation: infoItemAppear 0.3s ease-out;
}

.location-item:hover {
  background-color: #ECEAE8;
  border-color: var(--color-border);
  transform: translateY(-2px);
  box-shadow: var(--shadow-card);
}

.location-index {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.location-info {
  flex: 1;
}

.location-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 6px;
}

.location-address {
  font-size: 14px;
  color: var(--color-text-light);
  margin-bottom: 8px;
  line-height: 1.5;
}

.location-notes {
  font-size: 14px;
  color: var(--color-text);
  font-style: italic;
  padding-top: 8px;
  border-top: 1px solid var(--color-border);
  line-height: 1.5;
}

.updated-at {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--color-text-light);
}

.action-section {
  margin-top: 48px;
  padding-top: 32px;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-start;
}

.back-button {
  border-radius: var(--radius-sm);
  padding: 12px 28px;
  transition: var(--transition-normal);
  font-weight: 500;
  font-size: 14px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.back-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
  border-color: var(--color-primary);
}

.empty-container {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
    padding: 20px;
  }
  
  .header-actions {
    align-self: flex-start;
  }
  
  .info-row {
    grid-template-columns: 1fr;
  }
  
  .detail-content {
    padding: 20px;
  }
  
  .detail-title {
    font-size: 22px;
  }
}

/* 延迟动画 */
.info-item:nth-child(1) { animation-delay: 0.1s; }
.info-item:nth-child(2) { animation-delay: 0.2s; }
.info-item:nth-child(3) { animation-delay: 0.3s; }
.info-item:nth-child(4) { animation-delay: 0.4s; }
.info-item:nth-child(5) { animation-delay: 0.5s; }
.info-item:nth-child(6) { animation-delay: 0.6s; }

.location-item:nth-child(1) { animation-delay: 0.1s; }
.location-item:nth-child(2) { animation-delay: 0.2s; }
.location-item:nth-child(3) { animation-delay: 0.3s; }
.location-item:nth-child(4) { animation-delay: 0.4s; }
.location-item:nth-child(5) { animation-delay: 0.5s; }
.location-item:nth-child(6) { animation-delay: 0.6s; }
.location-item:nth-child(7) { animation-delay: 0.7s; }
.location-item:nth-child(8) { animation-delay: 0.8s; }
.location-item:nth-child(9) { animation-delay: 0.9s; }
.location-item:nth-child(10) { animation-delay: 1.0s; }
</style>
