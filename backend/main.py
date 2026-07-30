import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import json
import httpx
import requests as sync_requests
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from crawlers import registry
from auth import init_db, register, login, get_user_by_token, update_profile, check_tool_access, create_order, confirm_order, get_vip_status
from netease_crypto import get_music_url, get_cookie, save_cookie

SCORES_DIR = Path(__file__).parent / "game_scores"
SCORES_DIR.mkdir(exist_ok=True)


def _load_scores(game_id: str) -> list:
    file = SCORES_DIR / f"{game_id}.json"
    if file.exists():
        try:
            return json.loads(file.read_text(encoding="utf-8"))
        except Exception:
            return []
    return []


def _save_scores(game_id: str, scores: list):
    file = SCORES_DIR / f"{game_id}.json"
    file.write_text(json.dumps(scores, ensure_ascii=False), encoding="utf-8")

app = FastAPI(title="蛛罗万象", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ExecuteParams(BaseModel):
    params: dict = {}
    token: str = ""


class AuthParams(BaseModel):
    username: str
    password: str


class ProfileParams(BaseModel):
    token: str
    avatar: str = ""
    bio: str = ""
    zodiac: str = ""
    birthday: str = ""
    location: str = ""
    gender: str = ""


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/api/crawlers")
def list_crawlers():
    return registry.get_all()


@app.get("/api/crawlers/{crawler_id}")
def get_crawler(crawler_id: str):
    return registry.get(crawler_id)


@app.post("/api/crawlers/{crawler_id}/execute")
def execute_crawler(crawler_id: str, body: ExecuteParams):
    access = check_tool_access(crawler_id, body.token)
    if not access["ok"]:
        return access
    return registry.execute(crawler_id, body.params)


@app.post("/api/auth/register")
def auth_register(body: AuthParams):
    if len(body.username) < 2 or len(body.username) > 20:
        raise HTTPException(400, "用户名需 2-20 个字符")
    if len(body.password) < 6:
        raise HTTPException(400, "密码至少 6 位")
    result = register(body.username, body.password)
    if not result["success"]:
        raise HTTPException(400, result["error"])
    return result


@app.post("/api/auth/login")
def auth_login(body: AuthParams):
    result = login(body.username, body.password)
    if not result["success"]:
        raise HTTPException(401, result["error"])
    return result


@app.get("/api/auth/me")
def auth_me(token: str = ""):
    if not token:
        raise HTTPException(401, "未登录")
    user = get_user_by_token(token)
    if not user:
        raise HTTPException(401, "登录已失效")
    return {"success": True, "user": user}


@app.put("/api/auth/profile")
def auth_profile(body: ProfileParams):
    result = update_profile(body.token, body.dict(exclude={"token"}))
    if not result["success"]:
        raise HTTPException(400, result["error"])
    return result


class VipOrderParams(BaseModel):
    token: str
    plan: str


class VipConfirmParams(BaseModel):
    token: str
    order_id: int


@app.post("/api/vip/create-order")
def vip_create_order(body: VipOrderParams):
    result = create_order(body.token, body.plan)
    if not result["success"]:
        raise HTTPException(400, result["error"])
    return result


@app.post("/api/vip/confirm-order")
def vip_confirm_order(body: VipConfirmParams):
    result = confirm_order(body.token, body.order_id)
    if not result["success"]:
        raise HTTPException(400, result["error"])
    return result


@app.get("/api/vip/status")
def vip_status(token: str = ""):
    return get_vip_status(token)


@app.get("/api/proxy/music/{song_id}/url")
def get_music_real_url(song_id: str, level: str = "standard"):
    url = get_music_url(song_id, level=level)
    if not url:
        return {"success": False, "error": "无法获取歌曲播放链接（需要登录网易云账号并配置Cookie）"}
    return {"success": True, "url": url}


@app.get("/api/proxy/music/{song_id}")
async def proxy_music(song_id: str):
    url = get_music_url(song_id)
    if not url:
        raise HTTPException(502, "无法获取歌曲播放链接（需要登录网易云账号并配置Cookie）")
    try:
        sync_resp = sync_requests.get(url, stream=True, timeout=30)
        async def iter_bytes():
            for chunk in sync_resp.iter_content(chunk_size=65536):
                if chunk:
                    yield chunk
        return StreamingResponse(
            iter_bytes(),
            media_type=sync_resp.headers.get("content-type", "audio/mpeg"),
            headers={"Accept-Ranges": "bytes", "Content-Disposition": "inline"},
        )
    except Exception as e:
        raise HTTPException(502, f"proxy error: {str(e)}")


class CookieParams(BaseModel):
    cookie: str


@app.post("/api/netease/cookie")
def set_netease_cookie(body: CookieParams):
    save_cookie(body.cookie)
    return {"success": True, "message": "Cookie已保存"}


@app.get("/api/netease/cookie")
def get_netease_cookie():
    c = get_cookie()
    has_cookie = bool(c) and "MUSIC_U" in c
    return {"has_cookie": has_cookie, "cookie": c[:80] + "..." if has_cookie else ""}


class GameScoreParams(BaseModel):
    token: str
    score: int
    username: str = ""


@app.get("/api/games/{game_id}/leaderboard")
def game_leaderboard(game_id: str):
    scores = sorted(_load_scores(game_id), key=lambda x: x["score"], reverse=True)[:10]
    return {"success": True, "scores": scores}


@app.post("/api/games/{game_id}/score")
def game_submit_score(game_id: str, body: GameScoreParams):
    user = get_user_by_token(body.token) if body.token else None
    username = user["username"] if user else (body.username or "匿名玩家")
    scores = _load_scores(game_id)
    scores.append({"username": username, "score": body.score})
    scores.sort(key=lambda x: x["score"], reverse=True)
    scores = scores[:50]
    _save_scores(game_id, scores)
    rank = next((i+1 for i, s in enumerate(scores) if s["score"] == body.score and s["username"] == username), 1)
    return {"success": True, "rank": rank, "total": len(scores)}


frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")
app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port)
