"""
UniHome – Fraud Detection Microservice  (Enterprise-Grade v2)
=============================================================
Stack : FastAPI · Gemini 1.5 Flash (Vision) · httpx async · tenacity
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import re
from typing import Optional

import google.generativeai as genai
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from google.generativeai import GenerationConfig
from google.generativeai.types import HarmBlockThreshold, HarmCategory
from pydantic import BaseModel, Field
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
    before_sleep_log,
)

try:
    import redis.asyncio as redis_async
except ImportError:  # Keeps local syntax checks working before dependencies are installed.
    redis_async = None

# ---------------------------------------------------------------------------
# Bootstrap
# ---------------------------------------------------------------------------

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s – %(message)s",
)
logger = logging.getLogger("unihome.fraud")

# Shared Gemini key for both trust scoring and UniBot chatbot.
# Do not introduce a separate chatbot API key unless the architecture changes.
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise EnvironmentError("GEMINI_API_KEY manquante dans le fichier .env")

genai.configure(api_key=GEMINI_API_KEY)

# Shared model name for scoring and chatbot.
# Keep the same default that was already used by the scoring system.
MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-flash-latest")
FALLBACK_MODEL_NAMES = [
    model.strip()
    for model in os.getenv("GEMINI_FALLBACK_MODEL_NAMES", "").split(",")
    if model.strip()
]
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CHAT_HISTORY_TTL_SECONDS = int(os.getenv("CHAT_HISTORY_TTL_SECONDS", "3600"))
CHAT_HISTORY_MAX_MESSAGES = int(os.getenv("CHAT_HISTORY_MAX_MESSAGES", "10"))
MAX_PHOTO_DOWNLOADS = 5          # On analyse jusqu'à 5 photos échantillonnées
DOWNLOAD_TIMEOUT_S  = 40.0       # Timeout par requête HTTP (secondes)
MAX_ASSET_BYTES     = 5_000_000  # 5 Mo – on ignore les fichiers trop lourds

_redis_client = None
_redis_unavailable_logged = False

# ---------------------------------------------------------------------------
# Schémas Pydantic
# ---------------------------------------------------------------------------
 
class DetailScore(BaseModel):
    description : int = Field(..., ge=0, le=100)
    prix        : int = Field(..., ge=0, le=100)
    photos      : int = Field(..., ge=0, le=100)
    justificatif: int = Field(..., ge=0, le=100)
    coherence   : int = Field(..., ge=0, le=100)
 

class RoleMessages(BaseModel):
    student: str = Field(..., description="Message court et rassurant/prudent pour l'étudiant")
    owner  : str = Field(..., description="Message actionnable pour le propriétaire")
    admin  : str = Field(..., description="Message détaillé pour l'admin/modération")
 
 
class AnalysisResponse(BaseModel):
    scoreGlobal  : int = Field(..., ge=0, le=100)
    detailScore  : DetailScore
    raisonnement : str = Field(..., description="Analyse complète : points forts, points faibles, et actions correctives")
    messages     : RoleMessages = Field(..., description="Messages IA séparés par rôle : student, owner, admin")
 
 
class ListingRequest(BaseModel):
    titre                 : str           = Field(..., min_length=1)
    description           : str           = Field(..., min_length=1)
    prix                  : float         = Field(..., gt=0)
    photoUrls             : list[str]     = Field(default_factory=list)
    justificatifUrl       : Optional[str] = None
    proprietaireNomComplet: Optional[str] = None
    ville                 : Optional[str] = None
    adresse               : Optional[str] = None
    typeLogement          : Optional[str] = None
    surface               : Optional[float] = None
    chargesIncluses       : Optional[bool] = None
    proprietaireVerifieCin: Optional[bool] = None
    noteProprietaire      : Optional[float] = None
    nbAvisProprietaire    : Optional[int] = None


class ChatListingContext(BaseModel):
    id             : str
    titre          : Optional[str] = None
    description    : Optional[str] = None
    loyer          : Optional[float] = None
    chargesIncluses: Optional[bool] = None
    ville          : Optional[str] = None
    adresse        : Optional[str] = None
    superficie     : Optional[float] = None
    typeLogement   : Optional[str] = None
    scoreConfiance : Optional[int] = None
    equipements    : list[str] = Field(default_factory=list)
    photoUrls      : list[str] = Field(default_factory=list)
    distanceCampusM: Optional[float] = None


class ChatOwnerListingContext(BaseModel):
    id               : str
    titre            : Optional[str] = None
    description      : Optional[str] = None
    loyer            : Optional[float] = None
    ville            : Optional[str] = None
    typeLogement     : Optional[str] = None
    statut           : Optional[str] = None
    scoreConfiance   : Optional[int] = None
    ownerTrustMessage: Optional[str] = None
    nbSignalements   : Optional[int] = None
    photoCount       : Optional[int] = None
    equipements      : list[str] = Field(default_factory=list)


class ChatRequest(BaseModel):
    message       : str = Field(..., min_length=1)
    sessionId     : str
    role          : str = "ANONYMOUS"
    locale        : str = "fr"
    currentAnnonce: Optional[ChatListingContext] = None
    userProfile   : dict = Field(default_factory=dict)
    ownerListings : list[ChatOwnerListingContext] = Field(default_factory=list)
    safeListings  : list[ChatListingContext] = Field(default_factory=list)
    allowedTools  : dict[str, bool] = Field(default_factory=dict)


class ChatResponse(BaseModel):
    reply              : str
    suggestedListingIds: list[str] = Field(default_factory=list)
    listingReasons     : dict[str, list[str]] = Field(default_factory=dict)
    quickReplies       : list[str] = Field(default_factory=list)


class ChatHistoryMessage(BaseModel):
    role   : str
    content: str
 
 
# ---------------------------------------------------------------------------
# GenerationConfig — schéma JSON imposé via le prompt (plus fiable en multimodal)
# et provoque une troncature silencieuse du JSON. Le format est imposé via le prompt.
# ---------------------------------------------------------------------------
 
GENERATION_CONFIG = GenerationConfig(
    response_mime_type="application/json",  # Désactive le wrapping Markdown
    temperature=0.1,
    max_output_tokens=2048,
)

# UniBot intentionally uses the same Gemini generation parameters as the
# trust-scoring endpoint because this configuration is already validated in UniHome.
CHAT_GENERATION_CONFIG = GENERATION_CONFIG

# Free-form generation config used when the chatbot may either call a tool or
# answer in plain text. We cannot force JSON output here because Gemini cannot
# simultaneously emit a function_call AND respect response_mime_type=json.
CHAT_TOOL_GENERATION_CONFIG = GenerationConfig(
    temperature=0.1,
    max_output_tokens=2048,
)

# ---------------------------------------------------------------------------
# Backend internal API (used by chatbot tool-calling to query the database)
# ---------------------------------------------------------------------------
# The AI service never executes SQL nor mutates state — it only invokes typed
# Spring Boot endpoints under /api/internal/chatbot/** which return projected,
# read-only data. Authentication uses a shared secret carried in the
# X-Internal-API-Key header and verified by InternalApiKeyFilter on the JVM side.

BACKEND_INTERNAL_URL = os.getenv("BACKEND_INTERNAL_URL", "http://api:8080").rstrip("/")
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")
CHATBOT_TOOL_TIMEOUT_S = float(os.getenv("CHATBOT_TOOL_TIMEOUT_S", "5"))
CHATBOT_TOOL_MAX_TURNS = int(os.getenv("CHATBOT_TOOL_MAX_TURNS", "3"))
CHATBOT_TOOL_MAX_RESULTS = int(os.getenv("CHATBOT_TOOL_MAX_RESULTS", "20"))

if not INTERNAL_API_KEY:
    logger.warning(
        "INTERNAL_API_KEY is empty; chatbot tool-calling to Spring Boot will fail. "
        "Set the env var (>= 32 chars) so backend filter accepts our calls."
    )

SAFETY_SETTINGS = {
    HarmCategory.HARM_CATEGORY_HARASSMENT       : HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_HATE_SPEECH      : HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
    HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
}

# ---------------------------------------------------------------------------
# Prompt système (règles métier + directives visuelles)
# ---------------------------------------------------------------------------
 
SYSTEM_PROMPT = """
Tu es le moteur de scoring de confiance d'UniHome, une plateforme marocaine de
location de logements étudiants. Ta mission est STRICTEMENT limitée à l'annonce :
texte, prix, photos, justificatif, adresse déclarée, cohérence globale. Ne fais
pas de jugement personnel sur le propriétaire et ne donne aucune garantie légale.

Le score UniHome décide directement le workflow backend :
• scoreGlobal >= 70  → annonce publiée automatiquement (VALIDEE)
• scoreGlobal 40–69  → revue admin (EN_ATTENTE)
• scoreGlobal < 40   → rejet automatique (REJETEE)

Tu dois donc être strict : une annonce incertaine doit rester dans 40–69, pas être
publiée automatiquement. Une annonce ne doit passer >=70 que si elle semble légitime,
avec prix plausible, photos cohérentes et justificatif exploitable.

━━━ CRITÈRES (0–100 chacun) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▌JUSTIFICATIF — critère le plus important
    • Document marocain logement clair (ONEE/Redal/Amendis/eau-électricité/acte)
        + nom propriétaire visible et cohérent + adresse liée au logement → 90–100
    • Document logement clair, adresse liée, nom absent/non lisible → 70–85
    • Document présent mais type incertain ou partiellement lisible → 45–69
    • Document flou/illisible → 20–45
    • Aucun justificatif → 0–35
    • Nom clairement différent ou adresse clairement contradictoire → 0–20

IMPORTANT : un justificatif ne prouve pas légalement la propriété. Dis seulement
qu'il "semble cohérent" ou "ne confirme pas clairement" le lien avec le logement.

▌PHOTOS
    • 5+ photos claires, cohérentes, logement réel, plusieurs espaces → 85–100
    • 3–4 photos claires et cohérentes → 70–85
    • 2 photos acceptables → 55–70
    • Photos floues/sombres/incomplètes → 25–55
    • Watermark, banque d'images, logement différent, image IA suspecte → 0–55

▌PRIX (MAD)
    Analyse selon prix, ville, type, surface et marché étudiant marocain.
    • Prix plausible pour le type/surface/ville → 75–100
    • Un peu bas ou haut mais possible → 55–74
    • Très bas sans preuve forte → 20–55
    • Extrêmement bas ou incohérent → 0–35
    • Très élevé : baisse le score prix mais ne rejette pas automatiquement.

▌DESCRIPTION
    • Spécifique, utile, annonce-focused, sans langage suspect → 75–100
    • Correcte mais manque détails charges/équipements/proximité → 55–74
    • Très courte/générique → 30–55
    • Contradictoire ou langage de paiement suspect → 0–35
    Signaux critiques : western union, mandat cash, avance/caution avant visite,
    propriétaire absent/étranger, pas de visite possible, transfert d'argent urgent.

▌COHERENCE
    Vérifie si titre, description, prix, type, surface, ville, photos et justificatif
    racontent la même histoire. Contradiction claire sur justificatif/adresse/nom → 0–25.

━━━ PONDÉRATION OBLIGATOIRE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
scoreGlobal = round(justificatif×0.35 + photos×0.20 + prix×0.20 + description×0.15 + coherence×0.10)

━━━ CAPS BUSINESS À RESPECTER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Aucun justificatif ou justificatif illisible → scoreGlobal max 69
• Nom justificatif clairement différent → scoreGlobal max 39
• Adresse justificatif clairement différente → scoreGlobal max 39
• Langage paiement frauduleux → scoreGlobal max 39
• Prix extrêmement bas avec preuve faible → scoreGlobal max 55
• Incertitude forte → rester entre 40 et 69

━━━ FORMAT DE SORTIE OBLIGATOIRE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Retourne EXACTEMENT ce JSON, sans texte avant/après, sans Markdown :

{
    "scoreGlobal": <entier 0-100>,
    "detailScore": {
        "description": <entier 0-100>,
        "prix": <entier 0-100>,
        "photos": <entier 0-100>,
        "justificatif": <entier 0-100>,
        "coherence": <entier 0-100>
    },
    "raisonnement": "<3-5 phrases admin en français : points forts, points faibles, actions correctives>",
    "messages": {
        "student": "<1-2 phrases pour l'étudiant : confiance, prudence avant paiement/visite, annonce uniquement>",
        "owner": "<1-2 phrases pour le propriétaire : statut probable, améliorations concrètes si besoin, annonce uniquement>",
        "admin": "<3-5 phrases pour l'admin : analyse complète, preuves, risques, décision, annonce uniquement>"
    }
}

Tous les messages doivent rester centrés sur l'annonce. Aucun message ne doit garantir
que le propriétaire possède légalement le logement. Le message student doit être sûr
et non technique. Le message owner doit être actionnable. Le message admin peut être
plus détaillé et mentionner les preuves, incohérences et seuils.
""".strip()


CHATBOT_SYSTEM_PROMPT = """
Tu es UniBot, l'assistant virtuel de la plateforme UniHome au Maroc.
UniHome aide les étudiants marocains à trouver des logements près des universités.

Règles principales :
- Réponds en français, arabe standard ou darija selon la langue de l'utilisateur.
- Sois concis, utile, professionnel et rassurant.
- Tu aides uniquement sur UniHome, logement étudiant, recherche, annonces, confiance, signalements, propriétaires et sécurité.
- Ne donne jamais de conseil légal ou financier précis.
- N'invente jamais d'annonce.
- Recommande uniquement les annonces fournies dans le contexte.
- Les annonces privées du propriétaire servent uniquement à expliquer son propre statut/améliorations ; ne les recommande jamais comme résultats publics.
- Ne révèle jamais les contacts sauf si le contexte indique explicitement canRevealContacts=true.
- Ne révèle jamais CIN, justificatif, notes admin ou données privées.
- Si aucune annonce ne correspond, dis-le clairement et propose d'élargir les critères.
- Pour chaque recommandation, mentionne l'ID/titre/prix/score et 2 raisons utiles.
- Le score de confiance n'est pas une garantie légale.
- Avant tout paiement, conseille de visiter le logement et confirmer les informations.

Tu dois retourner uniquement un JSON valide avec cette structure :
{
    "reply": "réponse courte en français",
    "suggestedListingIds": ["id-annonce"],
    "listingReasons": {"id-annonce": ["raison 1", "raison 2"]},
    "quickReplies": ["suggestion courte"]
}
""".strip()
 
 
# ---------------------------------------------------------------------------
# Téléchargement asynchrone des assets (images / justificatif)
# ---------------------------------------------------------------------------
 
async def _fetch_asset(client: httpx.AsyncClient, url: str) -> bytes | None:
    """
    Télécharge un asset distant en mémoire.
    Retourne None si l'URL est invalide, trop lourde ou en erreur.
    """
    try:
        resp = await client.get(url, timeout=DOWNLOAD_TIMEOUT_S, follow_redirects=True)
        resp.raise_for_status()
        if len(resp.content) > MAX_ASSET_BYTES:
            logger.warning("Asset ignoré (trop lourd : %d o) : %s", len(resp.content), url)
            return None
        return resp.content
    except Exception as exc:
        logger.warning("Échec téléchargement asset [%s] : %s", url, exc)
        return None
 
 
def _mime_from_url(url: str) -> str:
    """Déduit le MIME type depuis l'extension de l'URL."""
    lower = url.lower().split("?")[0]
    if lower.endswith(".pdf"):
        return "application/pdf"
    if lower.endswith(".png"):
        return "image/png"
    if lower.endswith(".webp"):
        return "image/webp"
    return "image/jpeg"  # défaut Cloudinary
 

def _select_photo_urls_for_analysis(photo_urls: list[str]) -> list[str]:
    """
    Sélectionne un échantillon représentatif des photos à analyser.
    Avec 10 photos, on couvre début / milieu / fin au lieu de prendre seulement
    les premières images, pour mieux détecter une photo incohérente.
    """
    if len(photo_urls) <= MAX_PHOTO_DOWNLOADS:
        return photo_urls

    if MAX_PHOTO_DOWNLOADS <= 1:
        return photo_urls[:MAX_PHOTO_DOWNLOADS]

    last_index = len(photo_urls) - 1
    indexes = [round(i * last_index / (MAX_PHOTO_DOWNLOADS - 1)) for i in range(MAX_PHOTO_DOWNLOADS)]
    return [photo_urls[index] for index in dict.fromkeys(indexes)]
 
 
async def download_assets(
    photo_urls: list[str],
    justificatif_url: Optional[str],
) -> tuple[list[tuple[bytes, str]], tuple[bytes, str] | None]:
    """
    Télécharge en parallèle un échantillon de photos + le justificatif.
    Retourne :
      - photos    : liste de (bytes, mime_type)
      - justif    : (bytes, mime_type) ou None
    """
    targets_photos = _select_photo_urls_for_analysis(photo_urls)
    has_justif     = bool(justificatif_url and justificatif_url.strip())
 
    async with httpx.AsyncClient() as client:
        tasks_photos = [_fetch_asset(client, u) for u in targets_photos]
        task_justif  = _fetch_asset(client, justificatif_url) if has_justif else asyncio.sleep(0, result=None)
 
        results = await asyncio.gather(*tasks_photos, task_justif)
 
    photo_results  = results[:-1]
    justif_result  = results[-1]
 
    photos_out: list[tuple[bytes, str]] = []
    for url, data in zip(targets_photos, photo_results):
        if data:
            photos_out.append((data, _mime_from_url(url)))
 
    justif_out: tuple[bytes, str] | None = None
    if justif_result and has_justif:
        justif_out = (justif_result, _mime_from_url(justificatif_url))
 
    return photos_out, justif_out
 
 
# ---------------------------------------------------------------------------
# Construction des content_parts multimodaux
# ---------------------------------------------------------------------------
 
def build_content_parts(
    req         : ListingRequest,
    photos      : list[tuple[bytes, str]],
    justif      : tuple[bytes, str] | None,
) -> list:
    """
    Assemble le prompt texte + les blobs binaires en une liste de parts
    compatible avec l'API Gemini.
    """
    nb_photos_total = len(req.photoUrls)
    proprietaire    = req.proprietaireNomComplet or "Non renseigné"
    has_justif      = justif is not None
 
    text_prompt = (
        f"Analyse l'annonce immobilière suivante :\n\n"
        f"**Titre** : {req.titre}\n"
        f"**Description** : {req.description}\n"
        f"**Prix mensuel** : {req.prix} MAD\n"
        f"**Ville** : {req.ville or 'Non renseignée'}\n"
        f"**Adresse déclarée** : {req.adresse or 'Non renseignée'}\n"
        f"**Type logement** : {req.typeLogement or 'Non renseigné'}\n"
        f"**Surface** : {req.surface if req.surface is not None else 'Non renseignée'} m²\n"
        f"**Charges incluses** : {'Oui' if req.chargesIncluses else 'Non' if req.chargesIncluses is False else 'Non renseigné'}\n"
        f"**Nombre total de photos déclarées** : {nb_photos_total}\n"
        f"**Photos téléchargées pour analyse** : {len(photos)}\n"
        f"**Justificatif fourni** : {'Oui' if has_justif else 'Non'}\n"
        f"**Propriétaire déclaré** : {proprietaire}\n\n"
        f"**CIN propriétaire déjà vérifiée par admin** : {'Oui' if req.proprietaireVerifieCin else 'Non' if req.proprietaireVerifieCin is False else 'Non renseigné'}\n"
        f"**Note propriétaire** : {req.noteProprietaire if req.noteProprietaire is not None else 'Non renseignée'}\n"
        f"**Nombre avis propriétaire** : {req.nbAvisProprietaire if req.nbAvisProprietaire is not None else 'Non renseigné'}\n\n"
    )
 
    if photos:
        text_prompt += (
            f"Les {len(photos)} image(s) du logement suivent immédiatement. "
            "Examine-les attentivement selon les règles visuelles.\n"
        )
    if has_justif:
        text_prompt += (
            "Le document justificatif suit. Vérifie s'il ressemble "
            "à une facture marocaine (Redal/Amendis/ONEE/eau-électricité), "
            "un acte de propriété ou une autorisation de location. Vérifie uniquement "
            "si le nom et l'adresse visibles semblent cohérents avec les données déclarées.\n"
        )
 
    text_prompt += (
        "\nIMPORTANT : Ta réponse doit commencer IMMÉDIATEMENT par '{' sans "
        "aucun texte introductif, explication, ou raisonnement. "
        "Produis uniquement le JSON de scoring, rien d'autre."
    )
 
    parts: list = [text_prompt]
 
    for blob_bytes, mime in photos:
        parts.append({"mime_type": mime, "data": blob_bytes})
 
    if justif:
        blob_bytes, mime = justif
        parts.append({"mime_type": mime, "data": blob_bytes})
 
    return parts
 
 
# ---------------------------------------------------------------------------
# Appel Gemini avec retry + exponential backoff (tenacity)
# ---------------------------------------------------------------------------
 
def _parse_gemini_json(raw: str) -> AnalysisResponse:
    """
    Parse défensif : retire les fences Markdown, isole l'objet JSON,
    valide avec Pydantic. Résiste aux préfixes/suffixes parasites.
    """
    import re
    import json as _json
 
    # Strip fences ```json ... ``` que Gemini peut émettre malgré response_mime_type
    text = re.sub(r"```(?:json)?\s*", "", raw, flags=re.IGNORECASE)
    text = text.replace("```", "").strip()
 
    # Extraire le premier objet JSON complet avec un compteur d'accolades.
    start = text.find("{")
    if start == -1:
        raise ValueError(f"Aucun objet JSON dans la réponse Gemini : {text!r}")

    depth = 0
    end = -1
    in_string = False
    escaped = False
    for index in range(start, len(text)):
        char = text[index]
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue
        if char == '"':
            in_string = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                end = index + 1
                break

    if end == -1:
        raise ValueError(f"Objet JSON incomplet dans la réponse Gemini : {text!r}")
 
    data = _json.loads(text[start:end])
    return AnalysisResponse.model_validate(data)


def _clamp_score(value: float | int) -> int:
    return max(0, min(100, int(round(value))))


def _contains_any(text: str, terms: list[str]) -> bool:
    normalized = text.lower()
    return any(term in normalized for term in terms)


def _word_count(text: str) -> int:
    import re
    return len(re.findall(r"\b\w+\b", text or ""))


STRONG_PAYMENT_TERMS = [
    "western union",
    "westerunion",
    "mandat cash",
    "avance avant visite",
    "caution avant visite",
    "frais de dossier avant visite",
    "envoyez l'argent",
    "envoyer l'argent",
    "transférez l'argent",
    "transferez l'argent",
]

OWNER_ABSENT_TERMS = [
    "je suis à l'étranger",
    "je suis a l'etranger",
    "propriétaire absent",
    "proprietaire absent",
    "pas de visite possible",
    "en voyage",
    "abroad",
]


def _description_rule_score(description: str) -> int:
    score = 82
    words = _word_count(description)
    text = description.lower()

    if words < 20:
        score -= 30
    elif words < 35:
        score -= 12
    elif words > 80:
        score += 5

    if _contains_any(text, STRONG_PAYMENT_TERMS):
        score -= 55
    if _contains_any(text, OWNER_ABSENT_TERMS):
        score -= 35
    if "urgent urgent" in text:
        score -= 20
    if "contact email seulement" in text or "email seulement" in text:
        score -= 20

    return _clamp_score(score)


def _price_rule_score(req: ListingRequest) -> int:
    price = float(req.prix)
    type_logement = (req.typeLogement or "").upper()
    surface = req.surface or 0

    if price < 800:
        return 18
    if price < 1500:
        if type_logement in {"CHAMBRE", "COLOCATION"}:
            return 62
        return 46
    if price <= 6000:
        score = 84
        if type_logement == "CHAMBRE" and price > 3500:
            score -= 18
        if type_logement == "STUDIO" and surface and surface < 18 and price > 3500:
            score -= 12
        return _clamp_score(score)
    if price <= 9000:
        return 62
    return 45


def _photo_count_score(total_photos: int) -> int:
    if total_photos <= 0:
        return 10
    if total_photos == 1:
        return 35
    if total_photos == 2:
        return 62
    if total_photos <= 4:
        return 78
    return 90


def _reason_mentions_mismatch(reason: str, field: str) -> bool:
    """
    Détecte seulement une contradiction explicite concernant le champ ciblé.
    Évite les faux positifs comme :
    "le nom correspond parfaitement ... les différentes pièces du logement".
    """
    text = (reason or "").lower()
    if field not in text:
        return False

    positive_patterns = [
        rf"{field}[^.!?;]{{0,90}}correspond",
        rf"correspond[^.!?;]{{0,90}}{field}",
        rf"{field}[^.!?;]{{0,90}}cohérent",
        rf"{field}[^.!?;]{{0,90}}coherent",
    ]
    negative_patterns = [
        rf"{field}[^.!?;]{{0,90}}ne correspond",
        rf"ne correspond[^.!?;]{{0,90}}{field}",
        rf"{field}[^.!?;]{{0,90}}différent",
        rf"{field}[^.!?;]{{0,90}}different",
        rf"différent[^.!?;]{{0,90}}{field}",
        rf"different[^.!?;]{{0,90}}{field}",
        rf"{field}[^.!?;]{{0,90}}contradictoire",
        rf"contradictoire[^.!?;]{{0,90}}{field}",
        rf"{field}[^.!?;]{{0,90}}incohérent",
        rf"{field}[^.!?;]{{0,90}}incoherent",
        rf"incohérent[^.!?;]{{0,90}}{field}",
        rf"incoherent[^.!?;]{{0,90}}{field}",
    ]

    sentences = [segment.strip() for segment in re.split(r"[.!?;\n]+", text) if segment.strip()]
    for sentence in sentences:
        if field not in sentence:
            continue
        has_negative = any(re.search(pattern, sentence) for pattern in negative_patterns)
        has_positive = any(re.search(pattern, sentence) for pattern in positive_patterns)
        if has_negative and not has_positive:
            return True

    return False


def apply_strict_business_rules(
    req: ListingRequest,
    ai_result: AnalysisResponse,
    justif: tuple[bytes, str] | None,
) -> AnalysisResponse:
    """
    Gemini provides multimodal judgment, but Python enforces UniHome's strict
    business gates so uncertain annonces do not auto-pass or auto-reject.
    """
    detail = ai_result.detailScore
    caps: list[int] = []

    description_score = min(detail.description, _description_rule_score(req.description))
    price_score = min(detail.prix, _price_rule_score(req))
    photos_score = min(detail.photos, _photo_count_score(len(req.photoUrls)))
    justificatif_score = detail.justificatif
    coherence_score = detail.coherence

    has_justif_url = bool(req.justificatifUrl and req.justificatifUrl.strip())
    if not has_justif_url:
        justificatif_score = min(justificatif_score, 30)
        caps.append(69)
    elif justif is None:
        justificatif_score = min(justificatif_score, 40)
        caps.append(69)

    if has_justif_url and justificatif_score < 45:
        caps.append(69)

    if _contains_any(req.description, STRONG_PAYMENT_TERMS):
        description_score = min(description_score, 25)
        coherence_score = min(coherence_score, 45)
        caps.append(39)
    elif _contains_any(req.description, OWNER_ABSENT_TERMS):
        description_score = min(description_score, 45)
        coherence_score = min(coherence_score, 60)
        caps.append(55)

    if req.prix < 800:
        price_score = min(price_score, 20)
        caps.append(55 if justificatif_score >= 70 else 39)

    if len(req.photoUrls) < 2:
        photos_score = min(photos_score, 35)
        caps.append(69)

    if _reason_mentions_mismatch(ai_result.raisonnement, "nom"):
        justificatif_score = min(justificatif_score, 20)
        coherence_score = min(coherence_score, 25)
        caps.append(39)

    if _reason_mentions_mismatch(ai_result.raisonnement, "adresse"):
        justificatif_score = min(justificatif_score, 25)
        coherence_score = min(coherence_score, 30)
        caps.append(39)

    adjusted_detail = DetailScore(
        description=_clamp_score(description_score),
        prix=_clamp_score(price_score),
        photos=_clamp_score(photos_score),
        justificatif=_clamp_score(justificatif_score),
        coherence=_clamp_score(coherence_score),
    )

    score = _clamp_score(
        adjusted_detail.justificatif * 0.35
        + adjusted_detail.photos * 0.20
        + adjusted_detail.prix * 0.20
        + adjusted_detail.description * 0.15
        + adjusted_detail.coherence * 0.10
    )

    if caps:
        score = min(score, min(caps))

    return AnalysisResponse(
        scoreGlobal=score,
        detailScore=adjusted_detail,
        raisonnement=ai_result.raisonnement,
        messages=ai_result.messages,
    )
 
 
@retry(
    retry=retry_if_exception_type(Exception),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    before_sleep=before_sleep_log(logger, logging.WARNING),
    reraise=True,
)
async def call_gemini(content_parts: list) -> tuple[str, object]:
    """
    Appel asynchrone à Gemini avec jusqu'à 3 tentatives.
    Retourne (raw_json_text, finish_reason).
    """
    last_error: Exception | None = None
    for model_name in _candidate_model_names():
        try:
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=SYSTEM_PROMPT,
                generation_config=GENERATION_CONFIG,
                safety_settings=SAFETY_SETTINGS,
            )
            response = await model.generate_content_async(content_parts)
            finish_reason = response.candidates[0].finish_reason if response.candidates else None
            if model_name != MODEL_NAME:
                logger.info("Gemini scoring fallback model used: %s", model_name)
            return response.text, finish_reason
        except Exception as exc:
            last_error = exc
            logger.warning("Gemini scoring model %s failed: %s", model_name, exc)
    raise last_error or RuntimeError("No Gemini model available")


def _candidate_model_names() -> list[str]:
    candidates: list[str] = []
    for model_name in [MODEL_NAME, *FALLBACK_MODEL_NAMES]:
        if model_name and model_name not in candidates:
            candidates.append(model_name)
    return candidates


def _chat_history_key(session_id: str) -> str:
    safe_session_id = re.sub(r"[^a-zA-Z0-9:_-]", "_", (session_id or "anonymous"))[:120]
    return f"unihome:chat:{safe_session_id}"


async def _get_redis_client():
    global _redis_client, _redis_unavailable_logged
    if redis_async is None:
        if not _redis_unavailable_logged:
            logger.warning("Redis package is not installed; UniBot memory is disabled.")
            _redis_unavailable_logged = True
        return None
    if not REDIS_URL:
        return None
    if _redis_client is None:
        try:
            _redis_client = redis_async.from_url(REDIS_URL, decode_responses=True)
            await _redis_client.ping()
            logger.info("UniBot Redis memory connected: %s", REDIS_URL)
        except Exception as exc:
            _redis_client = None
            if not _redis_unavailable_logged:
                logger.warning("Redis unavailable; UniBot memory disabled for now: %s", exc)
                _redis_unavailable_logged = True
            return None
    return _redis_client


async def _load_chat_history(session_id: str) -> list[ChatHistoryMessage]:
    client = await _get_redis_client()
    if client is None:
        return []
    try:
        raw = await client.get(_chat_history_key(session_id))
        if not raw:
            return []
        data = json.loads(raw)
        messages = [ChatHistoryMessage.model_validate(item) for item in data if isinstance(item, dict)]
        return messages[-CHAT_HISTORY_MAX_MESSAGES:]
    except Exception as exc:
        logger.warning("Could not load UniBot Redis history: %s", exc)
        return []


async def _save_chat_turn(session_id: str, user_message: str, assistant_reply: str) -> None:
    client = await _get_redis_client()
    if client is None:
        return
    try:
        history = await _load_chat_history(session_id)
        history.extend([
            ChatHistoryMessage(role="user", content=(user_message or "").strip()[:1200]),
            ChatHistoryMessage(role="assistant", content=(assistant_reply or "").strip()[:1200]),
        ])
        payload = [message.model_dump() for message in history[-CHAT_HISTORY_MAX_MESSAGES:]]
        await client.setex(
            _chat_history_key(session_id),
            CHAT_HISTORY_TTL_SECONDS,
            json.dumps(payload, ensure_ascii=False),
        )
    except Exception as exc:
        logger.warning("Could not save UniBot Redis history: %s", exc)


def _chat_history_text(history: list[ChatHistoryMessage]) -> str:
    if not history:
        return ""
    lines = ["Historique récent de la conversation (dernier contexte utile, ne pas inventer de données):"]
    for message in history[-CHAT_HISTORY_MAX_MESSAGES:]:
        role = "Utilisateur" if message.role == "user" else "UniBot"
        content = (message.content or "").replace("\n", " ").strip()
        if content:
            lines.append(f"- {role}: {content[:500]}")
    return "\n".join(lines)


def _chat_listing_line(listing: ChatListingContext) -> str:
    parts = [f"ID={listing.id}"]
    if listing.titre:
        parts.append(f"titre={listing.titre}")
    if listing.ville:
        parts.append(f"ville={listing.ville}")
    if listing.typeLogement:
        parts.append(f"type={listing.typeLogement}")
    if listing.loyer is not None:
        parts.append(f"loyer={listing.loyer:.0f} MAD")
    if listing.superficie is not None:
        parts.append(f"surface={listing.superficie:.0f} m²")
    if listing.scoreConfiance is not None:
        parts.append(f"score={listing.scoreConfiance}/100")
    if listing.distanceCampusM is not None:
        parts.append(f"distanceCampus={listing.distanceCampusM:.0f} m")
    if listing.equipements:
        parts.append(f"equipements={', '.join(listing.equipements[:8])}")
    if listing.adresse:
        parts.append(f"adresse={listing.adresse}")
    return " | ".join(parts)


def _chat_owner_listing_line(listing: ChatOwnerListingContext) -> str:
    parts = [f"ID={listing.id}"]
    if listing.titre:
        parts.append(f"titre={listing.titre}")
    if listing.statut:
        parts.append(f"statut={listing.statut}")
    if listing.scoreConfiance is not None:
        parts.append(f"score={listing.scoreConfiance}/100")
    if listing.ville:
        parts.append(f"ville={listing.ville}")
    if listing.typeLogement:
        parts.append(f"type={listing.typeLogement}")
    if listing.loyer is not None:
        parts.append(f"loyer={listing.loyer:.0f} MAD")
    if listing.photoCount is not None:
        parts.append(f"photos={listing.photoCount}")
    if listing.nbSignalements is not None:
        parts.append(f"signalements={listing.nbSignalements}")
    if listing.equipements:
        parts.append(f"equipements={', '.join(listing.equipements[:8])}")
    if listing.ownerTrustMessage:
        parts.append(f"messageProprietaire={listing.ownerTrustMessage}")
    return " | ".join(parts)


def _chat_context_text(req: ChatRequest) -> str:
    lines = [
        f"Role utilisateur: {req.role}",
        f"Langue demandée: {req.locale}",
        f"Permissions: {req.allowedTools}",
    ]
    if req.userProfile:
        lines.append(f"Profil utilisateur disponible: {req.userProfile}")
    if req.currentAnnonce:
        lines.append("Annonce courante visible par l'utilisateur:")
        lines.append(_chat_listing_line(req.currentAnnonce))
    if req.ownerListings and req.allowedTools.get("canDiscussOwnerListings"):
        lines.append("Annonces appartenant au propriétaire connecté (contexte privé autorisé uniquement pour expliquer statut/améliorations, pas pour recommandations publiques):")
        for listing in req.ownerListings[:10]:
            lines.append("- " + _chat_owner_listing_line(listing))
    lines.append(
        "Pour toute recherche d'annonces publiques, utilise l'outil search_annonces. "
        "Aucune annonce publique n'est listée dans ce contexte ; tu dois interroger la base."
    )
    return "\n".join(lines)


def _extract_json_object(raw: str) -> dict:
    text = re.sub(r"```(?:json)?\s*", "", raw or "", flags=re.IGNORECASE)
    text = text.replace("```", "").strip()
    start = text.find("{")
    if start == -1:
        raise ValueError(f"Aucun objet JSON dans la réponse : {text!r}")

    depth = 0
    end = -1
    in_string = False
    escaped = False
    for index in range(start, len(text)):
        char = text[index]
        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue
        if char == '"':
            in_string = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                end = index + 1
                break

    if end == -1:
        raise ValueError(f"Objet JSON incomplet : {text!r}")
    return json.loads(text[start:end])


# ---------------------------------------------------------------------------
# Chatbot tool-calling: Gemini function declarations + Spring Boot dispatcher
# ---------------------------------------------------------------------------
# The chatbot used to receive a pre-filtered batch of ~30 listings in every
# request prompt. That approach did not scale and broke negations like
# "appartement Berkane sans réfrigérateur" because the in-memory scorer in
# Spring Boot only handled positive equipment matches. We now expose three
# typed, read-only tools that Gemini can call to query the database directly
# through Spring Boot's internal endpoint.
#
# Security model: the backend filter (InternalApiKeyFilter) rejects requests
# missing the shared secret carried in X-Internal-API-Key. The Python service
# never builds SQL — it always sends a structured JSON payload that maps to
# JPA Specifications on the Spring side.

_SEARCH_ANNONCES_DECLARATION = genai.protos.FunctionDeclaration(
    name="search_annonces",
    description=(
        "Cherche des annonces VALIDÉES dans la base de données UniHome selon "
        "des filtres typés. Utilise ce tool dès que l'utilisateur demande des "
        "logements (\"appart à Casa\", \"studio sans WiFi\", \"chambre proche "
        "ENIAD\", etc.). Quand l'utilisateur dit \"sans X\" ou \"pas de X\", "
        "place X dans equipementsExclus pour exclure les annonces qui ont cet "
        "équipement. Quand il dit \"avec X\" place-le dans equipementsRequis."
    ),
    parameters=genai.protos.Schema(
        type=genai.protos.Type.OBJECT,
        properties={
            "ville": genai.protos.Schema(
                type=genai.protos.Type.STRING,
                description="Ville marocaine (Casablanca, Rabat, Berkane, etc.). Insensible à la casse et aux accents.",
            ),
            "typeLogement": genai.protos.Schema(
                type=genai.protos.Type.STRING,
                description="Type de logement.",
                enum=["STUDIO", "CHAMBRE", "COLOCATION", "APPARTEMENT"],
            ),
            "prixMin": genai.protos.Schema(type=genai.protos.Type.NUMBER, description="Loyer minimum en MAD."),
            "prixMax": genai.protos.Schema(type=genai.protos.Type.NUMBER, description="Loyer maximum en MAD."),
            "surfaceMin": genai.protos.Schema(type=genai.protos.Type.NUMBER, description="Surface minimum en m²."),
            "chargesIncluses": genai.protos.Schema(
                type=genai.protos.Type.BOOLEAN,
                description="True pour garder uniquement les annonces charges incluses.",
            ),
            "scoreConfianceMin": genai.protos.Schema(
                type=genai.protos.Type.INTEGER,
                description="Score de confiance minimum (0-100). Utilise 70 pour 'fiable', 50 pour 'correct'.",
            ),
            "equipementsRequis": genai.protos.Schema(
                type=genai.protos.Type.ARRAY,
                items=genai.protos.Schema(type=genai.protos.Type.STRING),
                description="Équipements OBLIGATOIREMENT présents (ex: ['WiFi','Cuisine équipée']).",
            ),
            "equipementsExclus": genai.protos.Schema(
                type=genai.protos.Type.ARRAY,
                items=genai.protos.Schema(type=genai.protos.Type.STRING),
                description=(
                    "Équipements à EXCLURE. À utiliser dès que l'utilisateur "
                    "dit 'sans X', 'pas de X', 'non meublé'. Ex: ['Réfrigérateur']."
                ),
            ),
            "autourUniversiteNom": genai.protos.Schema(
                type=genai.protos.Type.STRING,
                description="Nom d'université pour filtrer par proximité (ex: 'ENIAD', 'ENSIAS').",
            ),
            "rayonMetres": genai.protos.Schema(
                type=genai.protos.Type.INTEGER,
                description="Rayon de recherche autour de l'université en mètres (défaut 3000).",
            ),
            "limit": genai.protos.Schema(
                type=genai.protos.Type.INTEGER,
                description="Nombre max de résultats à retourner (défaut 10, max 20).",
            ),
        },
    ),
)

_GET_ANNONCE_DETAILS_DECLARATION = genai.protos.FunctionDeclaration(
    name="get_annonce_details",
    description=(
        "Récupère le détail complet d'une annonce par UUID (description longue, "
        "tous les équipements, photos, statut, etc.). À appeler après search_annonces "
        "uniquement quand l'utilisateur veut zoomer sur une annonce précise."
    ),
    parameters=genai.protos.Schema(
        type=genai.protos.Type.OBJECT,
        properties={
            "annonceId": genai.protos.Schema(
                type=genai.protos.Type.STRING,
                description="UUID de l'annonce.",
            ),
        },
        required=["annonceId"],
    ),
)

_GET_OWNER_LISTINGS_DECLARATION = genai.protos.FunctionDeclaration(
    name="get_owner_listings",
    description=(
        "Liste les annonces du propriétaire connecté (tous statuts confondus). "
        "À n'appeler que si canDiscussOwnerListings=true dans le contexte. Sert "
        "à expliquer pourquoi une annonce est en attente / rejetée et comment l'améliorer."
    ),
    parameters=genai.protos.Schema(type=genai.protos.Type.OBJECT, properties={}),
)

_CHATBOT_TOOLS = [genai.protos.Tool(function_declarations=[
    _SEARCH_ANNONCES_DECLARATION,
    _GET_ANNONCE_DETAILS_DECLARATION,
    _GET_OWNER_LISTINGS_DECLARATION,
])]


def _internal_headers() -> dict[str, str]:
    return {
        "X-Internal-API-Key": INTERNAL_API_KEY,
        "Content-Type": "application/json",
    }


async def _call_search_annonces(args: dict, _req: ChatRequest) -> dict:
    """POST /api/internal/chatbot/search with the args Gemini produced."""
    # Hard-cap the limit even if Gemini tries to ask for more.
    if "limit" in args and isinstance(args["limit"], (int, float)):
        args["limit"] = min(int(args["limit"]), CHATBOT_TOOL_MAX_RESULTS)
    async with httpx.AsyncClient(timeout=CHATBOT_TOOL_TIMEOUT_S) as client:
        resp = await client.post(
            f"{BACKEND_INTERNAL_URL}/api/internal/chatbot/search",
            json=args,
            headers=_internal_headers(),
        )
    resp.raise_for_status()
    results = resp.json() if resp.content else []
    return {"count": len(results), "results": results}


async def _call_get_annonce_details(args: dict, _req: ChatRequest) -> dict:
    annonce_id = args.get("annonceId")
    if not annonce_id:
        return {"error": "annonceId is required"}
    async with httpx.AsyncClient(timeout=CHATBOT_TOOL_TIMEOUT_S) as client:
        resp = await client.get(
            f"{BACKEND_INTERNAL_URL}/api/internal/chatbot/annonces/{annonce_id}",
            headers=_internal_headers(),
        )
    if resp.status_code == 404:
        return {"error": "annonce introuvable", "annonceId": annonce_id}
    resp.raise_for_status()
    return {"annonce": resp.json()}


async def _call_get_owner_listings(_args: dict, req: ChatRequest) -> dict:
    """
    Returns the owner's listings only when the frontend told us we can
    discuss them. Gemini receives a deterministic refusal otherwise, which
    keeps the LLM honest about scopes.
    """
    if not req.allowedTools.get("canDiscussOwnerListings"):
        return {
            "error": (
                "Cet utilisateur n'a pas accès aux annonces propriétaire. "
                "Ne propose pas de discuter d'annonces propriétaire."
            )
        }
    # The Spring side already provided the owner listings (small payload) so
    # we just echo them back to keep latency low. If the data becomes too
    # large in the future, switch to /api/internal/chatbot/owner/{ownerId}.
    owner_payload = [
        {
            "id": listing.id,
            "titre": listing.titre,
            "statut": listing.statut,
            "scoreConfiance": listing.scoreConfiance,
            "loyer": listing.loyer,
            "ville": listing.ville,
            "typeLogement": listing.typeLogement,
            "photoCount": listing.photoCount,
            "nbSignalements": listing.nbSignalements,
            "equipements": listing.equipements,
            "ownerTrustMessage": listing.ownerTrustMessage,
        }
        for listing in req.ownerListings
    ]
    return {"count": len(owner_payload), "results": owner_payload}


_TOOL_DISPATCH = {
    "search_annonces": _call_search_annonces,
    "get_annonce_details": _call_get_annonce_details,
    "get_owner_listings": _call_get_owner_listings,
}


def _proto_to_py(value):
    """Recursively convert google.protobuf wrapper types (Struct, MapComposite,
    RepeatedComposite, Value) into plain Python dict/list/str/int/float/bool so
    they are JSON-serializable for httpx and downstream logging.
    """
    # Plain primitives pass through.
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    # Mappings (dict-like, MapComposite).
    try:
        items = value.items()
        return {str(k): _proto_to_py(v) for k, v in items}
    except (AttributeError, TypeError):
        pass
    # Iterables (list, RepeatedComposite). Exclude strings (already handled).
    try:
        iterator = iter(value)
        return [_proto_to_py(item) for item in iterator]
    except TypeError:
        pass
    # Last-resort: stringify.
    return str(value)


async def _dispatch_tool_call(name: str, args: dict, req: ChatRequest) -> dict:
    handler = _TOOL_DISPATCH.get(name)
    if handler is None:
        logger.warning("Unknown tool requested by Gemini: %s", name)
        return {"error": f"Outil inconnu: {name}"}
    try:
        return await handler(args, req)
    except httpx.HTTPStatusError as exc:
        logger.warning("Tool %s -> backend HTTP error: %s", name, exc)
        return {"error": f"Erreur backend ({exc.response.status_code})", "details": exc.response.text[:200]}
    except Exception as exc:
        logger.warning("Tool %s failed: %s", name, exc)
        return {"error": f"Erreur tool: {exc}"}


def _extract_function_calls(response) -> list:
    """Returns every function_call part across the response candidates."""
    calls = []
    try:
        for candidate in response.candidates or []:
            content = getattr(candidate, "content", None)
            if not content:
                continue
            for part in getattr(content, "parts", []) or []:
                fc = getattr(part, "function_call", None)
                if fc and getattr(fc, "name", ""):
                    calls.append(fc)
    except Exception as exc:
        logger.debug("Could not introspect function_calls: %s", exc)
    return calls


def _build_genai_history(history: list[ChatHistoryMessage]) -> list:
    """Converts our Redis history to the format expected by start_chat()."""
    converted = []
    for message in history[-CHAT_HISTORY_MAX_MESSAGES:]:
        role = "user" if message.role == "user" else "model"
        text = (message.content or "").strip()
        if not text:
            continue
        converted.append({"role": role, "parts": [text]})
    return converted


def _final_text(response) -> str:
    """Best-effort extraction of plain text from a possibly tool-heavy response."""
    chunks = []
    for candidate in response.candidates or []:
        content = getattr(candidate, "content", None)
        if not content:
            continue
        for part in getattr(content, "parts", []) or []:
            text = getattr(part, "text", "") or ""
            if text:
                chunks.append(text)
    return "\n".join(chunks).strip()


CHATBOT_TOOL_SYSTEM_PROMPT = CHATBOT_SYSTEM_PROMPT + """

━━━ ACCÈS BASE DE DONNÉES (tool-calling) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tu disposes de 3 outils pour interroger la base UniHome :
1. search_annonces(filtres) — Cherche des annonces VALIDÉES. Appelle cet
   outil dès qu'on te demande de trouver/lister/recommander des logements.
   Traduction des intentions en filtres :
   • "à Casa", "à Berkane" → ville
   • "studio", "chambre", "colocation", "appartement" → typeLogement
   • "moins de 3000 DH", "max 3000" → prixMax = 3000
   • "minimum 2000" → prixMin = 2000
   • "au moins 30 m²" → surfaceMin = 30
   • "avec WiFi", "meublé" → equipementsRequis
   • "sans réfrigérateur", "pas de clim", "non meublé" → equipementsExclus
   • "proche ENIAD", "près de l'ENSIAS" → autourUniversiteNom (rayonMetres ≈ 3000)
   • "fiable", "bon score" → scoreConfianceMin = 70
2. get_annonce_details(annonceId) — Détails complets d'une annonce précise.
3. get_owner_listings() — Annonces du propriétaire connecté. À n'utiliser
   QUE si canDiscussOwnerListings=true dans le contexte.

Procédure stricte :
- Si l'utilisateur cherche un logement, appelle search_annonces AVANT de répondre.
- Si zéro résultat, propose de relâcher un critère (suggère lequel concrètement).
- Tu peux enchaîner search_annonces puis get_annonce_details si nécessaire.
- Ne devine JAMAIS d'annonce qui n'est pas dans le résultat des outils.

Format final (APRÈS tous les appels d'outils) : un objet JSON unique avec
la structure {reply, suggestedListingIds, listingReasons, quickReplies}.
- suggestedListingIds contient uniquement des UUIDs renvoyés par tes appels d'outils.
- listingReasons : 2 raisons max par annonce.
- quickReplies : 2 à 4 suggestions courtes.
""".strip()


async def _run_chatbot_tool_loop(
    req: ChatRequest,
    history: list[ChatHistoryMessage],
) -> ChatResponse:
    """
    Multi-turn chat session: Gemini decides when to call our tools, we execute
    them against Spring Boot, feed the JSON results back, and finally extract
    the plain-text JSON answer. Hard-capped at CHATBOT_TOOL_MAX_TURNS to keep
    latency bounded.
    """
    last_error: Exception | None = None
    final_response = None

    for model_name in _candidate_model_names():
        try:
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=CHATBOT_TOOL_SYSTEM_PROMPT,
                generation_config=CHAT_TOOL_GENERATION_CONFIG,
                safety_settings=SAFETY_SETTINGS,
                tools=_CHATBOT_TOOLS,
            )
            chat = model.start_chat(history=_build_genai_history(history))
            user_prompt = (
                f"Contexte UniHome :\n{_chat_context_text(req)}\n\n"
                f"Message utilisateur : {req.message}\n\n"
                "Réponds en respectant les règles JSON ci-dessus."
            )
            response = await chat.send_message_async(user_prompt)

            for turn in range(CHATBOT_TOOL_MAX_TURNS):
                fc_parts = _extract_function_calls(response)
                if not fc_parts:
                    break

                logger.info(
                    "Chatbot turn %d/%d - %d tool call(s): %s",
                    turn + 1,
                    CHATBOT_TOOL_MAX_TURNS,
                    len(fc_parts),
                    [fc.name for fc in fc_parts],
                )

                tool_responses = []
                for fc in fc_parts:
                    args = _proto_to_py(fc.args) if fc.args else {}
                    if not isinstance(args, dict):
                        args = {}
                    result = await _dispatch_tool_call(fc.name, args, req)
                    tool_responses.append(
                        genai.protos.Part(
                            function_response=genai.protos.FunctionResponse(
                                name=fc.name,
                                response={"result": result},
                            )
                        )
                    )
                response = await chat.send_message_async(tool_responses)
            else:
                logger.warning(
                    "Chatbot tool loop reached max turns (%d); forcing final answer.",
                    CHATBOT_TOOL_MAX_TURNS,
                )

            final_response = response
            if model_name != MODEL_NAME:
                logger.info("Gemini chatbot fallback model used: %s", model_name)
            break
        except Exception as exc:
            last_error = exc
            logger.warning("Gemini chatbot tool-loop on %s failed: %s", model_name, exc)

    if final_response is None:
        raise last_error or RuntimeError("No Gemini model available for chat")

    text = _final_text(final_response)
    if not text:
        raise ValueError("Réponse Gemini sans texte exploitable.")
    data = _extract_json_object(text)
    chat_response = ChatResponse.model_validate(data)

    # Hard validation: suggestedListingIds must not invent IDs. Drop anything
    # that does not look like a UUID; the frontend will resolve them against
    # the public listings endpoint anyway.
    uuid_pattern = re.compile(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")
    valid_ids = [lid for lid in chat_response.suggestedListingIds if uuid_pattern.match(lid or "")]
    chat_response.suggestedListingIds = valid_ids
    chat_response.listingReasons = {
        lid: reasons[:2]
        for lid, reasons in chat_response.listingReasons.items()
        if lid in valid_ids
    }
    return chat_response


async def call_chat_model(req: ChatRequest, history: list[ChatHistoryMessage] | None = None) -> ChatResponse:
    """
    Thin wrapper that delegates to the tool-calling loop. The pre-tool
    implementation stuffed up to 30 listings into the prompt; it is now
    replaced by Gemini function-calling so the model queries Spring Boot's
    database endpoints on demand.
    """
    return await _run_chatbot_tool_loop(req, history or [])


def _fallback_chat_response(req: ChatRequest) -> ChatResponse:
    message = (req.message or "").lower()
    owner_terms = ["mon annonce", "mes annonces", "statut", "rejet", "attente", "amélior", "amelior", "pourquoi"]
    if req.ownerListings and req.allowedTools.get("canDiscussOwnerListings") and any(term in message for term in owner_terms):
        summaries = []
        for listing in req.ownerListings[:3]:
            status = listing.statut or "statut non renseigné"
            score = f"{listing.scoreConfiance}/100" if listing.scoreConfiance is not None else "score en attente"
            advice = listing.ownerTrustMessage or "Ajoutez une description précise, plusieurs photos nettes et des justificatifs cohérents."
            summaries.append(f"- {listing.titre or listing.id}: {status}, {score}. {advice}")
        reply = "Je peux expliquer uniquement vos propres annonces.\n" + "\n".join(summaries)
        return ChatResponse(
            reply=reply,
            suggestedListingIds=[],
            listingReasons={},
            quickReplies=["Comment améliorer mon annonce ?", "Pourquoi mon annonce est en attente ?", "Expliquer le score"],
        )
    if "score" in message or "confiance" in message:
        reply = (
            "Le score de confiance UniHome aide à évaluer la cohérence d'une annonce. "
            "Il ne garantit pas légalement le logement : visitez toujours avant tout paiement."
        )
    elif "signaler" in message or "arnaque" in message or "fraude" in message:
        reply = (
            "Pour signaler une annonce suspecte, ouvrez sa page détail et utilisez l'option de signalement. "
            "UniHome peut suspendre une annonce après plusieurs signalements."
        )
    else:
        reply = (
            "Je peux vous aider à comprendre UniHome, chercher des logements validés ou expliquer le score de confiance. "
            "Précisez votre ville et votre budget pour que je lance une recherche."
        )
    return ChatResponse(
        reply=reply,
        suggestedListingIds=[],
        listingReasons={},
        quickReplies=["Trouver un studio", "Comment fonctionne le score ?", "Signaler une arnaque"],
    )
 
 
# ---------------------------------------------------------------------------
# Application FastAPI
# ---------------------------------------------------------------------------
 
app = FastAPI(
    title="UniHome – Fraud Detection Service (Enterprise v2)",
    description=(
        "Analyse multimodale anti-fraude des annonces immobilières étudiantes. "
        "Gemini 1.5 Flash Vision · Async · Tenacity Retries · Structured Output."
    ),
    version="2.0.0",
)
 
 
@app.get("/health", tags=["Infra"])
async def health_check():
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "fallbackModels": FALLBACK_MODEL_NAMES,
        "redisMemoryEnabled": bool(redis_async and REDIS_URL),
        "chatHistoryTtlSeconds": CHAT_HISTORY_TTL_SECONDS,
        "chatHistoryMaxMessages": CHAT_HISTORY_MAX_MESSAGES,
        "version": "2.0.0",
    }


@app.post("/chat", response_model=ChatResponse, tags=["Chatbot"])
async def chatbot_chat(req: ChatRequest) -> ChatResponse:
    logger.info(
        "► Chatbot – role=%s | hasCurrent=%s | ownerListings=%d | session=%s",
        req.role,
        req.currentAnnonce is not None,
        len(req.ownerListings),
        req.sessionId,
    )
    history = await _load_chat_history(req.sessionId)
    try:
        response = await call_chat_model(req, history)
    except Exception as exc:
        logger.warning("Chatbot Gemini indisponible ou réponse invalide, fallback local : %s", exc)
        response = _fallback_chat_response(req)
    await _save_chat_turn(req.sessionId, req.message, response.reply)
    return response
 
 
@app.post(
    "/analyze-listing",
    response_model=AnalysisResponse,
    summary="Analyse multimodale d'une annonce (Vision + Texte)",
    tags=["Fraud Detection"],
)
async def analyze_listing(listing: ListingRequest) -> AnalysisResponse:
    logger.info(
        "► Analyse – titre=%r | prix=%.0f MAD | photos=%d | justif=%s",
        listing.titre,
        listing.prix,
        len(listing.photoUrls),
        "oui" if listing.justificatifUrl else "non",
    )
 
    # 1. Téléchargement parallèle des assets
    photos, justif = await download_assets(listing.photoUrls, listing.justificatifUrl)
    logger.info(
        "  Assets prêts – photos téléchargées : %d/%d | justificatif : %s",
        len(photos),
        min(len(listing.photoUrls), MAX_PHOTO_DOWNLOADS),
        "oui" if justif else "non",
    )
 
    # 2. Construction des parts multimodaux
    content_parts = build_content_parts(listing, photos, justif)
 
    # 3. Appel Gemini (async + retry automatique)
    try:
        raw_json, finish_reason = await call_gemini(content_parts)
    except Exception as exc:
        logger.exception("Gemini indisponible après 3 tentatives : %s", exc)
        raise HTTPException(
            status_code=500,
            detail=f"Service IA indisponible après 3 tentatives : {exc}",
        ) from exc
 
    # Guard : réponse tronquée → on log mais on tente quand même le parse
    # (Gemini peut retourner MAX_TOKENS alors que le JSON est complet dans raw_json)
    if finish_reason and finish_reason.name != "STOP":
        logger.warning(
            "Gemini finish_reason=%s — tentative de parse partiel | raw=%r",
            finish_reason.name, raw_json,
        )
 
    logger.debug("Gemini raw response : %s", raw_json)
 
    # 4. Désérialisation défensive + validation Pydantic
    try:
        ai_result = _parse_gemini_json(raw_json)
        result = apply_strict_business_rules(listing, ai_result, justif)
    except Exception as exc:
        logger.error("Réponse Gemini invalide : %r – erreur : %s", raw_json, exc)
        raise HTTPException(
            status_code=500,
            detail=f"Réponse IA mal structurée : {exc}",
        ) from exc
 
    logger.info(
        "◄ Score – global=%d | desc=%d | prix=%d | photos=%d | justif=%d | coherence=%d",
        result.scoreGlobal,
        result.detailScore.description,
        result.detailScore.prix,
        result.detailScore.photos,
        result.detailScore.justificatif,
        result.detailScore.coherence,
    )
    logger.info("◄ Raisonnement – %s", result.raisonnement)
    return result
 
 
# ---------------------------------------------------------------------------
# Lancement direct
# ---------------------------------------------------------------------------
 
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=os.getenv("RELOAD", "true").lower() in {"1", "true", "yes"},
    )
 