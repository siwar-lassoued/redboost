from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import List
from models.schemas import ProgramAnalysisResponse
from services.gemini_service import GeminiService
from services.mistral_service import MistralService
from services.pdf_service import PDFService

router = APIRouter()

# Initialize services lazily
_gemini_service = None
_mistral_service = None
_pdf_service = None

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

def get_pdf_service():
    global _pdf_service
    if _pdf_service is None:
        _pdf_service = PDFService()
    return _pdf_service

@router.post("/compare", response_model=ProgramAnalysisResponse)
async def compare_programs(
    recent_program: UploadFile = File(...),
    reference_programs: List[UploadFile] = File(...),
    model: str = Form("mistral")
):
    try:
        pdf_service = get_pdf_service()
        llm_service = get_mistral_service() if model == "mistral" else get_gemini_service()
        
        # Extract text from recent program
        recent_text = await pdf_service.extract_text(recent_program)
        
        # Extract text from reference programs
        reference_texts = []
        for ref_file in reference_programs:
            text = await pdf_service.extract_text(ref_file)
            reference_texts.append(text)
            
        # Analyze using selected model
        result = await llm_service.analyze_programs(recent_text, reference_texts)
        
        return ProgramAnalysisResponse(
            strengths=result.get("strengths", []),
            weaknesses=result.get("weaknesses", []),
            comparisons=result.get("comparisons", []),
            recommendations=result.get("recommendations", []),
            custom_feedback=result.get("custom_feedback", "")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
