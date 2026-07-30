from .base import BaseCrawler


class VIPVideoCrawler(BaseCrawler):
    @property
    def id(self) -> str:
        return "vip-video"

    @property
    def name(self) -> str:
        return "VIP视频破解"

    @property
    def description(self) -> str:
        return "解析各大视频平台（爱奇艺、腾讯、优酷等）VIP视频，免费高清观看"

    @property
    def icon(self) -> str:
        return "🎬"

    def get_info(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "category": "音影娱乐",
            "description": self.description,
            "icon": self.icon,
            "platforms": [
                {"id": "iqiyi", "name": "爱奇艺", "url": "https://www.iqiyi.com"},
                {"id": "tencent", "name": "腾讯视频", "url": "https://v.qq.com"},
                {"id": "youku", "name": "优酷", "url": "https://www.youku.com"},
            ],
        }

    def execute(self, params: dict) -> dict:
        video_url = params.get("url", "")
        if not video_url:
            return {"error": "请提供视频链接"}
        parsers = [
            f"https://jx.xmflv.cc/?url={video_url}",
            f"https://jx.jsonplayer.com/player/?url={video_url}",
            f"https://m3u8.hlsjs.com/?url={video_url}",
        ]
        return {"success": True, "message": "已打开解析页面", "url": parsers[0], "fallbacks": parsers[1:], "redirect": True}


crawler = VIPVideoCrawler()
