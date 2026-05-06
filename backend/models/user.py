import bcrypt
import secrets
import time
import json
import os

# ── Storage paths ──────────────────────────────────────────────────────────
DATA_DIR   = os.path.join(os.path.dirname(__file__), '..', 'data')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')

os.makedirs(DATA_DIR, exist_ok=True)

SESSION_TTL = 60 * 60 * 24  # 24 hours

# Sessions stay in memory (short-lived, no need for persistence)
_sessions = {}


# ── File helpers ───────────────────────────────────────────────────────────

def _load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    try:
        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        # Convert password_hash string back to bytes after JSON round-trip
        for u in data.values():
            if isinstance(u.get('password_hash'), str):
                u['password_hash'] = u['password_hash'].encode('latin-1')
        return data
    except Exception:
        return {}


def _save_users(users):
    serialisable = {}
    for email, u in users.items():
        row = dict(u)
        if isinstance(row.get('password_hash'), bytes):
            row['password_hash'] = row['password_hash'].decode('latin-1')
        serialisable[email] = row
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(serialisable, f, indent=2)


# ── User operations ────────────────────────────────────────────────────────

def create_user(name, email, password):
    email = email.lower().strip()
    users = _load_users()
    if email in users:
        raise ValueError("An account with this email already exists.")
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters.")
    salt          = bcrypt.gensalt(rounds=12)
    password_hash = bcrypt.hashpw(password.encode('utf-8'), salt)
    user = {
        'id':            secrets.token_hex(16),
        'name':          name.strip(),
        'email':         email,
        'password_hash': password_hash,
        'created_at':    time.time(),
    }
    users[email] = user
    _save_users(users)
    return _safe(user)


def authenticate_user(email, password):
    email = email.lower().strip()
    users = _load_users()
    user  = users.get(email)
    if not user:
        raise ValueError("Invalid email or password.")
    if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash']):
        raise ValueError("Invalid email or password.")
    return _safe(user)


def get_user_by_id(uid):
    for u in _load_users().values():
        if u['id'] == uid:
            return _safe(u)
    return None


def _safe(u):
    return {
        'id':         u['id'],
        'name':       u['name'],
        'email':      u['email'],
        'created_at': u['created_at'],
    }


# ── Session operations ─────────────────────────────────────────────────────

def create_session(user):
    token = secrets.token_urlsafe(32)
    _sessions[token] = {
        'user_id':    user['id'],
        'email':      user['email'],
        'name':       user['name'],
        'created_at': time.time(),
        'expires_at': time.time() + SESSION_TTL,
    }
    return token


def get_session(token):
    s = _sessions.get(token)
    if not s:
        return None
    if time.time() > s['expires_at']:
        _sessions.pop(token, None)
        return None
    return s


def delete_session(token):
    _sessions.pop(token, None)
