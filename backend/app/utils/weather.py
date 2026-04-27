import requests
import time
from functools import lru_cache
from app.config import WEATHER, API_TIMEOUT, API_RETRY_COUNT

class WeatherService:
    def __init__(self):
        self.api_key = WEATHER['API_KEY']
        self.api_url = WEATHER['API_URL']
        self.hourly_url = WEATHER['HOURLY_URL']
        self.daily_url = WEATHER['DAILY_URL']
    
    def _make_request(self, url, params):
        """发送API请求，处理超时和重试"""
        params['key'] = self.api_key
        
        for attempt in range(API_RETRY_COUNT):
            try:
                response = requests.get(url, params=params, timeout=API_TIMEOUT)
                response.raise_for_status()
                return response.json()
            except requests.exceptions.RequestException as e:
                if attempt == API_RETRY_COUNT - 1:
                    raise
                time.sleep(1)  # 等待1秒后重试
    
    @lru_cache(maxsize=100)
    def get_current_weather(self, lat, lon):
        """获取实时天气数据"""
        params = {'location': f'{lon},{lat}'}
        return self._make_request(self.api_url, params)
    
    @lru_cache(maxsize=100)
    def get_hourly_weather(self, lat, lon):
        """获取24小时逐小时天气预报"""
        params = {'location': f'{lon},{lat}'}
        return self._make_request(self.hourly_url, params)
    
    @lru_cache(maxsize=100)
    def get_daily_weather(self, lat, lon):
        """获取7天天气预报"""
        params = {'location': f'{lon},{lat}'}
        return self._make_request(self.daily_url, params)
    
    def get_weather_summary(self, weather_data):
        """生成天气摘要"""
        if 'now' in weather_data:
            temp = weather_data['now']['temp']
            text = weather_data['now']['text']
            feels_like = weather_data['now']['feelsLike']
            humidity = weather_data['now']['humidity']
            wind_dir = weather_data['now']['windDir']
            wind_scale = weather_data['now']['windScale']
            
            summary = f"当前温度{temp}°C，{text}，体感温度{feels_like}°C，湿度{humidity}%，{wind_dir}风{wind_scale}级"
            return summary
        return "无法获取天气摘要"
