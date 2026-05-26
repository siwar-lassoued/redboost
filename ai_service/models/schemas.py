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


# ─── Enriched Matching (called by Spring Boot) ──────────────────

class EnrichedMatchingRequest(BaseModel):
    """
    Spring Boot collects all data from MySQL (profiles, candidatures, CV text
    extracted via PDFBox, form answers) and sends it here as a single payload.
    """
    coaches: List[Dict[str, Any]]
    entrepreneurs: List[Dict[str, Any]]
    programme: Dict[str, Any]
    thematique: Optional[Dict[str, Any]] = None


# ─── Enriched Reporting (called by Spring Boot) ─────────────────

class BinomaData(BaseModel):
    coach_id: int
    coach_name: str
    entrepreneur_id: int
    entrepreneur_name: str
    sessions_total: int = 0
    sessions_realisees: int = 0
    sessions_annulees: int = 0
    taches_total: int = 0
    taches_terminees: int = 0
    taches_en_retard: int = 0
    taches_bloquees: int = 0
    livrables_soumis: int = 0

class EnrichedReportingRequest(BaseModel):
    """
    Spring Boot collects planning data (sessions, taches, livrables) for the
    selected period, computes per-binôme stats, extracts document text, and
    sends everything here for AI analysis.
    """
    programme_name: str
    programme_id: int
    date_debut: str
    date_fin: str
    period_type: str

    # Pre-computed metrics
    total_sessions: int = 0
    sessions_realisees: int = 0
    sessions_planifiees: int = 0
    sessions_annulees: int = 0

    total_taches: int = 0
    taches_terminees: int = 0
    taches_en_cours: int = 0
    taches_bloquees: int = 0
    taches_en_retard: int = 0

    total_livrables: int = 0
    livrables_approuves: int = 0

    # Per-binôme breakdown
    binomes: List[BinomaData] = []

    # Context text: documents, activities, session notes — all extracted by Java
    context_text: str = ""
