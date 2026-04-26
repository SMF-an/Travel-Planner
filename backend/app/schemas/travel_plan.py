from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import List, Optional, Literal

# 规划状态类型
PlanStatus = Literal['draft', 'in_progress', 'completed', 'archived']

# 出行偏好类型
TravelPreference = Literal['自然风光', '历史文化', '美食体验', '休闲购物', '探险活动', '休闲放松']

# 创建规划请求模型
class TravelPlanCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    start_date: date
    end_date: date
    budget_min: int = Field(..., ge=0)
    budget_max: int = Field(..., ge=0)
    num_people: int = Field(..., ge=1)
    preferences: List[str] = []
    start_location: str = Field(..., min_length=1, max_length=255)
    destination: str = Field(..., min_length=1, max_length=255)
    status: Optional[PlanStatus] = 'draft'

# 更新规划请求模型
class TravelPlanUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget_min: Optional[int] = Field(None, ge=0)
    budget_max: Optional[int] = Field(None, ge=0)
    num_people: Optional[int] = Field(None, ge=1)
    preferences: Optional[List[str]] = None
    start_location: Optional[str] = Field(None, min_length=1, max_length=255)
    destination: Optional[str] = Field(None, min_length=1, max_length=255)
    status: Optional[PlanStatus] = None

# 规划响应模型
class TravelPlanResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    start_date: date
    end_date: date
    budget_min: int
    budget_max: int
    num_people: int
    preferences: List[str]
    start_location: str
    destination: str
    status: PlanStatus
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
