import os
import json
import re
import execjs
import requests
from jsonpath import jsonpath
from pathlib import Path

_JS_COMPILED = None
COOKIE_FILE = Path(__file__).parent / "netease_cookie.txt"

def _get_js():
    global _JS_COMPILED
    if _JS_COMPILED is None:
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        js_path = os.path.join(backend_dir, "wangyiyun.js")
        with open(js_path, encoding="utf-8") as f:
            source = f.read()
        source = source.replace("./node_modules/crypto-js", "crypto-js")
        _JS_COMPILED = execjs.compile(source)
    return _JS_COMPILED


def encrypt_params(raw_data: dict) -> dict:
    js_obj = _get_js()
    args_str = json.dumps(raw_data)
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    old_cwd = os.getcwd()
    os.chdir(backend_dir)
    try:
        return js_obj.call("get_data", args_str)
    finally:
        os.chdir(old_cwd)


def get_cookie() -> str:
    if COOKIE_FILE.exists():
        return COOKIE_FILE.read_text(encoding="utf-8").strip()
    return ""


def save_cookie(cookie: str):
    COOKIE_FILE.write_text(cookie.strip(), encoding="utf-8")


def _extract_csrf(cookie: str) -> str:
    m = re.search(r'__csrf=([^;]+)', cookie)
    return m.group(1) if m else "76ae6d9119bec2746e07ac368e995601"


def get_music_url(song_id: int | str, cookie: str = "", level: str = "standard") -> str | None:
    if not cookie:
        cookie = get_cookie()
    csrf_token = _extract_csrf(cookie)
    args_dict = {
        "ids": f"[{song_id}]",
        "level": level,
        "encodeType": "aac",
        "csrf_token": csrf_token,
    }
    form_data = encrypt_params(args_dict)
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Referer": "https://music.163.com/",
    }
    if cookie:
        headers["Cookie"] = cookie
    url = f"https://music.163.com/weapi/song/enhance/player/url/v1?csrf_token={csrf_token}"
    resp = requests.post(url, headers=headers, data=form_data, timeout=15)
    urls = jsonpath(resp.json(), "$..url")
    if urls and urls[0]:
        return urls[0]
    return None
