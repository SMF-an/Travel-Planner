from fastapi import APIRouter, HTTPException
from app.models.location import Location, PlanLocation, init_location_db
from app.models.travel_plan import TravelPlan
from app.schemas.location import (
    LocationCreate, LocationUpdate, LocationResponse,
    PlanLocationCreate, PlanLocationUpdate, PlanLocationResponse,
    LocationSearchResponse
)
from datetime import datetime
import httpx

router = APIRouter()

AMAP_API_KEY = '6efba890c74d422fa53fc3c0c83ebe3b'
AMAP_SECURITY_JS_CODE = '6b26790de737459c4ca0786703fb84fe'

init_location_db()

@router.get("/plans/{plan_id}/locations", response_model=list[PlanLocationResponse])
def get_plan_locations(plan_id: int):
    try:
        plan = TravelPlan.get_by_id(plan_id)
    except TravelPlan.DoesNotExist:
        raise HTTPException(status_code=404, detail="规划不存在")

    plan_locations = PlanLocation.select().where(PlanLocation.plan_id == plan_id).order_by(PlanLocation.order_index)
    result = []
    for pl in plan_locations:
        result.append(PlanLocationResponse(
            id=pl.id,
            plan_id=pl.plan_id,
            location=LocationResponse(
                id=pl.location.id,
                name=pl.location.name,
                address=pl.location.address,
                latitude=pl.location.latitude,
                longitude=pl.location.longitude,
                description=pl.location.description,
                order_index=pl.location.order_index,
                created_at=pl.location.created_at
            ),
            order_index=pl.order_index,
            visit_date=pl.visit_date,
            notes=pl.notes,
            created_at=pl.created_at
        ))
    return result

@router.post("/plans/{plan_id}/locations", response_model=PlanLocationResponse)
def add_location_to_plan(plan_id: int, location_data: LocationCreate):
    try:
        plan = TravelPlan.get_by_id(plan_id)
    except TravelPlan.DoesNotExist:
        raise HTTPException(status_code=404, detail="规划不存在")

    location = Location.create(
        name=location_data.name,
        address=location_data.address,
        latitude=location_data.latitude,
        longitude=location_data.longitude,
        description=location_data.description
    )

    max_order = PlanLocation.select().where(PlanLocation.plan_id == plan_id).count()
    plan_location = PlanLocation.create(
        plan_id=plan_id,
        location=location,
        order_index=max_order
    )

    return PlanLocationResponse(
        id=plan_location.id,
        plan_id=plan_location.plan_id,
        location=LocationResponse(
            id=location.id,
            name=location.name,
            address=location.address,
            latitude=location.latitude,
            longitude=location.longitude,
            description=location.description,
            order_index=location.order_index,
            created_at=location.created_at
        ),
        order_index=plan_location.order_index,
        visit_date=plan_location.visit_date,
        notes=plan_location.notes,
        created_at=plan_location.created_at
    )

@router.put("/plan-locations/{plan_location_id}", response_model=PlanLocationResponse)
def update_plan_location(plan_location_id: int, update_data: PlanLocationUpdate):
    try:
        plan_location = PlanLocation.get_by_id(plan_location_id)
    except PlanLocation.DoesNotExist:
        raise HTTPException(status_code=404, detail="规划地点不存在")

    if update_data.order_index is not None:
        plan_location.order_index = update_data.order_index
    if update_data.visit_date is not None:
        plan_location.visit_date = update_data.visit_date
    if update_data.notes is not None:
        plan_location.notes = update_data.notes

    plan_location.save()

    return PlanLocationResponse(
        id=plan_location.id,
        plan_id=plan_location.plan_id,
        location=LocationResponse(
            id=plan_location.location.id,
            name=plan_location.location.name,
            address=plan_location.location.address,
            latitude=plan_location.location.latitude,
            longitude=plan_location.location.longitude,
            description=plan_location.location.description,
            order_index=plan_location.location.order_index,
            created_at=plan_location.location.created_at
        ),
        order_index=plan_location.order_index,
        visit_date=plan_location.visit_date,
        notes=plan_location.notes,
        created_at=plan_location.created_at
    )

@router.delete("/plan-locations/{plan_location_id}")
def delete_plan_location(plan_location_id: int):
    try:
        plan_location = PlanLocation.get_by_id(plan_location_id)
    except PlanLocation.DoesNotExist:
        raise HTTPException(status_code=404, detail="规划地点不存在")

    plan_location.location.delete_instance()
    plan_location.delete_instance()

    return {"message": "删除成功"}

@router.put("/plans/{plan_id}/locations/reorder")
def reorder_locations(plan_id: int, location_ids: list[int]):
    try:
        plan = TravelPlan.get_by_id(plan_id)
    except TravelPlan.DoesNotExist:
        raise HTTPException(status_code=404, detail="规划不存在")

    for index, loc_id in enumerate(location_ids):
        try:
            plan_location = PlanLocation.get((PlanLocation.plan_id == plan_id) & (PlanLocation.id == loc_id))
            plan_location.order_index = index
            plan_location.save()
        except PlanLocation.DoesNotExist:
            raise HTTPException(status_code=404, detail=f"规划地点 {loc_id} 不存在")

    return {"message": "排序更新成功"}

@router.get("/locations/search", response_model=list[LocationSearchResponse])
async def search_locations(keywords: str):
    if not keywords or len(keywords.strip()) < 2:
        raise HTTPException(status_code=400, detail="搜索关键词至少需要2个字符")

    url = "https://restapi.amap.com/v3/place/text"
    params = {
        "key": AMAP_API_KEY,
        "keywords": keywords,
        "city": "全国",
        "offset": 20,
        "page": 1,
        "output": "json"
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10.0)
            data = response.json()

        if data.get("status") != "1":
            raise HTTPException(status_code=502, detail="地图服务查询失败")

        pois = data.get("pois", [])
        results = []
        for poi in pois:
            location_str = poi.get("location", "")
            if location_str:
                lng, lat = location_str.split(",")
                results.append(LocationSearchResponse(
                    name=poi.get("name", ""),
                    address=poi.get("address", ""),
                    latitude=float(lat),
                    longitude=float(lng)
                ))

        return results
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="地图服务请求超时")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"地图服务错误: {str(e)}")

@router.get("/geocode", response_model=LocationSearchResponse)
async def geocode(address: str):
    if not address or len(address.strip()) < 2:
        raise HTTPException(status_code=400, detail="地址至少需要2个字符")

    url = "https://restapi.amap.com/v3/geocode/geo"
    params = {
        "key": AMAP_API_KEY,
        "address": address,
        "output": "json"
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10.0)
            data = response.json()

        if data.get("status") != "1":
            raise HTTPException(status_code=502, detail="地理编码服务查询失败")

        geocodes = data.get("geocodes", [])
        if not geocodes:
            raise HTTPException(status_code=404, detail="未找到该地址")

        first_result = geocodes[0]
        location_str = first_result.get("location", "")
        lng, lat = location_str.split(",")

        return LocationSearchResponse(
            name=address,
            address=first_result.get("formatted_address", address),
            latitude=float(lat),
            longitude=float(lng)
        )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="地理编码服务请求超时")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"地理编码服务错误: {str(e)}")