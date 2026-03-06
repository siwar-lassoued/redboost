from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import writing_assistance, program_analysis
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="RedStart AI API",
    description="API for writing assistance and program analysis using Gemini",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(writing_assistance.router, prefix="/api/writing", tags=["Writing Assistance"])
app.include_router(program_analysis.router, prefix="/api/analysis", tags=["Program Analysis"])

@app.get("/")
async def root():
    return {"message": "Welcome to RedStart AI API"}
