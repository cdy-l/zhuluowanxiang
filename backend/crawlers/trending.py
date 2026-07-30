import requests
import json
import re
from .base import BaseCrawler


class TrendingCrawler(BaseCrawler):
    @property
    def id(self) -> str:
        return "trending"

    @property
    def name(self) -> str:
        return "热搜热榜聚合"

    @property
    def description(self) -> str:
        return "聚合微博热搜、知乎热榜、百度热搜，一个页面看全网热点"

    @property
    def icon(self) -> str:
        return "🔥"

    def get_info(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "category": "内容抓取",
            "description": self.description,
            "icon": self.icon,
        }

    def _fetch_weibo(self) -> list:
        try:
            resp = requests.get(
                "https://weibo.com/ajax/side/hotSearch",
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Referer": "https://weibo.com/",
                },
                timeout=8,
            )
            data = resp.json()
            realtime = data.get("data", {}).get("realtime", [])
            results = []
            for i, item in enumerate(realtime[:30]):
                word = item.get("word", "")
                hot = item.get("raw_hot", 0) or item.get("num", 0)
                label = item.get("label_name", "")
                results.append({
                    "rank": i + 1,
                    "title": word,
                    "hot": f"{hot:,}" if hot else "",
                    "label": label,
                    "url": f"https://s.weibo.com/weibo?q={requests.utils.quote(word)}",
                })
            return results
        except Exception:
            return []

    def _fetch_zhihu(self) -> list:
        try:
            resp = requests.get(
                "https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc",
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                },
                timeout=8,
            )
            data = resp.json()
            results = []
            for i, item in enumerate(data.get("data", [])[:30]):
                title = item.get("Title", "")
                hot = item.get("HotValue", "")
                url = item.get("Url", "")
                results.append({
                    "rank": i + 1,
                    "title": title,
                    "hot": str(hot) if hot else "",
                    "url": url,
                })
            return results
        except Exception:
            return []

    def _fetch_baidu(self) -> list:
        try:
            resp = requests.get(
                "https://top.baidu.com/board?tab=realtime",
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                },
                timeout=8,
            )
            html = resp.text
            import re
            matches = re.findall(r'"word":"(.*?)"', html)
            hot_matches = re.findall(r'"hotScore":(\d+)', html)
            results = []
            for i, word in enumerate(matches[:30]):
                hot = hot_matches[i] if i < len(hot_matches) else ""
                results.append({
                    "rank": i + 1,
                    "title": word,
                    "hot": f"{int(hot):,}" if hot else "",
                    "url": f"https://www.baidu.com/s?wd={requests.utils.quote(word)}",
                })
            return results
        except Exception:
            return []

    def execute(self, params: dict) -> dict:
        platform = params.get("platform", "weibo")

        sources = {
            "weibo": ("微博热搜", "https://weibo.com/", self._fetch_weibo),
            "zhihu": ("头条热榜", "https://www.toutiao.com/", self._fetch_zhihu),
            "baidu": ("百度热搜", "https://top.baidu.com/", self._fetch_baidu),
        }

        if platform not in sources:
            return {"success": False, "error": f"不支持的热榜来源: {platform}"}

        name, url, fetcher = sources[platform]
        items = fetcher()

        if not items:
            return {"success": False, "error": f"获取{name}失败，请稍后重试"}

        return {
            "success": True,
            "platform": platform,
            "name": name,
            "source_url": url,
            "total": len(items),
            "items": items,
        }


crawler = TrendingCrawler()
