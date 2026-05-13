# CI/CD 自动部署文档

## 概述

本项目已配置 GitHub Actions + CloudBase CLI 实现自动部署，每次 push 代码到 `main` 分支时自动部署前端和云函数到腾讯云 CloudBase。

## 工作流配置

工作流文件：`.github/workflows/deploy.yml`

### 触发条件

- **自动触发**：推送代码到 `main` 分支
- **手动触发**：在 GitHub Actions 页面手动点击运行

### 部署流程

```
检出代码 → 设置 Node.js 环境 → 安装 CloudBase CLI → 安装前端依赖 → 构建前端 → 部署到 CloudBase
```

## 配置步骤

### 1. 获取腾讯云 API 密钥

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
2. 进入 **访问管理** → **API 密钥管理**
3. 点击 **新建密钥** 创建一对 API 密钥
4. 记录 `SecretId` 和 `SecretKey`（请妥善保管，不要泄露）

### 2. 配置 GitHub Secrets

1. 打开 GitHub 仓库页面
2. 点击 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret** 添加以下两个密钥：

| Secret 名称 | 说明 |
|------------|------|
| `CLOUDBASE_SECRETID` | 腾讯云 SecretId |
| `CLOUDBASE_SECRETKEY` | 腾讯云 SecretKey |

### 3. 测试部署

```bash
# 推送代码触发自动部署
git add .
git commit -m "Update: xxx"
git push origin main
```

## 部署内容

### 前端部署

- 构建工具：Vite
- 输出目录：`frontend/dist`
- 部署位置：CloudBase 静态网站托管根目录 `/`

### 云函数部署

| 函数名称 | 描述 |
|---------|------|
| `travel_plan` | 行程规划管理云函数 |
| `weather` | 天气服务云函数 |
| `ai_summary` | AI 总结云函数 |

## 手动触发部署

1. 进入 GitHub 仓库的 **Actions** 页面
2. 选择 **Deploy to CloudBase** 工作流
3. 点击 **Run workflow** 按钮
4. 选择目标分支（默认 main），点击 **Run workflow**

## 查看部署日志

1. 进入 GitHub 仓库的 **Actions** 页面
2. 找到对应的工作流运行记录
3. 点击进入查看详细部署日志

## 环境变量

工作流使用以下环境变量：

| 变量名 | 来源 | 用途 |
|-------|------|------|
| `CLOUDBASE_SECRETID` | GitHub Secrets | 腾讯云 API 密钥 ID |
| `CLOUDBASE_SECRETKEY` | GitHub Secrets | 腾讯云 API 密钥 |

## CloudBase 配置

部署配置文件：`cloudbaserc.json`

主要配置项：

- `envId`: CloudBase 环境 ID（已配置）
- `functionRoot`: 云函数根目录（`cloudfunctions`）
- `app.root`: 前端项目根目录（`./frontend`）
- `app.buildCommand`: 前端构建命令（`npm run build`）

## 注意事项

1. **密钥安全**：API 密钥通过 GitHub Secrets 管理，不要硬编码到代码中
2. **构建环境**：使用 Ubuntu-latest 运行器，Node.js 版本为 20
3. **依赖缓存**：使用 `actions/setup-node` 的缓存功能加速依赖安装
4. **部署范围**：`cloudbase deploy --all` 会部署前端和所有云函数

## 故障排除

### 部署失败常见原因

1. **密钥配置错误**：检查 Secrets 中的 `CLOUDBASE_SECRETID` 和 `CLOUDBASE_SECRETKEY` 是否正确
2. **云函数配置错误**：检查 `cloudbaserc.json` 中的函数配置
3. **前端构建失败**：检查 `frontend/package.json` 中的 `build` 脚本
4. **网络问题**：重试工作流或检查网络连接

### 手动测试部署

```bash
# 安装 CloudBase CLI
npm install -g @cloudbase/cli

# 登录
cloudbase login --apiKeyId <SecretId> --apiKey <SecretKey>

# 部署
cloudbase deploy --all
```

---

**最后更新时间**：2026-05-13