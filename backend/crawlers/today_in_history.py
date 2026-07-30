import requests
import json
from datetime import datetime
from .base import BaseCrawler

FALLBACK_EVENTS = {
    (1, 1): [{"year": "1912", "text": "中华民国成立"}, {"year": "1942", "text": "中国、美国、英国、苏联等26国签署《联合国家宣言》"}, {"year": "1948", "text": "英国铁路国有化"}, {"year": "1956", "text": "苏丹共和国成立"}, {"year": "1958", "text": "欧洲经济共同体正式成立"}, {"year": "1979", "text": "中国与美国正式建立外交关系"}, {"year": "1981", "text": "中国首次实行学位制"}, {"year": "1995", "text": "世界贸易组织正式成立"}],
    (7, 5): [{"year": "1687", "text": "牛顿发表《自然哲学的数学原理》"}, {"year": "1811", "text": "委内瑞拉脱离西班牙宣布独立"}, {"year": "1830", "text": "法国占领阿尔及利亚"}, {"year": "1841", "text": "英国人托马斯·库克组织了世界上第一次包价旅游"}, {"year": "1854", "text": "中国《上海英法美租界租地章程》公布"}, {"year": "1884", "text": "德国占领喀麦隆"}, {"year": "1943", "text": "第二次世界大战库尔斯克战役开始"}, {"year": "1946", "text": "世界上第一件比基尼泳装问世"}, {"year": "1954", "text": "BBC播出世界上第一部电视新闻节目"}, {"year": "1975", "text": "佛得角共和国独立"}, {"year": "1986", "text": "中国首次发行金融债券"}, {"year": "1996", "text": "世界上第一只克隆羊多莉诞生"}, {"year": "2003", "text": "世界卫生组织宣布SARS疫情被控制"}, {"year": "2018", "text": "泰国少年足球队洞穴救援行动开始"}],
    (7, 6): [{"year": "1415", "text": "捷克宗教改革家扬·胡斯被处以火刑"}, {"year": "1785", "text": "美元被选为美国官方货币单位"}, {"year": "1885", "text": "法国科学家巴斯德首次成功进行狂犬病疫苗人体试验"}, {"year": "1893", "text": "印度作家、诗人泰戈尔发表《飞鸟集》"}, {"year": "1908", "text": "中国晚清改革家张之洞逝世"}, {"year": "1928", "text": "中国国民政府将北京改名为北平"}, {"year": "1942", "text": "安妮·弗兰克一家躲进密室"}, {"year": "1964", "text": "马拉维共和国独立"}, {"year": "1975", "text": "科摩罗伊斯兰联邦共和国独立"}, {"year": "1998", "text": "香港启德机场正式关闭"}],
    (7, 7): [{"year": "1937", "text": "中国抗日战争全面爆发（七七事变）"}, {"year": "1981", "text": "太阳探测卫星SolarMax发射升空"}, {"year": "2005", "text": "伦敦地铁和巴士发生多起爆炸袭击"}, {"year": "2007", "text": "新世界七大奇迹评选结果在葡萄牙里斯本公布"}],
    (7, 10): [{"year": "1929", "text": "南京国民政府颁布《中华民国民法》"}, {"year": "1949", "text": "中华人民共和国成立后首次全国社会科学工作者代表会议召开"}, {"year": "1962", "text": "美国发射第一颗有源通信卫星Telstar"}, {"year": "1973", "text": "巴哈马联邦正式独立"}, {"year": "1985", "text": "绿色和平组织船只\"彩虹勇士号\"在新西兰奥克兰港被炸沉"}, {"year": "1991", "text": "鲍里斯·叶利钦就任俄罗斯联邦首任总统"}, {"year": "2002", "text": "中国国家博物馆正式挂牌成立"}, {"year": "2005", "text": "世界最长的跨海大桥——杭州湾跨海大桥全线贯通"}],
}

class TodayInHistoryCrawler(BaseCrawler):
    @property
    def id(self) -> str:
        return "today-in-history"

    @property
    def name(self) -> str:
        return "历史上的今天"

    @property
    def description(self) -> str:
        return "每天精选历史上的今天发生的重大事件"

    @property
    def icon(self) -> str:
        return "📜"

    def get_info(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "category": "实用工具",
            "description": self.description,
            "icon": self.icon,
        }

    def _fetch_wikipedia(self, month: int, day: int) -> list:
        try:
            url = f"https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/{month}/{day}"
            resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=(2, 3))
            data = resp.json()
            events = data.get("events", [])
            results = []
            for item in events:
                year = item.get("year", "")
                text = item.get("text", "")
                pages = item.get("pages", [])
                thumbnail = ""
                if pages:
                    thumb_info = pages[0].get("thumbnail", {})
                    thumbnail = thumb_info.get("source", "")
                results.append({
                    "year": str(year),
                    "text": text,
                    "thumbnail": thumbnail,
                })
            return results[:20]
        except Exception:
            return []

    def _fetch_fallback(self, month: int, day: int) -> list:
        key = (month, day)
        if key in FALLBACK_EVENTS:
            return FALLBACK_EVENTS[key]
        return [{"year": "——", "text": "暂无该日期的历史事件数据"}]

    def _today_info(self, month: int, day: int) -> dict:
        zodiac_map = {
            1: "摩羯座", 2: "水瓶座", 3: "双鱼座", 4: "白羊座",
            5: "金牛座", 6: "双子座", 7: "巨蟹座", 8: "狮子座",
            9: "处女座", 10: "天秤座", 11: "天蝎座", 12: "射手座",
        }
        zodiac = zodiac_map.get(month, "")
        return {
            "month": month,
            "day": day,
            "zodiac": zodiac,
        }

    def execute(self, params: dict) -> dict:
        now = datetime.now()
        month = params.get("month", now.month)
        day = params.get("day", now.day)

        month = int(month)
        day = int(day)

        events = self._fetch_wikipedia(month, day)
        is_fallback = False
        if not events:
            events = self._fetch_fallback(month, day)
            is_fallback = True

        today_info = self._today_info(month, day)

        return {
            "success": True,
            "date": f"{month}月{day}日",
            "today_info": today_info,
            "total": len(events),
            "events": events,
            "is_fallback": is_fallback,
        }


crawler = TodayInHistoryCrawler()
