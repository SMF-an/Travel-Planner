import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 35000,
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
  deletePlan: (id) => api.delete(`/plans/${id}`),
  
  // 生成AI总结
  generateSummary: (planId, data) => api.post(`/plans/${planId}/summary`, data),
  
  // 获取规划总结信息
  getSummaryInfo: (planId) => api.get(`/plans/${planId}/summary`)
};
