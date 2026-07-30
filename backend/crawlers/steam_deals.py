import requests
import re
import json
from .base import BaseCrawler

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://store.steampowered.com/",
}


class SteamDealsCrawler(BaseCrawler):
    @property
    def id(self) -> str:
        return "steam-deals"

    @property
    def name(self) -> str:
        return "Steam游戏折扣"

    @property
    def description(self) -> str:
        return "Steam特惠游戏列表，折扣力度一目了然"

    @property
    def icon(self) -> str:
        return "🎮"

    def get_info(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "icon": self.icon,
            "category": "音影娱乐",
        }

    def _fetch_specials(self) -> list:
        resp = requests.get(
            "https://store.steampowered.com/api/featuredcategories?cc=cn&l=zh&specials=1",
            headers=HEADERS,
            timeout=10,
        )
        data = resp.json()
        specials = data.get("specials", {}).get("items", [])
        results = []
        for item in specials[:20]:
            name = item.get("name", "")
            original = item.get("original_price", 0)
            final = item.get("final_price", 0)
            discount = item.get("discount_percent", 0)
            appid = item.get("id", "")
            results.append({
                "title": name,
                "original": f"¥{original/100:.2f}" if original else "",
                "final": f"¥{final/100:.2f}" if final else "",
                "discount": f"-{discount}%" if discount else "",
                "url": f"https://store.steampowered.com/app/{appid}" if appid else "",
                "img": item.get("header_image", f"https://steamcdn-a.akamaihd.net/steam/apps/{appid}/header.jpg") if appid else "",
            })
        return results

    def _fetch_top_sellers(self) -> list:
        resp = requests.get(
            "https://store.steampowered.com/api/featuredcategories?cc=cn&l=zh",
            headers=HEADERS,
            timeout=10,
        )
        data = resp.json()
        sellers = data.get("top_sellers", {}).get("items", [])
        results = []
        for item in sellers[:20]:
            name = item.get("name", "")
            original = item.get("original_price", 0)
            final = item.get("final_price", 0)
            discount = item.get("discount_percent", 0)
            appid = item.get("id", "")
            results.append({
                "title": name,
                "original": f"¥{original/100:.2f}" if original else "",
                "final": f"¥{final/100:.2f}" if final else "",
                "discount": f"-{discount}%" if discount else "",
                "url": f"https://store.steampowered.com/app/{appid}" if appid else "",
                "img": item.get("header_image", f"https://steamcdn-a.akamaihd.net/steam/apps/{appid}/header.jpg") if appid else "",
            })
        return results

    def execute(self, params: dict) -> dict:
        tab = params.get("tab", "specials")

        sources = {
            "specials": ("Steam特惠", self._fetch_specials),
            "top": ("热销商品", self._fetch_top_sellers),
        }

        if tab not in sources:
            tab = "specials"
        name, fetcher = sources[tab]
        items = fetcher()

        if not items:
            return {"success": False, "error": "获取Steam列表失败"}

        return {
            "success": True,
            "tab": tab,
            "name": name,
            "total": len(items),
            "items": items,
        }


crawler = SteamDealsCrawler()
