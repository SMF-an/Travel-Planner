<template>
  <div class="app">
    <n-layout>
      <n-layout-header class="header">
        <div class="header-content">
          <div class="logo-section">
            <div class="logo-wrapper">
              <n-icon class="logo" :component="TravelIcon" />
            </div>
            <h1 class="title">智能出行规划器</h1>
          </div>
        </div>
      </n-layout-header>
      <n-layout-content class="content">
        <div class="container">
          <router-view v-slot="{ Component }">
            <transition name="slide-fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </n-layout-content>
    </n-layout>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, h } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { NLayout, NLayoutHeader, NLayoutContent, NIcon } from 'naive-ui';

// 旅行图标
const TravelIcon = {
  render() {
    return h('svg', {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '24',
      height: '24',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: '2',
      strokeLinecap: 'round',
      strokeLinejoin: 'round'
    }, [
      h('path', { d: 'M2 12a3 3 0 0 0 3-3V6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a3 3 0 0 0 3 3 3 3 0 0 1-3 3 3 3 0 0 0-3 3v3H8v-3a3 3 0 0 0-3-3 3 3 0 0 1-3-3z' }),
      h('path', { d: 'M8 22V12' }),
      h('path', { d: 'M16 12V22' }),
      h('path', { d: 'M2 12h20' }),
      h('circle', { cx: '8', cy: '8', r: '1' }),
      h('circle', { cx: '16', cy: '8', r: '1' })
    ]);
  }
};

const router = useRouter();
const route = useRoute();
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap');

:root {
  --color-primary: #667eea;
  --color-primary-light: #818cf8;
  --color-primary-dark: #4f46e5;
  --color-secondary: #764ba2;
  --color-accent: #f59e0b;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-background: #f8fafc;
  --color-surface: #ffffff;
  --color-surface-light: #f1f5f9;
  --color-surface-secondary: #e2e8f0;
  --color-text: #1e293b;
  --color-text-light: #475569;
  --color-text-secondary: #94a3b8;
  --color-border: #e2e8f0;
  --color-border-light: #f1f5f9;
  --radius-sm: 12px;
  --radius-md: 16px;
  --radius-lg: 20px;
  --radius-xl: 24px;
  --shadow-soft: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
  --shadow-card: 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  --shadow-hover: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
  --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background-color: var(--color-background);
  color: var(--color-text);
  line-height: 1.7;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  letter-spacing: -0.01em;
}

.app {
  min-height: 100vh;
}

.header {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
  height: auto;
  min-height: 72px;
  display: flex;
  align-items: center;
  padding: 0 40px;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-content {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo-wrapper {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-soft);
  transition: var(--transition-normal);
}

.logo-wrapper:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: var(--shadow-hover);
}

.logo {
  color: white;
  font-size: 24px;
}

.title {
  font-size: clamp(18px, 4vw, 24px);
  font-weight: 700;
  margin: 0;
  letter-spacing: 1px;
  background: linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-secondary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.content {
  background: linear-gradient(180deg, var(--color-background) 0%, #EBE8E5 100%);
  min-height: calc(100vh - 72px);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px;
}

/* 过渡动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all var(--transition-normal);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(15px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header {
    padding: 0 20px;
    min-height: 64px;
  }
  
  .logo-wrapper {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
  }
  
  .title {
    font-size: 16px;
    letter-spacing: 0.5px;
  }
  
  .container {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .header {
    padding: 0 16px;
  }
  
  .logo-section {
    gap: 12px;
  }
  
  .title {
    font-size: 14px;
  }
}

/* 全局滚动条样式 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-background);
}

::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-light);
}
</style>
