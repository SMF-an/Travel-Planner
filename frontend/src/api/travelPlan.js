import axios from 'axios';

const CLOUDBASE_API = 'https://personal-d8ge1nis6551fced9.service.tcloudbase.com/api';

const api = axios.create({
  baseURL: `${CLOUDBASE_API}/plans`,
  timeout: 35000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const travelPlanApi = {
  getPlans: () => api.get('/'),

  getPlan: (id) => api.get(`/${id}`),

  createPlan: (plan) => api.post('/', plan),

  updatePlan: (id, plan) => api.put(`/${id}`, plan),

  deletePlan: (id) => api.delete(`/${id}`),

  generateSummary: (planId, data) => axios.post(`${CLOUDBASE_API}/plans/summary`, { ...data, plan_id: planId }),

  getSummaryInfo: (planId) => axios.get(`${CLOUDBASE_API}/plans/${planId}/summary`)
};

export const aiSummaryApi = {
  generateSummary: (planId, data) => axios.post(`${CLOUDBASE_API}/plans/summary`, { ...data, plan_id: planId }),

  getSummaryInfo: (planId) => axios.get(`${CLOUDBASE_API}/plans/${planId}/summary`)
};