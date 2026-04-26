# 智能出行规划器项目工作总结

**项目名称**：智能出行规划器（Travel Planner）
**项目类型**：前后端分离全栈应用
**文档版本**：V2.0
**编写日期**：2026年4月26日
**项目状态**：第二阶段开发完成

---

## 目录

1. [项目概述](#1-项目概述)
2. [项目目标](#2-项目目标)
3. [项目结构](#3-项目结构)
4. [技术架构](#4-技术架构)
5. [功能模块](#5-功能模块)
6. [已完成任务清单](#6-已完成任务清单)
7. [关键技术实现](#7-关键技术实现)
8. [遇到的问题及解决方案](#8-遇到的问题及解决方案)
9. [API接口文档](#9-api接口文档)
10. [项目规范](#10-项目规范)

---

## 1. 项目概述

### 1.1 项目简介

智能出行规划器是一款面向短途出行、一日游或周末出行用户设计的全栈Web应用系统。系统提供从"创建规划"到"地点选择"的全流程服务，旨在帮助用户高效管理出行计划，提升出行体验。

### 1.2 项目背景

随着城市化进程加快和消费升级趋势日益明显，短途出行和周末旅游已成为都市人群的主要休闲方式。然而，用户在规划出行时面临诸多挑战：

- **信息分散**：行程安排、交通住宿、景点攻略等信息分散在多个平台
- **效率低下**：缺乏统一的规划工具，用户需要在多个应用间切换
- **体验割裂**：现有工具缺乏整体性，用户难以形成完整的出行方案

### 1.3 开发阶段

| 阶段 | 名称 | 状态 | 主要内容 |
|------|------|------|----------|
| 第一阶段 | 规划管理 | ✅ 已完成 | 规划CRUD、地点管理 |
| 第二阶段 | 地点选择 | ✅ 已完成 | 地图交互、地点搜索、拖拽排序 |

---

## 2. 项目目标

### 2.1 总体目标

在项目第二阶段，专注于完成**地点选择与管理模块**的完整功能实现，包括地图交互、地点搜索、拖拽排序等功能，建立完善的前后端通信机制。

### 2.2 功能目标

#### 2.2.1 规划管理模块

| 序号 | 功能 | 描述 | 优先级 |
|------|------|------|--------|
| F1 | 规划创建 | 用户可创建新的出行规划 | P0 |
| F2 | 规划列表 | 用户可查看所有已创建的规划 | P0 |
| F3 | 规划详情 | 用户可查看单个规划的完整信息 | P0 |
| F4 | 规划编辑 | 用户可编辑已有规划的各项信息 | P0 |
| F5 | 规划删除 | 用户可删除不需要的规划 | P0 |

#### 2.2.2 地点管理模块

| 序号 | 功能 | 描述 | 优先级 |
|------|------|------|--------|
| F6 | 地图选点 | 用户可在地图上点击选择地点 | P0 |
| F7 | 地点搜索 | 用户可通过关键词搜索地点 | P0 |
| F8 | 地点列表 | 用户可查看已选地点列表 | P0 |
| F9 | 地点编辑 | 用户可编辑地点备注信息 | P1 |
| F10 | 地点删除 | 用户可删除不需要的地点 | P0 |
| F11 | 拖拽排序 | 用户可通过拖拽调整地点顺序 | P0 |
| F12 | 地点详情 | 用户可查看地点详细信息 | P1 |

### 2.3 技术目标

| 序号 | 目标 | 描述 | 状态 |
|------|------|------|------|
| T1 | 前后端分离 | 前后端通过RESTful API通信 | ✅ |
| T2 | 数据验证 | 后端使用Pydantic进行数据校验 | ✅ |
| T3 | 状态管理 | 前端使用Pinia统一管理应用状态 | ✅ |
| T4 | 地图集成 | 高德地图API集成 | ✅ |
| T5 | 拖拽功能 | vuedraggable拖拽排序 | ✅ |

---

## 3. 项目结构

```
travel_planner/
├── .trae/                          # Trae IDE配置目录
│   └── rules/
│       └── project.md              # 项目规则文档
├── backend/                         # 后端模块
│   ├── app/                        # 应用主目录
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI应用入口
│   │   ├── models/                 # 数据模型目录
│   │   │   ├── __init__.py
│   │   │   ├── location.py        # 地点数据模型
│   │   │   └── travel_plan.py      # 出行规划数据模型
│   │   ├── routes/                 # 路由目录
│   │   │   ├── __init__.py
│   │   │   ├── location.py        # 地点相关路由
│   │   │   └── travel_plan.py      # 规划相关路由
│   │   ├── schemas/                # 数据模式目录
│   │   │   ├── __init__.py
│   │   │   ├── location.py        # 地点Pydantic模型
│   │   │   └── travel_plan.py      # 规划Pydantic模型
│   │   └── utils/                  # 工具函数目录
│   │       └── __init__.py
│   └── travel_planner.db           # SQLite数据库文件
└── frontend/                        # 前端模块
    ├── public/                     # 静态资源目录
    ├── src/                        # 源代码目录
    │   ├── api/                    # API接口封装
    │   │   ├── location.js        # 地点相关API
    │   │   └── travelPlan.js      # 规划相关API
    │   ├── assets/                 # 静态资源
    │   ├── components/             # 公共组件
    │   │   └── LocationSelector.vue # 地点选择组件
    │   ├── router/                # 路由配置
    │   │   └── index.js
    │   ├── stores/                 # Pinia状态管理
    │   │   ├── location.js       # 地点状态管理
    │   │   └── travelPlan.js      # 规划状态管理
    │   ├── views/                 # 页面视图
    │   │   ├── PlanDetail.vue     # 规划详情页
    │   │   ├── PlanForm.vue       # 规划表单页
    │   │   └── PlanList.vue       # 规划列表页
    │   ├── App.vue                 # 根组件
    │   ├── main.js                 # 应用入口
    │   └── style.css               # 全局样式
    ├── index.html                  # HTML入口
    ├── package.json                # NPM依赖配置
    └── vite.config.js              # Vite配置
```

---

## 4. 技术架构

### 4.1 技术栈概览

| 层级 | 技术选型 | 版本 | 说明 |
|------|----------|------|------|
| 前端框架 | Vue 3 | 3.x | 采用Composition API |
| 构建工具 | Vite | 8.x | 快速热更新的开发体验 |
| UI组件库 | Naive UI | 2.x | 现代化Vue3组件库 |
| 状态管理 | Pinia | 2.x | Vue3推荐的状态管理方案 |
| 路由管理 | Vue Router | 4.x | Vue3官方路由解决方案 |
| HTTP客户端 | Axios | 1.x | 异步请求封装 |
| 拖拽组件 | vuedraggable | 4.x | 基于Sortable.js的拖拽排序 |
| 后端框架 | FastAPI | 0.136.x | 高性能Python Web框架 |
| ORM框架 | Peewee | 3.x | 轻量级Python ORM |
| 数据验证 | Pydantic | 2.x | 数据模型验证库 |
| 数据库 | SQLite | 3.x | 轻量级关系型数据库 |
| 地图服务 | 高德地图 | 2.0 | 地图展示、地理编码、地点搜索 |

### 4.2 前端架构

前端采用Vue 3 + Composition API架构，主要特点：

- **组件化开发**：模块化组件设计，提高代码复用性
- **响应式状态管理**：使用Pinia进行状态管理，支持异步操作
- **TypeScript类型安全**：虽然使用JavaScript，但遵循类型提示规范
- **统一API层**：封装API调用，统一错误处理

### 4.3 后端架构

后端采用FastAPI + Peewee架构，主要特点：

- **异步API设计**：使用async/await提升性能
- **Pydantic数据验证**：自动请求和响应验证
- **分层架构**：路由、模型、模式分离
- **外部服务集成**：高德地图API集成

---

## 5. 功能模块

### 5.1 规划管理模块

#### 5.1.1 规划列表页 (PlanList.vue)

- 展示所有已创建的规划卡片
- 支持按状态筛选（草稿、进行中、已完成、已归档）
- 支持标题关键词搜索
- 卡片展示：标题、目的地、日期、状态、预算范围
- 快捷操作：编辑、删除
- 响应式布局，支持移动端访问

#### 5.1.2 规划表单页 (PlanForm.vue)

- 两步式表单设计：
  - 第一步：填写基本信息（标题、目的地、日期、预算等）
  - 第二步：选择地点（地图选点、搜索添加）
- 实时表单验证
- 草稿自动保存（localStorage）
- 表单数据持久化

#### 5.1.3 规划详情页 (PlanDetail.vue)

- 完整展示规划信息
- 已选地点列表展示（序号、名称、地址、备注）
- 交互反馈：编辑、删除、返回

### 5.2 地点管理模块

#### 5.2.1 地图交互 (LocationSelector.vue)

- **地图初始化**：高德地图2.0 API加载
- **点击选点**：点击地图任意位置获取坐标
- **地理编码**：将点击坐标转换为地址信息
- **标记管理**：显示/隐藏/更新地图标记
- **位置跳转**：搜索结果自动定位

#### 5.2.2 地点搜索

- **搜索方式**：
  - 高德地图地理编码API（指定API）
  - 高德地图地点搜索API
- **搜索结果展示**：列表形式，包含名称和地址
- **自动定位**：搜索成功后地图跳转并标记

#### 5.2.3 地点列表管理

- **列表展示**：序号、名称、地址、备注
- **拖拽排序**：长按拖动调整顺序
- **编辑功能**：修改地点名称、地址、备注
- **删除功能**：确认后删除地点
- **详情查看**：模态框展示地点详情

### 5.3 数据模型

#### 5.3.1 TravelPlan 模型

| 字段名 | 数据类型 | 说明 | 约束 |
|--------|----------|------|------|
| id | AutoField | 主键 | 自增 |
| title | CharField | 规划标题 | 最大100字符 |
| description | TextField | 规划描述 | 可为空 |
| start_date | DateField | 开始日期 | 必填 |
| end_date | DateField | 结束日期 | 必填 |
| start_location | CharField | 出发地点 | 最大100字符 |
| destination | CharField | 目的地 | 最大100字符 |
| budget_min | DecimalField | 最低预算 | 默认0 |
| budget_max | DecimalField | 最高预算 | 默认99999 |
| num_people | IntegerField | 出行人数 | 默认1 |
| status | CharField | 规划状态 | 枚举值 |
| preferences | TextField | 出行偏好 | JSON格式 |
| created_at | DateTimeField | 创建时间 | 自动 |
| updated_at | DateTimeField | 更新时间 | 自动 |

#### 5.3.2 Location 模型

| 字段名 | 数据类型 | 说明 | 约束 |
|--------|----------|------|------|
| id | AutoField | 主键 | 自增 |
| name | CharField | 地点名称 | 最大255字符 |
| address | CharField | 地址 | 最大500字符 |
| latitude | FloatField | 纬度 | 必填 |
| longitude | FloatField | 经度 | 必填 |
| description | CharField | 描述 | 最大500字符 |
| order_index | IntegerField | 排序索引 | 默认0 |
| created_at | DateTimeField | 创建时间 | 自动 |

#### 5.3.3 PlanLocation 模型

| 字段名 | 数据类型 | 说明 | 约束 |
|--------|----------|------|------|
| id | AutoField | 主键 | 自增 |
| location | ForeignKeyField | 关联地点 | 外键 |
| plan_id | IntegerField | 规划ID | 必填 |
| order_index | IntegerField | 排序索引 | 默认0 |
| visit_date | CharField | 访问日期 | 最大50字符 |
| notes | CharField | 备注 | 最大500字符 |
| created_at | DateTimeField | 创建时间 | 自动 |

---

## 6. 已完成任务清单

### 6.1 功能任务

| 任务编号 | 任务名称 | 完成状态 | 完成日期 |
|----------|----------|----------|----------|
| FT-001 | 项目架构设计与初始化 | ✅ 已完成 | 2026-04-26 |
| FT-002 | 后端数据模型设计 | ✅ 已完成 | 2026-04-26 |
| FT-003 | 后端API接口开发 | ✅ 已完成 | 2026-04-26 |
| FT-004 | 前端路由配置 | ✅ 已完成 | 2026-04-26 |
| FT-005 | 前端状态管理 | ✅ 已完成 | 2026-04-26 |
| FT-006 | 规划列表页面开发 | ✅ 已完成 | 2026-04-26 |
| FT-007 | 规划表单页面开发 | ✅ 已完成 | 2026-04-26 |
| FT-008 | 规划详情页面开发 | ✅ 已完成 | 2026-04-26 |
| FT-009 | 表单验证逻辑实现 | ✅ 已完成 | 2026-04-26 |
| FT-010 | 草稿保存功能实现 | ✅ 已完成 | 2026-04-26 |
| FT-011 | 地点数据模型设计 | ✅ 已完成 | 2026-04-26 |
| FT-012 | 地点API路由开发 | ✅ 已完成 | 2026-04-26 |
| FT-013 | 地图组件开发 | ✅ 已完成 | 2026-04-26 |
| FT-014 | 地图点击选点功能 | ✅ 已完成 | 2026-04-26 |
| FT-015 | 地理编码功能 | ✅ 已完成 | 2026-04-26 |
| FT-016 | 地点搜索功能 | ✅ 已完成 | 2026-04-26 |
| FT-017 | 地点拖拽排序 | ✅ 已完成 | 2026-04-26 |
| FT-018 | 地点详情弹窗 | ✅ 已完成 | 2026-04-26 |
| FT-019 | 规划详情地点展示 | ✅ 已完成 | 2026-04-26 |

### 6.2 界面优化任务

| 任务编号 | 任务名称 | 完成状态 | 完成日期 |
|----------|----------|----------|----------|
| UT-001 | 导航栏玻璃态效果 | ✅ 已完成 | 2026-04-26 |
| UT-002 | 圆角统一为24px | ✅ 已完成 | 2026-04-26 |
| UT-003 | 柔和阴影系统 | ✅ 已完成 | 2026-04-26 |
| UT-004 | 莫兰迪色系应用 | ✅ 已完成 | 2026-04-26 |
| UT-005 | 排版层次优化 | ✅ 已完成 | 2026-04-26 |
| UT-006 | 响应式布局适配 | ✅ 已完成 | 2026-04-26 |
| UT-007 | 页面过渡动画 | ✅ 已完成 | 2026-04-26 |
| UT-008 | 拖拽视觉反馈 | ✅ 已完成 | 2026-04-26 |

### 6.3 Bug修复任务

| 任务编号 | 问题描述 | 解决方案 | 完成状态 |
|----------|----------|----------|----------|
| BF-001 | Peewee EnumField导入错误 | 改用CharField替代 | ✅ 已修复 |
| BF-002 | Pydantic自定义类型错误 | 使用Literal类型定义枚举 | ✅ 已修复 |
| BF-003 | 前端JSX语法解析错误 | 改用Vue模板语法 | ✅ 已修复 |
| BF-004 | 后端API状态值访问错误 | 直接返回status字段 | ✅ 已修复 |
| BF-005 | Peewee refresh()方法错误 | 重新查询获取实例 | ✅ 已修复 |
| BF-006 | 表单验证逻辑错误 | 优化验证规则 | ✅ 已修复 |
| BF-007 | Vue Router导航警告 | 修改守卫返回方式 | ✅ 已修复 |
| BF-008 | 地图点击事件无响应 | 修复地理编码API调用和事件监听器注册 | ✅ 已修复 |
| BF-009 | 地理编码结果字段名错误 | formattedAddress改为formatted_address | ✅ 已修复 |

---

## 7. 关键技术实现

### 7.1 前端关键技术

#### 7.1.1 Vue 3 Composition API

```vue
<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useLocationStore } from '../stores/location';

const mapInstance = ref(null);
const searchResults = ref([]);
const searchLoading = ref(false);

const handleSearch = async () => {
  searchLoading.value = true;
  try {
    // 构造请求URL
    const url = new URL(GEOCODE.API_URL);
    url.searchParams.append('key', GEOCODE.API_KEY);
    url.searchParams.append('address', keywords);
    url.searchParams.append('output', 'json');

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status === '1' && data.count > 0) {
      // 处理结果
      mapInstance.value.setCenter([lng, lat], true);
      mapInstance.value.setZoom(15);
    }
  } finally {
    searchLoading.value = false;
  }
};
</script>
```

#### 7.1.2 Pinia状态管理

```javascript
import { defineStore } from 'pinia';

export const useLocationStore = defineStore('location', {
  state: () => ({
    locations: [],
    currentLocation: null,
    mapLoaded: false,
    loading: false,
    error: null
  }),

  getters: {
    getLocationCount: (state) => state.locations.length,
    getLocationById: (state) => (id) => state.locations.find(l => l.id === id)
  },

  actions: {
    async fetchPlanLocations(planId) {
      this.loading = true;
      try {
        const response = await locationApi.getPlanLocations(planId);
        this.locations = response.data;
      } catch (err) {
        this.error = '获取地点列表失败';
      } finally {
        this.loading = false;
      }
    },

    async addLocation(planId, locationData) {
      const response = await locationApi.addLocation(planId, locationData);
      this.locations.push(response.data);
    },

    setMapLoaded(loaded) {
      this.mapLoaded = loaded;
    }
  }
});
```

#### 7.1.3 拖拽排序实现

```vue
<draggable
  v-model="localLocations"
  item-key="id"
  :animation="200"
  ghost-class="location-ghost"
  chosen-class="location-chosen"
  drag-class="location-drag"
  @end="handleReorder"
>
  <template #item="{ element, index }">
    <div class="location-item">
      <div class="drag-indicator">
        <n-icon :component="DragIcon" size="16" />
      </div>
      <div class="location-index">{{ index + 1 }}</div>
      <!-- 其他内容 -->
    </div>
  </template>
</draggable>
```

### 7.2 后端关键技术

#### 7.2.1 FastAPI路由设计

```python
from fastapi import APIRouter, HTTPException
from app.models.location import Location, PlanLocation
from app.schemas.location import LocationCreate, PlanLocationResponse

router = APIRouter()

@router.get("/plans/{plan_id}/locations", response_model=list[PlanLocationResponse])
def get_plan_locations(plan_id: int):
    plan_locations = PlanLocation.select().where(
        PlanLocation.plan_id == plan_id
    ).order_by(PlanLocation.order_index)
    return [to_response(pl) for pl in plan_locations]

@router.post("/plans/{plan_id}/locations", response_model=PlanLocationResponse)
def add_location_to_plan(plan_id: int, location_data: LocationCreate):
    location = Location.create(
        name=location_data.name,
        address=location_data.address,
        latitude=location_data.latitude,
        longitude=location_data.longitude
    )
    # 创建关联记录
    return to_response(plan_location)

@router.put("/plans/{plan_id}/locations/reorder")
def reorder_locations(plan_id: int, location_ids: list[int]):
    for index, loc_id in enumerate(location_ids):
        plan_location = PlanLocation.get(...)
        plan_location.order_index = index
        plan_location.save()
    return {"message": "排序更新成功"}
```

#### 7.2.2 外部API集成

```python
import httpx

AMAP_API_KEY = 'your_api_key'

@router.get("/locations/search")
async def search_locations(keywords: str):
    url = "https://restapi.amap.com/v3/place/text"
    params = {
        "key": AMAP_API_KEY,
        "keywords": keywords,
        "city": "全国",
        "offset": 20,
        "page": 1,
        "output": "json"
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, timeout=10.0)
        data = response.json()

    if data.get("status") != "1":
        raise HTTPException(status_code=502, detail="地图服务查询失败")

    return [to_search_response(poi) for poi in data.get("pois", [])]
```

---

## 8. 遇到的问题及解决方案

### 8.1 技术问题

#### 问题一：Peewee EnumField导入错误

**问题描述**：`ImportError: cannot import name 'EnumField' from 'peewee'`

**解决方案**：将EnumField改为CharField，使用常量定义枚举值

#### 问题二：地图点击事件无响应

**问题描述**：用户在地图上点击后，系统未能正确响应

**解决方案**：
1. 修复地理编码API结果字段名（formattedAddress → formatted_address）
2. 优化事件监听器注册（先移除旧监听器再添加新监听器）
3. 添加错误处理和日志输出

#### 问题三：拖拽排序功能改进

**问题描述**：原有拖拽需要点击"调整顺序"按钮才能触发

**解决方案**：
1. 移除edit-mode切换机制
2. 默认启用拖拽功能
3. 添加丰富的视觉反馈（缩放、阴影、透明度变化）

### 8.2 架构问题

#### 问题一：外键循环导入

**问题描述**：PlanLocation直接引用TravelPlan导致循环导入

**解决方案**：将外键关联改为使用plan_id整数类型

#### 问题二：前端依赖缺失

**问题描述**：使用vuedraggable但未安装依赖

**解决方案**：执行 `npm install vuedraggable@^4.1.0`

---

## 9. API接口文档

### 9.1 规划相关接口

| 方法 | 路径 | 功能 | 状态码 |
|------|------|------|--------|
| GET | /api/plans | 获取规划列表 | 200 |
| GET | /api/plans/{id} | 获取规划详情 | 200/404 |
| POST | /api/plans | 创建新规划 | 201/422 |
| PUT | /api/plans/{id} | 更新规划 | 200/404/422 |
| DELETE | /api/plans/{id} | 删除规划 | 204/404 |

### 9.2 地点相关接口

| 方法 | 路径 | 功能 | 状态码 |
|------|------|------|--------|
| GET | /api/plans/{plan_id}/locations | 获取规划地点列表 | 200 |
| POST | /api/plans/{plan_id}/locations | 添加地点到规划 | 201/404 |
| PUT | /api/plan-locations/{id} | 更新地点信息 | 200/404 |
| DELETE | /api/plan-locations/{id} | 删除规划地点 | 200/404 |
| PUT | /api/plans/{plan_id}/locations/reorder | 更新地点顺序 | 200 |
| GET | /api/locations/search | 搜索地点 | 200/400 |
| GET | /api/geocode | 地理编码 | 200/400/404 |

### 9.3 接口示例

#### 获取规划地点列表

```http
GET /api/plans/1/locations
```

响应：
```json
[
  {
    "id": 1,
    "plan_id": 1,
    "location": {
      "id": 1,
      "name": "故宫",
      "address": "北京市东城区景山前街4号",
      "latitude": 39.918,
      "longitude": 116.397
    },
    "order_index": 0,
    "visit_date": null,
    "notes": "需要提前预约",
    "created_at": "2026-04-26T10:00:00"
  }
]
```

#### 添加地点

```http
POST /api/plans/1/locations
Content-Type: application/json

{
  "name": "天安门广场",
  "address": "北京市东城区东长安街",
  "latitude": 39.907,
  "longitude": 116.391,
  "description": "升旗仪式"
}
```

#### 搜索地点

```http
GET /api/locations/search?keywords=故宫
```

响应：
```json
[
  {
    "name": "故宫",
    "address": "北京市东城区景山前街4号",
    "latitude": 39.918,
    "longitude": 116.397
  }
]
```

---

## 10. 项目规范

### 10.1 前端规范

- 使用Vue 3 Composition API和`<script setup>`语法糖
- 组件采用模块化设计，职责单一
- 使用Pinia进行状态管理，遵循store模式
- API调用统一封装在api目录下
- 样式使用CSS变量，统一设计系统
- 添加适当的动画过渡效果

### 10.2 后端规范

- 使用FastAPI异步路由
- Pydantic模型用于数据验证
- 遵循RESTful API设计规范
- 统一的错误处理和响应格式
- 外部API调用使用httpx异步客户端

### 10.3 Git提交规范

- feat: 新功能
- fix: Bug修复
- docs: 文档更新
- style: 代码格式调整
- refactor: 重构
- test: 测试相关

---

**文档编制人**：AI Assistant
**审核人**：待定
**版本**：V2.0
**创建日期**：2026年4月26日
**最后更新**：2026年4月26日
