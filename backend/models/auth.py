from functools import wraps
from flask import request, jsonify
from models.user import get_session


def get_current_user():
    """Extract and validate the session token from the request."""
    token = request.headers.get("X-Session-Token") or \
            request.cookies.get("session_token")
    if not token:
        return None
    return get_session(token)


def login_required(f):
    """Decorator that rejects unauthenticated requests with 401."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        return f(*args, **kwargs)
    return decorated
