import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatPlainDate, formatPlainDateWithWeekday } from './date';

export const exportUtils = {
  generateFileName(prefix = 'AI建议') {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${prefix}_${year}${month}${day}_${hours}${minutes}${seconds}`;
  },

  exportToMarkdown(content, planData, risks = []) {
    try {
      let markdown = `# ${planData.title || '出行规划AI建议'}\n\n`;
      
      markdown += `## 基本信息\n\n`;
      markdown += `- **规划名称**: ${planData.title || '未命名规划'}\n`;
      markdown += `- **出发日期**: ${planData.start_date || '未设置'}\n`;
      markdown += `- **结束日期**: ${planData.end_date || '未设置'}\n`;
      markdown += `- **预算上限**: ¥${planData.budget_max || 0}\n`;
      markdown += `- **出行人数**: ${planData.people_count || 1}人\n\n`;

      markdown += `## AI分析建议\n\n`;
      markdown += content + '\n\n';

      if (risks && risks.length > 0) {
        markdown += `## 风险提示\n\n`;
        risks.forEach((risk, index) => {
          const levelText = {
            high: '🔴 高风险',
            medium: '🟡 中风险',
            low: '🟢 低风险'
          };
          markdown += `${index + 1}. **${levelText[risk.level] || risk.level}**: ${risk.message}\n`;
          markdown += `   > ${risk.suggestion}\n\n`;
        });
      }

      markdown += `---\n`;
      markdown += `导出时间: ${new Date().toLocaleString('zh-CN')}\n`;

      return markdown;
    } catch (error) {
      console.error('Markdown转换失败:', error);
      throw new Error('Markdown格式转换失败，请重试');
    }
  },

  downloadMarkdown(content, planData, risks = []) {
    try {
      const markdown = this.exportToMarkdown(content, planData, risks);
      const fileName = `${this.generateFileName('AI建议')}.md`;
      
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true, fileName, path: '浏览器下载目录' };
    } catch (error) {
      console.error('Markdown导出失败:', error);
      throw new Error('导出Markdown文件失败，请重试');
    }
  },

  async exportToPdf(content, planData, risks = [], elementId = null) {
    let container = null;
    try {
      const fileName = `${this.generateFileName('AI建议')}.pdf`;

      if (!content) {
        throw new Error('导出内容为空');
      }

      if (!planData) {
        throw new Error('规划数据为空');
      }

      let contentHtml = `
        <style>
          * { box-sizing: border-box; }
          .pdf-root {
            width: 800px;
            padding: 20px;
            background: #ffffff;
            color: #333;
            font-family: 'Microsoft YaHei', 'PingFang SC', 'SimHei', -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 14px;
            line-height: 1.8;
          }
          h1 {
            color: #667eea;
            font-size: 24px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 12px;
            margin: 0 0 24px;
            font-weight: bold;
          }
          h2 {
            color: #374151;
            font-size: 18px;
            margin: 28px 0 16px;
            font-weight: bold;
          }
          h3 {
            color: #4b5563;
            font-size: 16px;
            margin: 20px 0 12px;
            font-weight: bold;
          }
          p { margin: 12px 0; text-align: justify; }
          strong { color: #667eea; font-weight: bold; }
          .info-table {
            border-collapse: collapse;
            width: 100%;
            margin: 16px 0;
            border: 1px solid #e5e7eb;
          }
          .info-table td {
            border: 1px solid #e5e7eb;
            padding: 10px 14px;
          }
          .info-table tr:first-child td {
            background-color: #f3f4f6;
            font-weight: bold;
            color: #374151;
          }
          .risk-item {
            margin: 14px 0;
            padding: 14px;
            border-radius: 8px;
            border-left: 4px solid;
          }
          .risk-high { background-color: #fef2f2; border-color: #ef4444; }
          .risk-medium { background-color: #fffbeb; border-color: #f59e0b; }
          .risk-low { background-color: #f0fdf4; border-color: #10b981; }
          .risk-title { font-weight: bold; margin-bottom: 8px; color: #374151; }
          .risk-suggestion { font-style: italic; color: #6b7280; font-size: 13px; margin-top: 6px; }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #9ca3af;
          }
          .summary-content { margin: 16px 0; }
        </style>
        <div class="pdf-root">
          <h1>${planData.title || '出行规划AI建议'}</h1>
          <h2>基本信息</h2>
          <table class="info-table">
            <tr><td>规划名称</td><td>${planData.title || '未命名规划'}</td></tr>
            <tr><td>出发日期</td><td>${planData.start_date || '未设置'}</td></tr>
            <tr><td>结束日期</td><td>${planData.end_date || '未设置'}</td></tr>
            <tr><td>预算上限</td><td>¥${planData.budget_max || 0}</td></tr>
            <tr><td>出行人数</td><td>${planData.people_count || 1}人</td></tr>
          </table>
          <h2>AI分析建议</h2>
          <div class="summary-content">${content || '暂无AI分析建议'}</div>
      `;

      if (risks && risks.length > 0) {
        contentHtml += '<h2>风险提示</h2>';
        risks.forEach((risk) => {
          const levelClass = `risk-${risk.level}`;
          contentHtml += `
            <div class="risk-item ${levelClass}">
              <div class="risk-title">${risk.message || '未知风险'}</div>
              <div class="risk-suggestion">💡 ${risk.suggestion || '暂无建议'}</div>
            </div>
          `;
        });
      }

      contentHtml += `
          <div class="footer">导出时间: ${new Date().toLocaleString('zh-CN')}</div>
        </div>
      `;

      container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-10000px';
      container.style.top = '0';
      container.style.width = '800px';
      container.style.background = '#ffffff';
      container.style.zIndex = '-1';
      container.style.pointerEvents = 'none';
      container.innerHTML = contentHtml;

      document.body.appendChild(container);

      if (document.fonts && document.fonts.ready) {
        try {
          await document.fonts.ready;
        } catch (e) {
          console.warn('等待字体加载失败，继续导出:', e);
        }
      }

      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        windowWidth: 800,
        width: 800
      });

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('渲染导出内容失败');
      }

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(fileName);
      return { success: true, fileName, path: '浏览器下载目录' };
    } catch (error) {
      console.error('PDF导出失败:', error);
      const errorMessage = typeof error === 'string'
        ? error
        : (error && error.message ? error.message : '未知错误');
      throw new Error(errorMessage);
    } finally {
      if (container && container.parentNode) {
        try {
          document.body.removeChild(container);
        } catch (e) {
          console.warn('清理容器失败:', e);
        }
      }
    }
  },

  async downloadPdf(content, planData, risks = []) {
    return await this.exportToPdf(content, planData, risks);
  },

  // ========== 行程单导出功能 ==========

  generateTripFileName(prefix = '行程单') {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${prefix}_${year}${month}${day}`;
  },

  generateTripMarkdown(planData, locations) {
    try {
      let markdown = `# ${planData.title || '出行规划'}\n\n`;
      
      markdown += `## 基本信息\n\n`;
      markdown += `| 属性 | 内容 |\n`;
      markdown += `| --- | --- |\n`;
      markdown += `| 规划名称 | ${planData.title || '未命名规划'} |\n`;
      markdown += `| 目的地 | ${planData.destination || '未设置'} |\n`;
      markdown += `| 出发地点 | ${planData.start_location || '未设置'} |\n`;
      markdown += `| 出发日期 | ${formatPlainDate(planData.start_date) || '未设置'} |\n`;
      markdown += `| 结束日期 | ${formatPlainDate(planData.end_date) || '未设置'} |\n`;
      markdown += `| 预算范围 | ¥${planData.budget_min || 0} - ¥${planData.budget_max || 0} |\n`;
      markdown += `| 出行人数 | ${planData.num_people || 1}人 |\n`;
      markdown += `| 出行偏好 | ${planData.preferences?.join('、') || '未设置'} |\n`;
      
      if (planData.description) {
        markdown += `\n## 规划描述\n\n${planData.description}\n\n`;
      }

      if (locations && locations.length > 0) {
        const sortedLocations = [...locations].sort((a, b) => {
          const dateCompare = (a.visit_date || '').localeCompare(b.visit_date || '');
          if (dateCompare !== 0) return dateCompare;
          const slotOrder = { '上午': 0, '下午': 1, '晚上': 2 };
          return (slotOrder[a.visit_time_slot] || 0) - (slotOrder[b.visit_time_slot] || 0);
        });

        markdown += `## 行程安排\n\n`;
        
        let currentDate = '';
        sortedLocations.forEach((loc, index) => {
          if (loc.visit_date && loc.visit_date !== currentDate) {
            currentDate = loc.visit_date;
            markdown += `### ${formatPlainDateWithWeekday(currentDate) || currentDate}\n\n`;
          }
          
          markdown += `${index + 1}. **${loc.name || loc.location?.name || '未知地点'}**\n`;
          markdown += `   - 时间：${loc.visit_time_slot || '未设置'}\n`;
          if (loc.location?.address) {
            markdown += `   - 地址：${loc.location.address}\n`;
          }
          if (loc.transportation) {
            markdown += `   - 交通方式：${loc.transportation}\n`;
          }
          if (loc.duration) {
            markdown += `   - 预计时长：${loc.duration}\n`;
          }
          if (loc.notes) {
            markdown += `   - 备注：${loc.notes}\n`;
          }
          markdown += `\n`;
        });
      }

      markdown += `---\n`;
      markdown += `导出时间: ${new Date().toLocaleString('zh-CN')}\n`;
      markdown += `生成工具: 智能出行规划器\n`;

      return markdown;
    } catch (error) {
      console.error('行程单Markdown转换失败:', error);
      throw new Error('Markdown格式转换失败，请重试');
    }
  },

  downloadTripMarkdown(planData, locations) {
    try {
      const markdown = this.generateTripMarkdown(planData, locations);
      const fileName = `${this.generateTripFileName('行程单')}.md`;
      
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true, fileName, path: '浏览器下载目录' };
    } catch (error) {
      console.error('行程单Markdown导出失败:', error);
      throw new Error('导出Markdown文件失败，请重试');
    }
  },

  async downloadTripPdf(planData, locations) {
    let container = null;
    try {
      const fileName = `${this.generateTripFileName('行程单')}.pdf`;

      if (!planData) {
        throw new Error('规划数据为空');
      }

      let contentHtml = `
        <style>
          * { box-sizing: border-box; }
          .pdf-root {
            width: 800px;
            padding: 30px;
            background: #ffffff;
            color: #333;
            font-family: 'Microsoft YaHei', 'PingFang SC', 'SimHei', -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 14px;
            line-height: 1.8;
          }
          .header-section {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #667eea;
          }
          .main-title {
            color: #667eea;
            font-size: 28px;
            font-weight: bold;
            margin: 0 0 10px;
          }
          .subtitle {
            color: #6b7280;
            font-size: 14px;
          }
          h2 {
            color: #374151;
            font-size: 18px;
            margin: 28px 0 16px;
            font-weight: bold;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
          }
          h3 {
            color: #4b5563;
            font-size: 16px;
            margin: 22px 0 14px;
            font-weight: bold;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin: 16px 0;
          }
          .info-item {
            display: flex;
            padding: 12px 16px;
            background-color: #f9fafb;
            border-radius: 6px;
          }
          .info-label {
            font-weight: 600;
            color: #6b7280;
            min-width: 80px;
          }
          .info-value {
            color: #374151;
            font-weight: 500;
          }
          .description-box {
            padding: 16px;
            background-color: #f9fafb;
            border-radius: 6px;
            border-left: 4px solid #667eea;
            margin: 12px 0;
            line-height: 1.7;
          }
          .location-list {
            margin: 16px 0;
          }
          .location-item {
            padding: 16px;
            background-color: #f9fafb;
            border-radius: 6px;
            margin-bottom: 12px;
            border-left: 4px solid #10b981;
          }
          .location-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
          }
          .location-name {
            font-size: 16px;
            font-weight: bold;
            color: #374151;
          }
          .location-time {
            font-size: 13px;
            color: #667eea;
            font-weight: 500;
          }
          .location-detail {
            font-size: 14px;
            color: #4b5563;
            margin-bottom: 6px;
            display: flex;
            gap: 8px;
          }
          .location-detail svg {
            width: 14px;
            height: 14px;
            color: #9ca3af;
          }
          .location-notes {
            font-size: 13px;
            color: #6b7280;
            font-style: italic;
            padding-top: 10px;
            border-top: 1px dashed #e5e7eb;
            margin-top: 10px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #9ca3af;
            text-align: center;
          }
          .preferences {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 8px;
          }
          .preference-tag {
            padding: 4px 12px;
            background-color: #e0e7ff;
            color: #4338ca;
            border-radius: 20px;
            font-size: 12px;
          }
        </style>
        <div class="pdf-root">
          <div class="header-section">
            <h1 class="main-title">${planData.title || '出行规划'}</h1>
            <div class="subtitle">智能出行规划器 · 行程单</div>
          </div>

          <h2>基本信息</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">目的地：</span>
              <span class="info-value">${planData.destination || '未设置'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">出发地点：</span>
              <span class="info-value">${planData.start_location || '未设置'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">出发日期：</span>
              <span class="info-value">${formatPlainDate(planData.start_date) || '未设置'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">结束日期：</span>
              <span class="info-value">${formatPlainDate(planData.end_date) || '未设置'}</span>
            </div>
            <div class="info-item">
              <span class="info-label">预算范围：</span>
              <span class="info-value">¥${planData.budget_min || 0} - ¥${planData.budget_max || 0}</span>
            </div>
            <div class="info-item">
              <span class="info-label">出行人数：</span>
              <span class="info-value">${planData.num_people || 1}人</span>
            </div>
          </div>

          <div class="preferences">
            ${planData.preferences?.map(p => `<span class="preference-tag">${p}</span>`).join('') || '<span style="color: #9ca3af; font-size: 13px;">未设置出行偏好</span>'}
          </div>
      `;

      if (planData.description) {
        contentHtml += `
          <h2>规划描述</h2>
          <div class="description-box">${planData.description}</div>
        `;
      }

      if (locations && locations.length > 0) {
        const sortedLocations = [...locations].sort((a, b) => {
          const dateCompare = (a.visit_date || '').localeCompare(b.visit_date || '');
          if (dateCompare !== 0) return dateCompare;
          const slotOrder = { '上午': 0, '下午': 1, '晚上': 2 };
          return (slotOrder[a.visit_time_slot] || 0) - (slotOrder[b.visit_time_slot] || 0);
        });

        contentHtml += '<h2>行程安排</h2><div class="location-list">';
        
        let currentDate = '';
        sortedLocations.forEach((loc, index) => {
          if (loc.visit_date && loc.visit_date !== currentDate) {
            currentDate = loc.visit_date;
            contentHtml += `<h3>${formatPlainDateWithWeekday(currentDate) || currentDate}</h3>`;
          }
          
          contentHtml += `
            <div class="location-item">
              <div class="location-header">
                <span class="location-name">${index + 1}. ${loc.name || loc.location?.name || '未知地点'}</span>
                <span class="location-time">${loc.visit_time_slot || '未设置'}</span>
              </div>
          `;
          
          if (loc.location?.address) {
            contentHtml += `<div class="location-detail"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg><span>${loc.location.address}</span></div>`;
          }
          if (loc.transportation) {
            contentHtml += `<div class="location-detail"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.7 7.8c-.8.3-1.7.5-2.7.5H8c-1 0-2-.2-2.7-.5M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9"/><path d="M17 11l3-3-3-3M7 11l-3-3 3-3"/></svg><span>交通方式：${loc.transportation}</span></div>`;
          }
          if (loc.duration) {
            contentHtml += `<div class="location-detail"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>预计时长：${loc.duration}</span></div>`;
          }
          if (loc.notes) {
            contentHtml += `<div class="location-notes">备注：${loc.notes}</div>`;
          }
          
          contentHtml += '</div>';
        });
        
        contentHtml += '</div>';
      } else {
        contentHtml += '<h2>行程安排</h2><p style="color: #9ca3af; text-align: center; padding: 20px;">暂无行程安排</p>';
      }

      contentHtml += `
          <div class="footer">
            <p>导出时间: ${new Date().toLocaleString('zh-CN')}</p>
            <p>生成工具: 智能出行规划器</p>
          </div>
        </div>
      `;

      container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-10000px';
      container.style.top = '0';
      container.style.width = '800px';
      container.style.background = '#ffffff';
      container.style.zIndex = '-1';
      container.style.pointerEvents = 'none';
      container.innerHTML = contentHtml;

      document.body.appendChild(container);

      if (document.fonts && document.fonts.ready) {
        try {
          await document.fonts.ready;
        } catch (e) {
          console.warn('等待字体加载失败，继续导出:', e);
        }
      }

      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        windowWidth: 800,
        width: 800
      });

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('渲染导出内容失败');
      }

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(fileName);
      return { success: true, fileName, path: '浏览器下载目录' };
    } catch (error) {
      console.error('行程单PDF导出失败:', error);
      const errorMessage = typeof error === 'string'
        ? error
        : (error && error.message ? error.message : '未知错误');
      throw new Error(errorMessage);
    } finally {
      if (container && container.parentNode) {
        try {
          document.body.removeChild(container);
        } catch (e) {
          console.warn('清理容器失败:', e);
        }
      }
    }
  }
};

export default exportUtils;