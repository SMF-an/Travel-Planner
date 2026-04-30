<template>
  <div class="schedule-planner">
    <div class="planner-header">
      <h2 class="planner-title">行程时间规划</h2>
      <p class="planner-subtitle">为每个地点安排具体的出行日期和时间段</p>
    </div>

    <div class="planner-content">
      <div class="date-section">
        <div class="section-title">
          <n-icon :component="CalendarIcon" class="section-icon" />
          <span>选择日期</span>
        </div>
        <div class="date-grid">
          <div
            v-for="date in availableDates"
            :key="date.dateStr"
            class="date-item"
            :class="{ active: selectedDate === date.dateStr, disabled: isDateDisabled(date.dateStr) }"
            @click="selectDate(date)"
          >
            <div class="date-day">{{ date.day }}</div>
            <div class="date-weekday">{{ date.weekday }}</div>
            <div v-if="getWeatherForDate(date.dateStr)" class="date-weather">
              <span class="weather-icon">{{ getWeatherIcon(getWeatherForDate(date.dateStr)) }}</span>
              <span class="weather-temp">{{ getWeatherForDate(date.dateStr) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="locations-section">
        <div class="section-title">
          <n-icon :component="MapPinIcon" class="section-icon" />
          <span>已选地点</span>
          <span class="location-count">({{ planLocations.length }}个)</span>
        </div>

        <div v-if="planLocations.length === 0" class="empty-state">
          <n-icon :component="AlertCircleIcon" class="empty-icon" />
          <p>暂无已选地点，请先选择出行地点</p>
        </div>

        <div v-else class="locations-list">
          <div
            v-for="(location, index) in planLocations"
            :key="location.id"
            class="location-card"
            :class="{ selected: selectedLocation?.id === location.id }"
            @click="selectLocationItem(location)"
          >
            <div class="location-header">
              <span class="location-index">{{ index + 1 }}</span>
              <div class="location-info">
                <h3 class="location-name">{{ location.location.name }}</h3>
                <p class="location-address">{{ location.location.address }}</p>
              </div>
              <div class="location-status">
                <span v-if="location.visit_date" class="status-planned">
                  {{ location.visit_date }} {{ location.visit_time_slot || '' }}
                </span>
                <span v-else class="status-unplanned">未安排</span>
              </div>
            </div>

            <div v-if="selectedLocation?.id === location.id" class="location-schedule">
              <div class="schedule-form">
                <n-form-item label="选择时间段" class="form-item">
                  <div class="time-slots">
                    <n-button
                      v-for="slot in timeSlots"
                      :key="slot.value"
                      class="time-slot-btn"
                      :class="{ active: editingSlot === slot.value }"
                      @click.stop="setTimeSlot(slot.value)"
                      size="small"
                    >
                      <template #icon>
                        <n-icon :component="slot.icon" />
                      </template>
                      {{ slot.label }}
                    </n-button>
                  </div>
                </n-form-item>

                <n-form-item label="备注" class="form-item">
                  <n-input
                    v-model:value="editingNotes"
                    placeholder="添加备注信息..."
                    size="small"
                  />
                </n-form-item>

                <div class="schedule-actions">
                  <n-button
                    type="primary"
                    @click.stop="saveSchedule(location)"
                    :loading="savingId === location.id"
                    size="small"
                  >
                    <template #icon>
                      <n-icon :component="SaveIcon" />
                    </template>
                    保存
                  </n-button>
                  <n-button
                    v-if="location.visit_date"
                    type="default"
                    @click.stop="clearSchedule(location)"
                    size="small"
                  >
                    <template #icon>
                      <n-icon :component="TrashIcon" />
                    </template>
                    清除
                  </n-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="preview-section">
        <div class="section-title">
          <n-icon :component="ListIcon" class="section-icon" />
          <span>行程预览</span>
        </div>

        <div v-if="!hasScheduledLocations" class="empty-preview">
          <p>暂无已安排的行程</p>
        </div>

        <div v-else class="schedule-preview">
          <div
            v-for="date in sortedScheduledDates"
            :key="date"
            class="day-schedule"
          >
            <div class="day-header">
              <span class="day-date">{{ formatDateForPreview(date) }}</span>
              <span class="day-weather" v-if="getWeatherForDate(date)">
                {{ getWeatherIcon(getWeatherForDate(date)) }} {{ getWeatherForDate(date) }}
              </span>
            </div>
            <div class="day-locations">
              <div
                v-for="(slotGroup, slot) in getLocationsByTimeSlot(date)"
                :key="slot"
                class="slot-group"
              >
                <div class="slot-label">{{ slot }}</div>
                <div
                  v-for="loc in slotGroup"
                  :key="loc.id"
                  class="slot-location"
                >
                  <n-icon :component="MapPinIcon" class="mini-icon" />
                  <span>{{ loc.location.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="planner-footer">
      <div class="validation-info">
        <n-icon :component="CheckCircleIcon" v-if="allLocationsScheduled" class="valid-icon" />
        <n-icon :component="AlertTriangleIcon" v-else class="warning-icon" />
        <span>{{ allLocationsScheduled ? '所有地点已安排时间' : `还有 ${unscheduledCount} 个地点未安排时间` }}</span>
      </div>
    </div>

    <n-modal
      v-if="showConflictModal"
      :show="showConflictModal"
      @update:show="showConflictModal = false"
      title="时间冲突提醒"
      preset="warning"
    >
      <div class="conflict-content">
        <p>以下地点安排在同一时间：</p>
        <ul class="conflict-list">
          <li v-for="loc in conflictLocations" :key="loc.id">
            {{ loc.location.name }} - {{ loc.visit_date }} {{ loc.visit_time_slot }}
          </li>
        </ul>
        <p class="conflict-hint">建议重新安排时间，避免行程冲突</p>
      </div>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, computed, h } from 'vue';
import { NFormItem, NInput, NButton, NIcon, NModal } from 'naive-ui';
import { formatPlainDateKey, formatPlainDateParts, formatPlainDateWithWeekday, parsePlainDate } from '../utils/date';
import { useLocationStore } from '../stores/location';
import { useWeatherStore } from '../stores/weather';

const props = defineProps({
  planId: {
    type: Number,
    required: true
  },
  startDate: {
    type: [Number, String],
    required: true
  },
  endDate: {
    type: [Number, String],
    required: true
  }
});

const emit = defineEmits(['back', 'next']);

const locationStore = useLocationStore();
const weatherStore = useWeatherStore();

const selectedDate = ref('');
const selectedLocation = ref(null);
const editingSlot = ref('');
const editingNotes = ref('');
const savingId = ref(null);
const showConflictModal = ref(false);
const conflictLocations = ref([]);

const CalendarIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '20',
      height: '20',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2'
    }, [
      h('rect', { x: '3', y: '4', width: '18', height: '18', rx: '2', ry: '2' }),
      h('line', { x1: '16', y1: '2', x2: '16', y2: '6' }),
      h('line', { x1: '8', y1: '2', x2: '8', y2: '6' }),
      h('line', { x1: '3', y1: '10', x2: '21', y2: '10' })
    ]);
  }
};

const MapPinIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '20',
      height: '20',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2'
    }, [
      h('path', { d: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z' }),
      h('circle', { cx: '12', cy: '10', r: '3' })
    ]);
  }
};

const SunIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '16',
      height: '16',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2'
    }, [
      h('circle', { cx: '12', cy: '12', r: '5' }),
      h('line', { x1: '12', y1: '1', x2: '12', y2: '3' }),
      h('line', { x1: '12', y1: '21', x2: '12', y2: '23' }),
      h('line', { x1: '4.22', y1: '4.22', x2: '5.64', y2: '5.64' }),
      h('line', { x1: '18.36', y1: '18.36', x2: '19.78', y2: '19.78' }),
      h('line', { x1: '1', y1: '12', x2: '3', y2: '12' }),
      h('line', { x1: '21', y1: '12', x2: '23', y2: '12' }),
      h('line', { x1: '4.22', y1: '19.78', x2: '5.64', y2: '18.36' }),
      h('line', { x1: '18.36', y1: '5.64', x2: '19.78', y2: '4.22' })
    ]);
  }
};

const MoonIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '16',
      height: '16',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2'
    }, [
      h('path', { d: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' })
    ]);
  }
};

const SaveIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '16',
      height: '16',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2'
    }, [
      h('path', { d: 'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z' }),
      h('polyline', { points: '17 21 17 13 7 13 7 21' }),
      h('polyline', { points: '7 3 7 8 15 8' })
    ]);
  }
};

const TrashIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '16',
      height: '16',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2'
    }, [
      h('polyline', { points: '3 6 5 6 21 6' }),
      h('path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' })
    ]);
  }
};

const ListIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '20',
      height: '20',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2'
    }, [
      h('line', { x1: '8', y1: '6', x2: '21', y2: '6' }),
      h('line', { x1: '8', y1: '12', x2: '21', y2: '12' }),
      h('line', { x1: '8', y1: '18', x2: '21', y2: '18' }),
      h('line', { x1: '3', y1: '6', x2: '3.01', y2: '6' }),
      h('line', { x1: '3', y1: '12', x2: '3.01', y2: '12' }),
      h('line', { x1: '3', y1: '18', x2: '3.01', y2: '18' })
    ]);
  }
};

const AlertCircleIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '24',
      height: '24',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2'
    }, [
      h('circle', { cx: '12', cy: '12', r: '10' }),
      h('line', { x1: '12', y1: '8', x2: '12', y2: '12' }),
      h('line', { x1: '12', y1: '16', x2: '12.01', y2: '16' })
    ]);
  }
};

const CheckCircleIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '20',
      height: '20',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2'
    }, [
      h('polyline', { points: '20 6 9 17 4 12' }),
      h('circle', { cx: '12', cy: '12', r: '10' })
    ]);
  }
};

const AlertTriangleIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '20',
      height: '20',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2'
    }, [
      h('path', { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' }),
      h('line', { x1: '12', y1: '9', x2: '12', y2: '13' }),
      h('line', { x1: '12', y1: '17', x2: '12.01', y2: '17' })
    ]);
  }
};

const timeSlots = [
  { value: '上午', label: '上午', icon: SunIcon },
  { value: '下午', label: '下午', icon: SunIcon },
  { value: '晚上', label: '晚上', icon: MoonIcon }
];

const planLocations = computed(() => locationStore.locations);

const availableDates = computed(() => {
  const dates = [];
  const start = parsePlainDate(props.startDate);
  const end = parsePlainDate(props.endDate);

  if (!start || !end) {
    return dates;
  }

  while (start <= end) {
    const dateStr = formatPlainDateKey(start);
    const parts = formatPlainDateParts(start);
    dates.push({
      dateStr,
      day: parts.day,
      weekday: parts.weekday
    });
    start.setDate(start.getDate() + 1);
  }
  return dates;
});

const getWeatherForDate = (dateStr) => {
  if (planLocations.value.length === 0) return null;
  const firstLoc = planLocations.value[0];
  const key = `${firstLoc.location.latitude},${firstLoc.location.longitude}`;
  const weatherData = weatherStore.locationsWeather.get(key);
  if (weatherData && weatherData.dailyWeather && weatherData.dailyWeather.daily) {
    const dayData = weatherData.dailyWeather.daily.find(d => d.fxDate === dateStr);
    if (dayData) {
      return `${dayData.tempMin}°C ~ ${dayData.tempMax}°C ${dayData.textDay}`;
    }
  }
  return null;
};

const getWeatherIcon = (weatherStr) => {
  if (!weatherStr) return '☀️';
  if (weatherStr.includes('雨')) return '🌧️';
  if (weatherStr.includes('雪')) return '❄️';
  if (weatherStr.includes('阴')) return '☁️';
  if (weatherStr.includes('雾')) return '🌫️';
  return '☀️';
};

const isDateDisabled = (dateStr) => {
  return false;
};

const selectDate = (date) => {
  selectedDate.value = date.dateStr;
};

const selectLocationItem = (location) => {
  if (selectedLocation.value?.id === location.id) {
    selectedLocation.value = null;
    editingSlot.value = '';
    editingNotes.value = '';
  } else {
    selectedLocation.value = location;
    editingSlot.value = location.visit_time_slot || '';
    editingNotes.value = location.notes || '';
  }
};

const setTimeSlot = (slot) => {
  editingSlot.value = slot;
};

const checkTimeConflict = (locationId, date, timeSlot) => {
  return planLocations.value.filter(l => {
    return l.id !== locationId && l.visit_date === date && l.visit_time_slot === timeSlot;
  });
};

const saveSchedule = async (location) => {
  if (!selectedDate.value) {
    alert('请先选择日期');
    return;
  }
  if (!editingSlot.value) {
    alert('请选择时间段');
    return;
  }

  const conflicts = checkTimeConflict(location.id, selectedDate.value, editingSlot.value);
  if (conflicts.length > 0) {
    conflictLocations.value = conflicts;
    showConflictModal.value = true;
    return;
  }

  savingId.value = location.id;
  try {
    await locationStore.updateLocation(location.id, {
      visit_date: selectedDate.value,
      visit_time_slot: editingSlot.value,
      notes: editingNotes.value
    });
    alert('保存成功');
    selectedLocation.value = null;
    editingSlot.value = '';
    editingNotes.value = '';
  } catch (err) {
    alert('保存失败，请重试');
  } finally {
    savingId.value = null;
  }
};

const clearSchedule = async (location) => {
  savingId.value = location.id;
  try {
    await locationStore.updateLocation(location.id, {
      visit_date: null,
      visit_time_slot: null,
      notes: null
    });
    alert('已清除时间安排');
  } catch (err) {
    alert('清除失败，请重试');
  } finally {
    savingId.value = null;
  }
};

const sortedScheduledDates = computed(() => {
  const dates = new Set();
  planLocations.value.forEach(loc => {
    if (loc.visit_date) {
      dates.add(loc.visit_date);
    }
  });
  return Array.from(dates).sort();
});

const getLocationsByTimeSlot = (date) => {
  const slots = {};
  planLocations.value.forEach(loc => {
    if (loc.visit_date === date && loc.visit_time_slot) {
      if (!slots[loc.visit_time_slot]) {
        slots[loc.visit_time_slot] = [];
      }
      slots[loc.visit_time_slot].push(loc);
    }
  });
  return slots;
};

const formatDateForPreview = (dateStr) => {
  return formatPlainDateWithWeekday(dateStr);
};

const allLocationsScheduled = computed(() => {
  if (planLocations.value.length === 0) return false;
  return planLocations.value.every(loc => loc.visit_date && loc.visit_time_slot);
});

const unscheduledCount = computed(() => {
  return planLocations.value.filter(loc => !loc.visit_date || !loc.visit_time_slot).length;
});

const hasScheduledLocations = computed(() => {
  return planLocations.value.some(loc => loc.visit_date && loc.visit_time_slot);
});
</script>

<style scoped>
.schedule-planner {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.planner-header {
  padding: 24px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  color: white;
}

.planner-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.planner-subtitle {
  font-size: 14px;
  opacity: 0.9;
  margin: 0;
}

.planner-content {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.date-section {
  margin-bottom: 32px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}

.section-icon {
  color: var(--color-primary);
}

.date-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 12px;
}

.date-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 12px;
  background: white;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.date-item:hover:not(.disabled) {
  border-color: var(--color-primary);
}

.date-item.active {
  border-color: var(--color-primary);
  background: rgba(139, 157, 195, 0.1);
}

.date-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.date-day {
  font-size: 24px;
  font-weight: 600;
}

.date-weekday {
  font-size: 12px;
  margin-top: 4px;
}

.date-weather {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.8;
}

.weather-icon {
  font-size: 14px;
}

.locations-section {
  margin-bottom: 32px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  background: white;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
}

.empty-icon {
  margin-bottom: 12px;
  opacity: 0.5;
}

.locations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.location-card {
  background: white;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.location-card:hover {
  border-color: var(--color-primary);
}

.location-card.selected {
  border-color: var(--color-primary);
  background: rgba(139, 157, 195, 0.05);
}

.location-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.location-index {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  font-weight: 600;
}

.location-info {
  flex: 1;
}

.location-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
}

.location-address {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.location-status {
  font-size: 13px;
}

.status-planned {
  color: var(--color-success);
  background: rgba(80, 184, 121, 0.1);
  padding: 4px 12px;
  border-radius: var(--radius-sm);
}

.status-unplanned {
  color: var(--color-warning);
  background: rgba(250, 173, 20, 0.1);
  padding: 4px 12px;
  border-radius: var(--radius-sm);
}

.location-schedule {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

.schedule-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.time-slots {
  display: flex;
  gap: 12px;
}

.time-slot-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: white;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
  transition: all var(--transition-normal);
}

.time-slot-btn:hover {
  border-color: var(--color-primary);
}

.time-slot-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.schedule-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.preview-section {
  margin-bottom: 32px;
}

.empty-preview {
  padding: 24px;
  text-align: center;
  background: white;
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
}

.schedule-preview {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.day-schedule {
  background: white;
  border-radius: var(--radius-md);
  padding: 16px;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.day-date {
  font-size: 16px;
  font-weight: 600;
}

.day-weather {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.day-locations {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.slot-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slot-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-primary);
  padding: 4px 8px;
  background: rgba(139, 157, 195, 0.1);
  border-radius: var(--radius-sm);
  width: fit-content;
}

.slot-location {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--color-surface);
  border-radius: var(--radius-sm);
}

.mini-icon {
  width: 14px;
  height: 14px;
  color: var(--color-primary);
}

.planner-footer {
  padding: 16px 24px;
  background: white;
  border-top: 1px solid var(--color-border);
}

.validation-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.valid-icon {
  color: var(--color-success);
}

.warning-icon {
  color: var(--color-warning);
}

.conflict-content {
  padding: 16px 0;
}

.conflict-list {
  margin: 12px 0;
  padding-left: 20px;
}

.conflict-list li {
  padding: 4px 0;
  color: var(--color-text-secondary);
}

.conflict-hint {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
  color: var(--color-text-secondary);
  font-size: 14px;
}

@media (max-width: 768px) {
  .planner-content {
    padding: 16px;
  }

  .date-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
}
</style>
