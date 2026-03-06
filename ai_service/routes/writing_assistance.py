from fastapi import APIRouter, HTTPException
from models.schemas import WritingRequest, WritingResponse
from services.gemini_service import GeminiService
from services.mistral_service import MistralService

router = APIRouter()

# Initialize services lazily
_gemini_service = None
_mistral_service = None

def get_gemini_service():
    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService()
    return _gemini_service

def get_mistral_service():
    global _mistral_service
    if _mistral_service is None:
        _mistral_service = MistralService()
    return _mistral_service

@router.post("/check", response_model=WritingResponse)
async def check_writing(request: WritingRequest):
    try:
        # Choose the service based on the model parameter
        service = get_mistral_service() if request.model == "mistral" else get_gemini_service()
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
        # Choose the service based on the model parameter
        service = get_mistral_service() if request.model == "mistral" else get_gemini_service()
        result = await service.improve_writing(request.text, request.context)
        return WritingResponse(
            original_text=request.text,
            improved_text=result.get("improved_text", ""),
            feedback=result.get("feedback", []),
            score=result.get("score", 0)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
