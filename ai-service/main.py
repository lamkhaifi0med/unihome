"""
UniHome – Fraud Detection Microservice  (Enterprise-Grade v2)
=============================================================
Stack : FastAPI · Gemini 1.5 Flash (Vision) · httpx async · tenacity
"""

from __future__ import annotations

import asyncio
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

# ---------------------------------------------------------------------------
# Bootstrap
# ---------------------------------------------------------------------------

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s – %(message)s",
)
logger = logging.getLogger("unihome.fraud")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise EnvironmentError("GEMINI_API_KEY manquante dans le fichier .env")

genai.configure(api_key=GEMINI_API_KEY)

MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-flash-latest")
MAX_PHOTO_DOWNLOADS = 5          # On analyse jusqu'à 5 photos échantillonnées
DOWNLOAD_TIMEOUT_S  = 40.0       # Timeout par requête HTTP (secondes)
MAX_ASSET_BYTES     = 5_000_000  # 5 Mo – on ignore les fichiers trop lourds

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
 
 
# ---------------------------------------------------------------------------
# GenerationConfig — schéma JSON imposé via le prompt (plus fiable en multimodal)
# et provoque une troncature silencieuse du JSON. Le format est imposé via le prompt.
# ---------------------------------------------------------------------------
 
GENERATION_CONFIG = GenerationConfig(
    response_mime_type="application/json",  # Désactive le wrapping Markdown
    temperature=0.1,
    max_output_tokens=2048,
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
    Appel asynchrone à Gemini 1.5 Flash avec jusqu'à 3 tentatives.
    Retourne (raw_json_text, finish_reason).
    """
    model = genai.GenerativeModel(
        model_name=MODEL_NAME,
        system_instruction=SYSTEM_PROMPT,
        generation_config=GENERATION_CONFIG,
        safety_settings=SAFETY_SETTINGS,
    )
    response = await model.generate_content_async(content_parts)
    finish_reason = response.candidates[0].finish_reason if response.candidates else None
    return response.text, finish_reason
 
 
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
    return {"status": "ok", "model": MODEL_NAME, "version": "2.0.0"}
 
 
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
 