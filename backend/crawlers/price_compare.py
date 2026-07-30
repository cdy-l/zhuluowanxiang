import random
from .base import BaseCrawler

SAMPLE_PRODUCTS = [
    {"name": "Apple iPhone 16 Pro Max 256GB", "price": 8999, "shop": "Apple官方旗舰店", "sales": "10万+", "location": "上海"},
    {"name": "Apple iPhone 16 Pro 128GB", "price": 7999, "shop": "Apple官方旗舰店", "sales": "8.5万+", "location": "上海"},
    {"name": "Apple iPhone 16 128GB", "price": 5999, "shop": "Apple官方旗舰店", "sales": "15万+", "location": "上海"},
    {"name": "华为 Mate 60 Pro 512GB", "price": 6999, "shop": "华为官方旗舰店", "sales": "12万+", "location": "深圳"},
    {"name": "华为 Mate 60 256GB", "price": 5499, "shop": "华为官方旗舰店", "sales": "9万+", "location": "深圳"},
    {"name": "小米 14 Ultra 512GB", "price": 5999, "shop": "小米官方旗舰店", "sales": "7万+", "location": "北京"},
    {"name": "小米 14 Pro 256GB", "price": 4999, "shop": "小米官方旗舰店", "sales": "11万+", "location": "北京"},
    {"name": "OPPO Find X7 Ultra 512GB", "price": 5999, "shop": "OPPO官方旗舰店", "sales": "5万+", "location": "东莞"},
    {"name": "vivo X100 Pro 512GB", "price": 4999, "shop": "vivo官方旗舰店", "sales": "6万+", "location": "东莞"},
    {"name": "Samsung Galaxy S24 Ultra 512GB", "price": 9699, "shop": "三星官方旗舰店", "sales": "3万+", "location": "北京"},
    {"name": "Sony WH-1000XM5 降噪耳机", "price": 2499, "shop": "索尼官方旗舰店", "sales": "8万+", "location": "上海"},
    {"name": "Apple AirPods Pro 2", "price": 1799, "shop": "Apple官方旗舰店", "sales": "20万+", "location": "上海"},
    {"name": "Apple Watch Ultra 2", "price": 5999, "shop": "Apple官方旗舰店", "sales": "4.5万+", "location": "上海"},
    {"name": "MacBook Pro 14英寸 M3 Pro", "price": 14999, "shop": "Apple官方旗舰店", "sales": "6万+", "location": "上海"},
    {"name": "iPad Pro M4 11英寸", "price": 7999, "shop": "Apple官方旗舰店", "sales": "7万+", "location": "上海"},
    {"name": "Dyson V15 Detect 吸尘器", "price": 4590, "shop": "戴森官方旗舰店", "sales": "5万+", "location": "广州"},
    {"name": "Nintendo Switch OLED", "price": 2599, "shop": "任天堂官方旗舰店", "sales": "9万+", "location": "深圳"},
    {"name": "PS5 光驱版", "price": 3599, "shop": "索尼官方旗舰店", "sales": "12万+", "location": "上海"},
    {"name": "Xbox Series X", "price": 3799, "shop": "微软官方旗舰店", "sales": "3万+", "location": "苏州"},
    {"name": "DJI Mini 4 Pro 无人机", "price": 4788, "shop": "大疆官方旗舰店", "sales": "4万+", "location": "深圳"},
]

PRODUCT_IMG = "https://picsum.photos/seed/{seed}/200/200"


class PriceCompareCrawler(BaseCrawler):
    @property
    def id(self) -> str:
        return "price-compare"

    @property
    def name(self) -> str:
        return "商品比价"

    @property
    def description(self) -> str:
        return "搜索热门商品，查看价格、销量、店铺信息（演示数据）"

    @property
    def icon(self) -> str:
        return "🏷️"

    def get_info(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "category": "内容抓取",
            "description": self.description,
            "icon": self.icon,
        }

    def execute(self, params: dict) -> dict:
        keyword = params.get("keyword", "").strip()
        if not keyword:
            return {"error": "请输入搜索关键词"}

        results = [p for p in SAMPLE_PRODUCTS if keyword.lower() in p["name"].lower()]
        if not results:
            results = random.sample(SAMPLE_PRODUCTS, min(6, len(SAMPLE_PRODUCTS)))

        items = []
        for i, p in enumerate(results):
            items.append({
                "title": p["name"],
                "price": str(p["price"]),
                "sales": p["sales"],
                "shop": p["shop"],
                "location": p["location"],
                "url": "#",
                "img": PRODUCT_IMG.format(seed=p["name"].replace(" ", "")),
            })

        return {
            "success": True,
            "keyword": keyword,
            "total": len(items),
            "items": items,
            "source": "演示数据",
            "note": "当前为演示数据，接入淘宝API后可获取实时价格",
        }


crawler = PriceCompareCrawler()
