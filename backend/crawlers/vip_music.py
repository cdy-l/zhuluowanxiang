import requests
from .base import BaseCrawler

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 Chrome/120.0.0.0",
    "Referer": "https://music.163.com/",
}


class VIPMusicCrawler(BaseCrawler):
    @property
    def id(self) -> str:
        return "vip-music"

    @property
    def name(self) -> str:
        return "VIP音乐搜索"

    @property
    def description(self) -> str:
        return "搜索全网热门音乐，提供完整歌曲在线播放"

    @property
    def icon(self) -> str:
        return "🎵"

    def get_info(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "category": "音影娱乐",
            "description": self.description,
            "icon": self.icon,
        }

    def execute(self, params: dict) -> dict:
        keyword = params.get("keyword", "").strip()
        if not keyword:
            return {"error": "请输入歌曲名或歌手"}
        return self._search_netease(keyword)

    def _search_netease(self, keyword):
        try:
            r = requests.get(
                "https://music.163.com/api/search/get/web",
                params={"s": keyword, "offset": 0, "limit": 15, "type": 1},
                headers=HEADERS,
                timeout=15,
            )
            if r.status_code != 200:
                return {"error": f"搜索失败: HTTP {r.status_code}"}
            data = r.json()
            songs_data = data.get("result", {}).get("songs", [])
            if not songs_data:
                return {"error": "未找到相关歌曲"}

            songs = []
            for s in songs_data:
                sid = s.get("id")
                name = s.get("name", "")
                artists = ", ".join(a.get("name", "") for a in s.get("artists", []))
                album = s.get("album", {}).get("name", "") if s.get("album") else ""
                play_url = f"/api/proxy/music/{sid}"
                songs.append({
                    "id": str(sid),
                    "name": name,
                    "artist": artists,
                    "album": album,
                    "download_url": play_url,
                })

            return {
                "success": True,
                "keyword": keyword,
                "total": len(songs),
                "songs": songs,
                "source": "netease",
            }
        except Exception as e:
            return {"error": f"搜索失败: {str(e)}"}


crawler = VIPMusicCrawler()
