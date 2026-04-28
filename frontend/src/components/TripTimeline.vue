<template>
  <div class="trip-timeline">
    <div class="timeline-header">
      <h3 class="timeline-title">
        <n-icon :component="RouteIcon" class="title-icon" />
        行程安排
      </h3>
      <div class="timeline-stats">
        <span class="stat-item">
          <n-icon :component="CalendarIcon" />
          {{ scheduledCount }} 个行程
        </span>
      </div>
    </div>

    <div v-if="loading && items.length === 0" class="timeline-loading">
      <n-spin size="large" />
      <span class="loading-text">加载行程中...</span>
    </div>

    <div v-else-if="error && items.length === 0" class="timeline-error">
      <n-result
        status="error"
        title="加载失败"
        :description="error"
      >
        <template #footer>
          <n-button type="primary" @click="handleRetry">
            <template #icon>
              <n-icon :component="RefreshIcon" />
            </template>
            重试
          </n-button>
        </template>
      </n-result>
    </div>

    <div v-else-if="items.length === 0" class="timeline-empty">
      <n-empty description="暂无行程安排">
        <template #extra>
          <n-button type="primary" size="small" @click="$emit('add')">
            添加行程
          </n-button>
        </template>
      </n-empty>
    </div>

    <div v-else class="timeline-content" ref="scrollContainer">
      <div class="timeline-track">
        <div
          v-for="(item, index) in visibleItems"
          :key="item.id"
          class="timeline-item"
          :class="{ expanded: expandedId === item.id }"
          :style="{ animationDelay: `${index * 0.08}s` }"
          @click="toggleExpand(item)"
        >
          <div class="timeline-marker">
            <div class="marker-dot" :class="getTimeSlotClass(item.visit_time_slot)">
              <n-icon :component="getTimeSlotIcon(item.visit_time_slot)" />
            </div>
            <div v-if="index < visibleItems.length - 1" class="marker-line"></div>
          </div>

          <div class="timeline-card">
            <div class="card-header-row">
              <div class="date-badge">
                <span class="date-month">{{ formatMonth(item.visit_date) }}</span>
                <span class="date-day">{{ formatDay(item.visit_date) }}</span>
                <span class="date-weekday">{{ formatWeekday(item.visit_date) }}</span>
              </div>
              <div class="time-slot-badge" :class="getTimeSlotClass(item.visit_time_slot)">
                <n-icon :component="getTimeSlotIcon(item.visit_time_slot)" :size="14" />
                {{ item.visit_time_slot }}
              </div>
            </div>

            <div class="card-content">
              <h4 class="location-name">{{ item.location.name }}</h4>
              <p class="location-address">{{ item.location.address }}</p>
              <div v-if="item.notes" class="location-notes">
                <n-icon :component="NoteIcon" :size="14" />
                {{ item.notes }}
              </div>
            </div>

            <div class="card-expand" :class="{ rotated: expandedId === item.id }">
              <n-icon :component="ChevronDownIcon" />
            </div>

            <transition name="expand">
              <div v-if="expandedId === item.id" class="card-details">
                <div class="detail-row">
                  <n-icon :component="MapPinIcon" :size="16" />
                  <span>{{ item.location.address }}</span>
                </div>
                <div class="detail-row">
                  <n-icon :component="ClockIcon" :size="16" />
                  <span>{{ getTimeSlotDisplay(item.visit_time_slot) }}</span>
                </div>
                <div class="detail-row">
                  <n-icon :component="CloudIcon" :size="16" />
                  <span>{{ getWeatherDisplay(item) }}</span>
                </div>
                <div v-if="item.location.description" class="detail-row description">
                  <n-icon :component="FileTextIcon" :size="16" />
                  <span>{{ item.location.description }}</span>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <div v-if="hasMore && items.length > 0" class="load-more">
        <n-button
          v-if="!loadingMore"
          text
          @click="loadMore"
          class="load-more-btn"
        >
          <n-icon :component="LoadMoreIcon" :size="16" />
          加载更多
        </n-button>
        <n-spin v-else size="small" />
      </div>

      <div v-if="!hasMore && items.length > PAGE_SIZE" class="end-indicator">
        <n-divider />
        <span class="end-text">已展示全部 {{ items.length }} 个行程</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { h } from 'vue';
import {
  NIcon,
  NSpin,
  NEmpty,
  NResult,
  NButton,
  NDivider
} from 'naive-ui';

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  weatherByLocationId: {
    type: Object,
    default: () => ({})
  },
  loading: {
    type: Boolean,
    default: false
  },
  loadingMore: {
    type: Boolean,
    default: false
  },
  hasMore: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  pageSize: {
    type: Number,
    default: 10
  }
});

const emit = defineEmits(['load-more', 'retry', 'add']);

const PAGE_SIZE = props.pageSize;
const expandedId = ref(null);
const scrollContainer = ref(null);

const visibleItems = computed(() => {
  return props.items.slice(0, PAGE_SIZE);
});

const scheduledCount = computed(() => props.items.length);

const formatMonth = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月`;
};

const formatDay = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.getDate();
};

const formatWeekday = (dateStr) => {
  if (!dateStr) return '';
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return weekdays[new Date(dateStr).getDay()];
};

const getTimeSlotClass = (slot) => {
  if (!slot) return '';
  if (slot.includes('上午')) return 'slot-morning';
  if (slot.includes('下午')) return 'slot-afternoon';
  if (slot.includes('晚上')) return 'slot-evening';
  return '';
};

const getTimeSlotIcon = (slot) => {
  if (!slot) return SunIcon;
  if (slot.includes('上午')) return SunIcon;
  if (slot.includes('下午')) return SunIconIcon;
  if (slot.includes('晚上')) return MoonIcon;
  return SunIcon;
};

const getTimeSlotDisplay = (slot) => {
  if (!slot) return '全天';
  const times = {
    '上午': '08:00 - 12:00',
    '下午': '13:00 - 18:00',
    '晚上': '19:00 - 22:00'
  };
  return times[slot] || slot;
};

const toggleExpand = (item) => {
  if (expandedId.value === item.id) {
    expandedId.value = null;
  } else {
    expandedId.value = item.id;
  }
};

const loadMore = () => {
  emit('load-more');
};

const handleRetry = () => {
  emit('retry');
};

const getSlotTargetHour = (slot) => {
  if (!slot) return 12;
  if (slot.includes('上午')) return 9;
  if (slot.includes('下午')) return 15;
  if (slot.includes('晚上')) return 20;
  return 12;
};

const getWeatherDisplay = (item) => {
  if (!item?.id || !item?.visit_date) return '暂无天气数据';

  const weatherData = props.weatherByLocationId[item.id];
  if (!weatherData) return '暂无天气数据';

  const targetHour = getSlotTargetHour(item.visit_time_slot);
  const hourly = weatherData.hourlyWeather?.hourly || [];
  const sameDayHourly = hourly
    .map((entry) => {
      const fxTime = new Date(entry.fxTime);
      return {
        ...entry,
        date: fxTime.toISOString().slice(0, 10),
        hour: fxTime.getHours()
      };
    })
    .filter((entry) => entry.date === item.visit_date);

  if (sameDayHourly.length > 0) {
    let closest = sameDayHourly[0];
    for (let index = 1; index < sameDayHourly.length; index += 1) {
      const candidate = sameDayHourly[index];
      if (Math.abs(candidate.hour - targetHour) < Math.abs(closest.hour - targetHour)) {
        closest = candidate;
      }
    }
    return `${closest.text} ${closest.temp}°C`;
  }

  const daily = weatherData.dailyWeather?.daily || [];
  const dailyEntry = daily.find((entry) => entry.fxDate === item.visit_date);
  if (!dailyEntry) return '暂无天气数据';

  const isEvening = (item.visit_time_slot || '').includes('晚上');
  const text = isEvening ? (dailyEntry.textNight || dailyEntry.textDay) : dailyEntry.textDay;
  const temp = isEvening ? (dailyEntry.tempMin || dailyEntry.tempMax) : dailyEntry.tempMax;
  return `${text} ${temp}°C`;
};

const RouteIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '20',
      height: '20',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    }, [
      h('circle', { cx: '6', cy: '19', r: '3' }),
      h('path', { d: 'M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15' }),
      h('circle', { cx: '18', cy: '5', r: '3' })
    ]);
  }
};

const CalendarIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '16',
      height: '16',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    }, [
      h('rect', { x: '3', y: '4', width: '18', height: '18', rx: '2', ry: '2' }),
      h('line', { x1: '16', y1: '2', x2: '16', y2: '6' }),
      h('line', { x1: '8', y1: '2', x2: '8', y2: '6' }),
      h('line', { x1: '3', y1: '10', x2: '21', y2: '10' })
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
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
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

const SunIconIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '16',
      height: '16',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
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
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    }, [
      h('path', { d: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' })
    ]);
  }
};

const ChevronDownIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '16',
      height: '16',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    }, [
      h('polyline', { points: '6 9 12 15 18 9' })
    ]);
  }
};

const MapPinIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '16',
      height: '16',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    }, [
      h('path', { d: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z' }),
      h('circle', { cx: '12', cy: '10', r: '3' })
    ]);
  }
};

const ClockIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '16',
      height: '16',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    }, [
      h('circle', { cx: '12', cy: '12', r: '10' }),
      h('polyline', { points: '12 6 12 12 16 14' })
    ]);
  }
};

const CloudIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '16',
      height: '16',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    }, [
      h('path', { d: 'M17.5 19a4.5 4.5 0 1 0-.9-8.9A6 6 0 1 0 6 18.3' }),
      h('path', { d: 'M10 19h8' })
    ]);
  }
};

const FileTextIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '16',
      height: '16',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    }, [
      h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
      h('polyline', { points: '14 2 14 8 20 8' }),
      h('line', { x1: '16', y1: '13', x2: '8', y2: '13' }),
      h('line', { x1: '16', y1: '17', x2: '8', y2: '17' }),
      h('polyline', { points: '10 9 9 9 8 9' })
    ]);
  }
};

const NoteIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '14',
      height: '14',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    }, [
      h('path', { d: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' }),
      h('path', { d: 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' })
    ]);
  }
};

const RefreshIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '16',
      height: '16',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    }, [
      h('polyline', { points: '23 4 23 10 17 10' }),
      h('polyline', { points: '1 20 1 14 7 14' }),
      h('path', { d: 'M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15' })
    ]);
  }
};

const LoadMoreIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '16',
      height: '16',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    }, [
      h('polyline', { points: '6 9 12 15 18 9' })
    ]);
  }
};
</script>

<style scoped>
.trip-timeline {
  width: 100%;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  overflow: hidden;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, rgba(139, 157, 195, 0.08) 0%, rgba(212, 165, 165, 0.08) 100%);
  border-bottom: 1px solid var(--color-border);
}

.timeline-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: var(--color-text);
}

.title-icon {
  color: var(--color-primary);
}

.timeline-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.timeline-loading,
.timeline-error,
.timeline-empty {
  padding: 60px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.loading-text {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.timeline-content {
  padding: 24px;
  max-height: 600px;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.timeline-content::-webkit-scrollbar {
  width: 6px;
}

.timeline-content::-webkit-scrollbar-track {
  background: transparent;
}

.timeline-content::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.timeline-content::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-light);
}

.timeline-track {
  position: relative;
  padding-left: 32px;
}

.timeline-item {
  position: relative;
  padding-bottom: 24px;
  cursor: pointer;
  animation: itemAppear 0.4s ease-out both;
}

@keyframes itemAppear {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-marker {
  position: absolute;
  left: -32px;
  top: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.marker-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3px solid var(--color-surface);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  z-index: 1;
}

.marker-dot.slot-morning {
  background: linear-gradient(135deg, #FFB74D 0%, #FFA726 100%);
  color: white;
}

.marker-dot.slot-afternoon {
  background: linear-gradient(135deg, #4FC3F7 0%, #29B6F6 100%);
  color: white;
}

.marker-dot.slot-evening {
  background: linear-gradient(135deg, #7E57C2 0%, #5E35B1 100%);
  color: white;
}

.marker-dot:not(.slot-morning):not(.slot-afternoon):not(.slot-evening) {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  color: white;
}

.timeline-item:hover .marker-dot {
  transform: scale(1.15);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

.timeline-item.expanded .marker-dot {
  transform: scale(1.2);
  box-shadow: 0 4px 16px rgba(139, 157, 195, 0.4);
}

.marker-line {
  width: 2px;
  flex: 1;
  min-height: 40px;
  background: linear-gradient(to bottom, var(--color-border) 0%, transparent 100%);
  margin-top: 8px;
}

.timeline-card {
  background: var(--color-background);
  border-radius: var(--radius-md);
  padding: 16px 20px;
  border: 1px solid var(--color-border);
  transition: all 0.3s ease;
  position: relative;
}

.timeline-item:hover .timeline-card {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.timeline-item.expanded .timeline-card {
  border-color: var(--color-primary);
  box-shadow: 0 6px 20px rgba(139, 157, 195, 0.2);
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.date-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 12px;
  background: linear-gradient(135deg, rgba(139, 157, 195, 0.1) 0%, rgba(159, 193, 169, 0.1) 100%);
  border-radius: var(--radius-sm);
  min-width: 56px;
}

.date-month {
  font-size: 12px;
  color: var(--color-primary);
  font-weight: 600;
}

.date-day {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.2;
}

.date-weekday {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.time-slot-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
}

.time-slot-badge.slot-morning {
  background: rgba(255, 183, 77, 0.15);
  color: #E65100;
}

.time-slot-badge.slot-afternoon {
  background: rgba(79, 195, 247, 0.15);
  color: #0277BD;
}

.time-slot-badge.slot-evening {
  background: rgba(126, 87, 194, 0.15);
  color: #5E35B1;
}

.card-content {
  flex: 1;
}

.location-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 6px 0;
  line-height: 1.4;
}

.location-address {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.location-notes {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text);
  font-style: italic;
  padding: 8px 10px;
  background: rgba(139, 157, 195, 0.08);
  border-radius: var(--radius-sm);
  border-left: 3px solid var(--color-primary);
}

.card-expand {
  position: absolute;
  right: 16px;
  top: 16px;
  color: var(--color-text-light);
  transition: transform 0.3s ease;
}

.card-expand.rotated {
  transform: rotate(180deg);
}

.card-details {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  color: var(--color-text);
}

.detail-row.description {
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  line-height: 1.6;
}

.detail-row svg {
  flex-shrink: 0;
  color: var(--color-primary);
  margin-top: 2px;
}

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
}

.expand-enter-to,
.expand-leave-from {
  opacity: 1;
  max-height: 300px;
}

.load-more {
  padding: 20px;
  display: flex;
  justify-content: center;
}

.load-more-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-primary);
  font-weight: 500;
}

.load-more-btn:hover {
  color: var(--color-secondary);
}

.end-indicator {
  text-align: center;
  padding: 8px 0 0;
}

.end-text {
  font-size: 13px;
  color: var(--color-text-light);
}

@media (max-width: 768px) {
  .timeline-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 16px;
  }

  .timeline-content {
    padding: 16px;
  }

  .timeline-track {
    padding-left: 28px;
  }

  .marker-dot {
    width: 28px;
    height: 28px;
  }

  .timeline-marker {
    left: -28px;
  }

  .card-header-row {
    flex-direction: column;
    gap: 10px;
  }

  .date-badge {
    flex-direction: row;
    gap: 8px;
    min-width: auto;
  }

  .date-day {
    font-size: 18px;
  }

  .location-name {
    font-size: 15px;
  }
}
</style>
