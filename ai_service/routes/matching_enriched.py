from fastapi import APIRouter, HTTPException
from models.schemas import EnrichedMatchingRequest
from services.groq_service import GroqService
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Lazy init — reuses the same GroqService / GROQ_API_KEY from .env
_groq_service = None

def get_groq_service():
    global _groq_service
    if _groq_service is None:
        _groq_service = GroqService()
    return _groq_service


@router.post("/run-enriched")
async def run_enriched_matching(request: EnrichedMatchingRequest):
    """
    Enriched AI matching — called by Spring Boot backend.
    Spring Boot sends pre-collected data (profiles, CV text, candidature answers).
    Returns TOP 3 coaches per entrepreneur with detailed scoring.
    """
    try:
        service = get_groq_service()
        payload = request.model_dump()
        logger.info(
            "Enriched matching: %d coaches, %d entrepreneurs, programme=%s",
            len(payload.get("coaches", [])),
            len(payload.get("entrepreneurs", [])),
            payload.get("programme", {}).get("nom", "?")
        )
        result = await service.run_enriched_matching(payload)
        return result
    except Exception as e:
        logger.error("Enriched matching failed: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Erreur IA matching enrichi: {str(e)}")
