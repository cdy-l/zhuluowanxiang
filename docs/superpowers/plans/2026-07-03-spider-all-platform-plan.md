# 蛛罗万象—全场景可视化爬虫集成平台 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** V1 MVP — 后端 FastAPI + 前端科技风仪表盘 + VIP视频破解功能

**Architecture:** FastAPI 后端提供 REST API，前端纯 HTML/CSS/JS 通过 Fetch 调用 API。爬虫模块采用插件化设计，继承基类自动注册。

**Tech Stack:** Python FastAPI, Uvicorn, 纯前端 (HTML/CSS/JS)

---

### Task 1: 后端项目初始化

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/main.py`

- [ ] **Step 1: Create requirements.txt**

```txt
fastapi>=0.110.0
uvicorn>=0.29.0
```

- [ ] **Step 2: Create main.py — FastAPI 入口 + CORS + 静态文件挂载**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from crawlers import registry

app = FastAPI(title="蛛罗万象", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/crawlers")
def list_crawlers():
    return registry.get_all()


@app.get("/api/crawlers/{crawler_id}")
def get_crawler(crawler_id: str):
    return registry.get(crawler_id)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

- [ ] **Step 3: Verify server starts**

Run: `cd backend; pip install -r requirements.txt; uvicorn main:app --port 8000`
Expected: Server starts on http://localhost:8000, visit `/docs` sees Swagger UI

---

### Task 2: 爬虫基类和注册器

**Files:**
- Create: `backend/crawlers/__init__.py`
- Create: `backend/crawlers/base.py`

- [ ] **Step 1: Create base.py — 爬虫抽象基类**

```python
from abc import ABC, abstractmethod


class BaseCrawler(ABC):
    @property
    @abstractmethod
    def id(self) -> str: ...

    @property
    @abstractmethod
    def name(self) -> str: ...

    @property
    @abstractmethod
    def description(self) -> str: ...

    @property
    @abstractmethod
    def icon(self) -> str: ...

    @abstractmethod
    def get_info(self) -> dict: ...

    @abstractmethod
    def execute(self, params: dict) -> dict: ...
```

- [ ] **Step 2: Create __init__.py — 模块自动发现注册器**

```python
from .base import BaseCrawler
import importlib
import pkgutil


class CrawlerRegistry:
    def __init__(self):
        self._crawlers: dict[str, BaseCrawler] = {}

    def register(self, crawler: BaseCrawler):
        self._crawlers[crawler.id] = crawler

    def get_all(self) -> list[dict]:
        return [c.get_info() for c in self._crawlers.values()]

    def get(self, crawler_id: str) -> dict | None:
        c = self._crawlers.get(crawler_id)
        return c.get_info() if c else None

    def execute(self, crawler_id: str, params: dict) -> dict:
        c = self._crawlers.get(crawler_id)
        if not c:
            return {"error": f"Crawler '{crawler_id}' not found"}
        return c.execute(params)


def discover_crawlers():
    registry = CrawlerRegistry()
    package = __import__(__name__)
    for importer, modname, ispkg in pkgutil.iter_modules(package.__path__):
        if modname == "base" or ispkg:
            continue
        module = importlib.import_module(f".{modname}", __name__)
        if hasattr(module, "crawler"):
            registry.register(module.crawler)
    return registry


registry = discover_crawlers()
```

---

### Task 3: VIP视频破解爬虫模块

**Files:**
- Create: `backend/crawlers/vip_video.py`

- [ ] **Step 1: Create vip_video.py**

```python
import webbrowser
from .base import BaseCrawler


class VIPVideoCrawler(BaseCrawler):
    @property
    def id(self) -> str:
        return "vip-video"

    @property
    def name(self) -> str:
        return "VIP视频破解"

    @property
    def description(self) -> str:
        return "解析各大视频平台（爱奇艺、腾讯、优酷等）VIP视频，免费高清观看"

    @property
    def icon(self) -> str:
        return "🎬"

    def get_info(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "icon": self.icon,
            "platforms": [
                {"id": "iqiyi", "name": "爱奇艺", "url": "https://www.iqiyi.com"},
                {"id": "tencent", "name": "腾讯视频", "url": "https://v.qq.com"},
                {"id": "youku", "name": "优酷", "url": "https://www.youku.com"},
            ],
        }

    def execute(self, params: dict) -> dict:
        video_url = params.get("url", "")
        if not video_url:
            return {"error": "请提供视频链接"}
        parser_url = f"https://jx.xmflv.cc/?url={video_url}"
        webbrowser.open(parser_url)
        return {"success": True, "message": "已打开解析页面", "url": parser_url}


crawler = VIPVideoCrawler()
```

- [ ] **Step 2: 在 main.py 添加 VIP视频解析 API**

修改 `backend/main.py`，添加执行路由：

```python
from pydantic import BaseModel


class ExecuteParams(BaseModel):
    params: dict = {}


@app.post("/api/crawlers/{crawler_id}/execute")
def execute_crawler(crawler_id: str, body: ExecuteParams):
    return registry.execute(crawler_id, body.params)
```

完整 `main.py` 最终内容：

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from crawlers import registry

app = FastAPI(title="蛛罗万象", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ExecuteParams(BaseModel):
    params: dict = {}


@app.get("/api/crawlers")
def list_crawlers():
    return registry.get_all()


@app.get("/api/crawlers/{crawler_id}")
def get_crawler(crawler_id: str):
    return registry.get(crawler_id)


@app.post("/api/crawlers/{crawler_id}/execute")
def execute_crawler(crawler_id: str, body: ExecuteParams):
    return registry.execute(crawler_id, body.params)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

---

### Task 4: 前端 — 科技风页面结构

**Files:**
- Create: `frontend/index.html`

- [ ] **Step 1: Create index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>蛛罗万象 — 全场景可视化爬虫集成平台</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div id="particles"></div>

    <aside class="sidebar" id="sidebar">
        <div class="logo">
            <span class="logo-icon">🕷</span>
            <span class="logo-text">蛛罗万象</span>
        </div>
        <nav class="nav" id="nav">
            <a class="nav-item active" data-page="dashboard" onclick="switchPage('dashboard')">
                <span class="nav-icon">📊</span>
                <span class="nav-label">仪表盘</span>
            </a>
        </nav>
        <div class="sidebar-footer">
            <span>v1.0.0</span>
        </div>
    </aside>

    <main class="main" id="main">
        <header class="topbar">
            <button class="menu-btn" onclick="toggleSidebar()">☰</button>
            <h1 id="page-title">仪表盘</h1>
        </header>

        <div class="content" id="content">
            <!-- 仪表盘页面 -->
            <div class="page active" id="page-dashboard">
                <div class="hero">
                    <h2>欢迎来到 <span class="glow">蛛罗万象</span></h2>
                    <p class="hero-sub">全场景可视化爬虫集成平台</p>
                </div>
                <div class="crawler-grid" id="crawler-grid"></div>
            </div>

            <!-- VIP视频页面 -->
            <div class="page" id="page-vip-video">
                <div class="tool-header">
                    <h2>🎬 VIP视频破解</h2>
                    <p>支持爱奇艺、腾讯视频、优酷等平台</p>
                </div>
                <div class="tool-body">
                    <div class="platform-buttons" id="platform-buttons"></div>
                    <div class="input-group">
                        <input type="text" id="video-url" placeholder="粘贴视频链接到这里..." class="glow-input">
                        <button onclick="playVideo()" class="glow-btn">🚀 播放VIP视频</button>
                    </div>
                    <p class="hint">💡 提示：复制视频平台的页面链接，粘贴到上方输入框后点击播放</p>
                </div>
            </div>
        </div>
    </main>

    <script src="js/app.js"></script>
</body>
</html>
```

---

### Task 5: 前端 — 科技风样式

**Files:**
- Create: `frontend/css/style.css`

- [ ] **Step 1: Create style.css**

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

:root {
    --bg-primary: #0a0e1a;
    --bg-secondary: #111827;
    --bg-card: rgba(17, 24, 39, 0.8);
    --accent: #00d4ff;
    --accent-dim: rgba(0, 212, 255, 0.15);
    --text-primary: #e2e8f0;
    --text-secondary: #94a3b8;
    --border: rgba(0, 212, 255, 0.12);
    --sidebar-width: 220px;
}

body {
    font-family: 'Segoe UI', system-ui, -apple-system, 'Microsoft YaHei', sans-serif;
    background: var(--bg-primary);
    color: var(--text-primary);
    display: flex;
    min-height: 100vh;
    overflow: hidden;
}

#particles {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background:
        radial-gradient(ellipse at 20% 50%, rgba(0, 212, 255, 0.06) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 20%, rgba(0, 212, 255, 0.04) 0%, transparent 50%),
        radial-gradient(ellipse at 50% 80%, rgba(99, 102, 241, 0.04) 0%, transparent 50%);
}

/* 侧边栏 */
.sidebar {
    width: var(--sidebar-width);
    background: var(--bg-secondary);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    padding: 1.25rem;
    position: relative;
    z-index: 10;
    transition: width 0.3s, transform 0.3s;
    flex-shrink: 0;
}

.sidebar.collapsed {
    width: 60px;
}

.sidebar.collapsed .logo-text,
.sidebar.collapsed .nav-label,
.sidebar.collapsed .sidebar-footer span {
    display: none;
}

.logo {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--border);
    margin-bottom: 1.5rem;
}

.logo-icon {
    font-size: 1.5rem;
}

.logo-text {
    font-size: 1.1rem;
    font-weight: 700;
    background: linear-gradient(135deg, #00d4ff, #7c3aed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    white-space: nowrap;
}

.nav {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    flex: 1;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.625rem 0.75rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--text-secondary);
    text-decoration: none;
    white-space: nowrap;
}

.nav-item:hover {
    background: var(--accent-dim);
    color: var(--accent);
}

.nav-item.active {
    background: var(--accent-dim);
    color: var(--accent);
    box-shadow: inset 0 0 0 1px var(--accent);
}

.sidebar-footer {
    padding-top: 1rem;
    border-top: 1px solid var(--border);
    font-size: 0.75rem;
    color: var(--text-secondary);
}

/* 主内容区 */
.main {
    flex: 1;
    display: flex;
    flex-direction: column;
    position: relative;
    z-index: 10;
    overflow-y: auto;
    min-width: 0;
}

.topbar {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--border);
    background: rgba(10, 14, 26, 0.8);
    backdrop-filter: blur(10px);
    position: sticky;
    top: 0;
    z-index: 20;
}

.menu-btn {
    background: none;
    border: none;
    color: var(--text-secondary);
    font-size: 1.25rem;
    cursor: pointer;
    padding: 0.25rem;
    display: none;
}

.topbar h1 {
    font-size: 1.1rem;
    font-weight: 500;
}

.content {
    padding: 1.5rem;
    flex: 1;
}

.page {
    display: none;
    animation: fadeIn 0.3s ease;
}

.page.active {
    display: block;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* 仪表盘 */
.hero {
    text-align: center;
    padding: 2.5rem 1rem 2rem;
}

.hero h2 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
}

.glow {
    background: linear-gradient(135deg, #00d4ff, #7c3aed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: none;
    filter: drop-shadow(0 0 20px rgba(0, 212, 255, 0.3));
}

.hero-sub {
    color: var(--text-secondary);
    font-size: 1rem;
}

/* 爬虫卡片 */
.crawler-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.25rem;
    padding: 0.5rem 0;
}

.crawler-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 1.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(8px);
    position: relative;
    overflow: hidden;
}

.crawler-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
    opacity: 0;
    transition: opacity 0.3s;
}

.crawler-card:hover::before {
    opacity: 1;
}

.crawler-card:hover {
    border-color: var(--accent);
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 212, 255, 0.1);
}

.crawler-card .card-icon {
    font-size: 2rem;
    margin-bottom: 0.75rem;
}

.crawler-card .card-title {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 0.375rem;
}

.crawler-card .card-desc {
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.5;
}

/* VIP视频工具页 */
.tool-header {
    text-align: center;
    padding: 1.5rem 0;
}

.tool-header h2 {
    font-size: 1.5rem;
    margin-bottom: 0.375rem;
}

.tool-header p {
    color: var(--text-secondary);
}

.tool-body {
    max-width: 640px;
    margin: 0 auto;
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 2rem;
    backdrop-filter: blur(8px);
}

.platform-buttons {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
}

.platform-btn {
    flex: 1;
    min-width: 100px;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.03);
    color: var(--text-primary);
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
    text-align: center;
}

.platform-btn:hover {
    border-color: var(--accent);
    background: var(--accent-dim);
    color: var(--accent);
}

.input-group {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.glow-input {
    flex: 1;
    padding: 0.875rem 1rem;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.03);
    color: var(--text-primary);
    font-size: 0.9rem;
    outline: none;
    transition: all 0.3s;
}

.glow-input:focus {
    border-color: var(--accent);
    box-shadow: 0 0 20px rgba(0, 212, 255, 0.1);
}

.glow-btn {
    padding: 0.875rem 1.5rem;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, #00d4ff, #7c3aed);
    color: #fff;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    white-space: nowrap;
}

.glow-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 212, 255, 0.3);
}

.glow-btn:active {
    transform: translateY(0);
}

.hint {
    font-size: 0.8rem;
    color: var(--text-secondary);
    text-align: center;
}

/* 响应式 */
@media (max-width: 768px) {
    .sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        transform: translateX(-100%);
        z-index: 100;
        box-shadow: 4px 0 20px rgba(0, 0, 0, 0.5);
    }

    .sidebar.open {
        transform: translateX(0);
    }

    .menu-btn {
        display: block;
    }

    .input-group {
        flex-direction: column;
    }

    .crawler-grid {
        grid-template-columns: 1fr;
    }
}
```

---

### Task 6: 前端 — JavaScript 逻辑

**Files:**
- Create: `frontend/js/app.js`

- [ ] **Step 1: Create app.js**

```javascript
const API_BASE = 'http://localhost:8000';

let crawlers = [];

// 加载爬虫列表
async function loadCrawlers() {
    try {
        const res = await fetch(`${API_BASE}/api/crawlers`);
        crawlers = await res.json();
        renderCrawlerGrid();
        renderNav();
    } catch (err) {
        console.error('加载爬虫列表失败:', err);
    }
}

// 渲染爬虫卡片网格
function renderCrawlerGrid() {
    const grid = document.getElementById('crawler-grid');
    grid.innerHTML = crawlers.map(c => `
        <div class="crawler-card" onclick="switchPage('${c.id}')">
            <div class="card-icon">${c.icon}</div>
            <div class="card-title">${c.name}</div>
            <div class="card-desc">${c.description}</div>
        </div>
    `).join('');
}

// 渲染导航栏
function renderNav() {
    const nav = document.getElementById('nav');
    const extra = crawlers.map(c => `
        <a class="nav-item" data-page="${c.id}" onclick="switchPage('${c.id}')">
            <span class="nav-icon">${c.icon}</span>
            <span class="nav-label">${c.name}</span>
        </a>
    `).join('');
    nav.insertAdjacentHTML('beforeend', extra);
}

// 页面切换
function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const page = document.getElementById(`page-${pageId}`);
    const navItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);

    if (page) page.classList.add('active');
    if (navItem) navItem.classList.add('active');

    const titles = {
        'dashboard': '仪表盘',
    };
    const c = crawlers.find(c => c.id === pageId);
    document.getElementById('page-title').textContent = c ? c.name : (titles[pageId] || pageId);

    // 如果是VIP视频页，渲染平台按钮
    if (pageId === 'vip-video') {
        renderPlatformButtons();
    }
}

// 渲染平台按钮
function renderPlatformButtons() {
    const container = document.getElementById('platform-buttons');
    const vip = crawlers.find(c => c.id === 'vip-video');
    if (!vip || !vip.platforms) return;
    container.innerHTML = vip.platforms.map(p => `
        <button class="platform-btn" onclick="openPlatform('${p.url}')">
            ${p.name}
        </button>
    `).join('');
}

// 打开平台网站
function openPlatform(url) {
    window.open(url, '_blank');
}

// 播放VIP视频
async function playVideo() {
    const url = document.getElementById('video-url').value.trim();
    if (!url) {
        alert('请先粘贴视频链接');
        return;
    }
    try {
        const res = await fetch(`${API_BASE}/api/crawlers/vip-video/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ params: { url } }),
        });
        const data = await res.json();
        if (data.error) {
            alert(data.error);
        } else if (data.url) {
            window.open(data.url, '_blank');
        }
    } catch (err) {
        alert('请求失败，请确保后端服务已启动');
    }
}

// 切换侧边栏
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadCrawlers();
});
```

---

### Task 7: 验证完整流程

- [ ] **Step 1: 启动后端**

Run: `cd backend; uvicorn main:app --reload --port 8000`
Expected: 服务启动于 http://localhost:8000

- [ ] **Step 2: 验证 API**

Run: `curl http://localhost:8000/api/crawlers`
Expected: 返回包含 VIP视频破解模块信息的 JSON

- [ ] **Step 3: 打开前端**

直接用浏览器打开 `frontend/index.html`
Expected: 看到科技风深色仪表盘，显示 VIP视频破解 卡片

- [ ] **Step 4: 测试 VIP视频功能**

点击卡片进入功能页 → 粘贴视频链接 → 点击播放
Expected: 浏览器打开解析页面或提示错误
