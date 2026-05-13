<template>
  <div class="ai-summary">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <n-spin size="large" tip="AI正在为您生成出行建议...">
        <div class="loading-content">
          <p class="loading-text">正在分析您的出行规划...</p>
          <div class="loading-dots">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      </n-spin>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <n-card :bordered="false" class="error-card">
        <div class="error-content">
          <n-icon :component="ErrorIcon" class="error-icon" />
          <h3 class="error-title">生成建议失败</h3>
          <div class="error-message">
            <ul v-if="error.includes('\\n')">
              <li v-for="(msg, index) in error.split('\\n')" :key="index">{{ msg }}</li>
            </ul>
            <p v-else>{{ error }}</p>
          </div>
          <div class="error-hint">
            <n-icon :component="InfoIcon" class="hint-icon" />
            <span>系统会自动读取前面步骤的数据；若仍失败，请确认已至少选择一个地点。</span>
          </div>
          <n-button type="primary" @click="handleRetry" :loading="loading">
            <template #icon>
              <n-icon :component="RefreshIcon" />
            </template>
            重试
          </n-button>
        </div>
      </n-card>
    </div>

    <!-- 总结内容 -->
    <div v-else-if="summary" class="summary-content">
      <!-- 规划概览卡片 -->
      <n-card :bordered="false" class="overview-card">
        <div class="overview-header">
          <div class="overview-icon-wrapper">
            <n-icon :component="PlanIcon" class="overview-icon" />
          </div>
          <div class="overview-title-section">
            <h2 class="overview-title">{{ planTitle }}</h2>
            <p class="overview-subtitle">AI智能出行建议</p>
          </div>
        </div>
        
        <div class="overview-stats">
          <div class="stat-card">
            <div class="stat-icon-wrapper location-icon">
              <n-icon :component="MapPinIcon" class="stat-icon" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ locationCount }}</span>
              <span class="stat-label">规划地点</span>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon-wrapper cost-icon">
              <n-icon :component="WalletIcon" class="stat-icon" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ totalCost }}</span>
              <span class="stat-label">预计花费</span>
            </div>
          </div>
          
          <div class="stat-card budget-stat">
            <div class="stat-icon-wrapper" :class="`budget-status-${budgetStatus.status}`">
              <n-icon :component="BudgetIcon" class="stat-icon" />
            </div>
            <div class="stat-info">
              <span class="stat-value" :class="`budget-status-${budgetStatus.status}`">{{ budgetStatus.text }}</span>
              <span class="stat-label">预算状态</span>
            </div>
            <div class="budget-progress">
              <div class="budget-ring">
                <svg viewBox="0 0 80 80" class="ring-svg">
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    stroke="#E5E7EB"
                    stroke-width="6"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="36"
                    fill="none"
                    :stroke="budgetStatus.status === 'over' ? '#EF4444' : budgetStatus.status === 'warning' ? '#F59E0B' : '#10B981'"
                    stroke-width="6"
                    stroke-linecap="round"
                    :stroke-dasharray="`${budgetPercentage * 2.26} 226`"
                    transform="rotate(-90 40 40)"
                    class="ring-progress"
                  />
                </svg>
                <span class="ring-text">{{ budgetPercentage }}%</span>
              </div>
            </div>
          </div>
        </div>
      </n-card>

      <!-- AI总结卡片 -->
      <n-card :bordered="false" class="summary-card">
        <template #header>
          <div class="summary-card-header">
            <h3 class="summary-card-title">AI分析建议</h3>
            <n-button
              type="ghost"
              @click="toggleExportPopover"
              :loading="exportLoading"
              class="export-icon-button"
              size="small"
              ref="exportBtnRef"
            >
              <template #icon>
                <n-icon :component="DownloadIcon" />
              </template>
              导出
            </n-button>
            <div v-if="showExportPopover" ref="exportPopoverRef" class="export-popover">
              <n-button
                size="small"
                class="export-pop-btn"
                @click="handleExportMarkdown"
                title="导出 Markdown"
              >
                <div class="export-pop-inner">
                  <n-icon :component="FileTextIcon" />
                  <span class="export-pop-label">Markdown</span>
                </div>
              </n-button>
              <n-button
                size="small"
                class="export-pop-btn"
                @click="handleExportPdf"
                title="导出 PDF"
              >
                <div class="export-pop-inner">
                  <n-icon :component="FilePdfIcon" />
                  <span class="export-pop-label">PDF</span>
                </div>
              </n-button>
            </div>
          </div>
        </template>
        <div class="summary-text" v-html="formattedSummary"></div>

        <div class="summary-card-actions">
          <n-button
            type="default"
            @click="$emit('back')"
            size="large"
            class="action-button"
          >
            <template #icon>
              <n-icon :component="ArrowLeftIcon" />
            </template>
            返回修改
          </n-button>
          <n-button
            type="primary"
            @click="$emit('complete')"
            size="large"
            class="action-button primary-button"
          >
            <template #icon>
              <n-icon :component="CheckCircleIcon" />
            </template>
            完成规划
          </n-button>
        </div>
      </n-card>

      <!-- 风险提示卡片 -->
      <n-card v-if="risks && risks.length > 0" title="风险提示" :bordered="false" class="risks-card">
        <div class="risks-list">
          <div 
            v-for="(risk, index) in risks" 
            :key="index" 
            class="risk-item"
            :class="'risk-level-' + risk.level"
          >
            <div class="risk-icon-wrapper">
              <n-icon :component="getRiskIcon(risk.level)" class="risk-icon" />
            </div>
            <div class="risk-content">
              <p class="risk-message">{{ risk.message }}</p>
              <p class="risk-suggestion">
                <n-icon :component="LightbulbIcon" class="suggestion-icon" />
                {{ risk.suggestion }}
              </p>
            </div>
          </div>
        </div>
      </n-card>

      <!-- 操作按钮 已移入 AI 分析建议卡片内部 -->
    </div>
  </div>

  <!-- 导出格式选择对话框 -->
  <n-modal
    v-model:show="showExportDialog"
    :closable="true"
    :mask-closable="true"
    class="export-format-modal"
    title="选择导出格式"
  >
    <div class="export-format-content">
      <p class="export-format-desc">请选择您想要的导出格式：</p>
      <div class="export-format-options">
        <div 
          class="format-option"
          @click="selectExportFormat('markdown')"
        >
          <div class="format-icon-wrapper markdown-icon">
            <n-icon :component="FileTextIcon" class="format-icon" />
          </div>
          <div class="format-info">
            <h4 class="format-title">Markdown 格式</h4>
            <p class="format-desc">纯文本格式，适合文档编辑和版本控制</p>
          </div>
          <n-icon :component="ChevronRightIcon" class="format-arrow" />
        </div>
        <div 
          class="format-option"
          @click="selectExportFormat('pdf')"
        >
          <div class="format-icon-wrapper pdf-icon">
            <n-icon :component="FilePdfIcon" class="format-icon" />
          </div>
          <div class="format-info">
            <h4 class="format-title">PDF 格式</h4>
            <p class="format-desc">图文并茂，适合打印和分享</p>
          </div>
          <n-icon :component="ChevronRightIcon" class="format-arrow" />
        </div>
      </div>
    </div>
  </n-modal>

  <!-- 导出成功提示 -->
  <n-modal
    v-model:show="showExportSuccess"
    :closable="false"
    :mask-closable="false"
    class="export-success-modal"
  >
    <div class="success-content">
      <div class="success-icon-wrapper">
        <n-icon :component="CheckCircleIcon" class="success-icon" />
      </div>
      <h3 class="success-title">导出成功</h3>
      <p class="success-message">文件已成功导出：</p>
      <p class="success-filename">{{ lastExportFile }}</p>
      <div class="success-hint">
        <n-icon :component="InfoIcon" />
        <span>文件已保存到浏览器默认下载目录</span>
      </div>
      <div class="success-actions">
        <n-button type="primary" @click="showExportSuccess = false">
          确定
        </n-button>
      </div>
    </div>
  </n-modal>
</template>

<script setup>
import { ref, computed, watch, h, onMounted, onBeforeUnmount } from 'vue';
import { NCard, NSpin, NButton, NIcon, NModal } from 'naive-ui';
import { travelPlanApi } from '../api/travelPlan';
import { exportUtils } from '../utils/exportUtils';
import axios from 'axios';

const props = defineProps({
  planId: {
    type: Number,
    required: true
  },
  planData: {
    type: Object,
    required: true
  },
  locations: {
    type: Array,
    default: () => []
  },
  weather: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['back', 'complete']);

const loading = ref(false);
const error = ref(null);
const summary = ref('');
const risks = ref([]);
const isStreaming = ref(false);
const eventSource = ref(null);
const exportLoading = ref(false);
const showExportDialog = ref(false);
const showExportPopover = ref(false);
const exportBtnRef = ref(null);
const exportPopoverRef = ref(null);

const onDocumentKeydown = (e) => {
  if (e.key === 'Escape') showExportPopover.value = false;
};

const onDocumentClick = (evt) => {
  if (!showExportPopover.value) return;
  const pop = exportPopoverRef.value;
  const btn = exportBtnRef.value;
  const target = evt.target;

  if (pop && (pop === target || (pop.contains && pop.contains(target)))) return;
  if (btn && (btn === target || (btn.$el && btn.$el.contains && btn.$el.contains(target)) || (btn.contains && btn.contains(target)))) return;

  showExportPopover.value = false;
};

const toggleExportPopover = () => {
  showExportPopover.value = !showExportPopover.value;
};
// manage global listeners when popover opens/closes
watch(showExportPopover, (val) => {
  if (val) {
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onDocumentKeydown);
  } else {
    document.removeEventListener('click', onDocumentClick);
    document.removeEventListener('keydown', onDocumentKeydown);
  }
});
const showExportSuccess = ref(false);
const lastExportFile = ref('');

const planTitle = computed(() => props.planData.title || '出行规划');

const locationCount = computed(() => props.locations.length);

const totalCost = computed(() => {
  const total = props.locations.reduce((sum, loc) => sum + (loc.cost || 0), 0);
  return `¥${total}`;
});

const budgetStatus = computed(() => {
  const total = props.locations.reduce((sum, loc) => sum + (loc.cost || 0), 0);
  const budgetMax = props.planData.budget_max || 0;
  
  if (total > budgetMax) {
    return { text: '超预算', status: 'over' };
  } else if (total > budgetMax * 0.8) {
    return { text: '接近上限', status: 'warning' };
  } else {
    return { text: '充裕', status: 'good' };
  }
});

const budgetPercentage = computed(() => {
  const total = props.locations.reduce((sum, loc) => sum + (loc.cost || 0), 0);
  const budgetMax = props.planData.budget_max || 1;
  return Math.min(Math.round((total / budgetMax) * 100), 100);
});

const createSvgIcon = (attrs, children) => ({
  render() {
    return h(
      'svg',
      {
        xmlns: 'http://www.w3.org/2000/svg',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: '2',
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        ...attrs
      },
      children.map((child) => h(child.tag, child.attrs))
    );
  }
});

const BudgetIcon = createSvgIcon(
  { width: '24', height: '24', viewBox: '0 0 24 24' },
  [
    { tag: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
    { tag: 'polyline', attrs: { points: '12 6 12 12 16 14' } }
  ]
);

const MapPinIcon = createSvgIcon(
  { width: '24', height: '24', viewBox: '0 0 24 24' },
  [
    { tag: 'path', attrs: { d: 'M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z' } },
    { tag: 'circle', attrs: { cx: '12', cy: '10', r: '3' } }
  ]
);

const WalletIcon = createSvgIcon(
  { width: '24', height: '24', viewBox: '0 0 24 24' },
  [
    { tag: 'path', attrs: { d: 'M17 6h-4a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z' } },
    { tag: 'path', attrs: { d: 'M7 6h-3v13a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z' } }
  ]
);

const FileTextIcon = createSvgIcon(
  { width: '24', height: '24', viewBox: '0 0 24 24' },
  [
    { tag: 'path', attrs: { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' } },
    { tag: 'polyline', attrs: { points: '14 2 14 8 20 8' } },
    { tag: 'line', attrs: { x1: '16', y1: '13', x2: '8', y2: '13' } },
    { tag: 'line', attrs: { x1: '16', y1: '17', x2: '8', y2: '17' } },
    { tag: 'polyline', attrs: { points: '10 9 9 9 8 9' } }
  ]
);

const FilePdfIcon = createSvgIcon(
  { width: '24', height: '24', viewBox: '0 0 24 24' },
  [
    { tag: 'path', attrs: { d: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' } },
    { tag: 'polyline', attrs: { points: '14 2 14 8 20 8' } },
    { tag: 'path', attrs: { d: 'M16 13H8v2h8v-2zm0 4H8v2h8v-2z' } }
  ]
);

const DownloadIcon = createSvgIcon(
  { width: '24', height: '24', viewBox: '0 0 24 24' },
  [
    { tag: 'path', attrs: { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' } },
    { tag: 'polyline', attrs: { points: '7 10 12 15 17 10' } },
    { tag: 'line', attrs: { x1: '12', y1: '15', x2: '12', y2: '3' } }
  ]
);

const ChevronRightIcon = createSvgIcon(
  { width: '24', height: '24', viewBox: '0 0 24 24' },
  [
    { tag: 'path', attrs: { d: 'm9 18 6-6-6-6' } }
  ]
);

const escapeHtml = (value) => {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const renderInlineMarkdown = (text) => {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>');
};

const renderMarkdownToHtml = (markdown) => {
  const source = String(markdown || '').replace(/\r\n/g, '\n').trim();
  if (!source) {
    return '<p>暂无AI分析建议</p>';
  }

  const lines = source.split('\n');
  let minHeadingLevel = 6;

  for (const rawLine of lines) {
    const heading = rawLine.trim().match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      minHeadingLevel = Math.min(minHeadingLevel, heading[1].length);
    }
  }

  if (minHeadingLevel === 6) {
    minHeadingLevel = 1;
  }

  const html = [];
  let paragraphBuffer = [];
  let listBuffer = [];
  let sectionCounter = 0;
  let subsectionCounter = 0;
  let subsubsectionCounter = 0;

  const flushParagraph = () => {
    if (paragraphBuffer.length > 0) {
      html.push(`<p>${paragraphBuffer.join('<br/>')}</p>`);
      paragraphBuffer = [];
    }
  };

  const flushList = () => {
    if (listBuffer.length > 0) {
      html.push(`<ul>${listBuffer.join('')}</ul>`);
      listBuffer = [];
    }
  };

  const headingMatch = (line) => line.match(/^(#{1,6})\s+(.+)$/);
  const listMatch = (line) => line.match(/^[-*+]\s+(.+)$/);

  const getHeadingNumber = (relativeLevel) => {
    if (relativeLevel <= 1) {
      sectionCounter += 1;
      subsectionCounter = 0;
      subsubsectionCounter = 0;
      return `${sectionCounter}`;
    }

    if (sectionCounter === 0) {
      sectionCounter = 1;
    }

    if (relativeLevel === 2) {
      subsectionCounter += 1;
      subsubsectionCounter = 0;
      return `${sectionCounter}.${subsectionCounter}`;
    }

    if (subsectionCounter === 0) {
      subsectionCounter = 1;
    }

    subsubsectionCounter += 1;
    return `${sectionCounter}.${subsectionCounter}.${subsubsectionCounter}`;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const heading = headingMatch(line);
    if (heading) {
      flushParagraph();
      flushList();
      const level = Math.min(heading[1].length, 6);
      const relativeLevel = Math.max(1, level - minHeadingLevel + 1);
      const headingNumber = getHeadingNumber(relativeLevel);
      html.push(
        `<h${level} class="report-heading report-heading-level-${relativeLevel}">` +
        `<span class="summary-heading-prefix">${headingNumber}</span>` +
        `<span class="summary-heading-text">${renderInlineMarkdown(heading[2])}</span>` +
        `</h${level}>`
      );
      continue;
    }

    const listItem = listMatch(line);
    if (listItem) {
      flushParagraph();
      listBuffer.push(`<li>${renderInlineMarkdown(listItem[1])}</li>`);
      continue;
    }

    flushList();
    paragraphBuffer.push(renderInlineMarkdown(line));
  }

  flushParagraph();
  flushList();

  return html.join('');
};

const formattedSummary = computed(() => {
  try {
    return renderMarkdownToHtml(summary.value);
  } catch (e) {
    console.error('格式化总结失败:', e);
    return `<p>${escapeHtml(String(summary.value || '').substring(0, 500))}</p>`;
  }
});

const PlanIcon = createSvgIcon(
  { width: '24', height: '24', viewBox: '0 0 24 24' },
  [
    { tag: 'path', attrs: { d: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' } },
    { tag: 'path', attrs: { d: 'M9 12l2 2 4-4' } }
  ]
);

const ErrorIcon = createSvgIcon(
  { width: '48', height: '48', viewBox: '0 0 24 24' },
  [
    { tag: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
    { tag: 'line', attrs: { x1: '12', y1: '8', x2: '12', y2: '12' } },
    { tag: 'line', attrs: { x1: '12', y1: '16', x2: '12', y2: '16' } }
  ]
);

const RefreshIcon = createSvgIcon(
  { width: '18', height: '18', viewBox: '0 0 24 24' },
  [
    { tag: 'polyline', attrs: { points: '23 4 23 10 17 10' } },
    { tag: 'polyline', attrs: { points: '1 20 1 14 7 14' } },
    { tag: 'path', attrs: { d: 'M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15' } }
  ]
);

const ArrowLeftIcon = createSvgIcon(
  { width: '18', height: '18', viewBox: '0 0 24 24' },
  [
    { tag: 'line', attrs: { x1: '19', y1: '12', x2: '5', y2: '12' } },
    { tag: 'polyline', attrs: { points: '12 19 5 12 12 5' } }
  ]
);

const CheckCircleIcon = createSvgIcon(
  { width: '18', height: '18', viewBox: '0 0 24 24' },
  [
    { tag: 'path', attrs: { d: 'M22 11.08V12a10 10 0 1 1-5.93-9.14' } },
    { tag: 'polyline', attrs: { points: '22 4 12 14.01 9 11.01' } }
  ]
);

const AlertTriangleIcon = createSvgIcon(
  { width: '20', height: '20', viewBox: '0 0 24 24' },
  [
    { tag: 'path', attrs: { d: 'M12 9v4' } },
    { tag: 'path', attrs: { d: 'M12 17h.01' } },
    { tag: 'path', attrs: { d: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' } }
  ]
);

const InfoIcon = createSvgIcon(
  { width: '20', height: '20', viewBox: '0 0 24 24' },
  [
    { tag: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
    { tag: 'line', attrs: { x1: '12', y1: '16', x2: '12', y2: '12' } },
    { tag: 'line', attrs: { x1: '12', y1: '8', x2: '12', y2: '8' } }
  ]
);

const LightbulbIcon = createSvgIcon(
  { width: '14', height: '14', viewBox: '0 0 24 24' },
  [
    { tag: 'circle', attrs: { cx: '12', cy: '18', r: '3' } },
    { tag: 'path', attrs: { d: 'M12 15a6 6 0 0 0-9-5.19 4.5 4.5 0 0 1 3-1.81h12a4.5 4.5 0 0 1 3 1.82A6 6 0 0 0 12 15z' } }
  ]
);

const getRiskIcon = (level) => {
  switch (level) {
    case 'high':
      return AlertTriangleIcon;
    case 'medium':
      return InfoIcon;
    default:
      return InfoIcon;
  }
};

const getLocationName = (loc) => {
  return String(loc?.name ?? loc?.location?.name ?? '').trim();
};

const getLocationType = (loc) => {
  // 兼容现有地点模型（多数场景没有type字段），给AI默认类型避免后端校验失败。
  return String(loc?.type ?? loc?.location?.type ?? '').trim() || '景点';
};

const getLocationCost = (loc) => {
  return typeof loc?.cost === 'number' ? loc.cost : 0;
};

const getLocationDuration = (loc) => {
  return typeof loc?.duration === 'number' ? loc.duration : 0;
};

const getLocationTimeSlot = (loc) => {
  return loc?.time_slot || loc?.visit_time_slot || '';
};

const buildWeatherPayload = () => {
  if (!Array.isArray(props.weather)) return [];

  const normalized = [];

  props.weather.forEach((w) => {
    if (!w) return;

    // 兼容已经是AI接口所需结构的场景
    if (w.date || w.condition || w.temperature) {
      normalized.push({
        date: w.date || '',
        condition: w.condition || '',
        temperature: w.temperature || '',
        precipitation: typeof w.precipitation === 'number' ? w.precipitation : 0,
        wind: w.wind || ''
      });
      return;
    }

    // 兼容天气步骤中每个地点的和风天气结构
    const dailyList = w?.dailyWeather?.daily;
    if (Array.isArray(dailyList)) {
      dailyList.forEach((day) => {
        normalized.push({
          date: day?.fxDate || '',
          condition: day?.textDay || '',
          temperature: day?.tempMax && day?.tempMin
            ? `${day.tempMin}-${day.tempMax}`
            : (day?.tempMax || day?.tempMin || ''),
          precipitation: Number.isFinite(Number(day?.pop)) ? Number(day.pop) : 0,
          wind: [day?.windDirDay, day?.windScaleDay ? `${day.windScaleDay}级` : ''].filter(Boolean).join(' ')
        });
      });
    }
  });

  return normalized;
};

const validateLocations = () => {
  const errors = [];
  
  if (!props.locations || props.locations.length === 0) {
    errors.push('请至少添加一个地点');
    return errors;
  }

  props.locations.forEach((loc, index) => {
    const locationIndex = index + 1;
    if (!getLocationName(loc)) {
      errors.push(`第 ${locationIndex} 个地点：请填写地点名称`);
    }
  });

  return errors;
};

const generateSummary = async () => {
  loading.value = true;
  error.value = null;
  summary.value = '';
  risks.value = [];
  isStreaming.value = false;

  try {
    // 前端验证
    const validationErrors = validateLocations();
    if (validationErrors.length > 0) {
      error.value = validationErrors.join('\\n');
      loading.value = false;
      return;
    }

    const requestData = {
      plan_id: props.planId,
      title: props.planData.title,
      description: props.planData.description,
      start_date: formatDate(props.planData.start_date),
      end_date: formatDate(props.planData.end_date),
      budget_min: props.planData.budget_min,
      budget_max: props.planData.budget_max,
      num_people: props.planData.num_people,
      preferences: props.planData.preferences || [],
      start_location: props.planData.start_location,
      destination: props.planData.destination,
      locations: props.locations.map(loc => ({
        name: getLocationName(loc),
        type: getLocationType(loc),
        cost: getLocationCost(loc),
        duration: getLocationDuration(loc),
        time_slot: getLocationTimeSlot(loc)
      })),
      weather: buildWeatherPayload(),
      stream: false
    };

    // 使用 travelPlanApi 发送 POST 请求
    const response = await travelPlanApi.generateSummary(props.planId, requestData);
    
    if (response.data && response.data.success) {
      summary.value = response.data.summary || '';
      risks.value = response.data.risks || [];
    } else if (response.data && response.data.error) {
      error.value = formatErrorMessage(response.data.error) || '生成总结失败';
    }

  } catch (err) {
    console.error('生成AI总结失败:', err);
    error.value = formatErrorMessage(err.message) || '网络请求失败，请重试';
  } finally {
    loading.value = false;
    isStreaming.value = false;
  }
};

const formatErrorMessage = (error) => {
  if (!error) return null;

  if (typeof error === 'object' && !Array.isArray(error) && error.detail) {
    return formatErrorMessage(error.detail);
  }
  
  // 如果是数组格式的错误（FastAPI验证错误）
  if (Array.isArray(error)) {
    return error.map(err => {
      if (typeof err === 'object' && err.loc && err.msg) {
        // FastAPI格式：{loc: ['body', 'locations', '0', 'name'], msg: 'Field required'}
        const locationIdx = err.loc.findIndex(part => part === 'locations');
        const itemIndex = locationIdx >= 0 ? Number(err.loc[locationIdx + 1]) : NaN;
        const rawField = locationIdx >= 0 ? err.loc[locationIdx + 2] : err.loc[err.loc.length - 1];
        const fieldName = rawField === 'name' ? '地点名称' : 
                         rawField === 'type' ? '地点类型' : rawField;
        const position = Number.isNaN(itemIndex) ? '' : `第 ${itemIndex + 1} 个地点：`;
        return `${position}${fieldName}：${err.msg}`;
      }
      return typeof err === 'string' ? err : JSON.stringify(err);
    }).join('\\n');
  }
  
  // 如果是对象格式
  if (typeof error === 'object') {
    return JSON.stringify(error);
  }
  
  return String(error);
};

const formatDate = (dateValue) => {
  if (!dateValue) return '';
  if (typeof dateValue === 'number') {
    const date = new Date(dateValue);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  if (dateValue instanceof Date) {
    return `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(2, '0')}-${String(dateValue.getDate()).padStart(2, '0')}`;
  }
  return String(dateValue).split('T')[0] || String(dateValue);
};

const handleRetry = () => {
  generateSummary();
};

const selectExportFormat = async (format) => {
  showExportDialog.value = false;
  exportLoading.value = true;
  try {
    let result;
    if (format === 'markdown') {
      result = await exportUtils.downloadMarkdown(
        summary.value,
        props.planData,
        risks.value
      );
    } else {
      result = await exportUtils.downloadPdf(
        formattedSummary.value,
        props.planData,
        risks.value
      );
    }
    lastExportFile.value = result.fileName;
    showExportSuccess.value = true;
  } catch (err) {
    console.error(`导出${format}失败:`, err);
    const rawMessage = err?.message ? String(err.message) : '未知错误';
    alert(`导出${format === 'markdown' ? 'Markdown' : 'PDF'}文件失败：${rawMessage}`);
  } finally {
    exportLoading.value = false;
  }
};

const handleExportMarkdown = async () => {
  showExportPopover.value = false;
  await selectExportFormat('markdown');
};

const handleExportPdf = async () => {
  showExportPopover.value = false;
  await selectExportFormat('pdf');
};

watch(() => [props.planId, props.locations, props.weather], () => {
  if (props.planId && Array.isArray(props.locations) && props.locations.length > 0) {
    generateSummary();
  }
}, { immediate: true });
</script>

<style scoped>
.ai-summary {
  width: 100%;
  animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(15px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 加载状态 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}

.loading-content {
  text-align: center;
}

.loading-text {
  font-size: 16px;
  color: var(--color-text-secondary);
  margin-bottom: 20px;
  font-weight: 500;
}

.loading-dots {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  animation: dotPulse 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
  animation-delay: -0.32s;
}

.dot:nth-child(2) {
  animation-delay: -0.16s;
}

.dot:nth-child(3) {
  animation-delay: 0s;
}

@keyframes dotPulse {
  0%, 80%, 100% {
    transform: scale(0);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 错误状态 */
.error-container {
  padding: 48px;
}

.error-card {
  text-align: center;
  padding: 48px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}

.error-icon {
  color: #ef4444;
  margin-bottom: 20px;
}

.error-title {
  font-size: 22px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 12px;
}

.error-message {
  color: var(--color-text-secondary);
  margin-bottom: 20px;
  text-align: left;
  max-width: 420px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.7;
}

.error-message ul {
  margin: 0;
  padding-left: 24px;
}

.error-message li {
  margin-bottom: 10px;
  position: relative;
  padding-left: 10px;
}

.error-message li::before {
  content: '•';
  color: #ef4444;
  position: absolute;
  left: -18px;
  font-weight: 600;
}

.error-message p {
  margin: 0;
}

.error-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: var(--radius-md);
  margin-bottom: 28px;
  color: #b45309;
  font-size: 14px;
  font-weight: 500;
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.hint-icon {
  width: 18px;
  height: 18px;
}

/* 总结内容 */
.summary-content {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

/* 概览卡片 */
.overview-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 24px;
  padding: 28px 32px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  background: var(--color-surface);
  border: none;
}

.overview-header {
  display: flex;
  align-items: center;
  gap: 20px;
  justify-content: flex-start;
}

.overview-icon-wrapper {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(139, 157, 195, 0.3);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.overview-icon-wrapper:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(139, 157, 195, 0.4);
}

.overview-icon {
  width: 28px;
  height: 28px;
  color: white;
}

.overview-title-section {
  display: flex;
  flex-direction: column;
}

.overview-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  letter-spacing: -0.3px;
}

.overview-subtitle {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 6px 0 0;
  font-weight: 400;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  width: 100%;
}

.stat-card {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 14px;
  padding: 18px 20px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.96) 0%, rgba(241, 245, 249, 0.9) 100%);
  border-radius: var(--radius-md);
  min-width: 0;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  border: 1px solid rgba(226, 232, 240, 0.85);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.06);
}

.stat-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-bottom: 0;
}

.stat-icon-wrapper.location-icon {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.stat-icon-wrapper.location-icon .stat-icon {
  color: #3b82f6;
}

.stat-icon-wrapper.cost-icon {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.stat-icon-wrapper.cost-icon .stat-icon {
  color: #b45309;
}

.stat-icon-wrapper.budget-status-good {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.stat-icon-wrapper.budget-status-good .stat-icon {
  color: #059669;
}

.stat-icon-wrapper.budget-status-warning {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
}

.stat-icon-wrapper.budget-status-warning .stat-icon {
  color: #d97706;
}

.stat-icon-wrapper.budget-status-over {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
}

.stat-icon-wrapper.budget-status-over .stat-icon {
  color: #dc2626;
}

.stat-icon {
  width: 20px;
  height: 20px;
}

.stat-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1.1;
}

.stat-value.budget-status-good {
  color: #059669;
}

.stat-value.budget-status-warning {
  color: #d97706;
}

.stat-value.budget-status-over {
  color: #dc2626;
}

.stat-label {
  font-size: 11px;
  color: var(--color-text-secondary);
  margin-top: 4px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 预算进度环 */
.budget-stat {
  position: relative;
  overflow: hidden;
}

.budget-progress {
  position: absolute;
  top: 10px;
  right: 10px;
  opacity: 0.72;
}

.budget-ring {
  position: relative;
  width: 34px;
  height: 34px;
}

.ring-svg {
  width: 100%;
  height: 100%;
}

.ring-progress {
  transition: stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.ring-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 9px;
  font-weight: 600;
  color: var(--color-text-primary);
}

/* 总结卡片 */
.summary-card {
  padding: 28px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  background: var(--color-surface);
  border: none;
}

.summary-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 22px;
}

.summary-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 20px;
}

.summary-card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.export-icon-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-primary);
  background: rgba(102, 126, 234, 0.08);
  border: 1px solid rgba(102, 126, 234, 0.2);
  transition: all 0.25s ease;
}

.export-icon-button:hover {
  background: rgba(102, 126, 234, 0.15);
  border-color: rgba(102, 126, 234, 0.4);
  transform: translateY(-1px);
}

.export-icon-button :deep(.n-icon) {
  font-size: 14px;
}

.summary-text {
  line-height: 1.9;
  color: var(--color-text-primary);
  font-size: 15px;
}

.summary-text :deep(p) {
  margin: 0 0 16px 0;
  text-align: justify;
  text-justify: inter-ideograph;
}

.summary-text :deep(h1) {
  font-size: 20px;
  font-weight: 700;
  margin: 30px 0 14px 0;
  color: var(--color-text-primary);
  padding-bottom: 10px;
  border-bottom: 2px solid rgba(102, 126, 234, 0.25);
  letter-spacing: -0.2px;
}

.summary-text :deep(.report-heading) {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.summary-text :deep(.summary-heading-prefix) {
  flex-shrink: 0;
  min-width: 3.2em;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(102, 126, 234, 0.1);
  color: var(--color-primary);
  font-size: 0.78em;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.4;
  text-align: center;
}

.summary-text :deep(.summary-heading-text) {
  flex: 1;
  min-width: 0;
}

.summary-text :deep(.report-heading-level-1) {
  padding-bottom: 10px;
  border-bottom: 2px solid rgba(102, 126, 234, 0.25);
}

.summary-text :deep(h2) {
  font-size: 18px;
  font-weight: 650;
  margin: 24px 0 12px 0;
  color: var(--color-text-primary);
  position: relative;
  padding-left: 16px;
  letter-spacing: -0.15px;
}

.summary-text :deep(.report-heading-level-2),
.summary-text :deep(.report-heading-level-3) {
  padding-left: 2px;
}

.summary-text :deep(h2)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 18px;
  background: linear-gradient(180deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  border-radius: 2px;
}

.summary-text :deep(h3) {
  font-size: 16px;
  font-weight: 650;
  margin: 20px 0 10px 0;
  color: var(--color-text-primary);
  letter-spacing: -0.1px;
}

.summary-text :deep(h4) {
  font-size: 14px;
  font-weight: 650;
  margin: 16px 0 8px 0;
  color: var(--color-text-primary);
}

.summary-text :deep(.report-heading-level-2 .summary-heading-prefix) {
  background: rgba(102, 126, 234, 0.12);
}

.summary-text :deep(.report-heading-level-3 .summary-heading-prefix) {
  background: rgba(102, 126, 234, 0.08);
}

.summary-text :deep(strong) {
  color: var(--color-primary);
  font-weight: 600;
}

.summary-text :deep(em) {
  font-style: italic;
  color: var(--color-text-light);
}

.summary-text :deep(ul),
.summary-text :deep(ol) {
  margin: 12px 0 18px 0;
  padding-left: 22px;
}

.summary-text :deep(li) {
  margin-bottom: 8px;
  line-height: 1.75;
}

.summary-text :deep(ul > li)::marker,
.summary-text :deep(ol > li)::marker {
  color: var(--color-primary);
  font-weight: 600;
}

.summary-text :deep(ol) {
  list-style-type: decimal;
}

.summary-text :deep(ul) {
  list-style-type: disc;
}

/* 风险卡片 */
.risks-card {
  padding: 28px;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  background: var(--color-surface);
  border: none;
}

.risks-card :deep(.n-card-header) {
  padding-bottom: 20px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 20px;
}

.risks-card :deep(.n-card-header-title) {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.risks-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.risk-item {
  display: flex;
  gap: 16px;
  padding: 20px;
  border-radius: var(--radius-md);
  background: linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%);
  border-left: 4px solid;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.risk-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
}

.risk-level-high {
  border-color: #ef4444;
  background: linear-gradient(180deg, #fef2f2 0%, #fee2e2 100%);
}

.risk-level-high .risk-icon {
  color: #ef4444;
}

.risk-level-medium {
  border-color: #f59e0b;
  background: linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%);
}

.risk-level-medium .risk-icon {
  color: #f59e0b;
}

.risk-level-low {
  border-color: #10b981;
  background: linear-gradient(180deg, #f0fdf4 0%, #dcfce7 100%);
}

.risk-level-low .risk-icon {
  color: #10b981;
}

.risk-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.risk-level-high .risk-icon-wrapper {
  background: rgba(239, 68, 68, 0.1);
}

.risk-level-medium .risk-icon-wrapper {
  background: rgba(245, 158, 11, 0.1);
}

.risk-level-low .risk-icon-wrapper {
  background: rgba(16, 185, 129, 0.1);
}

.risk-icon {
  width: 20px;
  height: 20px;
}

.risk-content {
  flex: 1;
}

.risk-message {
  font-size: 15px;
  color: var(--color-text-primary);
  margin: 0 0 10px 0;
  font-weight: 600;
  line-height: 1.5;
}

.risk-suggestion {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  line-height: 1.6;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.suggestion-icon {
  color: #f59e0b;
  flex-shrink: 0;
  margin-top: 2px;
}

/* 操作按钮 */
.summary-actions {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding: 28px;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  border: none;
}

.action-button {
  padding: 14px 32px;
  border-radius: var(--radius-md);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
  font-size: 15px;
  letter-spacing: 0.3px;
}

.action-button:deep(.n-button) {
  border-radius: var(--radius-md);
}

.action-button:deep(.n-button-default) {
  background: transparent;
  border: 2px solid var(--color-border);
  color: var(--color-text-primary);
}

.action-button:deep(.n-button-default:hover) {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: rgba(139, 157, 195, 0.05);
}

.primary-button {
  padding: 14px 36px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.primary-button:deep(.n-button-primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.primary-button:deep(.n-button-primary:hover) {
  background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.5);
  transform: translateY(-2px);
}

.action-button:hover {
  transform: translateY(-2px);
}

.action-button:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .overview-card {
    gap: 20px;
    text-align: center;
    padding: 24px;
  }

  .overview-header {
    flex-direction: column;
    gap: 16px;
  }

  .overview-icon-wrapper {
    width: 48px;
    height: 48px;
  }

  .overview-icon {
    width: 24px;
    height: 24px;
  }

  .overview-title {
    font-size: 20px;
  }

  .overview-stats {
    width: 100%;
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .stat-card {
    padding: 16px 14px;
  }

  .stat-icon-wrapper {
    width: 36px;
    height: 36px;
  }

  .stat-icon {
    width: 18px;
    height: 18px;
  }

  .stat-value {
    font-size: 24px;
  }

  .budget-progress {
    top: 8px;
    right: 8px;
  }

  .budget-ring {
    width: 32px;
    height: 32px;
  }

  .ring-text {
    font-size: 8px;
  }

  .summary-actions {
    flex-direction: column;
    gap: 12px;
    padding: 20px;
  }

  .action-button {
    width: 100%;
    padding: 14px 24px;
  }

  .export-buttons {
    flex-direction: column;
    gap: 10px;
  }

  .export-btn {
    width: 100%;
  }
}

/* 导出格式选择对话框 */
.export-format-modal :deep(.n-modal),
.export-format-modal :deep(.n-modal-content) {
  border-radius: var(--radius-lg);
  padding: 0;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.18);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  width: 90%;
  max-width: 420px;
}

.export-format-modal :deep(.n-modal-header) {
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
}

.export-format-modal :deep(.n-modal-header-title) {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.export-format-content {
  padding: 24px;
}

.export-format-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0 0 20px 0;
}

.export-format-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.format-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: var(--color-background);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.25s ease;
}

.format-option:hover {
  background: rgba(102, 126, 234, 0.08);
  border-color: rgba(102, 126, 234, 0.3);
  transform: translateX(4px);
}

.format-icon-wrapper {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.format-icon-wrapper.markdown-icon {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.format-icon-wrapper.markdown-icon .format-icon {
  color: #3b82f6;
}

.format-icon-wrapper.pdf-icon {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
}

.format-icon-wrapper.pdf-icon .format-icon {
  color: #dc2626;
}

.format-icon {
  width: 22px;
  height: 22px;
}

.format-info {
  flex: 1;
  min-width: 0;
}

.format-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 4px 0;
}

.format-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin: 0;
}

.format-arrow {
  width: 16px;
  height: 16px;
  color: var(--color-text-light);
  flex-shrink: 0;
}

/* 导出成功弹窗 */
.export-success-modal :deep(.n-modal),
.export-success-modal :deep(.n-modal-content) {
  border-radius: 22px;
  padding: 0;
  overflow: hidden;
  box-shadow: 0 22px 48px rgba(15, 23, 42, 0.22);
  background: linear-gradient(160deg, #f0fdf4 0%, #ecfeff 100%);
  border: 1px solid #a7f3d0;
}

.success-content {
  padding: 32px;
  text-align: center;
  background: linear-gradient(160deg, #f0fdf4 0%, #ecfeff 100%);
  border-radius: 22px;
}

.success-icon-wrapper {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.35);
}

.success-icon {
  width: 40px;
  height: 40px;
  color: white;
}

.success-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 12px 0;
}

.success-message {
  font-size: 14px;
  color: #0f172a;
  margin: 0 0 8px 0;
}

.success-filename {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-primary);
  margin: 0 0 16px 0;
  word-break: break-all;
}

.success-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: #166534;
  margin: 0 0 24px 0;
  padding: 12px 16px;
  background: rgba(220, 252, 231, 0.8);
  border: 1px solid #86efac;
  border-radius: var(--radius-sm);
}

.success-actions {
  display: flex;
  justify-content: center;
}

.success-actions :deep(.n-button) {
  padding: 12px 32px;
  border-radius: var(--radius-md);
  font-weight: 600;
}

/* Export popover (small side buttons) */
.summary-card-header {
  position: relative;
}

.export-popover {
  position: absolute;
  top: 44px;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px;
  background: transparent;
  z-index: 40;
}

.export-pop-btn {
  min-width: 140px;
  height: 40px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 12px;
  background: #ffffff;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: none;
  cursor: pointer;
  gap: 10px;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.export-pop-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.06);
}

.export-pop-inner {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
}

.export-pop-btn :deep(.n-icon) {
  font-size: 18px;
  color: var(--color-text-primary);
}

.export-pop-label {
  font-size: 13px;
  color: var(--color-text-primary);
  font-weight: 600;
  line-height: 1;
}

@media (max-width: 768px) {
  .export-popover {
    display: none;
  }
}

</style>
