const axios = require('axios');

const WEATHER_CONFIG = {
  API_KEY: '911096bc5cda485481d70301fba9db67',
  API_URL: 'https://devapi.qweather.com/v7/weather/now',
  HOURLY_URL: 'https://devapi.qweather.com/v7/weather/24h',
  DAILY_URL: 'https://devapi.qweather.com/v7/weather/7d'
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };
}

function successResponse(data, statusCode = 200) {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify(data)
  };
}

function errorResponse(message, statusCode = 500) {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify({ error: message })
  };
}

async function makeRequest(url, params) {
  params.key = WEATHER_CONFIG.API_KEY;
  
  try {
    const response = await axios.get(url, { params, timeout: 10000 });
    return response.data;
  } catch (error) {
    console.error('Weather API request error:', error.message);
    throw error;
  }
}

async function getCurrentWeather(lat, lon) {
  const params = { location: `${lon},${lat}` };
  return makeRequest(WEATHER_CONFIG.API_URL, params);
}

async function getHourlyWeather(lat, lon) {
  const params = { location: `${lon},${lat}` };
  return makeRequest(WEATHER_CONFIG.HOURLY_URL, params);
}

async function getDailyWeather(lat, lon) {
  const params = { location: `${lon},${lat}` };
  return makeRequest(WEATHER_CONFIG.DAILY_URL, params);
}

function getWeatherSummary(weatherData) {
  if (weatherData && weatherData.now) {
    const temp = weatherData.now.temp;
    const text = weatherData.now.text;
    const feelsLike = weatherData.now.feelsLike;
    const humidity = weatherData.now.humidity;
    const windDir = weatherData.now.windDir;
    const windScale = weatherData.now.windScale;
    
    return `当前温度${temp}°C，${text}，体感温度${feelsLike}°C，湿度${humidity}%，${windDir}风${windScale}级`;
  }
  return '无法获取天气摘要';
}

exports.main = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  const path = event.path || '';
  const method = event.httpMethod;

  console.log(`[weather] ${method} ${path}`);

  try {
    let queryString = event.queryString || event.queryStringParameters || {};
    if (typeof queryString === 'string') {
      const params = new URLSearchParams(queryString);
      queryString = {};
      for (const [key, value] of params) {
        queryString[key] = value;
      }
    }
    console.log('[weather] queryString:', queryString);
    const lat = parseFloat(queryString.lat);
    const lon = parseFloat(queryString.lon);

    if (isNaN(lat) || isNaN(lon)) {
      return errorResponse('缺少必要参数：lat 和 lon', 400);
    }

    const segments = path.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];

    if (lastSegment === 'current' || path.endsWith('/weather/current')) {
      const weatherData = await getCurrentWeather(lat, lon);
      if (weatherData.code !== '200') {
        return errorResponse(`获取天气数据失败: ${weatherData.code}`, 400);
      }
      return successResponse(weatherData);
    }

    if (lastSegment === 'hourly' || path.endsWith('/weather/hourly')) {
      const weatherData = await getHourlyWeather(lat, lon);
      if (weatherData.code !== '200') {
        return errorResponse(`获取天气数据失败: ${weatherData.code}`, 400);
      }
      return successResponse(weatherData);
    }

    if (lastSegment === 'daily' || path.endsWith('/weather/daily')) {
      const weatherData = await getDailyWeather(lat, lon);
      if (weatherData.code !== '200') {
        return errorResponse(`获取天气数据失败: ${weatherData.code}`, 400);
      }
      return successResponse(weatherData);
    }

    if (lastSegment === 'summary' || path.endsWith('/weather/summary')) {
      const weatherData = await getCurrentWeather(lat, lon);
      if (weatherData.code !== '200') {
        return errorResponse(`获取天气数据失败: ${weatherData.code}`, 400);
      }
      const summary = getWeatherSummary(weatherData);
      return successResponse({ summary });
    }

    return errorResponse('未找到对应的接口', 404);
  } catch (error) {
    console.error('[weather] Error:', error);
    return errorResponse(error.message || '服务器内部错误', 500);
  }
};