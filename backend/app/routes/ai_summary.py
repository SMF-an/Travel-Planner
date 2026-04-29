from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from app.utils.ai_summary import generate_travel_summary, analyze_plan_risks
from app.models.travel_plan import TravelPlan
from app.models.location import Location
import json

router = APIRouter()

class LocationData(BaseModel):
    """地点数据模型"""
    name: str = Field(description="地点名称")
    type: str = Field(description="地点类型")
    cost: int = Field(description="预计花费")
    duration: int = Field(description="预计时长(分钟)")
    time_slot: str = Field(description="时间段")

class WeatherData(BaseModel):
    """天气数据模型"""
    date: str = Field(description="日期")
    condition: str = Field(description="天气状况")
    temperature: str = Field(description="温度")
    precipitation: int = Field(description="降水概率")
    wind: str = Field(description="风力")

class PlanSummaryRequest(BaseModel):
    """AI总结请求模型"""
    plan_id: int = Field(description="规划ID")
    title: str = Field(description="规划标题")
    description: Optional[str] = Field(description="规划描述")
    start_date: str = Field(description="开始日期")
    end_date: str = Field(description="结束日期")
    budget_min: int = Field(description="最小预算")
    budget_max: int = Field(description="最大预算")
    num_people: int = Field(description="出行人数")
    preferences: List[str] = Field(description="出行偏好")
    start_location: str = Field(description="出发地点")
    destination: str = Field(description="目的地")
    locations: List[LocationData] = Field(description="地点列表")
    weather: List[WeatherData] = Field(description="天气信息")

class PlanSummaryResponse(BaseModel):
    """AI总结响应模型"""
    success: bool = Field(description="是否成功")
    summary: Optional[str] = Field(description="AI生成的总结文本")
    risks: List[Dict] = Field(description="风险分析列表")
    error: Optional[str] = Field(description="错误信息")
    usage: Dict = Field(description="API使用信息")

@router.post("/plans/{plan_id}/summary", response_model=PlanSummaryResponse)
def generate_plan_summary(request: PlanSummaryRequest):
    """
    生成出行规划的AI总结
    
    参数:
        request: 包含规划详细信息的请求体
    
    返回:
        包含总结文本、风险分析的响应
    """
    
    # 构建规划数据
    plan_data = {
        'title': request.title,
        'description': request.description,
        'start_date': request.start_date,
        'end_date': request.end_date,
        'budget_min': request.budget_min,
        'budget_max': request.budget_max,
        'num_people': request.num_people,
        'preferences': request.preferences,
        'start_location': request.start_location,
        'destination': request.destination,
        'locations': [loc.dict() for loc in request.locations],
        'weather': [w.dict() for w in request.weather]
    }
    
    try:
        # 调用AI总结
        ai_result = generate_travel_summary(plan_data)
        
        # 本地风险分析
        local_risks = analyze_plan_risks(plan_data)
        
        if ai_result['success']:
            return PlanSummaryResponse(
                success=True,
                summary=ai_result['summary'],
                risks=local_risks,
                error=None,
                usage=ai_result['usage']
            )
        else:
            return PlanSummaryResponse(
                success=False,
                summary=None,
                risks=local_risks,
                error=ai_result['error'],
                usage=ai_result['usage']
            )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"生成总结失败: {str(e)}")

@router.get("/plans/{plan_id}/summary")
def get_plan_summary(plan_id: int):
    """
    获取规划的AI总结（需要先调用POST生成）
    
    参数:
        plan_id: 规划ID
    
    返回:
        规划信息（用于展示）
    """
    try:
        plan = TravelPlan.get_by_id(plan_id)
        
        # 获取关联的地点
        locations = []
        for loc in Location.select().where(Location.plan_id == plan_id):
            try:
                schedule_data = json.loads(loc.schedule) if loc.schedule else {}
            except:
                schedule_data = {}
            
            locations.append({
                'id': loc.id,
                'name': loc.name,
                'type': loc.type,
                'cost': loc.cost,
                'duration': loc.duration,
                'time_slot': schedule_data.get('time_slot', ''),
                'address': loc.address,
                'latitude': loc.latitude,
                'longitude': loc.longitude
            })
        
        return {
            'success': True,
            'plan': {
                'id': plan.id,
                'title': plan.title,
                'description': plan.description,
                'start_date': plan.start_date.isoformat(),
                'end_date': plan.end_date.isoformat(),
                'budget_min': plan.budget_min,
                'budget_max': plan.budget_max,
                'num_people': plan.num_people,
                'preferences': plan.preferences.split(',') if plan.preferences else [],
                'start_location': plan.start_location,
                'destination': plan.destination,
                'status': plan.status
            },
            'locations': locations
        }
    
    except TravelPlan.DoesNotExist:
        raise HTTPException(status_code=404, detail="规划不存在")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取规划信息失败: {str(e)}")
