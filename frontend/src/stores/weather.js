import { defineStore } from 'pinia';
import { weatherApi } from '../api/weather';

export const useWeatherStore = defineStore('weather', {
  state: () => ({
    locationsWeather: new Map(), // 存储多个地点的天气数据
    loading: false,
    error: null,
    cache: new Map()
  }),

  getters: {
    isLoading: (state) => state.loading,
    hasError: (state) => state.error !== null,
    getLocationWeather: (state) => (lat, lon) => {
      const key = `${lat},${lon}`;
      return state.locationsWeather.get(key);
    }
  },

  actions: {
    async fetchWeatherData(lat, lon) {
      const cacheKey = `${lat},${lon}`;
      
      // 检查缓存
      if (this.cache.has(cacheKey)) {
        const cachedData = this.cache.get(cacheKey);
        const now = Date.now();
        
        // 缓存有效期为10分钟
        if (now - cachedData.timestamp < 10 * 60 * 1000) {
          this.locationsWeather.set(cacheKey, cachedData);
          return cachedData;
        }
      }

      this.loading = true;
      this.error = null;

      try {
        // 并行请求所有天气数据
        const [currentRes, hourlyRes, dailyRes, summaryRes] = await Promise.all([
          weatherApi.getCurrentWeather(lat, lon),
          weatherApi.getHourlyWeather(lat, lon),
          weatherApi.getDailyWeather(lat, lon),
          weatherApi.getWeatherSummary(lat, lon)
        ]);

        const weatherData = {
          currentWeather: currentRes.data,
          hourlyWeather: hourlyRes.data,
          dailyWeather: dailyRes.data,
          weatherSummary: summaryRes.data
        };

        // 更新缓存
        const cachedData = {
          ...weatherData,
          timestamp: Date.now()
        };
        
        this.cache.set(cacheKey, cachedData);
        this.locationsWeather.set(cacheKey, weatherData);

        // 限制缓存大小，最多保存10个地点的天气数据
        if (this.cache.size > 10) {
          const firstKey = this.cache.keys().next().value;
          this.cache.delete(firstKey);
          this.locationsWeather.delete(firstKey);
        }

        return weatherData;
      } catch (err) {
        this.error = err.response?.data?.detail || '获取天气数据失败';
        console.error('Error fetching weather data:', err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    clearWeatherData() {
      this.locationsWeather.clear();
      this.error = null;
    },

    getTravelAdvice(weatherData) {
      if (!weatherData || !weatherData.currentWeather || !weatherData.currentWeather.now) return '无法获取出行建议';

      const text = weatherData.currentWeather.now.text;
      const temp = parseInt(weatherData.currentWeather.now.temp);

      if (text.includes('雨')) {
        return '建议携带雨具，注意防雨';
      } else if (text.includes('雪')) {
        return '建议穿厚衣服，注意保暖防滑';
      } else if (temp > 30) {
        return '天气炎热，建议穿轻薄衣物，注意防晒';
      } else if (temp < 10) {
        return '天气寒冷，建议穿厚衣服，注意保暖';
      } else if (text.includes('雾') || text.includes('霾')) {
        return '能见度低，建议谨慎驾驶，佩戴口罩';
      } else {
        return '天气良好，适合出行';
      }
    }
  }
});
