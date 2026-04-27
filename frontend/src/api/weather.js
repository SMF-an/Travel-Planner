import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

export const weatherApi = {
  getCurrentWeather: (lat, lon) => axios.get(`${BASE_URL}/weather/current`, { params: { lat, lon } }),

  getHourlyWeather: (lat, lon) => axios.get(`${BASE_URL}/weather/hourly`, { params: { lat, lon } }),

  getDailyWeather: (lat, lon) => axios.get(`${BASE_URL}/weather/daily`, { params: { lat, lon } }),

  getWeatherSummary: (lat, lon) => axios.get(`${BASE_URL}/weather/summary`, { params: { lat, lon } })
};
