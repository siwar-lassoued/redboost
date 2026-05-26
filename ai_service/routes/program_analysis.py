from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import List
from models.schemas import ProgramAnalysisResponse
from services.groq_service import GroqService
from services.mistral_service import MistralService
from services.pdf_service import PDFService
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize services lazily
_groq_service = None
_mistral_service = None
_pdf_service = None

def get_groq_service():
    global _groq_service
    if _groq_service is None:
        _groq_service = GroqService()
    return _groq_service

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
    model: str = Form("groq")
):
    try:
        pdf_service = get_pdf_service()
        llm_service = get_mistral_service() if model == "mistral" else get_groq_service()
        
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
