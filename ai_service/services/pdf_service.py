from pypdf import PdfReader
from fastapi import UploadFile
import io

class PDFService:
    async def extract_text(self, file: UploadFile) -> str:
        content = await file.read()
        pdf_file = io.BytesIO(content)
        reader = PdfReader(pdf_file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
