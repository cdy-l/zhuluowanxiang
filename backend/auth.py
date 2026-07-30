import sqlite3
import hashlib
import secrets
import os
from datetime import datetime, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "users.db")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


NEW_FIELDS = ["bio", "zodiac", "birthday", "location", "gender", "vip_expires"]


def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            avatar TEXT DEFAULT '👤',
            bio TEXT DEFAULT '',
            zodiac TEXT DEFAULT '',
            birthday TEXT DEFAULT '',
            location TEXT DEFAULT '',
            gender TEXT DEFAULT '',
            vip_expires TEXT,
            token TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            plan TEXT NOT NULL,
            amount INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    for field in NEW_FIELDS:
        try:
            conn.execute(f"ALTER TABLE users ADD COLUMN {field} TEXT DEFAULT ''")
        except sqlite3.OperationalError:
            pass
    conn.commit()
    conn.close()


def _hash_password(password, salt=None):
    if salt is None:
        salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000).hex()
    return pwd_hash, salt


USER_FIELDS = "id, username, avatar, bio, zodiac, birthday, location, gender, vip_expires"


def _user_dict(row):
    d = {k: (row[k] or "") for k in ["id", "username", "avatar", "bio", "zodiac", "birthday", "location", "gender"]}
    d["vip_expires"] = row["vip_expires"] or ""
    return d


def is_vip(user_row_or_dict):
    expires = user_row_or_dict.get("vip_expires") if isinstance(user_row_or_dict, dict) else user_row_or_dict["vip_expires"]
    if not expires:
        return False
    try:
        return datetime.now() < datetime.fromisoformat(expires)
    except (ValueError, TypeError):
        return False


VIP_TOOLS = {"vip-video", "vip-music", "novel", "ai-tools"}


def check_tool_access(tool_id, token):
    if tool_id not in VIP_TOOLS:
        return {"ok": True}
    user = get_user_by_token(token)
    if not user:
        return {"ok": False, "error": "请先登录"}
    if is_vip(user):
        return {"ok": True}
    return {"ok": False, "error": "该功能仅限VIP用户使用", "vip_required": True}


def create_order(token, plan):
    plans = {"monthly": (30, 10), "yearly": (365, 100)}
    if plan not in plans:
        return {"success": False, "error": "无效套餐"}
    conn = get_db()
    try:
        user = conn.execute("SELECT id FROM users WHERE token = ?", (token,)).fetchone()
        if not user:
            return {"success": False, "error": "未登录"}
        days, amount = plans[plan]
        conn.execute(
            "INSERT INTO orders (user_id, plan, amount) VALUES (?, ?, ?)",
            (user["id"], plan, amount)
        )
        order_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        conn.commit()
        return {"success": True, "order_id": order_id, "amount": amount, "plan": plan}
    finally:
        conn.close()


def confirm_order(token, order_id):
    conn = get_db()
    try:
        user = conn.execute("SELECT id FROM users WHERE token = ?", (token,)).fetchone()
        if not user:
            return {"success": False, "error": "未登录"}
        order = conn.execute(
            "SELECT * FROM orders WHERE id = ? AND user_id = ? AND status = 'pending'",
            (order_id, user["id"])
        ).fetchone()
        if not order:
            return {"success": False, "error": "订单不存在或已处理"}
        plans = {"monthly": 30, "yearly": 365}
        days = plans.get(order["plan"], 30)
        now = datetime.now()
        current = conn.execute("SELECT vip_expires FROM users WHERE id = ?", (user["id"],)).fetchone()
        current_expires = current["vip_expires"]
        if current_expires and is_vip({"vip_expires": current_expires}):
            base = datetime.fromisoformat(current_expires)
        else:
            base = now
        new_expires = base + timedelta(days=days)
        conn.execute("UPDATE users SET vip_expires = ? WHERE id = ?", (new_expires.isoformat(), user["id"]))
        conn.execute("UPDATE orders SET status = 'paid' WHERE id = ?", (order_id,))
        conn.commit()
        row = conn.execute(f"SELECT {USER_FIELDS} FROM users WHERE id = ?", (user["id"],)).fetchone()
        return {"success": True, "user": _user_dict(row)}
    finally:
        conn.close()


def get_vip_status(token):
    user = get_user_by_token(token)
    if not user:
        return {"is_vip": False, "expires": ""}
    return {
        "is_vip": is_vip(user),
        "expires": user.get("vip_expires", ""),
    }


def register(username, password):
    conn = get_db()
    try:
        existing = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
        if existing:
            return {"success": False, "error": "用户名已存在"}
        pwd_hash, salt = _hash_password(password)
        token = secrets.token_hex(32)
        conn.execute(
            "INSERT INTO users (username, password_hash, salt, token) VALUES (?, ?, ?, ?)",
            (username, pwd_hash, salt, token)
        )
        conn.commit()
        user = conn.execute(f"SELECT {USER_FIELDS} FROM users WHERE username = ?", (username,)).fetchone()
        return {"success": True, "user": _user_dict(user), "token": token}
    finally:
        conn.close()


def login(username, password):
    conn = get_db()
    try:
        user = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        if not user:
            return {"success": False, "error": "用户名或密码错误"}
        pwd_hash, _ = _hash_password(password, user["salt"])
        if pwd_hash != user["password_hash"]:
            return {"success": False, "error": "用户名或密码错误"}
        token = secrets.token_hex(32)
        conn.execute("UPDATE users SET token = ? WHERE id = ?", (token, user["id"]))
        conn.commit()
        row = conn.execute(f"SELECT {USER_FIELDS} FROM users WHERE id = ?", (user["id"],)).fetchone()
        return {"success": True, "user": _user_dict(row), "token": token}
    finally:
        conn.close()


def get_user_by_token(token):
    if not token:
        return None
    conn = get_db()
    try:
        user = conn.execute(f"SELECT {USER_FIELDS} FROM users WHERE token = ?", (token,)).fetchone()
        return _user_dict(user) if user else None
    finally:
        conn.close()


def update_profile(token, data):
    conn = get_db()
    try:
        user = conn.execute("SELECT id FROM users WHERE token = ?", (token,)).fetchone()
        if not user:
            return {"success": False, "error": "未登录"}
        allowed = {"avatar", "bio", "zodiac", "birthday", "location", "gender"}
        updates = {k: v for k, v in data.items() if k in allowed}
        if not updates:
            return {"success": False, "error": "没有可更新的字段"}
        sets = ", ".join(f"{k} = ?" for k in updates)
        vals = list(updates.values()) + [user["id"]]
        conn.execute(f"UPDATE users SET {sets} WHERE id = ?", vals)
        conn.commit()
        row = conn.execute(f"SELECT {USER_FIELDS} FROM users WHERE id = ?", (user["id"],)).fetchone()
        return {"success": True, "user": _user_dict(row)}
    finally:
        conn.close()
