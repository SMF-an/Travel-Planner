import axios from 'axios';

const CLOUDBASE_API = 'https://personal-d8ge1nis6551fced9.service.tcloudbase.com/api';

export const weatherApi = {
  getCurrentWeather: (lat, lon) => axios.get(`${CLOUDBASE_API}/weather/current`, { params: { lat, lon } }),

  getHourlyWeather: (lat, lon) => axios.get(`${CLOUDBASE_API}/weather/hourly`, { params: { lat, lon } }),

  getDailyWeather: (lat, lon) => axios.get(`${CLOUDBASE_API}/weather/daily`, { params: { lat, lon } }),

  getWeatherSummary: (lat, lon) => axios.get(`${CLOUDBASE_API}/weather/summary`, { params: { lat, lon } })
};