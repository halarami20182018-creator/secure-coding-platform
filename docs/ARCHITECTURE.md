# Project Architecture

## Overview

The platform follows a standard client-server architecture with a React frontend and a Flask REST API backend.

```
Browser (React)  <-->  Flask API  <-->  Content JSON / Claude API
```

## API Endpoints

| Method | Endpoint                  | Description                          |
|--------|---------------------------|--------------------------------------|
| GET    | /api/health               | Health check                         |
| GET    | /api/modules/             | List all learning modules            |
| GET    | /api/modules/:id          | Get a single module                  |
| GET    | /api/quiz/:moduleId       | Get quiz for a module                |
| POST   | /api/quiz/submit          | Submit quiz answers                  |
| GET    | /api/challenges/          | List all challenges                  |
| POST   | /api/challenges/submit    | Submit a challenge solution          |
| POST   | /api/ai-review/analyze    | Analyze code for security issues     |
| GET    | /api/progress/:userId     | Get student progress                 |
| POST   | /api/progress/update      | Update student progress              |

## Frontend Pages

| Route             | Page          | Description                          |
|-------------------|---------------|--------------------------------------|
| /                 | Home          | Landing page and overview            |
| /modules          | Modules       | List of all OWASP learning modules   |
| /modules/:id      | ModuleDetail  | Full module content and quiz         |
| /ai-review        | AIReview      | AI code evaluation workspace         |
| /challenges       | Challenges    | Coding challenge exercises           |
| /progress         | Progress      | Student progress dashboard           |

## Module Content Files

| File                              | Vulnerability         | OWASP Category              |
|-----------------------------------|-----------------------|-----------------------------|
| content/modules/sql_injection.json| SQL Injection         | A03:2021 - Injection        |
| content/modules/xss.json          | Cross-Site Scripting  | A03:2021 - Injection        |
| content/modules/insecure_auth.json| Insecure Auth         | A07:2021 - Auth Failures    |
| content/modules/path_traversal.json| Path Traversal       | A01:2021 - Access Control   |
| content/modules/buffer_overflow.json| Buffer Overflow     | A03:2021 - Injection        |
