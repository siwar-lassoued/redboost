import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import writing_assistance, program_analysis, matching_enriched, reporting_enriched, ocr

app = FastAPI(
    title="RedStart AI API",
    description="API IA pour l'assistance rédactionnelle, l'analyse de programmes, le matching enrichi et le reporting — propulsée par Gemini",
    version="3.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, remplacer par l'origine frontend spécifique
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(writing_assistance.router, prefix="/api/writing", tags=["Writing Assistance"])
app.include_router(program_analysis.router, prefix="/api/analysis", tags=["Program Analysis"])
app.include_router(matching_enriched.router, prefix="/api/matching", tags=["AI Matching Enriched"])
app.include_router(reporting_enriched.router, prefix="/api/reporting", tags=["AI Reporting"])
app.include_router(ocr.router, prefix="/api/ocr", tags=["OCR Extraction"])

@app.get("/")
async def root():
    return {"message": "Welcome to RedStart AI API v2"}

