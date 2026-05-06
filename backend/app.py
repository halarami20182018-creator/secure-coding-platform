import os
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

from routes.modules    import modules_bp
from routes.challenges import challenges_bp
from routes.ai_review  import ai_review_bp
from routes.progress   import progress_bp
from routes.auth       import auth_bp

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-change-in-production")
allowed_origins = [
    "http://localhost:3000",
    os.environ.get("FRONTEND_URL", ""),
]
allowed_origins = [o for o in allowed_origins if o]  # remove empty strings

CORS(app, supports_credentials=True, origins=allowed_origins)

app.register_blueprint(auth_bp,       url_prefix="/api/auth")
app.register_blueprint(modules_bp,    url_prefix="/api/modules")
app.register_blueprint(challenges_bp, url_prefix="/api/challenges")
app.register_blueprint(ai_review_bp,  url_prefix="/api/ai-review")
app.register_blueprint(progress_bp,   url_prefix="/api/progress")

@app.route("/api/health")
def health():
    return {
        "status":   "ok",
        "message":  "SecureCode Learn API is running",
        "ai_ready": bool(os.environ.get("GROQ_API_KEY")),
    }

if __name__ == "__main__":
    app.run(debug=True, port=5000)
