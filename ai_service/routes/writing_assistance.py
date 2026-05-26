from fastapi import APIRouter, HTTPException
from models.schemas import WritingRequest, WritingResponse
from services.groq_service import GroqService
from services.gemini_service import GeminiService
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize services lazily
_groq_service = None
_gemini_service = None

def get_groq_service():
    global _groq_service
    if _groq_service is None:
        _groq_service = GroqService()
    return _groq_service

def get_gemini_service():
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service

@router.post("/check", response_model=WritingResponse)
async def check_writing(request: WritingRequest):
    try:
        # Use Groq for everything
        service = get_groq_service()
        result = await service.check_writing(request.text, request.context)
        return WritingResponse(
            original_text=request.text,
            improved_text=result.get("improved_text", ""),
            feedback=result.get("feedback", []),
            score=result.get("score", 0)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/improve", response_model=WritingResponse)
async def improve_writing(request: WritingRequest):
    try:
        # Use Groq for everything
        service = get_groq_service()
        result = await service.improve_writing(request.text, request.context)
        return WritingResponse(
            original_text=request.text,
            improved_text=result.get("improved_text", ""),
            feedback=result.get("feedback", []),
            score=result.get("score", 0)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
