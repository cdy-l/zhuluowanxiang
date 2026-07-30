import random
from .base import BaseCrawler


class NamePickerCrawler(BaseCrawler):
    @property
    def id(self) -> str:
        return "name-picker"

    @property
    def name(self) -> str:
        return "随机点名器"

    @property
    def description(self) -> str:
        return "输入名单随机点名，支持换行/逗号/空格分隔"

    @property
    def icon(self) -> str:
        return "🎯"

    def get_info(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "category": "实用工具",
            "description": self.description,
            "icon": self.icon,
        }

    def execute(self, params: dict) -> dict:
        text = params.get("names", "").strip()
        if not text:
            return {"success": False, "error": "请输入名单"}

        import re
        names = [n.strip() for n in re.split(r"[\n,，、\s]+", text) if n.strip()]
        if not names:
            return {"success": False, "error": "未识别到有效姓名"}

        total = len(names)
        picked = random.choice(names)
        return {
            "success": True,
            "picked": picked,
            "total": total,
            "all_names": names,
        }


crawler = NamePickerCrawler()
