# UniHome AI Service

FastAPI microservice for UniHome listing trust and fraud scoring.

## Setup

1. Create a virtual environment.
2. Install `requirements.txt`.
3. Copy `.env.example` to `.env`.
4. Set `GEMINI_API_KEY` in `.env`.
5. Run `uvicorn main:app --reload --host 0.0.0.0 --port 8000`.

## Endpoints

- `GET /health`
- `POST /analyze-listing`
