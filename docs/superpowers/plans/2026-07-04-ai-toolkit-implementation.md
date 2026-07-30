# AI内容工具箱 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在蛛罗万象平台新增 AI 内容工具箱模块（智能摘要/翻译/润色/关键词/续写），调用通义千问 API

**Architecture:** 后端新建 `ai_tools.py` crawler，通过 HTTP 调用 DashScope API；前端一个页面多Tab切换，API Key 存入 localStorage

**Tech Stack:** Python + requests, FastAPI, 通义千问 qwen-turbo, vanilla JS

---

### Task 1: 创建后端 crawler — ai_tools.py

**Files:**
- Create: `backend/crawlers/ai_tools.py`

- [ ] **Step 1: 创建 ai_tools.py**

```python
import requests
from .base import BaseCrawler


SYSTEM_PROMPT = "你是一个有用的中文AI助手，请根据用户指令准确执行任务。"

PROMPTS = {
    "summary": "请对以下文本生成简洁的摘要，保留核心信息，不超过200字：\n\n{text}",
    "translate": "请将以下文本翻译成{target_language}，保持原意和语气，只返回翻译结果：\n\n{text}",
    "polish": "请优化以下文本，修正语法和表达，使语言更流畅自然，只返回优化后的文本：\n\n{text}",
    "keywords": "请从以下文本中提取5-10个核心关键词，以逗号分隔返回，只返回关键词：\n\n{text}",
    "continue": "请根据以下开头，继续写一段连贯的文字，保持风格一致：\n\n{text}",
}

DASHSCOPE_URL = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation"


class AIToolsCrawler(BaseCrawler):
    @property
    def id(self) -> str:
        return "ai-tools"

    @property
    def name(self) -> str:
        return "AI内容工具箱"

    @property
    def description(self) -> str:
        return "智能摘要、翻译、润色、关键词提取、文章续写 — 通义千问AI驱动"

    @property
    def icon(self) -> str:
        return "🤖"

    def get_info(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "icon": self.icon,
        }

    def execute(self, params: dict) -> dict:
        api_key = params.get("api_key", "").strip()
        action = params.get("action", "")
        text = params.get("text", "").strip()

        if not api_key:
            return {"success": False, "action": action, "error": "请先设置 API Key"}
        if not action:
            return {"success": False, "action": action, "error": "请选择工具"}
        if not text:
            return {"success": False, "action": action, "error": "请输入文本"}

        if action not in PROMPTS:
            return {"success": False, "action": action, "error": f"未知工具: {action}"}

        prompt_template = PROMPTS[action]
        target_language = params.get("target_language", "英文")
        prompt = prompt_template.format(text=text, target_language=target_language)

        return self._call_dashscope(api_key, action, prompt)

    def _call_dashscope(self, api_key: str, action: str, prompt: str) -> dict:
        try:
            resp = requests.post(
                DASHSCOPE_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "qwen-turbo",
                    "input": {
                        "messages": [
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": prompt},
                        ]
                    },
                    "parameters": {
                        "temperature": 0.7,
                        "max_tokens": 2000,
                    },
                },
                timeout=30,
            )
            data = resp.json()
            if resp.status_code != 200:
                err_msg = data.get("message", data.get("code", f"HTTP {resp.status_code}"))
                return {"success": False, "action": action, "error": f"API 错误: {err_msg}"}

            output = data.get("output", {})
            result = output.get("text", "")
            if not result:
                choices = output.get("choices", [])
                if choices:
                    result = choices[0].get("message", {}).get("content", "")

            return {"success": True, "action": action, "result": result.strip()}

        except requests.exceptions.Timeout:
            return {"success": False, "action": action, "error": "请求超时，请检查网络后重试"}
        except Exception as e:
            return {"success": False, "action": action, "error": f"请求失败: {str(e)}"}


crawler = AIToolsCrawler()
```

### Task 2: 注册 ai-tools 到 crawler 排序列表

**Files:**
- Modify: `backend/crawlers/__init__.py:14`

- [ ] **Step 1: 在 crawler_order 中添加 "ai-tools"**

修改第14行，在末尾添加 `"ai-tools"`：
```python
crawler_order = ["vip-video", "vip-music", "novel", "price-compare", "ai-tools"]
```

### Task 3: 前端 HTML — 添加 AI工具箱页面

**Files:**
- Modify: `frontend/index.html`

- [ ] **Step 1: 在商品比价页面之后、使用教程页面之前添加 page-ai-tools**

在 `index.html` 中，找到 `<!-- 商品比价页面 -->` 的结束 `</div>` 之后，`<!-- 使用教程页面 -->` 之前，添加：

```html
            <!-- AI内容工具箱页面 -->
            <div class="page" id="page-ai-tools">
                <div class="tool-header">
                    <h2>🤖 AI内容工具箱</h2>
                    <p>智能摘要 · 翻译 · 润色 · 关键词 · 续写 — 通义千问驱动</p>
                </div>
                <div class="tool-body">
                    <div class="ai-key-row">
                        <input type="password" id="ai-api-key" placeholder="输入通义千问 API Key..." class="glow-input" style="flex:1">
                        <button onclick="saveApiKey()" class="glow-btn" style="padding:0.875rem 1rem;font-size:0.8rem">💾 保存 Key</button>
                    </div>
                    <div class="ai-tab-bar" id="ai-tab-bar">
                        <button class="ai-tab active" data-action="summary" onclick="switchTool('summary')">📝 摘要</button>
                        <button class="ai-tab" data-action="translate" onclick="switchTool('translate')">🌐 翻译</button>
                        <button class="ai-tab" data-action="polish" onclick="switchTool('polish')">✨ 润色</button>
                        <button class="ai-tab" data-action="keywords" onclick="switchTool('keywords')">🏷️ 关键词</button>
                        <button class="ai-tab" data-action="continue" onclick="switchTool('continue')">✏️ 续写</button>
                    </div>
                    <div class="ai-extra" id="ai-extra" style="display:none;margin-bottom:0.75rem">
                        <label style="color:var(--text-secondary);font-size:0.85rem;margin-right:0.5rem">目标语言：</label>
                        <select id="ai-target-lang" class="glow-input" style="flex:1;max-width:200px;padding:0.5rem">
                            <option value="英文">英文</option>
                            <option value="中文">中文</option>
                            <option value="日文">日文</option>
                            <option value="韩文">韩文</option>
                            <option value="法文">法文</option>
                            <option value="德文">德文</option>
                            <option value="西班牙文">西班牙文</option>
                        </select>
                    </div>
                    <div class="input-group" style="flex-direction:column">
                        <textarea id="ai-input" class="glow-input" rows="6" placeholder="请输入要处理的文本..." style="resize:vertical;min-height:120px;font-family:inherit;line-height:1.6"></textarea>
                        <button onclick="executeTool()" class="glow-btn" id="ai-execute-btn">🚀 执行</button>
                    </div>
                    <div id="ai-result" style="display:none;margin-top:1rem;padding:1rem;background:rgba(0,212,255,0.03);border:1px solid var(--border);border-radius:10px;line-height:1.8;white-space:pre-wrap"></div>
                    <p class="hint" style="margin-top:0.75rem">💡 需先到 <a href="https://help.aliyun.com/zh/model-studio/getting-started/first-api-call-to-qwen" target="_blank" style="color:var(--accent)">阿里云DashScope</a> 获取 API Key</p>
                </div>
            </div>
```

### Task 4: 前端 CSS — AI 工具样式

**Files:**
- Modify: `frontend/css/style.css`

- [ ] **Step 1: 在文件末尾添加 AI 工具相关样式**

```css
/* AI工具箱 */
.ai-key-row {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.ai-tab-bar {
    display: flex;
    gap: 0.375rem;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
}

.ai-tab {
    flex: 1;
    min-width: 72px;
    padding: 0.6rem 0.5rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.02);
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 500;
    transition: all 0.2s;
    text-align: center;
}

.ai-tab:hover {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-dim);
}

.ai-tab.active {
    border-color: var(--accent);
    color: #fff;
    background: linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2));
    box-shadow: 0 0 12px rgba(0,212,255,0.15);
}

#ai-input {
    width: 100%;
}

#ai-result.loading {
    opacity: 0.6;
}

#ai-result.loading::after {
    content: '⏳ AI思考中...';
    display: block;
    text-align: center;
    color: var(--accent);
    padding: 1rem;
}
```

### Task 5: 前端 JS — AI 工具逻辑

**Files:**
- Modify: `frontend/js/app.js`

- [ ] **Step 1: 在文件末尾（`loadCrawlers` 之后）添加 AI 工具函数**

```javascript
// -------- AI内容工具箱 --------
const TOOL_PLACEHOLDERS = {
    summary: '请输入要生成摘要的长文本...',
    translate: '请输入要翻译的文本...',
    polish: '请输入要润色优化的文本...',
    keywords: '请输入要提取关键词的文本...',
    continue: '请输入文章开头，AI 将帮你续写...',
};

function switchTool(action) {
    document.querySelectorAll('.ai-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.ai-tab[data-action="${action}"]`).classList.add('active');

    const input = document.getElementById('ai-input');
    input.placeholder = TOOL_PLACEHOLDERS[action] || '请输入文本...';

    const extra = document.getElementById('ai-extra');
    extra.style.display = action === 'translate' ? 'flex' : 'none';
}

function saveApiKey() {
    const key = document.getElementById('ai-api-key').value.trim();
    if (!key) { alert('请输入 API Key'); return; }
    localStorage.setItem('dashscope_api_key', key);
    alert('✅ API Key 已保存到本地');
}

async function executeTool() {
    const apiKey = localStorage.getItem('dashscope_api_key') || document.getElementById('ai-api-key').value.trim();
    const activeTab = document.querySelector('.ai-tab.active');
    const action = activeTab ? activeTab.dataset.action : 'summary';
    const text = document.getElementById('ai-input').value.trim();
    const resultDiv = document.getElementById('ai-result');

    if (!apiKey) { alert('请先输入并保存 API Key'); return; }
    if (!text) { alert('请输入文本'); return; }

    const btn = document.getElementById('ai-execute-btn');
    btn.textContent = '⏳ 执行中...';
    btn.disabled = true;
    resultDiv.style.display = 'block';
    resultDiv.className = 'loading';
    resultDiv.textContent = '';

    try {
        const params = { api_key: apiKey, action, text };
        if (action === 'translate') {
            params.target_language = document.getElementById('ai-target-lang').value;
        }

        const res = await fetch('/api/crawlers/ai-tools/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ params }),
        });
        const data = await res.json();

        if (data.success) {
            resultDiv.className = '';
            resultDiv.textContent = data.result;
        } else {
            resultDiv.className = '';
            resultDiv.innerHTML = `<p style="color:#ff6b6b">❌ ${data.error || '处理失败'}</p>`;
        }
    } catch (err) {
        resultDiv.className = '';
        resultDiv.innerHTML = '<p style="color:#ff6b6b">❌ 请求失败，请确保后端服务已启动</p>';
    }

    btn.textContent = '🚀 执行';
    btn.disabled = false;
}
```

### Task 6: 更新 PROJECT_STATE.md

**Files:**
- Modify: `PROJECT_STATE.md`

- [ ] **Step 1: 在 crawlers 结构图中添加 ai_tools.py**

修改 `PROJECT_STATE.md` 第24行附近的 crawlers 列表：
```markdown
    ├── price_compare.py       # 商品比价（演示数据）
    └── ai_tools.py            # AI内容工具箱（通义千问）
```

- [ ] **Step 2: 在功能列表和已知问题中添加 AI 工具箱相关**

在第50行附近添加：
```
5. **AI内容工具箱** — 智能摘要、翻译、润色、关键词提取、文章续写
```

在第55行附近添加已知问题：
```
- AI内容工具箱需自行申请通义千问 API Key，前端页面输入保存
```

- [ ] **Step 3: 更新最新修改日期**
```
## 最新修改（2026-07-04）
- 新增 AI内容工具箱：5个AI工具，通义千问驱动
```

### Task 7: 验证

- [ ] **Step 1: 重启后端服务**

```powershell
# 先停止当前进程
Stop-Process -Id 27196 -Force
# 重新启动
Set-Location -LiteralPath "C:\Users\chang'dong'yu\Desktop\大三下小学期\code\backend"
uvicorn main:app --host 0.0.0.0 --port 8000
```

- [ ] **Step 2: 验证 API 返回**

```powershell
curl.exe -s http://127.0.0.1:8000/api/crawlers
```

预期输出应包含 `ai-tools` 条目。

- [ ] **Step 3: 验证前端页面**

浏览器打开 `http://127.0.0.1:8000`，确认：
- 仪表盘显示"AI内容工具箱"卡片
- 点击进入可看到 5 个 Tab
- 可输入 API Key 并保存
- 功能页面正常显示
