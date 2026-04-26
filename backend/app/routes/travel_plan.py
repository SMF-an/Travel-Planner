from fastapi import APIRouter, HTTPException
from app.models.travel_plan import TravelPlan, init_db
from app.schemas.travel_plan import TravelPlanCreate, TravelPlanUpdate, TravelPlanResponse
from datetime import datetime

router = APIRouter()

# 初始化数据库
init_db()

# 获取规划列表
@router.get("/plans", response_model=list[TravelPlanResponse])
def get_plans():
    plans = TravelPlan.select()
    return [
        TravelPlanResponse(
            id=plan.id,
            title=plan.title,
            description=plan.description,
            start_date=plan.start_date,
            end_date=plan.end_date,
            budget_min=plan.budget_min,
            budget_max=plan.budget_max,
            num_people=plan.num_people,
            preferences=plan.preferences.split(',') if plan.preferences else [],
            start_location=plan.start_location,
            destination=plan.destination,
            status=plan.status,
            created_at=plan.created_at,
            updated_at=plan.updated_at
        )
        for plan in plans
    ]

# 获取单个规划详情
@router.get("/plans/{plan_id}", response_model=TravelPlanResponse)
def get_plan(plan_id: int):
    try:
        plan = TravelPlan.get_by_id(plan_id)
        return TravelPlanResponse(
            id=plan.id,
            title=plan.title,
            description=plan.description,
            start_date=plan.start_date,
            end_date=plan.end_date,
            budget_min=plan.budget_min,
            budget_max=plan.budget_max,
            num_people=plan.num_people,
            preferences=plan.preferences.split(',') if plan.preferences else [],
            start_location=plan.start_location,
            destination=plan.destination,
            status=plan.status,
            created_at=plan.created_at,
            updated_at=plan.updated_at
        )
    except TravelPlan.DoesNotExist:
        raise HTTPException(status_code=404, detail="规划不存在")

# 创建新规划
@router.post("/plans", response_model=TravelPlanResponse)
def create_plan(plan: TravelPlanCreate):
    # 验证预算范围
    if plan.budget_min > plan.budget_max:
        raise HTTPException(status_code=400, detail="最小预算不能大于最大预算")
    
    # 验证日期范围
    if plan.start_date > plan.end_date:
        raise HTTPException(status_code=400, detail="开始日期不能晚于结束日期")
    
    # 创建规划
    new_plan = TravelPlan.create(
        title=plan.title,
        description=plan.description,
        start_date=plan.start_date,
        end_date=plan.end_date,
        budget_min=plan.budget_min,
        budget_max=plan.budget_max,
        num_people=plan.num_people,
        preferences=",".join(plan.preferences) if plan.preferences else None,
        start_location=plan.start_location,
        destination=plan.destination,
        status=plan.status
    )
    
    return TravelPlanResponse(
        id=new_plan.id,
        title=new_plan.title,
        description=new_plan.description,
        start_date=new_plan.start_date,
        end_date=new_plan.end_date,
        budget_min=new_plan.budget_min,
        budget_max=new_plan.budget_max,
        num_people=new_plan.num_people,
        preferences=new_plan.preferences.split(',') if new_plan.preferences else [],
        start_location=new_plan.start_location,
        destination=new_plan.destination,
        status=new_plan.status,
        created_at=new_plan.created_at,
        updated_at=new_plan.updated_at
    )

# 更新规划
@router.put("/plans/{plan_id}", response_model=TravelPlanResponse)
def update_plan(plan_id: int, plan_update: TravelPlanUpdate):
    try:
        plan = TravelPlan.get_by_id(plan_id)
        
        # 验证预算范围
        if plan_update.budget_min is not None and plan_update.budget_max is not None:
            if plan_update.budget_min > plan_update.budget_max:
                raise HTTPException(status_code=400, detail="最小预算不能大于最大预算")
        
        # 验证日期范围
        if plan_update.start_date is not None and plan_update.end_date is not None:
            if plan_update.start_date > plan_update.end_date:
                raise HTTPException(status_code=400, detail="开始日期不能晚于结束日期")
        
        # 更新字段
        update_data = plan_update.model_dump(exclude_unset=True)
        if 'preferences' in update_data:
            update_data['preferences'] = ",".join(update_data['preferences']) if update_data['preferences'] else None
        update_data['updated_at'] = datetime.now()
        
        plan.update(**update_data).execute()
        plan = TravelPlan.get_by_id(plan_id)
        
        return TravelPlanResponse(
            id=plan.id,
            title=plan.title,
            description=plan.description,
            start_date=plan.start_date,
            end_date=plan.end_date,
            budget_min=plan.budget_min,
            budget_max=plan.budget_max,
            num_people=plan.num_people,
            preferences=plan.preferences.split(',') if plan.preferences else [],
            start_location=plan.start_location,
            destination=plan.destination,
            status=plan.status,
            created_at=plan.created_at,
            updated_at=plan.updated_at
        )
    except TravelPlan.DoesNotExist:
        raise HTTPException(status_code=404, detail="规划不存在")

# 删除规划
@router.delete("/plans/{plan_id}")
def delete_plan(plan_id: int):
    try:
        plan = TravelPlan.get_by_id(plan_id)
        plan.delete_instance()
        return {"message": "规划删除成功"}
    except TravelPlan.DoesNotExist:
        raise HTTPException(status_code=404, detail="规划不存在")
