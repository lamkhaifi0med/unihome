"""
Gemini diagnostic helper for UniHome.

Purpose:
- test the configured Gemini key without printing it;
- list available generateContent models;
- test the exact scoring-compatible generation params used by ai-service/main.py;
- test each configured fallback model separately.

Run from the repository root:
    python ai-service/diagnose_gemini.py

Or with the project venv on Windows PowerShell:
    & ".venv/Scripts/python.exe" ai-service/diagnose_gemini.py
"""

from __future__ import annotations

import os
from pathlib import Path

import google.generativeai as genai
from dotenv import load_dotenv
from google.generativeai import GenerationConfig
from google.generativeai.types import HarmBlockThreshold, HarmCategory

AI_SERVICE_DIR = Path(__file__).resolve().parent
load_dotenv(AI_SERVICE_DIR / ".env")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-flash-latest")
FALLBACK_MODEL_NAMES = [
    model.strip()
    for model in os.getenv("GEMINI_FALLBACK_MODEL_NAMES", "").split(",")
    if model.strip()
]

GENERATION_CONFIG = GenerationConfig(
    response_mime_type="application/json",
    temperature=0.1,
    max_output_tokens=2048,
)

SAFETY_SETTINGS = {
    HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
}

SYSTEM_INSTRUCTION = "Retourne uniquement un JSON valide."
TEST_PROMPT = 'Retourne exactement ce JSON: {"ok": true, "source": "diagnostic"}'


def candidate_model_names() -> list[str]:
    candidates: list[str] = []
    for model_name in [MODEL_NAME, *FALLBACK_MODEL_NAMES]:
        if model_name and model_name not in candidates:
            candidates.append(model_name)
    return candidates


def print_header(title: str) -> None:
    print("\n" + "=" * 80)
    print(title)
    print("=" * 80)


def list_available_models() -> None:
    print_header("Available Gemini generateContent models")
    try:
        models = list(genai.list_models())
        names = [
            model.name
            for model in models
            if "generateContent" in getattr(model, "supported_generation_methods", [])
        ]
        print(f"generateContent model count: {len(names)}")
        for name in names[:50]:
            print(f"- {name}")
    except Exception as exc:
        print(f"LIST_MODELS_ERROR: {type(exc).__name__}: {exc}")


def test_model(model_name: str) -> None:
    print_header(f"Generation test: {model_name}")
    try:
        model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=SYSTEM_INSTRUCTION,
            generation_config=GENERATION_CONFIG,
            safety_settings=SAFETY_SETTINGS,
        )
        response = model.generate_content(TEST_PROMPT)
        print("STATUS: OK")
        print("RESPONSE:", (response.text or "").strip())
    except Exception as exc:
        print("STATUS: ERROR")
        print("ERROR_TYPE:", type(exc).__name__)
        print("ERROR_MESSAGE:", str(exc))


def main() -> None:
    print_header("Gemini configuration")
    print("GEMINI_API_KEY present:", bool(GEMINI_API_KEY))
    print("GEMINI_API_KEY length:", len(GEMINI_API_KEY or ""))
    print("GEMINI_MODEL_NAME:", MODEL_NAME)
    print("GEMINI_FALLBACK_MODEL_NAMES:", FALLBACK_MODEL_NAMES)
    print("Generation params: response_mime_type=application/json, temperature=0.1, max_output_tokens=2048")

    if not GEMINI_API_KEY:
        print("\nMissing GEMINI_API_KEY. Set it in ai-service/.env first.")
        return

    genai.configure(api_key=GEMINI_API_KEY)
    list_available_models()

    for model_name in candidate_model_names():
        test_model(model_name)


if __name__ == "__main__":
    main()
