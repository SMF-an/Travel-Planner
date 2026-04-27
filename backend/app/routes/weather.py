from fastapi import APIRouter, HTTPException, Query
from app.utils import WeatherService

router = APIRouter()
weather_service = WeatherService()

@router.get("/weather/current")
def get_current_weather(
    lat: float = Query(..., description="纬度"),
    lon: float = Query(..., description="经度")
):
    """获取实时天气数据"""
    try:
        weather_data = weather_service.get_current_weather(lat, lon)
        if 'error' in weather_data:
            raise HTTPException(status_code=400, detail=weather_data['error']['detail'])
        return weather_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取天气数据失败: {str(e)}")

@router.get("/weather/hourly")
def get_hourly_weather(
    lat: float = Query(..., description="纬度"),
    lon: float = Query(..., description="经度")
):
    """获取24小时逐小时天气预报"""
    try:
        weather_data = weather_service.get_hourly_weather(lat, lon)
        if 'error' in weather_data:
            raise HTTPException(status_code=400, detail=weather_data['error']['detail'])
        return weather_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取天气数据失败: {str(e)}")

@router.get("/weather/daily")
def get_daily_weather(
    lat: float = Query(..., description="纬度"),
    lon: float = Query(..., description="经度")
):
    """获取7天天气预报"""
    try:
        weather_data = weather_service.get_daily_weather(lat, lon)
        if 'error' in weather_data:
            raise HTTPException(status_code=400, detail=weather_data['error']['detail'])
        return weather_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取天气数据失败: {str(e)}")

@router.get("/weather/summary")
def get_weather_summary(
    lat: float = Query(..., description="纬度"),
    lon: float = Query(..., description="经度")
):
    """获取天气摘要"""
    try:
        weather_data = weather_service.get_current_weather(lat, lon)
        if 'error' in weather_data:
            raise HTTPException(status_code=400, detail=weather_data['error']['detail'])
        summary = weather_service.get_weather_summary(weather_data)
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取天气数据失败: {str(e)}")
