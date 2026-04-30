<template>
  <div class="plan-list">
    <div class="list-header">
      <h1 class="page-title">出行规划列表</h1>
      <n-button 
        type="primary" 
        @click="navigateToCreate"
        class="create-button"
      >
        <template #icon>
          <n-icon :component="PlusIcon" />
        </template>
        创建规划
      </n-button>
    </div>
    
    <div class="search-section">
      <n-input
        v-model:value="searchQuery"
        placeholder="搜索规划标题或目的地"
        clearable
        @input="handleSearch"
        class="search-input"
      >
        <template #prefix>
          <n-icon size="16">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </n-icon>
        </template>
      </n-input>
    </div>
    
    <div v-if="store.loading" class="loading-container">
      <n-spin size="large" />
      <p class="loading-text">加载中...</p>
    </div>
    
    <div v-else-if="filteredPlans.length === 0" class="empty-container">
      <n-empty 
        description="暂无规划"
        class="empty-state"
      >
        <template #extra>
          <n-button type="primary" @click="navigateToCreate">
            <template #icon>
              <n-icon :component="PlusIcon" />
            </template>
            创建第一个规划
          </n-button>
        </template>
      </n-empty>
    </div>
    
    <div v-else class="plans-grid">
      <n-card 
        v-for="plan in filteredPlans" 
        :key="plan.id"
        class="plan-card"
        :bordered="false"
        :hoverable="true"
        size="small"
      >
        <template #header>
          <div class="card-header">
            <h3 class="card-title">{{ plan.title }}</h3>
            <n-tag 
              :type="getStatusType(plan.status)"
              size="small"
            >
              {{ getStatusText(plan.status) }}
            </n-tag>
          </div>
        </template>
        
        <div class="card-content">
          <div class="info-item">
            <n-icon size="14">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            </n-icon>
            <span class="label">目的地：</span>
            <span class="value">{{ plan.destination }}</span>
          </div>
          
          <div class="info-item">
            <n-icon size="14">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </n-icon>
            <span class="label">日期：</span>
            <span class="value">{{ formatDate(plan.start_date) }} 至 {{ formatDate(plan.end_date) }}</span>
          </div>
          
          <div class="info-item">
            <n-icon size="14">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line><circle cx="12" cy="12" r="10"></circle></svg>
            </n-icon>
            <span class="label">预算：</span>
            <span class="value">¥{{ plan.budget_min }} - ¥{{ plan.budget_max }}</span>
          </div>
          
          <div class="info-item">
            <n-icon size="14">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </n-icon>
            <span class="label">人数：</span>
            <span class="value">{{ plan.num_people }}人</span>
          </div>
        </div>
        
        <template #footer>
          <div class="card-actions">
            <n-button 
              type="default" 
              size="small"
              @click="navigateToDetail(plan.id)"
              class="action-button"
            >
              <template #icon>
                <n-icon :component="ViewIcon" />
              </template>
              查看
            </n-button>
            <n-button 
              type="primary" 
              size="small"
              @click="navigateToEdit(plan.id)"
              class="action-button"
            >
              <template #icon>
                <n-icon :component="EditIcon" />
              </template>
              编辑
            </n-button>
            <n-button 
              type="error" 
              size="small"
              @click="handleDelete(plan.id)"
              class="action-button"
            >
              <template #icon>
                <n-icon :component="DeleteIcon" />
              </template>
              删除
            </n-button>
          </div>
        </template>
      </n-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import { useTravelPlanStore } from '../stores/travelPlan';
import { formatPlainDate } from '../utils/date';
import { NCard, NButton, NInput, NSpin, NEmpty, NTag, NIcon } from 'naive-ui';

// 图标组件
const PlusIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '20',
      height: '20',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round'
    }, [
      h('line', { x1: '12', y1: '5', x2: '12', y2: '19' }),
      h('line', { x1: '5', y1: '12', x2: '19', y2: '12' })
    ]);
  }
};

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

const ViewIcon = {
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
      h('path', { d: 'M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z' }),
      h('circle', { cx: '12', cy: '12', r: '3' })
    ]);
  }
};

const router = useRouter();
const store = useTravelPlanStore();
const searchQuery = ref('');

// 导航到创建页面
const navigateToCreate = () => {
  router.push({ name: 'PlanCreate' });
};

// 导航到详情页面
const navigateToDetail = (id) => {
  router.push({ name: 'PlanDetail', params: { id } });
};

// 导航到编辑页面
const navigateToEdit = (id) => {
  router.push({ name: 'PlanEdit', params: { id } });
};

// 删除规划
const handleDelete = async (id) => {
  if (confirm('确定要删除这个规划吗？')) {
    try {
      await store.deletePlan(id);
      alert('删除成功');
    } catch (err) {
      alert('删除失败，请重试');
    }
  }
};

// 搜索功能
const filteredPlans = computed(() => {
  if (!searchQuery.value) {
    return store.plans;
  }
  const query = searchQuery.value.toLowerCase();
  return store.plans.filter(plan => 
    plan.title.toLowerCase().includes(query) || 
    plan.destination.toLowerCase().includes(query)
  );
});

// 处理搜索
const handleSearch = () => {
  // 搜索逻辑已在computed中处理
};

// 格式化日期
const formatDate = (dateString) => {
  return formatPlainDate(dateString);
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

onMounted(async () => {
  await store.fetchPlans();
});
</script>

<style scoped>
.plan-list {
  width: 100%;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding: 0 8px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  letter-spacing: 0.5px;
}

.create-button {
  font-size: 14px;
  font-weight: 500;
  padding: 12px 24px;
  border-radius: var(--radius-sm);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  border: none;
  color: white;
  box-shadow: var(--shadow-card);
  transition: var(--transition-normal);
}

.create-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.search-section {
  margin-bottom: 32px;
  padding: 0 8px;
}

.search-input {
  width: 100%;
  max-width: 480px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 0;
}

.loading-text {
  margin-top: 20px;
  color: var(--color-text-light);
  font-size: 15px;
}

.empty-container {
  padding: 100px 0;
}

.empty-state {
  min-height: 350px;
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 28px;
  padding: 0 8px;
}

.plan-card {
  transition: all var(--transition-normal);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  animation: cardAppear 0.4s ease-out;
}

.plan-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-hover);
  border-color: var(--color-primary-light);
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
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: var(--color-text);
  line-height: 1.4;
}

.card-content {
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  padding: 8px 12px;
  background: var(--color-background);
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
}

.info-item:hover {
  background: #ECEAE8;
}

.info-item n-icon {
  margin-right: 10px;
  color: var(--color-primary);
}

.label {
  color: var(--color-text-light);
  margin-right: 6px;
  min-width: 64px;
  font-weight: 500;
}

.value {
  color: var(--color-text);
  font-weight: 600;
}

.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.action-button {
  font-size: 13px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  transition: var(--transition-normal);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }
  
  .plans-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .search-input {
    max-width: 100%;
  }
  
  .page-title {
    font-size: 24px;
  }
}
</style>
