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
