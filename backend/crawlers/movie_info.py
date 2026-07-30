import requests
from parsel import Selector
from .base import BaseCrawler

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://movie.douban.com/",
    "Accept-Language": "zh-CN,zh;q=0.9",
}


class MovieInfoCrawler(BaseCrawler):
    @property
    def id(self) -> str:
        return "movie-info"

    @property
    def name(self) -> str:
        return "影视资讯"

    @property
    def description(self) -> str:
        return "豆瓣热门电影排行榜、评分和简介"

    @property
    def icon(self) -> str:
        return "🎬"

    def get_info(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "icon": self.icon,
            "category": "音影娱乐",
        }

    def _fetch_movie_list(self, url: str, selector: str) -> list:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        sel = Selector(resp.text)
        items = sel.css(selector)
        results = []
        for item in items[:12]:
            title = item.css("img::attr(alt)").get() or item.attrib.get("title", "")
            img = item.css("img::attr(src)").get() or ""
            detail_url = item.css("a::attr(href)").get() or ""
            rating = item.css(".rating_nums::text").get() or item.xpath(".//span[@class='rating_nums']/text()").get() or ""
            rating = rating.strip()
            desc = item.xpath(".//p[@class='pl' or contains(@class,'pl')]/text()").get() or ""
            desc = desc.strip()
            results.append({
                "title": title.strip() if title else "未知",
                "img": img if img.startswith("http") else "",
                "rating": rating,
                "desc": desc,
                "url": detail_url if detail_url.startswith("http") else "https://movie.douban.com" + detail_url if detail_url.startswith("/") else "",
            })
        return results

    def execute(self, params: dict) -> dict:
        tab = params.get("tab", "nowplaying")

        sources = {
            "nowplaying": ("正在热映", "https://movie.douban.com/cinema/nowplaying/", "#nowplaying .list-item"),
            "coming": ("即将上映", "https://movie.douban.com/coming", ".coming_list tr"),
            "top250": ("豆瓣Top250", "https://movie.douban.com/top250", ".grid_view .item"),
        }

        if tab not in sources:
            sources[tab] = sources["nowplaying"]

        name, url, css_sel = sources[tab]
        items = self._fetch_movie_list(url, css_sel)

        if not items:
            return {"success": False, "error": "获取电影列表失败，豆瓣可能已拦截"}

        return {
            "success": True,
            "tab": tab,
            "name": name,
            "total": len(items),
            "items": items,
        }


crawler = MovieInfoCrawler()
