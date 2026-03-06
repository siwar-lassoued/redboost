from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class WritingRequest(BaseModel):
    text: str
    type: str  # "check", "improve", "rephrase"
    context: Optional[str] = None
    model: Optional[str] = "mistral"  # "mistral" (default) or "gemini"

class WritingResponse(BaseModel):
    original_text: str
    improved_text: str
    feedback: List[str]
    score: Optional[int] = None

class ProgramAnalysisResponse(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    comparisons: List[Dict[str, Any]]
    recommendations: List[str]
    custom_feedback: Optional[str] = None
