import requests
import json
import time
from app.config import DEEPSEEK

def generate_travel_summary(plan_data):
    """
    调用Deepseek API生成出行建议总结
    
    参数:
        plan_data: 包含以下字段的字典
            - title: 规划标题
            - description: 规划描述
            - start_date: 开始日期
            - end_date: 结束日期
            - budget_min: 最小预算
            - budget_max: 最大预算
            - num_people: 出行人数
            - preferences: 出行偏好列表
            - start_location: 出发地点
            - destination: 目的地
            - locations: 地点列表，每个地点包含:
                - name: 地点名称
                - type: 地点类型
                - cost: 预计花费
                - duration: 预计时长(分钟)
                - time_slot: 时间段(如: 上午, 下午, 晚上)
            - weather: 天气信息
                - date: 日期
                - condition: 天气状况
                - temperature: 温度
                - precipitation: 降水概率
                - wind: 风力
    
    返回:
        包含以下字段的字典:
            - success: 布尔值，是否成功
            - summary: AI生成的总结文本（成功时）
            - error: 错误信息（失败时）
            - usage: API使用信息
    """
    
    # 构建提示词
    prompt = build_prompt(plan_data)
    
    # 调用Deepseek API
    try:
        response = call_deepseek_api(prompt)
        if response.get('success'):
            return {
                'success': True,
                'summary': response['content'],
                'error': None,
                'usage': response.get('usage', {})
            }
        else:
            return {
                'success': False,
                'summary': None,
                'error': response.get('error', 'API调用失败'),
                'usage': {}
            }
    except Exception as e:
        return {
            'success': False,
            'summary': None,
            'error': str(e),
            'usage': {}
        }

def build_prompt(plan_data):
    """构建AI总结的提示词"""
    
    # 提取基本信息
    title = plan_data.get('title', '')
    destination = plan_data.get('destination', '')
    start_date = plan_data.get('start_date', '')
    end_date = plan_data.get('end_date', '')
    budget_min = plan_data.get('budget_min', 0)
    budget_max = plan_data.get('budget_max', 0)
    num_people = plan_data.get('num_people', 1)
    preferences = plan_data.get('preferences', [])
    locations = plan_data.get('locations', [])
    weather = plan_data.get('weather', [])
    
    # 计算总花费和地点数量
    total_cost = sum(loc.get('cost', 0) for loc in locations)
    num_locations = len(locations)
    
    # 构建地点信息
    location_info = ""
    for idx, loc in enumerate(locations, 1):
        location_info += f"{idx}. {loc.get('name', '')} - 类型: {loc.get('type', '')}, 预计花费: {loc.get('cost', 0)}元, "
        location_info += f"预计时长: {loc.get('duration', 0)}分钟, 时间段: {loc.get('time_slot', '')}\n"
    
    # 构建天气信息
    weather_info = ""
    for w in weather:
        weather_info += f"{w.get('date', '')}: {w.get('condition', '')}, 温度: {w.get('temperature', '')}°C, "
        weather_info += f"降水概率: {w.get('precipitation', 0)}%, 风力: {w.get('wind', '')}\n"
    
    # 构建提示词
    prompt = f"""
你是一位专业的出行规划顾问。请根据以下用户的出行规划信息，生成一份结构清晰、语言自然的出行建议总结报告。

【规划基本信息】
标题: {title}
目的地: {destination}
出行时间: {start_date} 至 {end_date}
出行人数: {num_people}人
预算范围: {budget_min}元 - {budget_max}元
出行偏好: {', '.join(preferences) if preferences else '无'}

【地点安排】
共{num_locations}个地点，总预计花费约{total_cost}元

{location_info}

【天气情况】
{weather_info}

【总结要求】
请按照以下结构生成总结报告：

1. 规划概述：简要介绍本次出行规划的基本情况

2. 优点分析：分析当前规划的优点和亮点

3. 潜在风险：识别可能影响出行体验的潜在问题（如天气影响、预算紧张等）

4. 改进建议：针对潜在风险提供具体、可操作的改进建议

5. 优先级提示：列出需要优先处理的事项

请使用友好、专业的语言，确保建议实用且具有针对性。
""".strip()
    
    return prompt

def call_deepseek_api(prompt, max_retries=2):
    """
    调用Deepseek API
    
    参数:
        prompt: 提示词
        max_retries: 最大重试次数
    
    返回:
        包含success、content、usage的字典
    """
    
    api_key = DEEPSEEK['API_KEY']
    api_url = f"{DEEPSEEK['API_URL'].rstrip('/')}/chat/completions"
    model = DEEPSEEK['MODEL']
    timeout = DEEPSEEK['API_TIMEOUT'] / 1000  # 转换为秒
    
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'model': model,
        'messages': [
            {
                'role': 'user',
                'content': prompt
            }
        ],
        'temperature': 0.7,
        'max_tokens': 2000,
        'stream': False
    }
    
    for attempt in range(max_retries + 1):
        try:
            response = requests.post(
                api_url,
                headers=headers,
                data=json.dumps(payload),
                timeout=timeout
            )
            
            response.raise_for_status()
            result = response.json()
            
            if 'choices' in result and len(result['choices']) > 0:
                content = result['choices'][0]['message']['content'].strip()
                return {
                    'success': True,
                    'content': content,
                    'usage': result.get('usage', {})
                }
            else:
                return {
                    'success': False,
                    'error': 'API返回格式异常'
                }
                
        except requests.exceptions.Timeout:
            if attempt < max_retries:
                time.sleep(2 ** attempt)  # 指数退避
                continue
            return {
                'success': False,
                'error': '请求超时'
            }
        except requests.exceptions.RequestException as e:
            if attempt < max_retries:
                time.sleep(2 ** attempt)
                continue
            return {
                'success': False,
                'error': f'网络请求失败: {str(e)}'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'处理响应失败: {str(e)}'
            }
    
    return {
        'success': False,
        'error': '重试次数已用尽'
    }

def analyze_plan_risks(plan_data):
    """
    分析规划风险（本地分析，用于补充AI总结）
    
    参数:
        plan_data: 规划数据
    
    返回:
        风险列表
    """
    risks = []
    
    budget_min = plan_data.get('budget_min', 0)
    budget_max = plan_data.get('budget_max', 0)
    locations = plan_data.get('locations', [])
    weather = plan_data.get('weather', [])
    
    # 计算总花费
    total_cost = sum(loc.get('cost', 0) for loc in locations)
    
    # 预算风险
    if total_cost > budget_max:
        risks.append({
            'level': 'high',
            'message': f'总预计花费{total_cost}元已超出预算上限{budget_max}元',
            'suggestion': '建议减少部分地点或选择更经济的活动'
        })
    elif total_cost > budget_max * 0.8:
        risks.append({
            'level': 'medium',
            'message': f'总预计花费{total_cost}元已接近预算上限（{budget_max}元）',
            'suggestion': '建议关注实际消费，预留一定预算余量'
        })
    
    # 天气风险
    for w in weather:
        condition = w.get('condition', '').lower()
        precipitation = w.get('precipitation', 0)
        
        if '雨' in condition or precipitation > 60:
            outdoor_locations = [loc for loc in locations if loc.get('type') in ['公园', '户外', '景点']]
            if outdoor_locations:
                risks.append({
                    'level': 'medium',
                    'message': f'{w.get("date", "")}有{condition}，可能影响户外活动',
                    'suggestion': '建议将户外活动调整到上午或更换为室内活动'
                })
    
    # 行程紧凑度分析
    total_duration = sum(loc.get('duration', 0) for loc in locations)
    if total_duration > 480:  # 超过8小时
        risks.append({
            'level': 'low',
            'message': '当日行程安排较紧凑（总时长约{:.1f}小时）'.format(total_duration / 60),
            'suggestion': '建议适当减少活动或增加休息时间'
        })
    
    return risks
