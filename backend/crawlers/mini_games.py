from .base import BaseCrawler


class MiniGamesCrawler(BaseCrawler):
    @property
    def id(self) -> str:
        return "mini-games"

    @property
    def name(self) -> str:
        return "小游戏合集"

    @property
    def description(self) -> str:
        return "贪吃蛇·打砖块·扫雷·2048·俄罗斯方块"

    @property
    def icon(self) -> str:
        return "🎮"

    def get_info(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "category": "休闲娱乐",
            "description": self.description,
            "icon": self.icon,
        }

    def execute(self, params: dict) -> dict:
        return {"success": True, "message": "游戏模块已加载"}


crawler = MiniGamesCrawler()
