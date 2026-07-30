import os
import re
import requests
import parsel
from .base import BaseCrawler

DOWNLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "downloads", "novels")

HEADERS = {
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
}


def slugify(text):
    return re.sub(r"[^\w\-]", "_", text).strip("_").lower() or "book"


class NovelCrawler(BaseCrawler):
    @property
    def id(self) -> str:
        return "novel"

    @property
    def name(self) -> str:
        return "小说爬取"

    @property
    def description(self) -> str:
        return "从 Wuxiaworld 爬取热门中国网络小说（英文译本），通过章节URL逐章下载"

    @property
    def icon(self) -> str:
        return "📖"

    def get_info(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "category": "内容抓取",
            "description": self.description,
            "icon": self.icon,
        }

    def execute(self, params: dict) -> dict:
        novel_slug = params.get("novel_slug", "").strip()
        if not novel_slug:
            return {"error": "请输入小说slug（如 coiling-dragon）"}

        base_url = f"https://www.wuxiaworld.com/novel/{novel_slug}"
        try:
            resp = requests.get(base_url, headers=HEADERS, timeout=15)
            if resp.status_code != 200:
                return {"error": f"无法访问该小说: HTTP {resp.status_code}"}
        except Exception as e:
            return {"error": f"请求失败: {str(e)}"}

        sel = parsel.Selector(resp.text)
        title_el = sel.css("h1::text").get()
        book_title = title_el.strip() if title_el else novel_slug
        save_dir = os.path.join(DOWNLOAD_DIR, slugify(book_title))
        os.makedirs(save_dir, exist_ok=True)

        first_link = sel.css(f'a[href*="{novel_slug}"][href*="chapter"]::attr(href)').get()
        if not first_link:
            return {"error": "未找到章节入口"}

        href = first_link.strip()
        if not href.startswith("http"):
            href = f"https://www.wuxiaworld.com{href}"

        downloaded = []
        errors = []
        seen = set()
        current_url = href
        max_chapters = 200

        while current_url and len(downloaded) < max_chapters:
            if current_url in seen:
                break
            seen.add(current_url)

            try:
                ch_resp = requests.get(current_url, headers=HEADERS, timeout=15)
                ch_sel = parsel.Selector(ch_resp.text)

                ch_title = ch_sel.css("h1::text").get()
                if not ch_title:
                    ch_title = f"chapter_{len(downloaded) + 1}"

                paragraphs = ch_sel.css("p::text").getall()
                content = "\n\n".join(p.strip() for p in paragraphs if p.strip())

                if content:
                    fp = os.path.join(save_dir, f"{slugify(ch_title)}.txt")
                    with open(fp, "w", encoding="utf-8") as f:
                        f.write(content)
                    downloaded.append(ch_title)

                next_link = ch_sel.css('a[rel="next"]::attr(href)').get()
                if not next_link:
                    next_link = ch_sel.css('a:contains("Next")::attr(href)').get()
                if not next_link:
                    next_links = ch_sel.css(f'a[href*="{novel_slug}"][href*="chapter"]')
                    found = False
                    for a in next_links:
                        h = a.css("::attr(href)").get()
                        if h and h.strip() not in seen:
                            next_link = h.strip()
                            found = True
                            break
                    if not found:
                        next_link = None

                if next_link:
                    if next_link.startswith("/"):
                        current_url = f"https://www.wuxiaworld.com{next_link}"
                    else:
                        current_url = next_link
                else:
                    current_url = None

            except Exception as e:
                errors.append(f"{os.path.basename(current_url)}: {str(e)[:50]}")
                break

        return {
            "success": True,
            "book_title": book_title,
            "novel_slug": novel_slug,
            "total_chapters": len(seen),
            "downloaded": len(downloaded),
            "errors": len(errors),
            "save_path": save_dir,
            "error_details": errors[:5] if errors else [],
        }


crawler = NovelCrawler()
