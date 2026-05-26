from fastapi import APIRouter, HTTPException, UploadFile, File
from services.pdf_service import PDFService
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

pdf_service = PDFService()

@router.post("/extract")
async def extract_pdf_text(file: UploadFile = File(...)):
    """
    Extracts text from a PDF file using PyMuPDF.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
        
    try:
        text = await pdf_service.extract_text(file)
        return {"text": text}
    except Exception as e:
        logger.error(f"Error extracting text from PDF: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to extract text: {str(e)}")
