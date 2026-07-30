# AI内容工具箱 — 设计文档

## 概述
在「蛛罗万象」平台中新增 AI 内容工具箱模块，集成五个实用 AI 工具：智能摘要、智能翻译、文本润色、关键词提取、文章续写。调用阿里通义千问 API（DashScope），API Key 由前端页面输入管理。

## 后端设计

### 新文件: `backend/crawlers/ai_tools.py`

继承 `BaseCrawler`，一个 crawler 处理所有 AI 子功能。

**参数:**
- `api_key` (str): 通义千问 API Key
- `action` (str): 子功能标识 `summary` / `translate` / `polish` / `keywords` / `continue`
- `text` (str): 输入文本
- `target_language` (str, 可选): 翻译目标语言，仅 `translate` 时使用

**调用通义千问 API:**
- 地址: `POST https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation`
- 模型: `qwen-turbo`
- 认证: `Authorization: Bearer {api_key}`
- 请求体格式:
```json
{
  "model": "qwen-turbo",
  "input": {
    "messages": [
      {"role": "system", "content": "你是一个有用的AI助手。"},
      {"role": "user", "content": "带指令的prompt + 用户文本"}
    ]
  },
  "parameters": {
    "temperature": 0.7,
    "max_tokens": 2000
  }
}
```

**各工具对应 Prompt:**

| action | Prompt 指令 |
|--------|------------|
| summary | "请对以下文本生成简洁的摘要，保留核心信息，不超过200字：\n\n{text}" |
| translate | "请将以下文本翻译成{target_language}，保持原意和语气：\n\n{text}" |
| polish | "请优化以下文本，修正语法和表达，使语言更流畅自然：\n\n{text}" |
| keywords | "请从以下文本中提取5-10个核心关键词，以逗号分隔返回：\n\n{text}" |
| continue | "请根据以下开头，继续写一段连贯的文字，保持风格一致：\n\n{text}" |

**返回格式:**
```json
{
  "success": true,
  "action": "summary",
  "result": "AI 生成的文本内容"
}
```

错误时返回:
```json
{
  "success": false,
  "action": "summary",
  "error": "错误描述"
}
```

### 修改: `backend/crawlers/__init__.py`

在 `crawler_order` 列表末尾添加 `"ai-tools"`。

## 前端设计

### 修改: `frontend/index.html`

新增 `page-ai-tools` 页面，包含:
- API Key 设置行（输入框 + 保存按钮）
- Tab 栏：五个工具 Tab
- 输入区域：多行文本框（带 placeholder 根据当前 tab 变化）
- 翻译时额外显示目标语言下拉选择
- 结果区域：显示 AI 返回结果或 loading

### 修改: `frontend/js/app.js`

新增函数:
- `switchTool(action)` — Tab 切换，更新输入框占位符和额外控件
- `executeTool()` — 读取输入和 API Key，调用后端 API
- API Key 保存到 `localStorage`，刷新后保留

### 修改: `frontend/css/style.css`

新增样式:
- `.ai-tab-bar` — Tab 导航栏
- `.ai-tab` — 单个 Tab
- `.ai-tab.active` — 选中 Tab
- `.ai-input-area` — 输入文本框
- `.ai-result` — 结果区域

## 数据流

```
用户输入文本 + 选择工具 → 点击执行
  → fetch POST /api/crawlers/ai-tools/execute
    → backend 调用通义千问 API
      → AI 返回结果
    → backend 返回给前端
  → 前端展示结果
```

## 错误处理
- API Key 为空 → 前端提示"请先设置 API Key"
- 输入文本为空 → 前端提示"请输入文本"
- API 调用失败 → 显示后端返回的错误信息
- 网络超时 → 提示"请求超时，请重试"

## 后续可扩展
- 更多 AI 工具（代码解释、情感分析、文本分类）
- 历史记录保存
- 切换不同模型（qwen-plus / qwen-max）
