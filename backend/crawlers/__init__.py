from .base import BaseCrawler
import importlib
import pkgutil


class CrawlerRegistry:
    def __init__(self):
        self._crawlers: dict[str, BaseCrawler] = {}

    def register(self, crawler: BaseCrawler):
        self._crawlers[crawler.id] = crawler

    def get_all(self) -> list[dict]:
        category_order = ["音影娱乐", "实用工具", "内容抓取", "休闲娱乐"]
        crawler_order = {
            "音影娱乐": ["vip-video", "vip-music", "movie-info", "steam-deals"],
            "实用工具": ["ai-tools", "name-picker", "today-in-history"],
            "内容抓取": ["novel", "price-compare", "trending"],
            "休闲娱乐": ["mini-games"],
        }
        items = [c.get_info() for c in self._crawlers.values()]
        items.sort(key=lambda x: (
            category_order.index(x["category"]) if x["category"] in category_order else 999,
            crawler_order.get(x["category"], []).index(x["id"]) if x["id"] in crawler_order.get(x["category"], []) else 999,
        ))
        return items

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
    for importer, modname, ispkg in pkgutil.iter_modules(__path__):
        if modname == "base" or ispkg:
            continue
        module = importlib.import_module(f".{modname}", __name__)
        if hasattr(module, "crawler"):
            registry.register(module.crawler)
    return registry


registry = discover_crawlers()
