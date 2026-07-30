import os
import json
import requests
from .base import BaseCrawler

import datetime

SYSTEM_PROMPT = f"你是一个有用的AI助手，名字叫蛛罗万象。当前日期和时间是：{datetime.datetime.now().strftime('%Y年%m月%d日 %H:%M:%S')}。请用中文回答用户的问题，回答简洁准确。不要透露你的技术实现细节。"
DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions"
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")


class AIToolsCrawler(BaseCrawler):
    @property
    def id(self) -> str:
        return "ai-tools"

    @property
    def name(self) -> str:
        return "AI智能助手"

    @property
    def description(self) -> str:
        return "与 DeepSeek AI 直接对话，解答问题、处理文本"

    @property
    def icon(self) -> str:
        return "🤖"

    def get_info(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "category": "实用工具",
            "description": self.description,
            "icon": self.icon,
        }

    def execute(self, params: dict) -> dict:
        messages = params.get("messages", [])
        if not messages:
            return {"success": False, "error": "请输入消息"}

        if not DEEPSEEK_API_KEY:
            return {"success": False, "error": "AI 功能未配置 API Key，请在 Railway 环境变量中设置 DEEPSEEK_API_KEY"}

        full_messages = [{"role": "system", "content": SYSTEM_PROMPT}] + messages

        try:
            resp = requests.post(
                DEEPSEEK_URL,
                headers={
                    "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "deepseek-chat",
                    "messages": full_messages,
                    "temperature": 0.7,
                    "max_tokens": 2000,
                },
                timeout=30,
            )
            data = resp.json()
            if resp.status_code != 200:
                err_msg = data.get("error", {}).get("message", f"HTTP {resp.status_code}")
                return {"success": False, "error": f"API 错误: {err_msg}"}

            choices = data.get("choices", [])
            if not choices:
                return {"success": False, "error": "AI 返回为空"}

            result = choices[0].get("message", {}).get("content", "")
            return {"success": True, "result": result.strip()}

        except requests.exceptions.Timeout:
            return {"success": False, "error": "请求超时，请检查网络后重试"}
        except json.JSONDecodeError:
            return {"success": False, "error": "AI 服务返回异常，请稍后重试"}
        except Exception as e:
            return {"success": False, "error": f"请求失败: {str(e)}"}


crawler = AIToolsCrawler()
