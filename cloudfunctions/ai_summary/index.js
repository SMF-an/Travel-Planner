const axios = require('axios');

const DEEPSEEK_CONFIG = {
  API_KEY: 'sk-e1d8c86fe79a4ac7acfcf3c248497bcb',
  API_URL: 'https://api.deepseek.com/chat/completions',
  MODEL: 'deepseek-v4-flash',
  API_TIMEOUT: 30000
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };
}

function successResponse(data, statusCode = 200) {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify(data)
  };
}

function errorResponse(message, statusCode = 500) {
  return {
    statusCode,
    headers: corsHeaders(),
    body: JSON.stringify({ error: message })
  };
}

function buildPrompt(planData) {
  const title = planData.title || '';
  const destination = planData.destination || '';
  const startDate = planData.start_date || '';
  const endDate = planData.end_date || '';
  const budgetMin = planData.budget_min || 0;
  const budgetMax = planData.budget_max || 0;
  const numPeople = planData.num_people || 1;
  const preferences = planData.preferences || [];
  const locations = planData.locations || [];
  const weather = planData.weather || [];

  const totalCost = locations.reduce((sum, loc) => sum + (loc.cost || 0), 0);
  const numLocations = locations.length;

  let locationInfo = '';
  locations.forEach((loc, idx) => {
    locationInfo += `${idx + 1}. ${loc.name || ''} - 类型: ${loc.type || ''}, 预计花费: ${loc.cost || 0}元, 预计时长: ${loc.duration || 0}分钟, 时间段: ${loc.time_slot || ''}\n`;
  });

  let weatherInfo = '';
  weather.forEach(w => {
    weatherInfo += `${w.date || ''}: ${w.condition || ''}, 温度: ${w.temperature || ''}°C, 降水概率: ${w.precipitation || 0}%, 风力: ${w.wind || ''}\n`;
  });

  const prompt = `
你是一位专业的出行规划顾问。请根据以下用户的出行规划信息，生成一份结构清晰、语言自然的出行建议总结报告。

【规划基本信息】
标题: ${title}
目的地: ${destination}
出行时间: ${startDate} 至 ${endDate}
出行人数: ${numPeople}人
预算范围: ${budgetMin}元 - ${budgetMax}元
出行偏好: ${preferences.length > 0 ? preferences.join(', ') : '无'}

【地点安排】
共${numLocations}个地点，总预计花费约${totalCost}元

${locationInfo}

【天气情况】
${weatherInfo}

【总结要求】
请按照以下结构生成总结报告：

1. 规划概述：简要介绍本次出行规划的基本情况

2. 优点分析：分析当前规划的优点和亮点

3. 潜在风险：识别可能影响出行体验的潜在问题（如天气影响、预算紧张等）

4. 改进建议：针对潜在风险提供具体、可操作的改进建议

5. 优先级提示：列出需要优先处理的事项

请使用友好、专业的语言，确保建议实用且具有针对性。
`.trim();

  return prompt;
}

async function callDeepseekApi(prompt, maxRetries = 2) {
  const headers = {
    'Authorization': `Bearer ${DEEPSEEK_CONFIG.API_KEY}`,
    'Content-Type': 'application/json'
  };

  const payload = {
    model: DEEPSEEK_CONFIG.MODEL,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 2000,
    stream: false
  };

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(
        DEEPSEEK_CONFIG.API_URL,
        payload,
        { headers, timeout: DEEPSEEK_CONFIG.API_TIMEOUT }
      );

      const result = response.data;

      if (result.choices && result.choices.length > 0) {
        return {
          success: true,
          content: result.choices[0].message.content.trim(),
          usage: result.usage || {}
        };
      } else {
        return {
          success: false,
          error: 'API返回格式异常'
        };
      }
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

function analyzePlanRisks(planData) {
  const risks = [];
  const { budget_min, budget_max, locations, start_date, end_date, weather } = planData;

  const totalCost = locations.reduce((sum, loc) => sum + (loc.cost || 0), 0);
  if (totalCost > budget_max) {
    risks.push({
      level: 'high',
      message: `预算可能不足`,
      detail: `预计总花费${totalCost}元已超过最高预算${budget_max}元`
    });
  } else if (totalCost > budget_max * 0.8) {
    risks.push({
      level: 'medium',
      message: '预算接近上限',
      detail: `预计总花费${totalCost}元，接近最高预算${budget_max}元`
    });
  }

  const start = new Date(start_date);
  const end = new Date(end_date);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  const locationsPerDay = locations.length / days;
  if (locationsPerDay > 5) {
    risks.push({
      level: 'high',
      message: '行程安排过于紧凑',
      detail: `平均每天安排${locationsPerDay.toFixed(1)}个地点，可能会比较赶`
    });
  } else if (locationsPerDay > 3) {
    risks.push({
      level: 'medium',
      message: '行程安排较满',
      detail: `平均每天安排${locationsPerDay.toFixed(1)}个地点`
    });
  }

  if (weather) {
    weather.forEach(w => {
      if (w.precipitation && w.precipitation > 70) {
        risks.push({
          level: 'high',
          message: `${w.date}降水概率较高`,
          detail: `降水概率${w.precipitation}%，建议准备雨具或调整室外活动安排`
        });
      }
    });
  }

  if (locations.some(loc => !loc.time_slot)) {
    risks.push({
      level: 'low',
      message: '部分地点未安排时间段',
      detail: '建议为所有地点分配具体的访问时间段'
    });
  }

  return risks;
}

async function generateTravelSummary(planData) {
  const prompt = buildPrompt(planData);

  try {
    const aiResult = await callDeepseekApi(prompt);

    if (aiResult.success) {
      return {
        success: true,
        summary: aiResult.content,
        error: null,
        usage: aiResult.usage
      };
    } else {
      return {
        success: false,
        summary: null,
        error: aiResult.error,
        usage: {}
      };
    }
  } catch (error) {
    return {
      success: false,
      summary: null,
      error: error.message,
      usage: {}
    };
  }
}

exports.main = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders(), body: '' };
  }

  const path = event.path || '';
  const method = event.httpMethod;

  console.log(`[ai_summary] ${method} ${path}`);

  try {
    if (path === '/' || path === '/summary' || path.endsWith('/summary')) {
      if (method === 'POST') {
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

        if (!body.title || !body.destination) {
          return errorResponse('缺少必要参数：title 和 destination', 400);
        }

        const aiResult = await generateTravelSummary(body);
        const localRisks = analyzePlanRisks(body);

        if (aiResult.success) {
          return successResponse({
            success: true,
            summary: aiResult.summary,
            risks: localRisks,
            error: null,
            usage: aiResult.usage
          });
        } else {
          return successResponse({
            success: false,
            summary: null,
            risks: localRisks,
            error: aiResult.error,
            usage: aiResult.usage
          });
        }
      } else if (method === 'GET') {
        return successResponse({
          message: 'AI总结服务正常运行，请使用POST请求提交规划数据生成总结'
        });
      }
    }

    return errorResponse('未找到对应的接口', 404);
  } catch (error) {
    console.error('[ai_summary] Error:', error);
    return errorResponse(error.message || '服务器内部错误', 500);
  }
};