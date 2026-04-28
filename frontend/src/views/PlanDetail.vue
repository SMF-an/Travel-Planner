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
          </div>
        </div>
      </template>
      
      <n-spin v-if="store.loading" class="loading-container">
        <template #description>
          <span>加载中...</span>
        </template>
      </n-spin>
      
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
import { ref, computed, onMounted, h } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useTravelPlanStore } from '../stores/travelPlan';
import { useLocationStore } from '../stores/location';
import { useWeatherStore } from '../stores/weather';
import { NCard, NButton, NSpin, NEmpty, NTag, NIcon } from 'naive-ui';
import TripTimeline from '../components/TripTimeline.vue';

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

const router = useRouter();
const route = useRoute();
const store = useTravelPlanStore();
const locationStore = useLocationStore();
const weatherStore = useWeatherStore();

const planId = route.params.id;

const timelineLoading = ref(false);
const timelineLoadingMore = ref(false);
const timelineHasMore = ref(false);
const timelineError = ref(null);
const weatherByLocationId = ref({});

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
    await locationStore.fetchPlanLocations(planId);
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
  return new Date(dateString).toLocaleDateString();
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
  router.push({ name: 'PlanEdit', params: { id: planId } });
};

// 导航到列表页面
const navigateToList = () => {
  router.push({ name: 'PlanList' });
};

// 删除规划
const handleDelete = async () => {
  if (confirm('确定要删除这个规划吗？')) {
    try {
      await store.deletePlan(planId);
      alert('删除成功');
      router.push({ name: 'PlanList' });
    } catch (err) {
      alert('删除失败，请重试');
    }
  }
};

// 加载规划详情和地点
onMounted(async () => {
  await store.fetchPlan(planId);
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

.loading-container {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
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
