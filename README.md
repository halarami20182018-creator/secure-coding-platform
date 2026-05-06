# Secure Coding Education Platform

An educational web platform teaching software engineering students secure coding practices using a security-by-design approach, grounded in the OWASP Top 10 framework.

## Project Structure

```
secure-coding-platform/
├── frontend/          # React.js web application
├── backend/           # Python Flask API
├── docs/              # Project documentation
└── README.md
```

## Getting Started

### Prerequisites
- Node.js v18+
- Python 3.10+
- Git

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python app.py
```

## Features
- Interactive OWASP Top 10 learning modules
- Security-by-design learning pathways
- AI code evaluation workspace
- Quizzes, coding challenges, and progress tracking

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React.js, React Router, Axios |
| Backend | Python, Flask, Flask-CORS |
| AI Integration | Claude API (Anthropic) |
| Styling | CSS Modules / Tailwind CSS |
| Version Control | Git / GitHub |
