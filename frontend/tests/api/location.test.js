import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { locationApi } from '../../src/api/location';

vi.mock('axios');

describe('Location API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getPlanLocations', () => {
    it('should make GET request to correct endpoint', async () => {
      axios.get.mockResolvedValue({ data: [] });

      await locationApi.getPlanLocations(1);

      expect(axios.get).toHaveBeenCalledWith('http://localhost:8000/api/plans/1/locations');
    });

    it('should return location data on success', async () => {
      const mockData = [{ id: 1, name: 'Location 1' }];
      axios.get.mockResolvedValue({ data: mockData });

      const result = await locationApi.getPlanLocations(1);

      expect(result.data).toEqual(mockData);
    });

    it('should throw error on request failure', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      await expect(locationApi.getPlanLocations(1)).rejects.toThrow('Network error');
    });
  });

  describe('addLocationToPlan', () => {
    it('should make POST request with correct data', async () => {
      axios.post.mockResolvedValue({ data: { id: 1 } });
      const locationData = {
        name: 'Test Location',
        address: 'Test Address',
        latitude: 39.9,
        longitude: 116.4
      };

      await locationApi.addLocationToPlan(1, locationData);

      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:8000/api/plans/1/locations',
        locationData
      );
    });

    it('should return created location on success', async () => {
      const mockLocation = { id: 1, name: 'Created Location' };
      axios.post.mockResolvedValue({ data: mockLocation });

      const result = await locationApi.addLocationToPlan(1, {});

      expect(result.data).toEqual(mockLocation);
    });
  });

  describe('updatePlanLocation', () => {
    it('should make PUT request to correct endpoint', async () => {
      axios.put.mockResolvedValue({ data: { id: 1 } });
      const updateData = { notes: 'Updated notes' };

      await locationApi.updatePlanLocation(1, updateData);

      expect(axios.put).toHaveBeenCalledWith(
        'http://localhost:8000/api/plan-locations/1',
        updateData
      );
    });
  });

  describe('deletePlanLocation', () => {
    it('should make DELETE request to correct endpoint', async () => {
      axios.delete.mockResolvedValue({ data: { message: 'Deleted' } });

      await locationApi.deletePlanLocation(1);

      expect(axios.delete).toHaveBeenCalledWith('http://localhost:8000/api/plan-locations/1');
    });

    it('should return success message on deletion', async () => {
      axios.delete.mockResolvedValue({ data: { message: '删除成功' } });

      const result = await locationApi.deletePlanLocation(1);

      expect(result.data.message).toBe('删除成功');
    });
  });

  describe('reorderLocations', () => {
    it('should make PUT request with location ids', async () => {
      axios.put.mockResolvedValue({ data: { message: 'Success' } });
      const locationIds = [3, 1, 2];

      await locationApi.reorderLocations(1, locationIds);

      expect(axios.put).toHaveBeenCalledWith(
        'http://localhost:8000/api/plans/1/locations/reorder',
        locationIds
      );
    });
  });

  describe('searchLocations', () => {
    it('should make GET request with keywords param', async () => {
      axios.get.mockResolvedValue({ data: [] });

      await locationApi.searchLocations('故宫');

      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/locations/search',
        { params: { keywords: '故宫' } }
      );
    });

    it('should return search results', async () => {
      const mockResults = [
        { name: '故宫', address: '北京市东城区' },
        { name: '故宫博物院', address: '北京市西城区' }
      ];
      axios.get.mockResolvedValue({ data: mockResults });

      const results = await locationApi.searchLocations('故宫');

      expect(results.data).toEqual(mockResults);
    });
  });

  describe('geocode', () => {
    it('should make GET request with address param', async () => {
      axios.get.mockResolvedValue({ data: {} });

      await locationApi.geocode('北京市朝阳区');

      expect(axios.get).toHaveBeenCalledWith(
        'http://localhost:8000/api/geocode',
        { params: { address: '北京市朝阳区' } }
      );
    });

    it('should return geocoded result', async () => {
      const mockResult = {
        name: '北京市朝阳区',
        address: '北京市朝阳区',
        latitude: 39.9,
        longitude: 116.4
      };
      axios.get.mockResolvedValue({ data: mockResult });

      const result = await locationApi.geocode('北京市朝阳区');

      expect(result.data).toEqual(mockResult);
    });
  });
});