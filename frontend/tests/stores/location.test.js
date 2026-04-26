import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useLocationStore } from '../../src/stores/location';

vi.mock('../../src/api/location', () => ({
  locationApi: {
    getPlanLocations: vi.fn(),
    addLocationToPlan: vi.fn(),
    updatePlanLocation: vi.fn(),
    deletePlanLocation: vi.fn(),
    reorderLocations: vi.fn(),
    searchLocations: vi.fn(),
    geocode: vi.fn()
  }
}));

describe('Location Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('State', () => {
    it('should have correct initial state', () => {
      const store = useLocationStore();
      expect(store.locations).toEqual([]);
      expect(store.selectedLocation).toBeNull();
      expect(store.searchResults).toEqual([]);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
      expect(store.mapLoaded).toBe(false);
    });
  });

  describe('Actions', () => {
    it('should fetch plan locations successfully', async () => {
      const { locationApi } = await import('../../src/api/location');
      const store = useLocationStore();
      const mockLocations = [
        { id: 1, name: 'Location 1', address: 'Address 1', latitude: 39.9, longitude: 116.4 },
        { id: 2, name: 'Location 2', address: 'Address 2', latitude: 40.0, longitude: 116.5 }
      ];

      locationApi.getPlanLocations.mockResolvedValue({ data: mockLocations });

      await store.fetchPlanLocations(1);

      expect(store.locations).toEqual(mockLocations);
      expect(store.loading).toBe(false);
      expect(store.error).toBeNull();
    });

    it('should handle fetch plan locations error', async () => {
      const { locationApi } = await import('../../src/api/location');
      const store = useLocationStore();

      locationApi.getPlanLocations.mockRejectedValue(new Error('Network error'));

      await store.fetchPlanLocations(1);

      expect(store.error).toBe('获取地点列表失败');
      expect(store.loading).toBe(false);
    });

    it('should add location successfully', async () => {
      const { locationApi } = await import('../../src/api/location');
      const store = useLocationStore();
      const newLocation = {
        name: 'New Location',
        address: 'New Address',
        latitude: 39.9,
        longitude: 116.4
      };
      const createdLocation = { id: 1, ...newLocation, order_index: 0 };

      locationApi.addLocationToPlan.mockResolvedValue({ data: createdLocation });

      const result = await store.addLocation(1, newLocation);

      expect(store.locations).toContainEqual(createdLocation);
      expect(result).toEqual(createdLocation);
    });

    it('should delete location successfully', async () => {
      const { locationApi } = await import('../../src/api/location');
      const store = useLocationStore();
      store.locations = [
        { id: 1, name: 'Location 1' },
        { id: 2, name: 'Location 2' }
      ];

      locationApi.deletePlanLocation.mockResolvedValue({});

      await store.deleteLocation(1);

      expect(store.locations).toHaveLength(1);
      expect(store.locations[0].id).toBe(2);
    });

    it('should search locations successfully', async () => {
      const { locationApi } = await import('../../src/api/location');
      const store = useLocationStore();
      const mockResults = [
        { name: 'Result 1', address: 'Address 1', latitude: 39.9, longitude: 116.4 }
      ];

      locationApi.searchLocations.mockResolvedValue({ data: mockResults });

      const results = await store.searchLocations('test');

      expect(store.searchResults).toEqual(mockResults);
      expect(results).toEqual(mockResults);
    });

    it('should reorder locations successfully', async () => {
      const { locationApi } = await import('../../src/api/location');
      const store = useLocationStore();
      store.locations = [
        { id: 1, name: 'Location 1', order_index: 0 },
        { id: 2, name: 'Location 2', order_index: 1 },
        { id: 3, name: 'Location 3', order_index: 2 }
      ];

      locationApi.reorderLocations.mockResolvedValue({});

      await store.reorderLocations(1, [3, 1, 2]);

      expect(store.locations[0].id).toBe(3);
      expect(store.locations[1].id).toBe(1);
      expect(store.locations[2].id).toBe(2);
    });

    it('should select location', () => {
      const store = useLocationStore();
      const location = { id: 1, name: 'Test Location' };

      store.selectLocation(location);

      expect(store.selectedLocation).toEqual(location);
    });

    it('should clear selected location', () => {
      const store = useLocationStore();
      store.selectedLocation = { id: 1, name: 'Test' };

      store.clearSelectedLocation();

      expect(store.selectedLocation).toBeNull();
    });

    it('should clear search results', () => {
      const store = useLocationStore();
      store.searchResults = [{ id: 1 }, { id: 2 }];

      store.clearSearchResults();

      expect(store.searchResults).toEqual([]);
    });

    it('should clear locations', () => {
      const store = useLocationStore();
      store.locations = [{ id: 1 }, { id: 2 }];

      store.clearLocations();

      expect(store.locations).toEqual([]);
    });

    it('should set map loaded state', () => {
      const store = useLocationStore();

      store.setMapLoaded(true);

      expect(store.mapLoaded).toBe(true);
    });
  });

  describe('Getters', () => {
    it('should return correct location count', () => {
      const store = useLocationStore();
      store.locations = [
        { id: 1 },
        { id: 2 },
        { id: 3 }
      ];

      expect(store.getLocationCount).toBe(3);
    });

    it('should return correct locations', () => {
      const store = useLocationStore();
      const mockLocations = [{ id: 1 }, { id: 2 }];
      store.locations = mockLocations;

      expect(store.getLocations).toEqual(mockLocations);
    });

    it('should return loading state', () => {
      const store = useLocationStore();
      store.loading = true;

      expect(store.isLoading).toBe(true);
    });

    it('should return error state', () => {
      const store = useLocationStore();
      store.error = 'Test error';

      expect(store.getError).toBe('Test error');
    });
  });
});