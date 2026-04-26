from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import travel_plan

app = FastAPI(
    title="Travel Planner API",
    description="智能出行规划器API",
    version="1.0.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该设置具体的前端域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(travel_plan.router, prefix="/api", tags=["travel_plans"])

# 根路径
@app.get("/")
def read_root():
    return {"message": "Welcome to Travel Planner API"}

# 健康检查
@app.get("/health")
def health_check():
    return {"status": "healthy"}
