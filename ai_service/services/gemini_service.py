import google.generativeai as genai
import os
from typing import List, Dict, Any
import json

class GeminiService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash')

    async def check_writing(self, text: str, context: str = None) -> Dict[str, Any]:
        prompt = f"""
        Act as a professional writing assistant. Analyze the following text and provide corrections for grammar, spelling, and style.
        
        Text to analyze:
        {text}
        
        Context (optional): {context if context else "None"}
        
        Return the response in JSON format with the following structure:
        {{
            "improved_text": "The corrected version of the text",
            "feedback": ["List of specific corrections and explanations"],
            "score": 85 (an integer score from 0-100 based on quality)
        }}
        """
        response = self.model.generate_content(prompt)
        return self._parse_json_response(response.text)

    async def improve_writing(self, text: str, context: str = None) -> Dict[str, Any]:
        prompt = f"""
        Act as a professional editor. Rewrite the following text to make it more professional, clear, and impactful.
        
        Text to improve:
        {text}
        
        Context (optional): {context if context else "None"}
        
        Return the response in JSON format with the following structure:
        {{
            "improved_text": "The improved version of the text",
            "feedback": ["List of improvements made (e.g., better vocabulary, sentence structure)"],
            "score": 90 (an integer score from 0-100 based on quality)
        }}
        """
        response = self.model.generate_content(prompt)
        return self._parse_json_response(response.text)

    async def analyze_programs(self, recent_program_text: str, reference_programs_texts: List[str]) -> Dict[str, Any]:
        prompt = f"""
        Tu es un évaluateur de programmes. Compare le "Programme Récent" avec les "Programmes de Référence" ci-dessous.
        Identifie les forces, les faiblesses et propose des recommandations actionnables.
        IMPORTANT: réponds uniquement en français.
        
        Contenu du Programme Récent:
        {recent_program_text[:30000]} 
        
        Contenu des Programmes de Référence (résumé de {len(reference_programs_texts)} programmes):
        {" ".join([text[:10000] for text in reference_programs_texts])}
        
        Retourne strictement une réponse JSON avec cette structure:
        {{
            "strengths": ["Liste des points forts du programme récent par rapport aux références"],
            "weaknesses": ["Liste des points faibles ou éléments manquants dans le programme récent"],
            "comparisons": [
                {{"aspect": "Curriculum", "recent": "Le programme récent met l'accent sur X", "reference": "Les références mettent plutôt l'accent sur Y", "verdict": "Meilleur/Plus faible/Différent"}}
            ],
            "recommendations": ["Liste de recommandations concrètes pour améliorer le programme récent"],
            "custom_feedback": "Paragraphe de synthèse critique en français"
        }}
        """
        response = self.model.generate_content(prompt)
        return self._parse_json_response(response.text)

    async def run_matching(self, coaches: List[Dict], entrepreneurs: List[Dict], 
                           programme: Dict, thematique: Dict = None) -> Dict[str, Any]:
        """
        Run AI-powered coach-entrepreneur matching.
        The thématique (if provided) influences the scoring — coaches whose expertise 
        matches the thématique get higher scores.
        """
        
        thematique_context = ""
        if thematique:
            thematique_context = f"""
THÉMATIQUE DE COACHING : {thematique.get('nom', 'Non spécifiée')}
Description : {thematique.get('description', '')}
Période : {thematique.get('dateDebut', '')} → {thematique.get('dateFin', '')}

Le matching doit PRIORISER les coaches dont l'expertise correspond directement 
à cette thématique. Le critère "Alignement thématique" vaut 30% du score."""
        
        system_prompt = f"""Tu es un expert RH et coach de startups. Tu effectues le matching entre
des coachs et des entrepreneurs dans le cadre d'un programme d'accompagnement.

{thematique_context}

Tu calcules un score de compatibilité 0-100 selon 5 critères pondérés :

1. Alignement thématique (30%) :
   L'expertise du coach correspond-elle à la thématique demandée ?
   Si pas de thématique spécifique, évaluer l'alignement général des compétences.

2. Alignement sectoriel (25%) :
   Le secteur du coach ↔ secteur de l'entrepreneur ↔ secteurs du programme.
   Les 3 doivent s'aligner pour un score maximal.

3. Compétences complémentaires (20%) :
   Les besoins d'accompagnement de l'entrepreneur sont-ils couverts 
   par les skills/expertise du coach ?

4. Stade de maturité (15%) :
   La phase de maturité de l'entrepreneur (idée/MVP/croissance/scale) 
   est-elle compatible avec l'expérience du coach ?

5. Charge coach (10%) :
   Score = (1 - nb_entrepreneurs_actifs/5) * 100
   Un coach avec 0 entrepreneur actif score 100%.
   Un coach avec 5+ est en surcharge → alerte.

Propose LE MEILLEUR coach pour chaque entrepreneur.
Base ta justification sur des éléments CONCRETS des profils.
Si score < 40 → alerte SCORE_FAIBLE.
Si coach nb_entrepreneurs_actifs >= 5 → alerte COACH_SURCHARGE.

RÈGLE ABSOLUE : JSON valide UNIQUEMENT. Zéro texte avant ou après le JSON."""
        
        # Truncate data to fit context window
        coaches_str = json.dumps(coaches[:20], ensure_ascii=False, default=str)[:8000]
        entrepreneurs_str = json.dumps(entrepreneurs[:20], ensure_ascii=False, default=str)[:8000]
        
        user_prompt = f"""Programme : {programme.get('nom', 'N/A')}
Description : {programme.get('description', 'N/A')[:500]}
Période : {programme.get('dateDebut', 'N/A')} - {programme.get('dateFin', 'N/A')}

COACHES DISPONIBLES :
{coaches_str}

ENTREPRENEURS À MATCHER :
{entrepreneurs_str}

Schéma JSON attendu :
{{
  "matchings": [
    {{
      "entrepreneur_id": 0,
      "coach_id": 0,
      "score_final": 0,
      "scores_detail": {{
        "alignement_thematique": 0,
        "alignement_sectoriel": 0,
        "competences_complementaires": 0,
        "stade_maturite": 0,
        "charge_coach": 0
      }},
      "justification": "...",
      "points_forts": ["..."],
      "points_attention": ["..."],
      "recommandation_session_1": "..."
    }}
  ],
  "alertes": []
}}"""

        full_prompt = f"{system_prompt}\n\n{user_prompt}"
        response = self.model.generate_content(full_prompt)
        return self._parse_json_response(response.text)

    def _parse_json_response(self, response_text: str) -> Dict[str, Any]:
        try:
            # Clean up potential markdown formatting
            clean_text = response_text.replace("```json", "").replace("```", "").strip()
            return json.loads(clean_text)
        except json.JSONDecodeError:
            return {
                "improved_text": response_text,
                "feedback": ["Error parsing JSON response from AI"],
                "score": 0,
                "strengths": [],
                "weaknesses": [],
                "comparisons": [],
                "recommendations": [],
                "custom_feedback": "Error parsing AI response"
            }
