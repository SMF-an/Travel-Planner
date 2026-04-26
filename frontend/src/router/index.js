import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'Home',
    redirect: '/plans'
  },
  {
    path: '/plans',
    name: 'PlanList',
    component: () => import('../views/PlanList.vue'),
    meta: {
      title: '规划列表'
    }
  },
  {
    path: '/plans/create',
    name: 'PlanCreate',
    component: () => import('../views/PlanForm.vue'),
    meta: {
      title: '创建规划'
    }
  },
  {
    path: '/plans/:id/edit',
    name: 'PlanEdit',
    component: () => import('../views/PlanForm.vue'),
    meta: {
      title: '编辑规划'
    }
  },
  {
    path: '/plans/:id',
    name: 'PlanDetail',
    component: () => import('../views/PlanDetail.vue'),
    meta: {
      title: '规划详情'
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 设置页面标题
router.beforeEach((to, from) => {
  document.title = to.meta.title || '智能出行规划器';
  return true;
});

export default router;
