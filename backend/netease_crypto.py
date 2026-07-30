import os
import json
import re
import execjs
import requests
from jsonpath import jsonpath
from pathlib import Path
from typing import Optional

_JS_COMPILED = None
_JS_ERROR = None
COOKIE_FILE = Path(__file__).parent / "netease_cookie.txt"


def _get_js():
    global _JS_COMPILED, _JS_ERROR
    if _JS_ERROR:
        return None
    if _JS_COMPILED is None:
        try:
            backend_dir = os.path.dirname(os.path.abspath(__file__))
            js_path = os.path.join(backend_dir, "wangyiyun.js")
            crypto_js_path = os.path.join(backend_dir, "crypto-js").replace("\\", "/")
            with open(js_path, encoding="utf-8") as f:
                source = f.read()
            source = source.replace("./crypto-js", crypto_js_path)
            _JS_COMPILED = execjs.compile(source)
        except Exception as e:
            _JS_ERROR = str(e)
            return None
    return _JS_COMPILED


def encrypt_params(raw_data: dict) -> Optional[dict]:
    js_obj = _get_js()
    if not js_obj:
        return None
    args_str = json.dumps(raw_data)
    try:
        return js_obj.call("get_data", args_str)
    except Exception:
        return None


def get_cookie() -> str:
    if COOKIE_FILE.exists():
        return COOKIE_FILE.read_text(encoding="utf-8").strip()
    return ""


def save_cookie(cookie: str):
    COOKIE_FILE.write_text(cookie.strip(), encoding="utf-8")


def _extract_csrf(cookie: str) -> str:
    m = re.search(r'__csrf=([^;]+)', cookie)
    return m.group(1) if m else "76ae6d9119bec2746e07ac368e995601"


_ENCRYPT_ERROR = None


def get_encrypt_error() -> Optional[str]:
    return _ENCRYPT_ERROR or _JS_ERROR


def get_music_url(song_id, cookie: str = "", level: str = "standard") -> Optional[str]:
    global _ENCRYPT_ERROR
    _ENCRYPT_ERROR = None
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
    if form_data is None:
        _ENCRYPT_ERROR = _JS_ERROR or "加密模块初始化失败"
        return None
    if not form_data:
        return None
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Referer": "https://music.163.com/",
    }
    if cookie:
        headers["Cookie"] = cookie
    url = f"https://music.163.com/weapi/song/enhance/player/url/v1?csrf_token={csrf_token}"
    try:
        resp = requests.post(url, headers=headers, data=form_data, timeout=15)
        urls = jsonpath(resp.json(), "$..url")
        if urls and urls[0]:
            return urls[0]
    except Exception:
        pass
    return None
