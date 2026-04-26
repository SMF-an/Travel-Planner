import { defineStore } from 'pinia';
import { locationApi } from '../api/location';

export const useLocationStore = defineStore('location', {
  state: () => ({
    locations: [],
    selectedLocation: null,
    searchResults: [],
    loading: false,
    error: null,
    mapLoaded: false
  }),

  getters: {
    getLocations: (state) => state.locations,
    getLocationCount: (state) => state.locations.length,
    isLoading: (state) => state.loading,
    getError: (state) => state.error
  },

  actions: {
    async fetchPlanLocations(planId) {
      this.loading = true;
      this.error = null;
      try {
        const response = await locationApi.getPlanLocations(planId);
        this.locations = response.data;
      } catch (err) {
        this.error = '获取地点列表失败';
        console.error(err);
      } finally {
        this.loading = false;
      }
    },

    async addLocation(planId, locationData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await locationApi.addLocationToPlan(planId, locationData);
        this.locations.push(response.data);
        return response.data;
      } catch (err) {
        this.error = '添加地点失败';
        console.error(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateLocation(planLocationId, updateData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await locationApi.updatePlanLocation(planLocationId, updateData);
        const index = this.locations.findIndex(l => l.id === planLocationId);
        if (index !== -1) {
          this.locations[index] = response.data;
        }
        return response.data;
      } catch (err) {
        this.error = '更新地点失败';
        console.error(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async deleteLocation(planLocationId) {
      this.loading = true;
      this.error = null;
      try {
        await locationApi.deletePlanLocation(planLocationId);
        this.locations = this.locations.filter(l => l.id !== planLocationId);
      } catch (err) {
        this.error = '删除地点失败';
        console.error(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async reorderLocations(planId, locationIds) {
      this.loading = true;
      this.error = null;
      try {
        await locationApi.reorderLocations(planId, locationIds);
        const reordered = [];
        for (let i = 0; i < locationIds.length; i++) {
          const loc = this.locations.find(l => l.id === locationIds[i]);
          if (loc) {
            loc.order_index = i;
            reordered.push(loc);
          }
        }
        this.locations = reordered;
      } catch (err) {
        this.error = '排序更新失败';
        console.error(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async searchLocations(keywords) {
      this.loading = true;
      this.error = null;
      try {
        const response = await locationApi.searchLocations(keywords);
        this.searchResults = response.data;
        return response.data;
      } catch (err) {
        this.error = '搜索地点失败';
        console.error(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async geocodeAddress(address) {
      this.loading = true;
      this.error = null;
      try {
        const response = await locationApi.geocode(address);
        return response.data;
      } catch (err) {
        this.error = '地理编码失败';
        console.error(err);
        throw err;
      } finally {
        this.loading = false;
      }
    },

    selectLocation(location) {
      this.selectedLocation = location;
    },

    clearSelectedLocation() {
      this.selectedLocation = null;
    },

    clearSearchResults() {
      this.searchResults = [];
    },

    clearLocations() {
      this.locations = [];
    },

    setMapLoaded(loaded) {
      this.mapLoaded = loaded;
    }
  }
});