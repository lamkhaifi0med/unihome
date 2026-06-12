# UniHome quick start for teammates

Follow these steps to run UniHome locally with Docker.

## 1. Install requirements

Install:

- Git
- Docker Desktop

On Windows, open Docker Desktop and wait until it says Docker is running.

## 2. Clone the project

Open PowerShell and run:

```powershell
git clone https://github.com/lamkhaifi0med/unihome.git
cd unihome
```

If you already cloned it before:

```powershell
git pull origin main
```

## 3. Add the private environment file

You will receive a private file separately called:

```text
unihome-teammate.env
```

Put it inside the project folder, then rename it to:

```text
.env
```

It must be next to:

```text
docker-compose.yml
```

So the project root should contain:

```text
.env
docker-compose.yml
backend/
frontend/
ai-service/
```

Do not commit or push this `.env` file. It contains private API keys.

## 4. Start the app

From the project root, run:

```powershell
docker compose up --build
```

The first build can take several minutes.

## 5. Open the app

After containers start, open:

- Frontend: http://localhost:5173
- Backend API: http://localhost:8095
- AI health check: http://localhost:8000/health

## 6. Create an account

The database will be fresh on your PC, so old local accounts from another machine will not exist.

Use this flow:

1. Open http://localhost:5173/register
2. Create a student account.
3. After registration, click the local confirmation link shown on the page.
4. Go to http://localhost:5173/login
5. Login.

## 7. If a port is already used

Open `.env` and change ports, for example:

```env
DB_PORT=5433
BACKEND_PORT=8096
FRONTEND_PORT=5174
AI_SERVICE_PORT=8001
VITE_API_URL=http://localhost:8096
```

Important: if you change `BACKEND_PORT`, also change `VITE_API_URL` to match it.

Then restart:

```powershell
docker compose down
docker compose up --build
```

## 8. Stop the project

To stop without deleting data:

```powershell
docker compose down
```

To reset the database completely:

```powershell
docker compose down -v
docker compose up --build
```

## 9. If something fails

Send these outputs to the team:

```powershell
docker compose ps
docker compose logs --tail=100 api
docker compose logs --tail=100 frontend
docker compose logs --tail=100 db
docker compose logs --tail=100 ai-service
```

## More details

For the full setup guide, read:

- [TEAMMATE_DOCKER_SETUP.md](TEAMMATE_DOCKER_SETUP.md)
