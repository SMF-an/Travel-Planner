<template>
  <div class="weather-display">
    <!-- 加载状态 -->
    <div v-if="weatherStore.isLoading" class="loading">
      <div class="loading-spinner"></div>
      <p>正在获取天气数据...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="weatherStore.hasError" class="error">
      <p class="error-message">{{ weatherStore.error }}</p>
      <button @click="fetchWeather" class="retry-btn">重试</button>
    </div>

    <!-- 天气信息 -->
    <div v-else-if="weatherData && weatherData.currentWeather && weatherData.currentWeather.now" class="weather-content">
      <!-- 实时天气 -->
      <div class="current-weather">
        <div class="weather-main">
          <div class="weather-icon">
            <img :src="'https://cdn.jsdelivr.net/npm/qweather-icons@1.8.0/icons/' + weatherData.currentWeather.now.icon + '.svg'" :alt="weatherData.currentWeather.now.text" />
          </div>
          <div class="weather-info">
            <h2 class="temperature">{{ weatherData.currentWeather.now.temp }}°C</h2>
            <p class="weather-text">{{ weatherData.currentWeather.now.text }}</p>
            <p class="weather-summary">{{ weatherData.weatherSummary ? weatherData.weatherSummary.summary : '' }}</p>
          </div>
        </div>

        <!-- 详细气象指标 -->
        <div class="weather-details">
          <div class="detail-item">
            <span class="detail-label">体感温度</span>
            <span class="detail-value">{{ weatherData.currentWeather.now.feelsLike }}°C</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">湿度</span>
            <span class="detail-value">{{ weatherData.currentWeather.now.humidity }}%</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">风力</span>
            <span class="detail-value">{{ weatherData.currentWeather.now.windDir }} {{ weatherData.currentWeather.now.windScale }}级</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">气压</span>
            <span class="detail-value">{{ weatherData.currentWeather.now.pressure }}hPa</span>
          </div>
        </div>

        <!-- 出行建议 -->
        <div class="travel-advice">
          <h3>出行建议</h3>
          <p>{{ weatherStore.getTravelAdvice(weatherData) }}</p>
        </div>
      </div>

      <!-- 24小时预报 -->
      <div v-if="weatherData.hourlyWeather && weatherData.hourlyWeather.hourly" class="hourly-forecast">
        <h3>24小时预报</h3>
        <div class="hourly-list">
          <div v-for="(hour, index) in weatherData.hourlyWeather.hourly" :key="index" class="hourly-item">
            <span class="hour-time">{{ hour.fxTime.substring(11, 16) }}</span>
            <img :src="'https://cdn.jsdelivr.net/npm/qweather-icons@1.8.0/icons/' + hour.icon + '.svg'" :alt="hour.text" class="hour-icon" />
            <span class="hour-temp">{{ hour.temp }}°C</span>
          </div>
        </div>
      </div>

      <!-- 7天预报 -->
      <div v-if="weatherData.dailyWeather && weatherData.dailyWeather.daily" class="daily-forecast">
        <h3>7天预报</h3>
        <div class="daily-list">
          <div v-for="(day, index) in weatherData.dailyWeather.daily" :key="index" class="daily-item">
            <span class="day-date">{{ formatDate(day.fxDate) }}</span>
            <img :src="'https://cdn.jsdelivr.net/npm/qweather-icons@1.8.0/icons/' + day.iconDay + '.svg'" :alt="day.textDay" class="day-icon" />
            <span class="day-text">{{ day.textDay }}</span>
            <div class="day-temp">
              <span class="day-temp-max">{{ day.tempMax }}°C</span>
              <span class="day-temp-min">{{ day.tempMin }}°C</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 无数据状态 -->
    <div v-else class="no-data">
      <p>请选择出行地点以获取天气信息</p>
    </div>
  </div>
</template>

<script setup>
import { watch, ref } from 'vue';
import { useWeatherStore } from '../stores/weather';
import { parsePlainDate } from '../utils/date';

const props = defineProps({
  lat: {
    type: Number,
    required: true
  },
  lon: {
    type: Number,
    required: true
  }
});

const weatherStore = useWeatherStore();
const weatherData = ref(null);

const fetchWeather = async () => {
  if (props.lat && props.lon) {
    try {
      weatherData.value = await weatherStore.fetchWeatherData(props.lat, props.lon);
    } catch (error) {
      console.error('获取天气数据失败:', error);
    }
  }
};

const formatDate = (dateString) => {
  const date = parsePlainDate(dateString);
  if (!date) {
    return '';
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return '今天';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return '明天';
  } else {
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekDays[date.getDay()];
  }
};

watch(
  () => [props.lat, props.lon],
  () => {
    fetchWeather();
  },
  { immediate: true }
);
</script>

<style scoped>
.weather-display {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 32px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--color-border);
  animation: cardAppear 0.4s ease-out;
}

.weather-display:hover {
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

.current-weather {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--color-border);
}

.weather-main {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-bottom: 24px;
}

.weather-icon img {
  width: 80px;
  height: 80px;
}

.weather-info h2 {
  font-size: 36px;
  margin: 0;
  font-weight: 700;
  color: var(--color-text);
}

.weather-text {
  font-size: 18px;
  margin: 8px 0;
  color: var(--color-text-secondary);
}

.weather-summary {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
}

.weather-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}

.detail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.detail-label {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}

.travel-advice {
  background: var(--color-info-light);
  border-radius: var(--radius-sm);
  padding: 16px;
  margin-top: 16px;
  border-left: 4px solid var(--color-primary);
}

.travel-advice h3 {
  font-size: 16px;
  margin: 0 0 8px 0;
  color: var(--color-primary);
  font-weight: 600;
}

.travel-advice p {
  margin: 0;
  color: var(--color-text);
  line-height: 1.4;
}

.hourly-forecast,
.daily-forecast {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--color-border);
}

.hourly-forecast h3,
.daily-forecast h3 {
  font-size: 18px;
  margin: 0 0 16px 0;
  color: var(--color-text);
  font-weight: 600;
}

.hourly-list {
  display: flex;
  overflow-x: auto;
  gap: 16px;
  padding-bottom: 10px;
}

.hourly-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
}

.hour-time {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.hour-icon {
  width: 32px;
  height: 32px;
  margin-bottom: 8px;
}

.hour-temp {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}

.daily-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.daily-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
}

.daily-item:last-child {
  border-bottom: none;
}

.day-date {
  width: 60px;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.day-icon {
  width: 32px;
  height: 32px;
}

.day-text {
  flex: 1;
  font-size: 14px;
  color: var(--color-text);
}

.day-temp {
  display: flex;
  gap: 16px;
  width: 100px;
  text-align: right;
}

.day-temp-max {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-error);
}

.day-temp-min {
  font-size: 14px;
  color: var(--color-primary);
}

.no-data {
  text-align: center;
  padding: 40px 0;
  color: var(--color-text-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .weather-display {
    padding: 24px;
  }
  
  .weather-main {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }

  .weather-details {
    grid-template-columns: repeat(2, 1fr);
  }

  .daily-item {
    flex-wrap: wrap;
  }
  
  .current-weather,
  .hourly-forecast,
  .daily-forecast {
    padding: 20px;
  }
}
</style>
