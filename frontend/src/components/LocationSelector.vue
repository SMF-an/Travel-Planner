<template>
  <div class="location-selector">
    <div class="location-header">
      <h2 class="section-title">地点选择</h2>
      <p class="section-desc">为您的规划添加想要游览的地点</p>
    </div>

    <div class="location-content">
      <div class="map-section">
        <div class="map-wrapper">
          <div ref="mapContainer" class="map-container"></div>
          <div v-if="!mapLoaded" class="map-loading">
            <n-spin size="large">
              <template #description>
                <span>地图加载中...</span>
              </template>
            </n-spin>
          </div>
          <div v-if="mapError" class="map-error">
            <n-result status="error" title="地图加载失败" :description="mapError">
              <template #footer>
                <n-button @click="initMap">重新加载</n-button>
              </template>
            </n-result>
          </div>
        </div>

        <div class="search-section">
          <n-input-group>
            <n-input
              v-model:value="searchKeywords"
              placeholder="搜索地点名称..."
              size="large"
              @keyup.enter="handleSearch"
              clearable
            />
            <n-button type="primary" size="large" @click="handleSearch" :loading="searchLoading">
              搜索
            </n-button>
          </n-input-group>

          <div v-if="searchResults.length > 0" class="search-results">
            <div
              v-for="(result, index) in searchResults"
              :key="index"
              class="search-result-item"
              @click="handleSelectSearchResult(result)"
            >
              <div class="result-name">{{ result.name }}</div>
              <div class="result-address">{{ result.address || '暂无地址信息' }}</div>
            </div>
          </div>
        </div>

        <div v-if="reverseGeocodeLoading || reverseGeocodeError" class="reverse-geocode-status">
          <n-spin v-if="reverseGeocodeLoading" size="small">
            <template #description>
              <span>正在解析点击位置，请稍候...</span>
            </template>
          </n-spin>
          <span v-else class="reverse-geocode-error">{{ reverseGeocodeError }}</span>
        </div>

        <div class="selected-info" v-if="selectedLocationForAdd">
          <div class="selected-header">
            <span class="selected-label">已选择地点</span>
            <n-button text type="error" @click="clearSelectedForAdd">
              <template #icon>
                <n-icon :component="CloseIcon" />
              </template>
            </n-button>
          </div>
          <div class="selected-content">
            <div class="selected-name">{{ selectedLocationForAdd.name }}</div>
            <div class="selected-address">{{ selectedLocationForAdd.address || '暂无详细地址' }}</div>
          </div>
          <n-input
            v-model:value="locationNotes"
            type="textarea"
            placeholder="添加备注（可选）"
            :autosize="{ minRows: 2, maxRows: 4 }"
            class="notes-input"
          />
          <n-button
            type="primary"
            block
            @click="handleAddLocation"
            :loading="addLoading"
            :disabled="!selectedLocationForAdd"
          >
            添加到规划
          </n-button>
        </div>
      </div>

      <div class="locations-list-section">
        <div class="locations-header">
          <h3 class="list-title">已选地点 ({{ locationStore.getLocationCount }})</h3>
          <span class="drag-hint">长按拖动调整顺序</span>
        </div>

        <n-empty
          v-if="locationStore.getLocationCount === 0 && !locationStore.loading"
          description="暂无已选地点"
          class="empty-locations"
        >
          <template #extra>
            <p class="empty-hint">在上方地图上点击选择地点，或搜索添加</p>
          </template>
        </n-empty>

        <div v-if="locationStore.loading" class="loading-container">
          <n-spin size="large" description="加载地点中..." />
        </div>

        <draggable
          v-else-if="locationStore.getLocationCount > 0"
          v-model="localLocations"
          item-key="id"
          :animation="200"
          ghost-class="location-ghost"
          chosen-class="location-chosen"
          drag-class="location-drag"
          @end="handleReorder"
          class="locations-list"
        >
          <template #item="{ element, index }">
            <div class="location-item" :key="element.id">
              <div class="drag-indicator">
                <n-icon :component="DragIcon" size="16" />
              </div>
              <div class="location-index">{{ index + 1 }}</div>
              <div class="location-info" @click="handleLocationClick(element)">
                <div class="location-name">{{ element.location.name }}</div>
                <div class="location-address">{{ element.location.address || '暂无地址' }}</div>
                <div v-if="element.notes" class="location-notes">{{ element.notes }}</div>
              </div>
              <div class="location-actions">
                <n-button text size="small" @click.stop="handleEditLocation(element)">
                  <template #icon>
                    <n-icon :component="EditIcon" />
                  </template>
                </n-button>
                <n-button text size="small" type="error" @click.stop="handleDeleteLocation(element.id)">
                  <template #icon>
                    <n-icon :component="DeleteIcon" />
                  </template>
                </n-button>
              </div>
            </div>
          </template>
        </draggable>
      </div>
    </div>

    <n-modal
      v-model:show="showEditModal"
      preset="card"
      title="编辑地点信息"
      style="width: 500px"
      :bordered="false"
    >
      <n-form label-placement="top" v-if="editingLocation">
        <n-form-item label="地点名称">
          <n-input v-model:value="editingLocation.location.name" placeholder="请输入地点名称" />
        </n-form-item>
        <n-form-item label="地址">
          <n-input v-model:value="editingLocation.location.address" placeholder="请输入地址" />
        </n-form-item>
        <n-form-item label="备注">
          <n-input
            v-model:value="editingLocation.notes"
            type="textarea"
            placeholder="添加备注"
            :autosize="{ minRows: 2, maxRows: 4 }"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <div class="modal-footer">
          <n-button @click="showEditModal = false">取消</n-button>
          <n-button type="primary" @click="handleSaveEdit" :loading="saveLoading">保存</n-button>
        </div>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showDetailModal"
      preset="card"
      title="地点详情"
      style="width: 450px"
      :bordered="false"
    >
      <div v-if="detailLocation" class="location-detail">
        <div class="detail-map">
          <div ref="detailMapContainer" class="detail-map-container"></div>
        </div>
        <div class="detail-info">
          <h3 class="detail-name">{{ detailLocation.location.name }}</h3>
          <div class="detail-row">
            <n-icon :component="LocationIcon" />
            <span>{{ detailLocation.location.address || '暂无地址' }}</span>
          </div>
          <div class="detail-row" v-if="detailLocation.notes">
            <n-icon :component="NotesIcon" />
            <span>{{ detailLocation.notes }}</span>
          </div>
          <div class="detail-row">
            <n-icon :component="OrderIcon" />
            <span>第 {{ detailLocation.order_index + 1 }} 站</span>
          </div>
        </div>
      </div>
    </n-modal>

    <div class="action-bar">
      <n-button size="large" @click="handleBack">返回上一步</n-button>
      <n-button type="primary" size="large" @click="handleNext" :disabled="locationStore.getLocationCount === 0">
        完成地点选择
      </n-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useLocationStore } from '../stores/location';
import { NInput, NInputGroup, NButton, NIcon, NSpin, NEmpty, NResult, NModal, NForm, NFormItem } from 'naive-ui';
import draggable from 'vuedraggable';
import { h } from 'vue';

const AMAP_API_KEY = '6efba890c74d422fa53fc3c0c83ebe3b';
const AMAP_SECURITY_JS_CODE = '6b26790de737459c4ca0786703fb84fe';

const GEOCODE = {
  API_KEY: 'f72055424a53f3875c71dce07d7bb10c',
  API_URL: 'https://restapi.amap.com/v3/geocode/geo'
};

const props = defineProps({
  planId: {
    type: [Number, String],
    required: true
  }
});

const emit = defineEmits(['back', 'next']);

const router = useRouter();
const route = useRoute();
const locationStore = useLocationStore();

const mapContainer = ref(null);
const detailMapContainer = ref(null);
const mapInstance = ref(null);
const detailMapInstance = ref(null);
const mapLoaded = ref(false);
const mapError = ref(null);

const searchKeywords = ref('');
const searchResults = ref([]);
const searchLoading = ref(false);
const addLoading = ref(false);
const saveLoading = ref(false);
const reverseGeocodeLoading = ref(false);
const reverseGeocodeError = ref('');

const selectedLocationForAdd = ref(null);
const locationNotes = ref('');

const localLocations = ref([]);

const showEditModal = ref(false);
const editingLocation = ref(null);

const showDetailModal = ref(false);
const detailLocation = ref(null);
const geocoderInstance = ref(null);

const CloseIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '16',
      height: '16',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round'
    }, [
      h('line', { x1: '18', y1: '6', x2: '6', y2: '18' }),
      h('line', { x1: '6', y1: '6', x2: '18', y2: '18' })
    ]);
  }
};

const DragIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '20',
      height: '20',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round'
    }, [
      h('circle', { cx: '9', cy: '5', r: '1' }),
      h('circle', { cx: '9', cy: '12', r: '1' }),
      h('circle', { cx: '9', cy: '19', r: '1' }),
      h('circle', { cx: '15', cy: '5', r: '1' }),
      h('circle', { cx: '15', cy: '12', r: '1' }),
      h('circle', { cx: '15', cy: '19', r: '1' })
    ]);
  }
};

const EditIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '16',
      height: '16',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round'
    }, [
      h('path', { d: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' }),
      h('path', { d: 'M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z' })
    ]);
  }
};

const DeleteIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '16',
      height: '16',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round'
    }, [
      h('path', { d: 'M3 6h18' }),
      h('path', { d: 'M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' }),
      h('path', { d: 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' })
    ]);
  }
};

const LocationIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '16',
      height: '16',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round'
    }, [
      h('path', { d: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z' }),
      h('circle', { cx: '12', cy: '10', r: '3' })
    ]);
  }
};

const NotesIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '16',
      height: '16',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round'
    }, [
      h('path', { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' }),
      h('polyline', { points: '14 2 14 8 20 8' }),
      h('line', { x1: '16', y1: '13', x2: '8', y2: '13' }),
      h('line', { x1: '16', y1: '17', x2: '8', y2: '17' })
    ]);
  }
};

const OrderIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '16',
      height: '16',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round'
    }, [
      h('line', { x1: '8', y1: '6', x2: '21', y2: '6' }),
      h('line', { x1: '8', y1: '12', x2: '21', y2: '12' }),
      h('line', { x1: '8', y1: '18', x2: '21', y2: '18' }),
      h('line', { x1: '3', y1: '6', x2: '3.01', y2: '6' }),
      h('line', { x1: '3', y1: '12', x2: '3.01', y2: '12' }),
      h('line', { x1: '3', y1: '18', x2: '3.01', y2: '18' })
    ]);
  }
};

watch(() => locationStore.locations, (newVal) => {
  localLocations.value = [...newVal];
}, { deep: true });

const initMap = () => {
  mapError.value = null;

  if (!window._AMapSecurityConfig) {
    window._AMapSecurityConfig = {
      securityJsCode: AMAP_SECURITY_JS_CODE
    };
  }

  if (!window.AMap) {
    const script = document.createElement('script');
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_API_KEY}`;
    script.async = true;
    script.onerror = () => {
      mapError.value = '地图服务加载失败，请检查网络连接';
    };
    script.onload = () => {
      // 加载安全脚本
      const securityScript = document.createElement('script');
      securityScript.src = `https://webapi.amap.com/security.js`;
      securityScript.async = true;
      securityScript.onerror = () => {
        console.warn('Security script loading failed, but continuing with map initialization');
        initAMap();
      };
      securityScript.onload = () => {
        initAMap();
      };
      document.head.appendChild(securityScript);
    };
    document.head.appendChild(script);
  } else {
    initAMap();
  }
};

const initAMap = () => {
  try {
    if (!mapContainer.value) {
      mapError.value = '地图容器不存在';
      return;
    }

    mapInstance.value = new AMap.Map(mapContainer.value, {
      zoom: 12,
      center: [116.397428, 39.90923],
      viewMode: '2D'
    });

    AMap.plugin(['AMap.Geocoder'], () => {
      geocoderInstance.value = new AMap.Geocoder({
        radius: 1000,
        extensions: 'all'
      });
    });

    // 确保事件监听器正确注册
    if (mapInstance.value) {
      mapInstance.value.off('click', handleMapClick); // 先移除旧的监听器
      mapInstance.value.on('click', handleMapClick); // 再添加新的监听器
      console.log('Map click event listener registered');
    }

    mapLoaded.value = true;
    locationStore.setMapLoaded(true);
  } catch (e) {
    console.error('Map initialization error:', e);
    mapError.value = '地图初始化失败: ' + e.message;
  }
};

const getDisplayNameFromRegeocode = (regeocode, formattedAddress) => {
  const pois = Array.isArray(regeocode?.pois) ? regeocode.pois : [];
  const aois = Array.isArray(regeocode?.aois) ? regeocode.aois : [];
  const addressComponent = regeocode?.addressComponent || {};

  return (
    pois[0]?.name ||
    aois[0]?.name ||
    addressComponent?.building?.name ||
    addressComponent?.neighborhood?.name ||
    addressComponent?.township ||
    formattedAddress
  );
};

const reverseGeocodeByPoint = (lng, lat) => {
  return new Promise((resolve, reject) => {
    if (!window.AMap) {
      reject(new Error('地图服务未就绪'));
      return;
    }

    const buildResult = (regeocodeData) => {
      const formattedAddress = regeocodeData?.formattedAddress || regeocodeData?.formatted_address;
      if (!formattedAddress) {
        reject(new Error('未获取到地址信息'));
        return;
      }

      resolve({
        name: getDisplayNameFromRegeocode(regeocodeData, formattedAddress),
        address: formattedAddress,
        latitude: lat,
        longitude: lng
      });
    };

    const runGeocode = (geocoder) => {
      geocoder.getAddress([lng, lat], (status, result) => {
        const regeocodeData = result?.regeocode;
        if (status === 'complete' && result?.info === 'OK' && regeocodeData) {
          buildResult(regeocodeData);
          return;
        }

        reject(new Error('地址解析失败'));
      });
    };

    if (geocoderInstance.value) {
      runGeocode(geocoderInstance.value);
      return;
    }

    AMap.plugin(['AMap.Geocoder'], () => {
      try {
        geocoderInstance.value = new AMap.Geocoder({
          radius: 1000,
          extensions: 'all'
        });
        runGeocode(geocoderInstance.value);
      } catch (error) {
        reject(error);
      }
    });
  });
};

const handleMapClick = async (e) => {
  const lng = e.lnglat.getLng();
  const lat = e.lnglat.getLat();

  if (!window.AMap || !mapInstance.value) {
    console.error('AMap is not loaded');
    return;
  }

  reverseGeocodeLoading.value = true;
  reverseGeocodeError.value = '';
  selectedLocationForAdd.value = null;
  locationNotes.value = '';

  if (mapInstance.value.marker) {
    mapInstance.value.marker.setMap(null);
  }

  mapInstance.value.marker = new AMap.Marker({
    position: [lng, lat]
  });
  mapInstance.value.add(mapInstance.value.marker);

  try {
    const parsedLocation = await reverseGeocodeByPoint(lng, lat);
    selectedLocationForAdd.value = parsedLocation;
  } catch (error) {
    console.warn('Geocoding failed:', error);
    reverseGeocodeError.value = '地址解析失败，请点击其他位置重试';
  } finally {
    reverseGeocodeLoading.value = false;
  }
};

const handleSearch = async () => {
  const keywords = searchKeywords.value.trim();
  if (!keywords || keywords.length < 2) {
    return;
  }

  searchLoading.value = true;
  searchResults.value = [];

  try {
    // 构造请求URL
    const url = new URL(GEOCODE.API_URL);
    url.searchParams.append('key', GEOCODE.API_KEY);
    url.searchParams.append('address', keywords);
    url.searchParams.append('output', 'json');

    // 发送请求
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error('网络请求失败');
    }

    const data = await response.json();

    // 处理API返回结果
    if (data.status === '1' && data.count > 0) {
      // 提取第一个结果
      const location = data.geocodes[0];
      const [longitude, latitude] = location.location.split(',').map(Number);

      // 构造搜索结果
      const result = {
        name: location.formatted_address,
        address: location.formatted_address,
        latitude: latitude,
        longitude: longitude
      };

      searchResults.value = [result];

      // 控制地图跳转到对应位置
      if (mapInstance.value) {
        mapInstance.value.setCenter([longitude, latitude], true);
        mapInstance.value.setZoom(15);

        // 添加标记
        if (mapInstance.value.marker) {
          mapInstance.value.marker.setMap(null);
        }

        mapInstance.value.marker = new AMap.Marker({
          position: [longitude, latitude]
        });
        mapInstance.value.add(mapInstance.value.marker);

        // 自动选择第一个结果
        selectedLocationForAdd.value = result;
      }
    } else {
      // 未找到地点
      searchResults.value = [];
      alert('未找到对应地点，请尝试其他关键词');
    }
  } catch (err) {
    console.error('搜索失败:', err);
    alert('搜索失败，请检查网络连接');
  } finally {
    searchLoading.value = false;
  }
};

const handleSelectSearchResult = (result) => {
  if (!result || !result.longitude || !result.latitude) {
    console.error('Invalid search result:', result);
    return;
  }

  selectedLocationForAdd.value = { ...result };
  searchResults.value = [];

  if (mapInstance.value) {
    if (mapInstance.value.marker) {
      mapInstance.value.marker.setMap(null);
    }

    mapInstance.value.marker = new AMap.Marker({
      position: [result.longitude, result.latitude]
    });
    mapInstance.value.add(mapInstance.value.marker);
    mapInstance.value.setCenter([result.longitude, result.latitude], true);
    mapInstance.value.setZoom(15);
  }
};

const clearSelectedForAdd = () => {
  selectedLocationForAdd.value = null;
  locationNotes.value = '';
  reverseGeocodeError.value = '';

  if (mapInstance.value && mapInstance.value.marker) {
    mapInstance.value.marker.setMap(null);
  }
};

const handleAddLocation = async () => {
  if (!selectedLocationForAdd.value) return;

  addLoading.value = true;

  try {
    await locationStore.addLocation(props.planId, {
      name: selectedLocationForAdd.value.name,
      address: selectedLocationForAdd.value.address,
      latitude: selectedLocationForAdd.value.latitude,
      longitude: selectedLocationForAdd.value.longitude,
      description: locationNotes.value || null
    });

    clearSelectedForAdd();
    locationNotes.value = '';
  } catch (err) {
    alert('添加地点失败，请重试');
  } finally {
    addLoading.value = false;
  }
};

const handleReorder = async () => {
  const locationIds = localLocations.value.map(l => l.id);
  try {
    await locationStore.reorderLocations(props.planId, locationIds);
  } catch (err) {
    await locationStore.fetchPlanLocations(props.planId);
  }
};

const handleLocationClick = (location) => {
  detailLocation.value = location;
  showDetailModal.value = true;

  nextTick(() => {
    if (detailMapContainer.value && !detailMapInstance.value) {
      detailMapInstance.value = new AMap.Map(detailMapContainer.value, {
        zoom: 14,
        center: [location.location.longitude, location.location.latitude]
      });

      new AMap.Marker({
        position: [location.location.longitude, location.location.latitude],
        map: detailMapInstance.value
      });
    }
  });
};

const handleEditLocation = (location) => {
  editingLocation.value = JSON.parse(JSON.stringify(location));
  showEditModal.value = true;
};

const handleSaveEdit = async () => {
  if (!editingLocation.value) return;

  saveLoading.value = true;

  try {
    await locationStore.updateLocation(editingLocation.value.id, {
      notes: editingLocation.value.notes
    });

    showEditModal.value = false;
    editingLocation.value = null;
  } catch (err) {
    alert('保存失败，请重试');
  } finally {
    saveLoading.value = false;
  }
};

const handleDeleteLocation = async (id) => {
  if (!confirm('确定要删除这个地点吗？')) return;

  try {
    await locationStore.deleteLocation(id);
  } catch (err) {
    alert('删除失败，请重试');
  }
};

const handleBack = () => {
  emit('back');
};

const handleNext = () => {
  emit('next');
};

onMounted(async () => {
  await locationStore.fetchPlanLocations(props.planId);
  initMap();
});

onUnmounted(() => {
  if (mapInstance.value) {
    mapInstance.value.destroy();
  }
  if (detailMapInstance.value) {
    detailMapInstance.value.destroy();
  }
  locationStore.clearLocations();
  locationStore.clearSearchResults();
});
</script>

<style scoped>
.location-selector {
  width: 100%;
  padding: 24px 0;
}

.location-header {
  margin-bottom: 24px;
  text-align: center;
}

.section-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 8px;
}

.section-desc {
  font-size: 14px;
  color: var(--color-text-light);
  margin: 0;
}

.location-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  margin-bottom: 24px;
}

@media (max-width: 1024px) {
  .location-content {
    grid-template-columns: 1fr;
  }
}

.map-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.map-wrapper {
  position: relative;
  height: 400px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.map-container {
  width: 100%;
  height: 100%;
}

.map-loading,
.map-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--color-surface);
}

.search-section {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 16px;
  border: 1px solid var(--color-border);
}

.reverse-geocode-status {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  padding: 12px 16px;
}

.reverse-geocode-error {
  color: #d03050;
  font-size: 13px;
}

.search-results {
  margin-top: 12px;
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.search-result-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border);
  transition: background var(--transition-fast);
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background: var(--color-background);
}

.result-name {
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 4px;
}

.result-address {
  font-size: 12px;
  color: var(--color-text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.selected-info {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 16px;
  border: 1px solid var(--color-border);
}

.selected-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.selected-label {
  font-weight: 500;
  color: var(--color-text);
}

.selected-content {
  margin-bottom: 12px;
}

.selected-name {
  font-weight: 600;
  font-size: 16px;
  color: var(--color-text);
  margin-bottom: 4px;
}

.selected-address {
  font-size: 13px;
  color: var(--color-text-light);
}

.notes-input {
  margin-bottom: 12px;
}

.locations-list-section {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: 20px;
  border: 1px solid var(--color-border);
  max-height: 600px;
  display: flex;
  flex-direction: column;
}

.locations-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.drag-hint {
  font-size: 12px;
  color: var(--color-text-light);
  opacity: 0.7;
}

.list-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.empty-locations {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.empty-hint {
  font-size: 13px;
  color: var(--color-text-light);
}

.loading-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.locations-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.location-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  background: var(--color-background);
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.location-item:hover {
  background: #ECEAE8;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.location-item:active {
  cursor: grabbing;
  transform: scale(1.02);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.location-item.location-ghost {
  opacity: 0.4;
  background: var(--color-primary-light);
}

.location-item.location-chosen {
  opacity: 0.9;
  transform: scale(1.02);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.location-item.location-drag {
  opacity: 1;
  transform: scale(1.05);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.drag-indicator {
  color: var(--color-text-light);
  padding: 2px;
  opacity: 0.5;
  transition: opacity var(--transition-fast);
  flex-shrink: 0;
}

.location-item:hover .drag-indicator {
  opacity: 1;
}

.location-index {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.location-info {
  flex: 1;
  cursor: pointer;
  min-width: 0;
}

.location-name {
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 4px;
}

.location-address {
  font-size: 12px;
  color: var(--color-text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.location-notes {
  font-size: 12px;
  color: var(--color-accent);
  margin-top: 4px;
  font-style: italic;
}

.location-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.location-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-map {
  height: 180px;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.detail-map-container {
  width: 100%;
  height: 100%;
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-name {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.detail-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 14px;
  color: var(--color-text-light);
}

.action-bar {
  display: flex;
  justify-content: space-between;
  padding-top: 24px;
  border-top: 1px solid var(--color-border);
}
</style>