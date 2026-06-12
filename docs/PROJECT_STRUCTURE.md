# Project Structure

The workspace is split into Docker-friendly service directories:

- `backend/` contains the Spring Boot API and owns `unihome.sql` for database initialization.
- `frontend/` contains the Vite application directly at the service root, not nested under another `frontend/` folder.
- `ai-service/` contains the FastAPI scoring service. Secrets live in `ai-service/.env`, based on `ai-service/.env.example`.
- `data/` contains standalone project datasets.
- `design-assets/` contains raw design assets that are not required at runtime.
- `docs/` contains planning, integration documents, and service bible notes.
- `archives/` and `logs/` are local-only folders ignored by Git.

This structure keeps Docker build contexts small and makes each runtime service explicit.
