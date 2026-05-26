import fitz
from fastapi import UploadFile
import io
import logging

logger = logging.getLogger(__name__)

class PDFService:
    async def extract_text(self, file: UploadFile) -> str:
        try:
            content = await file.read()
            # Open PDF with PyMuPDF
            doc = fitz.open(stream=content, filetype="pdf")
            text = ""
            for page in doc:
                text += page.get_text() + "\n"
            return text
        except Exception as e:
            logger.error(f"PyMuPDF error: {str(e)}")
            raise e
