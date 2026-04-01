from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from services.gemini_service import GeminiService
import json

router = APIRouter()
gemini_service = GeminiService()

class MatchingRequest(BaseModel):
    coaches: List[Dict[str, Any]]
    entrepreneurs: List[Dict[str, Any]]
    programme: Dict[str, Any]
    thematique: Optional[Dict[str, Any]] = None


@router.post("/run")
async def run_matching(request: MatchingRequest):
    """
    Run AI-powered coach-entrepreneur matching.
    Uses Gemini to analyze profiles and return optimal matchings with scores.
    """
    try:
        result = await gemini_service.run_matching(
            coaches=request.coaches,
            entrepreneurs=request.entrepreneurs,
            programme=request.programme,
            thematique=request.thematique
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur IA matching: {str(e)}")
