# UniHome

UniHome is organized as a small multi-service workspace so each service can be developed and containerized independently.

## Project layout

- `backend/` — Spring Boot API, PostgreSQL/PostGIS integration, business logic, and database seed SQL.
- `frontend/` — React + Vite client application.
- `ai-service/` — FastAPI trust/fraud scoring microservice.
- `data/` — project datasets, including Moroccan university/school CSV data.
- `design-assets/` — original design and illustration assets.
- `docs/` — roadmap, integration notes, and AI scoring plans.
- `archives/` — local backup archives; ignored by Git.
- `logs/` — local runtime logs; ignored by Git.

## Local development

### Backend

From `backend/`:

```powershell
.\mvnw.cmd spring-boot:run
```

### Frontend

From `frontend/`:

```powershell
npm install
npm run dev
```

### AI service

From `ai-service/`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Set `GEMINI_API_KEY` in `ai-service/.env` before starting the AI service.

## Docker readiness

The workspace now has clean service folders and Docker ignore files. The existing Compose file currently starts PostgreSQL/PostGIS and the Spring API; frontend and AI service containers can be added next.
