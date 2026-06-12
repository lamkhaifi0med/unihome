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

The workspace can run the main services with Docker Compose.

1. Copy the root environment example:

```powershell
Copy-Item .env.example .env
```

2. Edit `.env` and set at least:

- `GEMINI_API_KEY`
- `JWT_SECRET`
- `POSTGRES_PASSWORD` if you do not want the local default

3. Start the stack:

```powershell
docker compose up --build
```

Local URLs:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8095
- AI health check: http://localhost:8000/health
- PostgreSQL/PostGIS: localhost:5432

Inside Docker, services talk through Compose names. The backend calls the AI service with `http://ai-service:8000`, while the browser calls the backend with `http://localhost:8095` by default. Change `BACKEND_PORT` and `VITE_API_URL` in `.env` if you want another host port.
