import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  }
};

export default exportUtils;
