import bcrypt
import secrets
import time

# In-memory user store (replace with a database in production)
# Structure: { email: { id, name, email, password_hash, created_at } }
_users = {}

# In-memory session store
# Structure: { token: { user_id, email, name, created_at, expires_at } }
_sessions = {}

SESSION_TTL = 60 * 60 * 24  # 24 hours


# ── User operations ────────────────────────────────────────────────────────

def create_user(name: str, email: str, password: str) -> dict:
    """Create a new user. Returns user dict or raises ValueError."""
    email = email.lower().strip()

    if email in _users:
        raise ValueError("An account with this email already exists.")

    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters.")

    salt          = bcrypt.gensalt(rounds=12)
    password_hash = bcrypt.hashpw(password.encode("utf-8"), salt)

    user = {
        "id":            secrets.token_hex(16),
        "name":          name.strip(),
        "email":         email,
        "password_hash": password_hash,
        "created_at":    time.time(),
    }
    _users[email] = user
    return _safe_user(user)


def authenticate_user(email: str, password: str) -> dict:
    """Verify credentials. Returns user dict or raises ValueError."""
    email = email.lower().strip()
    user  = _users.get(email)

    if not user:
        raise ValueError("Invalid email or password.")

    if not bcrypt.checkpw(password.encode("utf-8"), user["password_hash"]):
        raise ValueError("Invalid email or password.")

    return _safe_user(user)


def get_user_by_id(user_id: str) -> dict | None:
    for user in _users.values():
        if user["id"] == user_id:
            return _safe_user(user)
    return None


def _safe_user(user: dict) -> dict:
    """Return user dict without sensitive fields."""
    return {
        "id":         user["id"],
        "name":       user["name"],
        "email":      user["email"],
        "created_at": user["created_at"],
    }


# ── Session operations ─────────────────────────────────────────────────────

def create_session(user: dict) -> str:
    """Create a secure session token and store it."""
    token = secrets.token_urlsafe(32)
    _sessions[token] = {
        "user_id":    user["id"],
        "email":      user["email"],
        "name":       user["name"],
        "created_at": time.time(),
        "expires_at": time.time() + SESSION_TTL,
    }
    return token


def get_session(token: str) -> dict | None:
    """Return session data if token is valid and not expired."""
    session = _sessions.get(token)
    if not session:
        return None
    if time.time() > session["expires_at"]:
        _sessions.pop(token, None)
        return None
    return session


def delete_session(token: str):
    """Remove a session (logout)."""
    _sessions.pop(token, None)
