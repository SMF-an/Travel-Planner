import { defineStore } from 'pinia';
import { travelPlanApi } from '../api/travelPlan';

export const useTravelPlanStore = defineStore('travelPlan', {
  state: () => ({
    plans: [],
    currentPlan: null,
    loading: false,
    error: null
  }),
  
  getters: {
    getAllPlans: (state) => state.plans,
    getCurrentPlan: (state) => state.currentPlan,
    isLoading: (state) => state.loading,
    getError: (state) => state.error
  },
  
  actions: {
    // 获取所有规划
    async fetchPlans() {
      this.loading = true;
      this.error = null;
      try {
        const response = await travelPlanApi.getPlans();
        this.plans = response.data;
      } catch (err) {
        this.error = '获取规划列表失败';
        console.error(err);
      } finally {
        this.loading = false;
      }
    },
    
    // 获取单个规划
    async fetchPlan(id) {
      this.loading = true;
      this.error = null;
      try {
        const response = await travelPlanApi.getPlan(id);
        this.currentPlan = response.data;
      } catch (err) {
        this.error = '获取规划详情失败';
        console.error(err);
      } finally {
        this.loading = false;
      }
    },
    
    // 创建规划
    async createPlan(plan) {
      this.loading = true;
      this.error = null;
      try {
        const response = await travelPlanApi.createPlan(plan);
        this.plans.push(response.data);
        return response.data;
      } catch (err) {
        this.error = '创建规划失败';
        console.error(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },
    
    // 更新规划
    async updatePlan(id, plan) {
      this.loading = true;
      this.error = null;
      try {
        const response = await travelPlanApi.updatePlan(id, plan);
        const index = this.plans.findIndex(p => p.id === id);
        if (index !== -1) {
          this.plans[index] = response.data;
        }
        if (this.currentPlan && this.currentPlan.id === id) {
          this.currentPlan = response.data;
        }
        return response.data;
      } catch (err) {
        this.error = '更新规划失败';
        console.error(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },
    
    // 删除规划
    async deletePlan(id) {
      this.loading = true;
      this.error = null;
      try {
        await travelPlanApi.deletePlan(id);
        this.plans = this.plans.filter(p => p.id !== id);
        if (this.currentPlan && this.currentPlan.id === id) {
          this.currentPlan = null;
        }
      } catch (err) {
        this.error = '删除规划失败';
        console.error(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },
    
    // 清除当前规划
    clearCurrentPlan() {
      this.currentPlan = null;
    }
  }
});
