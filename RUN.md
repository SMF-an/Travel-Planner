# Travel Planner 运行指南

本文档说明如何在本地运行本项目（后端 FastAPI + 前端 Vue3）。

## 1. 环境要求

- Python 3.10+
- Node.js 18+
- npm 9+

## 2. 启动后端（FastAPI）

说明：本项目统一使用 `backend/.venv` 作为唯一 Python 虚拟环境。

在 PowerShell 中执行：

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install fastapi "uvicorn[standard]" peewee pydantic requests httpx
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

后端启动后可访问：

- API 根地址: http://localhost:8000/
- 健康检查: http://localhost:8000/health
- Swagger 文档: http://localhost:8000/docs

## 3. 启动前端（Vue + Vite）

新开一个 PowerShell 窗口，执行：

```powershell
cd frontend
npm install
npm run dev
```

前端默认地址通常为：

- http://localhost:5173/

## 4. 使用说明

- 先启动后端，再启动前端。
- 前端代码中 API 地址已指向 `http://localhost:8000/api`，本地运行无需额外配置。

## 5. 常见问题

### 5.1 PowerShell 无法执行激活脚本

如果执行 `Activate.ps1` 报权限错误，可临时放开当前用户脚本策略：

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

执行后重新打开 PowerShell 再试。

### 5.2 端口被占用

- 后端可改端口：`uvicorn app.main:app --reload --port 8001`
- 如果修改了后端端口，请同步更新前端 `frontend/src/api/` 下的 API 基础地址。
