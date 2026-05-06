# 配置文件 - 从环境变量读取敏感信息

import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 和风天气API配置
WEATHER = {
    'API_KEY': os.getenv('WEATHER_API_KEY', ''),
    'API_URL': os.getenv('WEATHER_API_URL', 'https://devapi.qweather.com/v7/weather/now'),
    'HOURLY_URL': os.getenv('WEATHER_HOURLY_URL', 'https://devapi.qweather.com/v7/weather/24h'),
    'DAILY_URL': os.getenv('WEATHER_DAILY_URL', 'https://devapi.qweather.com/v7/weather/7d'),
    'ICON_URL': 'https://cdn.jsdelivr.net/npm/qweather-icons@1.8.0/icons'
}

# Deepseek API配置
DEEPSEEK = {
    'API_KEY': os.getenv('DEEPSEEK_API_KEY', ''),
    'API_URL': os.getenv('DEEPSEEK_API_URL', 'https://api.deepseek.com'),
    'MODEL': os.getenv('DEEPSEEK_MODEL', 'deepseek-v4-flash'),
    'API_TIMEOUT': 30000  # 30秒超时
}

# CloudBase 环境配置
CLOUDBASE_ENV_ID = os.getenv('CLOUDBASE_ENV_ID', '')

# API请求超时设置
API_TIMEOUT = int(os.getenv('API_TIMEOUT', '3'))  # 3秒

# 重试次数
API_RETRY_COUNT = int(os.getenv('API_RETRY_COUNT', '3'))