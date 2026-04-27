<template>
  <div class="multi-location-weather">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>正在获取天气数据...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error">
      <p class="error-message">{{ error }}</p>
      <button @click="fetchAllWeatherData" class="retry-btn">重试</button>
    </div>

    <!-- 天气信息 -->
    <div v-else-if="locations.length > 0" class="weather-content">
      <!-- 时间筛选器 -->
      <div class="date-filter">
        <n-select
          v-model:value="selectedDate"
          placeholder="选择日期"
          :options="travelDateOptions"
          class="date-select"
        />
      </div>

      <!-- 地点天气卡片 -->
      <div class="locations-grid">
        <div
          v-for="location in locations"
          :key="location.id"
          class="location-card"
        >
          <div class="location-header">
            <h4>{{ location.location.name }}</h4>
            <span class="location-address">{{ location.location.address }}</span>
          </div>

          <div v-if="location.weatherData" class="weather-data">
            <!-- 所选日期的天气 -->
            <div v-if="selectedDateWeather[location.id]" class="selected-date-weather">
              <h5>{{ formatDisplayDate(selectedDate) }} 天气</h5>
              <div class="selected-date-data">
                <img
                  :src="getWeatherIcon(selectedDateWeather[location.id].iconDay)"
                  :alt="selectedDateWeather[location.id].textDay"
                  class="day-icon"
                />
                <div class="selected-date-info">
                  <span class="weather-text">{{ selectedDateWeather[location.id].textDay }}</span>
                  <div class="temp-range">
                    <span class="temp-max">{{ selectedDateWeather[location.id].tempMax }}°C</span>
                    <span class="temp-min">{{ selectedDateWeather[location.id].tempMin }}°C</span>
                  </div>
                </div>
              </div>

              <div class="key-metrics">
                <div class="metric-item">
                  <span class="metric-label">湿度</span>
                  <span class="metric-value">{{ formatHumidity(selectedDateWeather[location.id]) }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">风向风力</span>
                  <span class="metric-value">{{ formatWind(selectedDateWeather[location.id]) }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">降水概率</span>
                  <span class="metric-value">{{ formatPrecipProbability(selectedDateWeather[location.id]) }}</span>
                </div>
                <div class="metric-item">
                  <span class="metric-label">紫外线</span>
                  <span class="metric-value">{{ formatUvIndex(selectedDateWeather[location.id]) }}</span>
                </div>
              </div>

              <details class="more-metrics">
                <summary>更多指标</summary>
                <div class="extra-metrics">
                  <div class="metric-item">
                    <span class="metric-label">降水量</span>
                    <span class="metric-value">{{ formatPrecip(selectedDateWeather[location.id]) }}</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">气压</span>
                    <span class="metric-value">{{ formatPressure(selectedDateWeather[location.id]) }}</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">能见度</span>
                    <span class="metric-value">{{ formatVisibility(selectedDateWeather[location.id]) }}</span>
                  </div>
                  <div class="metric-item">
                    <span class="metric-label">云量</span>
                    <span class="metric-value">{{ formatCloud(selectedDateWeather[location.id]) }}</span>
                  </div>
                </div>
              </details>
            </div>
            <div v-else class="weather-loading">
              <p>该日期暂无天气预报数据</p>
            </div>

            <!-- 出行建议 -->
            <div v-if="selectedDateWeather[location.id]" class="travel-advice">
              <h5>出行建议</h5>
              <p>{{ getTravelAdvice(selectedDateWeather[location.id]) }}</p>
            </div>
          </div>

          <div v-else class="weather-loading">
            <p>获取天气数据中...</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 无数据状态 -->
    <div v-else class="no-data">
      <p>请先选择出行地点</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useWeatherStore } from '../stores/weather';
import { NSelect } from 'naive-ui';

const props = defineProps({
  locations: {
    type: Array,
    required: true
  },
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  }
});

const weatherStore = useWeatherStore();
const loading = ref(false);
const error = ref(null);
const selectedDate = ref('');

// 计算行程日期范围
const travelDates = computed(() => {
  const dates = [];
  const start = new Date(props.startDate);
  const end = new Date(props.endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }
  
  return dates;
});

const travelDateOptions = computed(() => {
  return travelDates.value.map(date => ({
    label: formatDisplayDate(date),
    value: date
  }));
});

// 初始化选中日期为开始日期
onMounted(() => {
  if (travelDates.value.length > 0) {
    selectedDate.value = travelDates.value[0];
  }
  fetchAllWeatherData();
});

// 监听地点变化，重新获取天气数据
watch(
  () => props.locations,
  () => {
    fetchAllWeatherData();
  },
  { deep: true }
);

// 监听日期变化
watch(
  () => selectedDate.value,
  () => {
    // 日期变化时不需要重新获取数据，只需要更新显示
  }
);

// 格式化显示日期
const formatDisplayDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return '今天';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return '明天';
  } else {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${month}月${day}日 ${weekDays[date.getDay()]}`;
  }
};

// 获取天气图标
const getWeatherIcon = (iconCode) => {
  if (!iconCode) return '';
  return `https://cdn.jsdelivr.net/npm/qweather-icons@1.8.0/icons/${iconCode}.svg`;
};

// 获取所选日期的天气数据
const selectedDateWeather = computed(() => {
  const result = {};
  
  props.locations.forEach(location => {
    const weatherData = location.weatherData;
    if (weatherData && weatherData.dailyWeather && weatherData.dailyWeather.daily) {
      const dayWeather = weatherData.dailyWeather.daily.find(day => day.fxDate === selectedDate.value);
      if (dayWeather) {
        result[location.id] = dayWeather;
      }
    }
  });
  
  return result;
});

// 获取出行建议
const getTravelAdvice = (weatherData) => {
  if (!weatherData) {
    return '暂无可用天气数据';
  }

  const text = weatherData.textDay || '';
  const tempMax = Number(weatherData.tempMax);
  const tempMin = Number(weatherData.tempMin);
  const avgTemp = Number.isFinite(tempMax) && Number.isFinite(tempMin)
    ? (tempMax + tempMin) / 2
    : NaN;

  if (text.includes('雨')) {
    return '有降雨风险，建议携带雨具并穿防滑鞋。';
  }
  if (text.includes('雪')) {
    return '有降雪风险，建议做好保暖并注意路面湿滑。';
  }
  if (text.includes('雾') || text.includes('霾')) {
    return '能见度较低，建议错峰出行并佩戴口罩。';
  }
  if (Number.isFinite(avgTemp) && avgTemp >= 30) {
    return '气温较高，建议轻薄着装并注意补水防晒。';
  }
  if (Number.isFinite(avgTemp) && avgTemp <= 10) {
    return '气温较低，建议注意保暖并适当增添衣物。';
  }

  return '天气整体适宜，按计划出行即可。';
};

const formatHumidity = (dayWeather) => {
  if (!dayWeather || dayWeather.humidity === undefined || dayWeather.humidity === null || dayWeather.humidity === '') {
    return '暂无';
  }
  return `${dayWeather.humidity}%`;
};

const formatWind = (dayWeather) => {
  if (!dayWeather) {
    return '暂无';
  }
  const windDir = dayWeather.windDirDay || dayWeather.windDir || '';
  const windScale = dayWeather.windScaleDay || dayWeather.windScale || '';
  if (!windDir && !windScale) {
    return '暂无';
  }
  return `${windDir}${windDir && windScale ? ' ' : ''}${windScale ? `${windScale}级` : ''}`.trim();
};

const formatPrecip = (dayWeather) => {
  if (!dayWeather || dayWeather.precip === undefined || dayWeather.precip === null || dayWeather.precip === '') {
    return '暂无';
  }
  return `${dayWeather.precip} mm`;
};

const formatPrecipProbability = (dayWeather) => {
  if (!dayWeather || dayWeather.pop === undefined || dayWeather.pop === null || dayWeather.pop === '') {
    return '暂无';
  }
  return `${dayWeather.pop}%`;
};

const formatPressure = (dayWeather) => {
  if (!dayWeather || dayWeather.pressure === undefined || dayWeather.pressure === null || dayWeather.pressure === '') {
    return '暂无';
  }
  return `${dayWeather.pressure} hPa`;
};

const formatVisibility = (dayWeather) => {
  if (!dayWeather || dayWeather.vis === undefined || dayWeather.vis === null || dayWeather.vis === '') {
    return '暂无';
  }
  return `${dayWeather.vis} km`;
};

const formatCloud = (dayWeather) => {
  if (!dayWeather || dayWeather.cloud === undefined || dayWeather.cloud === null || dayWeather.cloud === '') {
    return '暂无';
  }
  return `${dayWeather.cloud}%`;
};

const formatUvIndex = (dayWeather) => {
  if (!dayWeather || dayWeather.uvIndex === undefined || dayWeather.uvIndex === null || dayWeather.uvIndex === '') {
    return '暂无';
  }
  return String(dayWeather.uvIndex);
};

// 获取所有地点的天气数据
const fetchAllWeatherData = async () => {
  if (props.locations.length === 0) return;

  loading.value = true;
  error.value = null;

  try {
    const weatherPromises = props.locations.map(async (location) => {
      const lat = location.location.latitude;
      const lon = location.location.longitude;
      
      try {
        const weatherData = await weatherStore.fetchWeatherData(lat, lon);
        return {
          ...location,
          weatherData: weatherData,
          error: null
        };
      } catch (err) {
        console.error(`获取地点 ${location.location.name} 的天气数据失败:`, err);
        return {
          ...location,
          weatherData: null,
          error: '获取天气数据失败'
        };
      }
    });

    const results = await Promise.all(weatherPromises);
    
    // 更新每个地点的天气数据
    props.locations.forEach((location, index) => {
      location.weatherData = results[index].weatherData;
      location.error = results[index].error;
    });
  } catch (err) {
    error.value = '获取天气数据失败';
    console.error('Error fetching weather data:', err);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.multi-location-weather {
  width: 100%;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 40px 0;
}

.error-message {
  color: var(--color-error);
  margin-bottom: 16px;
}

.retry-btn {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: var(--transition-normal);
  font-weight: 500;
  box-shadow: var(--shadow-card);
}

.retry-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.retry-btn:active {
  transform: translateY(0);
}

.weather-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.date-filter {
  margin-bottom: 4px;
}

.date-select {
  width: 200px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  transition: var(--transition-normal);
}

.date-select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(139, 157, 195, 0.15);
}

.locations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.location-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-card);
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid var(--color-border);
}

.location-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-hover);
}

.location-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}

.location-header h4 {
  margin: 0 0 6px 0;
  color: var(--color-text);
  font-size: 16px;
  font-weight: 600;
}

.location-address {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.weather-data {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.weather-text {
  font-size: 14px;
  margin: 4px 0;
  color: var(--color-text-secondary);
}

.selected-date-weather {
  padding: 16px;
  background: var(--color-surface-secondary);
  border-radius: var(--radius-sm);
  margin-top: 12px;
  border: 1px solid var(--color-border);
}

.selected-date-weather h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: var(--color-text);
  font-weight: 600;
}

.selected-date-data {
  display: flex;
  align-items: center;
  gap: 16px;
}

.day-icon {
  width: 48px;
  height: 48px;
}

.selected-date-info {
  flex: 1;
}

.key-metrics {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.more-metrics {
  margin-top: 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  overflow: hidden;
}

.more-metrics > summary {
  cursor: pointer;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  list-style: none;
}

.more-metrics > summary::-webkit-details-marker {
  display: none;
}

.more-metrics[open] > summary {
  border-bottom: 1px solid var(--color-border);
}

.extra-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 10px;
}

.metric-item {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.metric-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.metric-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}

.temp-range {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.temp-max {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-error);
}

.temp-min {
  font-size: 14px;
  color: var(--color-primary);
}

.travel-advice {
  background: var(--color-info-light);
  border-radius: var(--radius-sm);
  padding: 16px;
  margin-top: 12px;
  border-left: 4px solid var(--color-primary);
}

.travel-advice h5 {
  font-size: 14px;
  margin: 0 0 8px 0;
  color: var(--color-primary);
  font-weight: 600;
}

.travel-advice p {
  margin: 0;
  font-size: 13px;
  color: var(--color-text);
  line-height: 1.4;
}

.weather-loading {
  text-align: center;
  padding: 32px 0;
  color: var(--color-text-secondary);
}

.no-data {
  text-align: center;
  padding: 40px 0;
  color: var(--color-text-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .locations-grid {
    grid-template-columns: 1fr;
  }
  
  .location-card {
    padding: 20px;
  }

  .key-metrics,
  .extra-metrics {
    grid-template-columns: 1fr;
  }
}
</style>
