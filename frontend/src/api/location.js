import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

export const locationApi = {
  getPlanLocations: (planId) => axios.get(`${BASE_URL}/plans/${planId}/locations`),

  addLocationToPlan: (planId, locationData) => axios.post(`${BASE_URL}/plans/${planId}/locations`, locationData),

  updatePlanLocation: (planLocationId, updateData) => axios.put(`${BASE_URL}/plan-locations/${planLocationId}`, updateData),

  deletePlanLocation: (planLocationId) => axios.delete(`${BASE_URL}/plan-locations/${planLocationId}`),

  reorderLocations: (planId, locationIds) => axios.put(`${BASE_URL}/plans/${planId}/locations/reorder`, locationIds),

  searchLocations: (keywords) => axios.get(`${BASE_URL}/locations/search`, { params: { keywords } }),

  geocode: (address) => axios.get(`${BASE_URL}/geocode`, { params: { address } })
};