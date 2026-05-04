import axios from 'axios';

const CLOUDBASE_API = 'https://personal-d8ge1nis6551fced9.service.tcloudbase.com/api';

export const locationApi = {
  getPlanLocations: (planId) => axios.get(`${CLOUDBASE_API}/plans/${planId}/locations`),

  addLocationToPlan: (planId, locationData) => axios.post(`${CLOUDBASE_API}/plans/${planId}/locations`, locationData),

  updatePlanLocation: (planLocationId, updateData) => axios.put(`${CLOUDBASE_API}/plan-locations/${planLocationId}`, updateData),

  deletePlanLocation: (planLocationId) => axios.delete(`${CLOUDBASE_API}/plan-locations/${planLocationId}`),

  reorderLocations: (planId, locationIds) => axios.put(`${CLOUDBASE_API}/plans/${planId}/locations/reorder`, locationIds)
};