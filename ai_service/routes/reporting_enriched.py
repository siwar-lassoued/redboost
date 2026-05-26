from fastapi import APIRouter, HTTPException
from models.schemas import EnrichedReportingRequest
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


@router.post("/generate")
async def generate_report(request: EnrichedReportingRequest):
    """
    AI-powered reporting — called by Spring Boot backend.
    Spring Boot collects planning data (sessions, tâches, livrables) for the
    selected period, computes per-binôme stats, extracts document text, and
    sends everything here for AI analysis.
    Returns structured JSON with executive summary, KPIs, alerts,
    best/worst performers, and actionable recommendations.
    """
    try:
        service = get_groq_service()
        payload = request.model_dump()
        logger.info(
            "Report generation: programme=%s, period=%s to %s, binomes=%d",
            payload.get("programme_name", "?"),
            payload.get("date_debut", "?"),
            payload.get("date_fin", "?"),
            len(payload.get("binomes", []))
        )
        result = await service.generate_report(payload)
        return result
    except Exception as e:
        logger.error("Report generation failed: %s", str(e))
        raise HTTPException(status_code=500, detail=f"Erreur IA reporting: {str(e)}")
