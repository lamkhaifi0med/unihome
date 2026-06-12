# UniHome teammate Docker setup

Use this guide when sending the project to another teammate so they can run the full stack locally without installing Java, Node, Python packages, or PostgreSQL manually.

## 1. Requirements

Install these first:

- Git
- Docker Desktop
- VS Code, optional but recommended

On Windows, Docker Desktop must be running before starting the project.

## 2. Get the project

Clone the repository:

```powershell
git clone https://github.com/lamkhaifi0med/unihome.git
cd unihome
```

If the teammate already cloned it before:

```powershell
git pull origin main
```

## 3. Create local environment file

Copy the example file:

```powershell
Copy-Item .env.example .env
```

Then open `.env` and adjust values if needed.

Minimum required for the app to start:

```env
POSTGRES_DB=unihome
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password1234
DB_PORT=5432

BACKEND_PORT=8095
FRONTEND_PORT=5173
VITE_API_URL=http://localhost:8095

GEMINI_API_KEY=replace-with-your-gemini-api-key
GEMINI_MODEL_NAME=gemini-flash-latest
AI_SERVICE_PORT=8000
```

Notes:

- The app can start with a placeholder `GEMINI_API_KEY`, but AI scoring will not work until a real Gemini key is provided.
- Owner registration and listing photo upload require Cloudinary credentials.
- Email sending is disabled by default with `SMTP_HOST=smtp.example.com`; local registration will show a confirmation link in the UI instead.

## 4. Start everything

Run from the repository root:

```powershell
docker compose up --build
```

First build can take several minutes.

Expected URLs:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8095
- AI service health: http://localhost:8000/health
- PostgreSQL/PostGIS: localhost:5432

## 5. Create/login with an account

For a fresh teammate database, old local accounts will not exist.

Use this flow:

1. Open http://localhost:5173/register
2. Create an account.
3. On the success screen, click the local confirmation link.
4. Go to http://localhost:5173/login
5. Login with the new account.

## 6. Common problems

### Port already used

If a port is already used, edit `.env`.

Examples:

```env
DB_PORT=5433
BACKEND_PORT=8096
FRONTEND_PORT=5174
AI_SERVICE_PORT=8001
VITE_API_URL=http://localhost:8096
```

Then restart:

```powershell
docker compose down
docker compose up --build
```

If `FRONTEND_PORT` changes, open the frontend on that new port. If `BACKEND_PORT` changes, `VITE_API_URL` must match it.

### Database starts empty

This is normal for a teammate's first run. Docker creates a new local volume and initializes it from `backend/unihome.sql`.

If you want to share a private database snapshot, send a separate dump file outside Git, then restore it manually. Do not commit real production/personal data dumps.

### Reset database from zero

This deletes the local Docker database volume:

```powershell
docker compose down -v
docker compose up --build
```

### Pull latest project changes

```powershell
git pull origin main
docker compose up --build
```

## 7. Stop the stack

Stop containers but keep data:

```powershell
docker compose down
```

Stop containers and delete database data:

```powershell
docker compose down -v
```
