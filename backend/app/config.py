# 配置文件

# 和风天气API配置
WEATHER = {
    'API_KEY': '911096bc5cda485481d70301fba9db67',
    'API_URL': 'https://devapi.qweather.com/v7/weather/now',
    'HOURLY_URL': 'https://devapi.qweather.com/v7/weather/24h',
    'DAILY_URL': 'https://devapi.qweather.com/v7/weather/7d',
    'ICON_URL': 'https://cdn.jsdelivr.net/npm/qweather-icons@1.8.0/icons'
}

# API请求超时设置
API_TIMEOUT = 3  # 3秒

# 重试次数
API_RETRY_COUNT = 3
