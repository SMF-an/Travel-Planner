<template>
  <div class="plan-form">
    <div v-if="currentStep === 1" class="step-basic-info">
      <n-card
        :title="isEdit ? '编辑规划' : '创建规划'"
        class="form-card"
        :bordered="false"
        size="large"
      >
        <n-form
          ref="formRef"
          :model="formData"
          label-placement="top"
          class="form"
        >
          <div class="form-grid">
            <n-form-item label="规划标题" path="title" class="form-item" required>
              <n-input
                v-model:value="formData.title"
                placeholder="请输入规划标题"
                size="large"
                class="form-input"
              />
            </n-form-item>

            <n-form-item label="规划描述" path="description" class="form-item full-width">
              <n-input
                v-model:value="formData.description"
                type="textarea"
                placeholder="请输入规划描述"
                :autosize="{ minRows: 3, maxRows: 5 }"
                size="large"
                class="form-textarea"
              />
            </n-form-item>

            <div class="form-row">
              <n-form-item label="开始日期" path="start_date" class="form-item" required>
                <n-date-picker
                  v-model:value="formData.start_date"
                  type="date"
                  size="large"
                  class="form-input"
                />
              </n-form-item>

              <n-form-item label="结束日期" path="end_date" class="form-item" required>
                <n-date-picker
                  v-model:value="formData.end_date"
                  type="date"
                  size="large"
                  class="form-input"
                />
              </n-form-item>
            </div>

            <div class="form-row">
              <n-form-item label="最小预算" path="budget_min" class="form-item" required>
                <n-input-number
                  v-model:value="formData.budget_min"
                  :min="0"
                  placeholder="请输入最小预算"
                  size="large"
                  class="form-input"
                />
              </n-form-item>

              <n-form-item label="最大预算" path="budget_max" class="form-item" required>
                <n-input-number
                  v-model:value="formData.budget_max"
                  :min="0"
                  placeholder="请输入最大预算"
                  size="large"
                  class="form-input"
                />
              </n-form-item>
            </div>

            <n-form-item label="出行人数" path="num_people" class="form-item" required>
              <n-input-number
                v-model:value="formData.num_people"
                :min="1"
                placeholder="请输入出行人数"
                size="large"
                class="form-input"
              />
            </n-form-item>

            <n-form-item label="出行偏好" path="preferences" class="form-item full-width">
              <n-select
                v-model:value="formData.preferences"
                multiple
                filterable
                placeholder="请选择出行偏好"
                :options="preferenceOptions"
                size="large"
                class="form-select"
              />
            </n-form-item>

            <div class="form-row">
              <n-form-item label="出发地点" path="start_location" class="form-item" required>
                <n-input
                  v-model:value="formData.start_location"
                  placeholder="请输入出发地点"
                  size="large"
                  class="form-input"
                />
              </n-form-item>

              <n-form-item label="目的地" path="destination" class="form-item" required>
                <n-input
                  v-model:value="formData.destination"
                  placeholder="请输入目的地"
                  size="large"
                  class="form-input"
                />
              </n-form-item>
            </div>
          </div>

          <div class="form-actions">
            <n-button
              type="default"
              @click="handleCancel"
              size="large"
              class="action-button"
            >
              取消
            </n-button>
            <n-button
              type="info"
              @click="handleSaveDraft"
              :loading="store.loading"
              size="large"
              class="action-button"
            >
              <template #icon>
                <n-icon :component="SaveIcon" />
              </template>
              暂存为草稿
            </n-button>
            <n-button
              type="primary"
              @click="handleNextStep"
              size="large"
              class="action-button primary-button"
            >
              下一步
            </n-button>
          </div>
        </n-form>
      </n-card>
    </div>

    <div v-else-if="currentStep === 2" class="step-location">
      <LocationSelector
        v-if="createdPlanId"
        :plan-id="createdPlanId"
        @back="handleBackStep"
        @next="handleNextStep"
      />
    </div>

    <div v-else-if="currentStep === 3" class="step-weather">
      <n-card
        title="天气信息"
        class="form-card"
        :bordered="false"
        size="large"
      >
        <MultiLocationWeather
          :locations="locationStore.locations"
          :start-date="formData.start_date"
          :end-date="formData.end_date"
        />

        <div class="form-actions">
          <n-button
            type="default"
            @click="handleBackStep"
            size="large"
            class="action-button"
          >
            上一步
          </n-button>
          <n-button
            type="primary"
            @click="handleNextStep"
            size="large"
            class="action-button primary-button"
          >
            下一步
          </n-button>
        </div>
      </n-card>
    </div>

    <div v-else-if="currentStep === 4" class="step-schedule">
      <n-card
        class="form-card"
        :bordered="false"
        size="large"
      >
        <SchedulePlanner
          :plan-id="createdPlanId"
          :start-date="formData.start_date"
          :end-date="formData.end_date"
        />

        <div class="form-actions">
          <n-button
            type="default"
            @click="handleBackStep"
            size="large"
            class="action-button"
          >
            上一步
          </n-button>
          <n-button
            type="primary"
            @click="handleComplete"
            size="large"
            class="action-button primary-button"
          >
            完成
          </n-button>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, h } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useTravelPlanStore } from '../stores/travelPlan';
import { useLocationStore } from '../stores/location';
import { NCard, NForm, NFormItem, NInput, NInputNumber, NDatePicker, NSelect, NButton, NIcon } from 'naive-ui';
import LocationSelector from '../components/LocationSelector.vue';
import MultiLocationWeather from '../components/MultiLocationWeather.vue';
import SchedulePlanner from '../components/SchedulePlanner.vue';

const SaveIcon = {
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
      h('path', { d: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z' }),
      h('polyline', { points: '17 21 17 13 7 13 7 21' }),
      h('polyline', { points: '7 3 7 8 15 8' })
    ]);
  }
};

const router = useRouter();
const route = useRoute();
const store = useTravelPlanStore();
const locationStore = useLocationStore();
const formRef = ref(null);

const currentStep = ref(1);
const createdPlanId = ref(null);

const planId = computed(() => route.params.id);
const isEdit = computed(() => !!planId.value);
const isLocationStep = computed(() => route.name === 'PlanLocations');

const normalizeDateValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value === 'number') {
    return value;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day).getTime();
  }
  return new Date(value).getTime();
};

const formatDateForApi = (value) => {
  const normalizedValue = normalizeDateValue(value);
  if (normalizedValue === null) {
    return null;
  }
  const date = new Date(normalizedValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toTimestamp = (value) => {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return typeof value === 'number' ? value : new Date(value).getTime();
};

const preferenceOptions = [
  { label: '自然风光', value: '自然风光' },
  { label: '历史文化', value: '历史文化' },
  { label: '美食体验', value: '美食体验' },
  { label: '休闲购物', value: '休闲购物' },
  { label: '探险活动', value: '探险活动' },
  { label: '休闲放松', value: '休闲放松' }
];

const formData = reactive({
  title: '',
  description: '',
  start_date: null,
  end_date: null,
  budget_min: 0,
  budget_max: 0,
  num_people: 1,
  preferences: [],
  start_location: '',
  destination: ''
});

const validateFormData = () => {
  const title = formData.title.trim();
  const startLocation = formData.start_location.trim();
  const destination = formData.destination.trim();
  const startDate = normalizeDateValue(formData.start_date);
  const endDate = normalizeDateValue(formData.end_date);

  if (!title) return '请输入规划标题';
  if (startDate === null) return '请选择开始日期';
  if (endDate === null) return '请选择结束日期';
  if (formData.budget_min === null || formData.budget_min === undefined) return '请输入最小预算';
  if (formData.budget_max === null || formData.budget_max === undefined) return '请输入最大预算';
  if (formData.num_people === null || formData.num_people === undefined) return '请输入出行人数';
  if (formData.budget_min < 0) return '最小预算不能为负数';
  if (formData.budget_max < 0) return '最大预算不能为负数';
  if (formData.num_people < 1) return '出行人数至少为1';
  if (!startLocation) return '请输入出发地点';
  if (!destination) return '请输入目的地';
  if (startDate > endDate) return '开始日期不能晚于结束日期';
  if (formData.budget_min > formData.budget_max) return '最小预算不能大于最大预算';

  return '';
};

const handleCancel = () => {
  router.push({ name: 'PlanList' });
};

const handleSaveDraft = async () => {
  localStorage.setItem('planDraft', JSON.stringify({
    ...formData,
    start_date: normalizeDateValue(formData.start_date),
    end_date: normalizeDateValue(formData.end_date)
  }));
  alert('草稿保存成功');
  router.push({ name: 'PlanList' });
};

const handleNextStep = async () => {
  if (currentStep.value === 1) {
    const validationMessage = validateFormData();
    if (validationMessage) {
      alert(validationMessage);
      return;
    }

    try {
      const submitData = {
        ...formData,
        start_date: formatDateForApi(formData.start_date),
        end_date: formatDateForApi(formData.end_date),
        status: isEdit.value ? store.currentPlan?.status || 'in_progress' : 'in_progress'
      };

      let result;
      if (isEdit.value) {
        result = await store.updatePlan(planId.value, submitData);
        alert('更新成功');
      } else {
        result = await store.createPlan(submitData);
        localStorage.removeItem('planDraft');
      }

      createdPlanId.value = result.id;
      currentStep.value = 2;
    } catch (err) {
      alert('操作失败，请重试');
    }
  } else if (currentStep.value === 2) {
    if (locationStore.locations.length === 0) {
      alert('请至少选择一个地点');
      return;
    }
    currentStep.value = 3;
  } else if (currentStep.value === 3) {
    currentStep.value = 4;
  }
};

const handleBackStep = () => {
  if (currentStep.value === 4) {
    currentStep.value = 3;
  } else if (currentStep.value === 3) {
    currentStep.value = 2;
  } else if (currentStep.value === 2) {
    currentStep.value = 1;
  }
};

const handleComplete = () => {
  router.push({ name: 'PlanDetail', params: { id: createdPlanId.value } });
};

onMounted(async () => {
  if (isLocationStep.value && planId.value) {
    createdPlanId.value = planId.value;
    currentStep.value = 2;
  } else if (isEdit.value) {
    await store.fetchPlan(planId.value);
    if (store.currentPlan) {
      Object.assign(formData, {
        ...store.currentPlan,
        start_date: toTimestamp(store.currentPlan.start_date),
        end_date: toTimestamp(store.currentPlan.end_date)
      });
    }
  } else {
    const draft = localStorage.getItem('planDraft');
    if (draft) {
      try {
        const draftData = JSON.parse(draft);
        Object.assign(formData, {
          ...draftData,
          start_date: toTimestamp(draftData.start_date),
          end_date: toTimestamp(draftData.end_date)
        });
      } catch (e) {
        console.error('加载草稿失败:', e);
      }
    }
  }
});
</script>

<style scoped>
.plan-form {
  width: 100%;
}

.step-basic-info {
  animation: fadeIn 0.3s ease-out;
}

.step-location {
  animation: fadeIn 0.3s ease-out;
}

.step-weather {
  animation: fadeIn 0.3s ease-out;
}

.step-schedule {
  animation: fadeIn 0.3s ease-out;
}



@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-card {
  box-shadow: var(--shadow-card);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all var(--transition-normal);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  animation: cardAppear 0.4s ease-out;
}

.form-card:hover {
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

.form {
  padding: 0 32px 32px;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.form-item {
  width: 100%;
}

.full-width {
  grid-column: 1 / -1;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  border-radius: var(--radius-sm);
  transition: all var(--transition-normal);
  animation: formInputAppear 0.4s ease-out;
  border: 1px solid var(--color-border);
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(139, 157, 195, 0.15);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 40px;
  padding-top: 32px;
  border-top: 1px solid var(--color-border);
}

.action-button {
  padding: 12px 28px;
  border-radius: var(--radius-sm);
  transition: var(--transition-normal);
  font-weight: 500;
  font-size: 14px;
}

.primary-button {
  padding: 12px 32px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  border: none;
  color: white;
  box-shadow: var(--shadow-card);
}

.action-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.action-button:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .form {
    padding: 0 20px 20px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
    gap: 12px;
  }

  .action-button {
    width: 100%;
  }
}

@keyframes formInputAppear {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>