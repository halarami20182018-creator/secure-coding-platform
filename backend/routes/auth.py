from flask import Blueprint, jsonify, request
from models.user import create_user, authenticate_user, delete_session, create_session
from models.auth import get_current_user, login_required

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json() or {}
    name, email, password = data.get("name","").strip(), data.get("email","").strip(), data.get("password","")
    if not all([name, email, password]):
        return jsonify({"error": "Name, email, and password are required."}), 400
    try:
        user  = create_user(name, email, password)
        token = create_session(user)
        return jsonify({"user": user, "token": token}), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 409

@auth_bp.route("/signin", methods=["POST"])
def signin():
    data = request.get_json() or {}
    email, password = data.get("email","").strip(), data.get("password","")
    if not all([email, password]):
        return jsonify({"error": "Email and password are required."}), 400
    try:
        user  = authenticate_user(email, password)
        token = create_session(user)
        return jsonify({"user": user, "token": token}), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 401

@auth_bp.route("/signout", methods=["POST"])
@login_required
def signout():
    token = request.headers.get("X-Session-Token") or request.cookies.get("session_token")
    delete_session(token)
    return jsonify({"message": "Signed out successfully."}), 200

@auth_bp.route("/me", methods=["GET"])
def me():
    user = get_current_user()
    if not user:
        return jsonify({"user": None}), 200
    return jsonify({"user": {"id": user["user_id"], "name": user["name"], "email": user["email"]}}), 200
