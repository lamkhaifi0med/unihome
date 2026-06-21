# UniHome AI Service

FastAPI microservice for UniHome listing trust/fraud scoring and UniBot chatbot.

Both features use the same Gemini configuration:

- `GEMINI_API_KEY`
- `GEMINI_MODEL_NAME`
- `GEMINI_FALLBACK_MODEL_NAMES` optional comma-separated fallback list
- `REDIS_URL` for temporary UniBot conversation memory
- `CHAT_HISTORY_TTL_SECONDS` defaults to `3600`
- `CHAT_HISTORY_MAX_MESSAGES` defaults to `10`

Do not create a separate chatbot API key. The chatbot reuses the scoring service key.

Default model in code: `gemini-flash-latest`, matching the existing trust-scoring system. UniBot also reuses the same Gemini generation parameters as scoring. `GEMINI_FALLBACK_MODEL_NAMES` is optional and empty by default to avoid wasting quota on models the project cannot use.

Current local `.env` uses `GEMINI_MODEL_NAME=gemini-flash-lite-latest` because this is the model that successfully generated with the current key during diagnosis.

## Setup

1. Create a virtual environment.
2. Install `requirements.txt`.
3. Copy `.env.example` to `.env`.
4. Set `GEMINI_API_KEY` in `.env`.
5. Run `uvicorn main:app --reload --host 0.0.0.0 --port 8000`.

## Endpoints

- `GET /health`
- `POST /analyze-listing`
- `POST /chat`

## UniBot memory

UniBot stores short temporary conversation memory in Redis when available:

- key format: `unihome:chat:{sessionId}`;
- max messages: `CHAT_HISTORY_MAX_MESSAGES`;
- TTL: `CHAT_HISTORY_TTL_SECONDS`;
- no permanent account-linked chat history.

If Redis is unavailable, `/chat` continues working without memory and logs a warning.

## Separate Gemini diagnosis

Run this from the repository root to test Gemini independently from Spring Boot and the frontend:

```powershell
& ".venv/Scripts/python.exe" ai-service/diagnose_gemini.py
```

The script checks whether the key is present, lists available `generateContent` models, then tests the scoring-compatible generation parameters against `GEMINI_MODEL_NAME` and `GEMINI_FALLBACK_MODEL_NAMES`. It never prints the API key.
