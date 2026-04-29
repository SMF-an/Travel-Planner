from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import travel_plan, location, weather, ai_summary

app = FastAPI(
    title="Travel Planner API",
    description="智能出行规划器API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(travel_plan.router, prefix="/api", tags=["travel_plans"])
app.include_router(location.router, prefix="/api", tags=["locations"])
app.include_router(weather.router, prefix="/api", tags=["weather"])
app.include_router(ai_summary.router, prefix="/api", tags=["ai_summary"])

# 根路径
@app.get("/")
def read_root():
    return {"message": "Welcome to Travel Planner API"}

# 健康检查
@app.get("/health")
def health_check():
    return {"status": "healthy"}
