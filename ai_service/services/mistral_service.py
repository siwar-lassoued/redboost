from mistralai import Mistral
import os
from typing import List, Dict, Any
import json

class MistralService:
    def __init__(self):
        api_key = os.getenv("MISTRAL_API_KEY")
        if not api_key:
            raise ValueError("MISTRAL_API_KEY environment variable not set")
        self.client = Mistral(api_key=api_key)
        self.model = "mistral-large-latest"

    async def check_writing(self, text: str, context: str = None) -> Dict[str, Any]:
        prompt = f"""
        Tu es un assistant rédactionnel professionnel. Analyse le texte suivant et fournis des corrections grammaticales, orthographiques et stylistiques.
        IMPORTANT: Réponds UNIQUEMENT en français. Le texte amélioré doit être en français.
        
        Texte à analyser :
        {text}
        
        Contexte (optionnel) : {context if context else "Aucun"}
        
        Retourne la réponse en JSON avec la structure suivante :
        {{
            "improved_text": "La version corrigée du texte en français",
            "feedback": ["Liste des corrections et explications spécifiques en français"],
            "score": 85 (un entier de 0 à 100 basé sur la qualité)
        }}
        """
        
        chat_response = self.client.chat.complete(
            model=self.model,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        response_text = chat_response.choices[0].message.content
        return self._parse_json_response(response_text)

    async def improve_writing(self, text: str, context: str = None) -> Dict[str, Any]:
        prompt = f"""
        Tu es un éditeur professionnel. Réécris le texte suivant pour le rendre plus professionnel, clair et percutant.
        IMPORTANT: Réponds UNIQUEMENT en français. Le texte amélioré et tous les retours doivent être rédigés en français.
        
        Texte à améliorer :
        {text}
        
        Contexte (optionnel) : {context if context else "Aucun"}
        
        Retourne la réponse en JSON avec la structure suivante :
        {{
            "improved_text": "La version améliorée du texte en français",
            "feedback": ["Liste des améliorations apportées en français (ex: vocabulaire enrichi, structure des phrases, clarté)"],
            "score": 90 (un entier de 0 à 100 basé sur la qualité)
        }}
        """
        
        chat_response = self.client.chat.complete(
            model=self.model,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        response_text = chat_response.choices[0].message.content
        return self._parse_json_response(response_text)

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
        
        chat_response = self.client.chat.complete(
            model=self.model,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        response_text = chat_response.choices[0].message.content
        return self._parse_json_response(response_text)

    def _parse_json_response(self, response_text: str) -> Dict[str, Any]:
        try:
            clean_text = response_text.replace("```json", "").replace("```", "").strip()
            return json.loads(clean_text)
        except json.JSONDecodeError:
            return {
                "improved_text": response_text,
                "feedback": ["Erreur lors de l'analyse de la réponse de l'IA"],
                "score": 0,
                "strengths": [],
                "weaknesses": [],
                "comparisons": [],
                "recommendations": [],
                "custom_feedback": "Erreur lors de l'analyse de la réponse de l'IA"
            }