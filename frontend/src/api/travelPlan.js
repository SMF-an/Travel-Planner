import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 出行规划API
export const travelPlanApi = {
  // 获取规划列表
  getPlans: () => api.get('/plans'),
  
  // 获取单个规划详情
  getPlan: (id) => api.get(`/plans/${id}`),
  
  // 创建新规划
  createPlan: (plan) => api.post('/plans', plan),
  
  // 更新规划
  updatePlan: (id, plan) => api.put(`/plans/${id}`, plan),
  
  // 删除规划
  deletePlan: (id) => api.delete(`/plans/${id}`)
};
