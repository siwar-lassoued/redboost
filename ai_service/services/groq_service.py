import os
from typing import List, Dict, Any
import json
from groq import AsyncGroq

class GroqService:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable not set")
        self.client = AsyncGroq(api_key=api_key)
        self.model = 'llama-3.3-70b-versatile'

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
            "score": 85
        }}
        """
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return self._parse_json_response(response.choices[0].message.content)

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
            "score": 90
        }}
        """
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return self._parse_json_response(response.choices[0].message.content)

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
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return self._parse_json_response(response.choices[0].message.content)

    async def run_enriched_matching(self, payload: dict) -> Dict[str, Any]:
        coaches = payload.get("coaches", [])
        entrepreneurs = payload.get("entrepreneurs", [])
        programme = payload.get("programme", {})
        thematique = payload.get("thematique")

        thematique_block = ""
        if thematique:
            thematique_block = f"""
━━━ THÉMATIQUE ACTIVE (OBLIGATOIRE) ━━━
Nom : {thematique.get('nom', 'N/A')}
Description : {thematique.get('description', 'N/A')}
Période : {thematique.get('dateDebut', '')} → {thematique.get('dateFin', '')}

PRIORITÉ ABSOLUE : L'expertise du coach DOIT correspondre à cette thématique.
   Si non couverte → score alignement_global plafonné à 60/100 maximum.
   Si secteur incompatible → score alignement_global plafonné à 50/100 maximum.
"""

        system_prompt = f"""Tu es un expert RH senior spécialisé dans l'accompagnement de startups en Tunisie (contexte MENA).
Tu effectues le matching coach/entrepreneur pour le programme RedBoost.

━━━ CONTEXTE LOCAL TUNISIE ━━━
Favorise les coachs ayant :
- Expérience avec startups tunisiennes / écosystème MENA
- Connaissance : Startup Act, BFPME, SICAR, mécanismes de financement locaux
- Réseau actif (incubateurs tunisiens, investisseurs, corporate)

{thematique_block}

━━━ SCORING — 5 CRITÈRES PONDÉRÉS (total 100 points) ━━━

1. alignement_global (30%)
   Combine thématique (prioritaire) + secteur/industrie.

2. competences_complementaires (25%)
   Skills coach ↔ besoins_accompagnement + besoins_formation de l'entrepreneur.
   Analyse : formulaire, documents (CV extrait), bio, certifications.

3. stade_maturite (20%)
   Phase startup ↔ expérience coach (stades déjà accompagnés, années, succès clients).

4. compatibilite_humaine (15%)
   Style coaching déduit ↔ personnalité entrepreneur (déduite des réponses).
   Capacité d'accompagnement réel avec la charge actuelle.

5. charge_coach (10%)
   = score_charge_precalcule fourni dans les données du coach.

━━━ DONNÉES ENRICHIES ━━━
Les entrepreneurs incluent :
- documents_extrait : texte extrait de leur CV (PDF) par OCR
- reponses_formulaire : réponses au questionnaire de candidature
- besoins_formation, innovation, impact_social, impact_environnemental

Analyse TOUS ces champs pour un matching précis.

━━━ RÈGLES D'ANALYSE ━━━
- Données manquantes → score neutre 50 (JAMAIS 0)
- score_final = (alignement*0.30) + (competences*0.25) + (maturite*0.20) + (humaine*0.15) + (charge*0.10)
- Tous les scores entre 0 et 100. Éviter > 95 sans justification forte.

━━━ DÉTECTION DES RISQUES ━━━
Ajouter une alerte si :
- score_final < 40 → "SCORE_FAIBLE"
- nb_entrepreneurs_actifs >= 5 → "COACH_SURCHARGE"
- secteurs incompatibles → "MISMATCH_SECTORIEL"

━━━ SORTIE — TOP 3 PAR ENTREPRENEUR ━━━
Pour CHAQUE entrepreneur, évaluer TOUS les coachs et retourner les 3 meilleurs.
Trier par score_final décroissant. Rank 1 = meilleur recommandé.

RÈGLE ABSOLUE : Retourne UNIQUEMENT du JSON valide, zéro texte avant ou après."""

        coaches_str = json.dumps(coaches[:20], ensure_ascii=False, default=str)[:15000]
        entrepreneurs_str = json.dumps(entrepreneurs[:20], ensure_ascii=False, default=str)[:15000]

        user_prompt = f"""Programme : {programme.get('nom', 'N/A')}

COACHES DISPONIBLES :
{coaches_str}

ENTREPRENEURS :
{entrepreneurs_str}

Schéma JSON attendu :
{{
  "matchings": [
    {{
      "entrepreneur_id": 0,
      "propositions": [
        {{
          "rank": 1,
          "coach_id": 0,
          "score_final": 0,
          "scores_detail": {{
            "alignement_global": 0,
            "competences_complementaires": 0,
            "stade_maturite": 0,
            "compatibilite_humaine": 0,
            "charge_coach": 0
          }},
          "justification": "Explication synthétique du matching",
          "points_forts": ["..."],
          "points_attention": ["..."],
          "recommandation_session_1": "Suggestion concrète pour la première séance",
          "decision_support": {{
            "pourquoi_ce_coach": "Raison principale",
            "pourquoi_pas_ideal": "Limites ou risques",
            "cas_ou_choisir_ce_coach": "Dans quel cas choisir ce coach malgré son rang"
          }}
        }}
      ]
    }}
  ],
  "alertes": []
}}"""

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        return self._parse_json_response(response.choices[0].message.content)

    async def generate_report(self, payload: dict) -> Dict[str, Any]:
        programme_name = payload.get("programme_name", "N/A")
        date_debut = payload.get("date_debut", "")
        date_fin = payload.get("date_fin", "")
        binomes = payload.get("binomes", [])
        context_text = payload.get("context_text", "")

        total_sessions = payload.get("total_sessions", 0)
        sessions_realisees = payload.get("sessions_realisees", 0)
        sessions_planifiees = payload.get("sessions_planifiees", 0)
        sessions_annulees = payload.get("sessions_annulees", 0)

        total_taches = payload.get("total_taches", 0)
        taches_terminees = payload.get("taches_terminees", 0)
        taches_en_cours = payload.get("taches_en_cours", 0)
        taches_bloquees = payload.get("taches_bloquees", 0)
        taches_en_retard = payload.get("taches_en_retard", 0)

        total_livrables = payload.get("total_livrables", 0)
        livrables_approuves = payload.get("livrables_approuves", 0)

        binome_lines = []
        for b in binomes:
            binome_lines.append(
                f"- Coach {b.get('coach_name','?')} ↔ Entrepreneur {b.get('entrepreneur_name','?')}: "
                f"Sessions {b.get('sessions_realisees',0)}/{b.get('sessions_total',0)}, "
                f"Tâches terminées {b.get('taches_terminees',0)}/{b.get('taches_total',0)}, "
                f"En retard {b.get('taches_en_retard',0)}, Bloquées {b.get('taches_bloquees',0)}, "
                f"Livrables {b.get('livrables_soumis',0)}"
            )
        binome_summary = "\n".join(binome_lines) if binome_lines else "Aucun binôme validé."

        system_prompt = """Tu es 'Redboost IA', un système expert d'analyse de données pour les programmes d'incubation.
Tu reçois les données réelles du Planning de Coaching (sessions, tâches, livrables) pour une période donnée.

Ton rôle est d'analyser profondément ces données et de générer un rapport stratégique JSON.

Instructions:
- resume_executif : Paragraphe narratif résumant la santé globale de la période.
- analyse_livrables : Synthèse de la qualité des documents soumis.
- tendances : Analyse des tendances d'avancement entre les binômes.
- kpis_cles : 3-4 faits marquants ou points de succès majeurs.
- alertes : Blocages, retards, absences de soumission.
- recommandations : Recommandations actionnables.
- meilleur_entrepreneur : L'entrepreneur le plus avancé (max tâches terminées + livrables soumis).
- entrepreneur_en_difficulte : L'entrepreneur le plus en difficulté (retards, blocages).
- meilleur_coach : Le coach le plus actif (sessions réalisées + taux de complétion).
- coach_a_surveiller : Le coach avec le moins de performance.

RÈGLE ABSOLUE : Tu dois répondre EXCLUSIVEMENT avec un JSON valide. Zéro texte avant ou après."""

        user_prompt = f"""Programme : {programme_name}
Période: Du {date_debut} au {date_fin}

━━━ MÉTRIQUES GLOBALES ━━━
Sessions : {sessions_realisees} réalisées / {sessions_planifiees} planifiées / {sessions_annulees} annulées (Total: {total_sessions})
Tâches : {taches_terminees} terminées / {taches_en_cours} en cours / {taches_bloquees} bloquées / {taches_en_retard} en retard (Total: {total_taches})
Livrables : {livrables_approuves} approuvés sur {total_livrables} soumis

━━━ DÉTAIL PAR BINÔME ━━━
{binome_summary}

━━━ CONTEXTE DES ACTIVITÉS ━━━
{context_text[:25000] if context_text else "Aucun document partagé pour cette période."}

Génère la réponse selon ce format JSON :
{{
  "resume_executif": "...",
  "analyse_livrables": "...",
  "tendances": "...",
  "kpis_cles": ["fait marquant 1", "fait marquant 2"],
  "alertes": [
     {{ "type": "RETARD" ou "WARNING", "message": "..." }}
  ],
  "recommandations": ["reco 1", "reco 2"],
  "meilleur_entrepreneur": {{ "id": 0, "nom": "...", "raison": "..." }},
  "entrepreneur_en_difficulte": {{ "id": 0, "nom": "...", "raison": "..." }},
  "meilleur_coach": {{ "id": 0, "nom": "...", "raison": "..." }},
  "coach_a_surveiller": {{ "id": 0, "nom": "...", "raison": "..." }}
}}"""

        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"}
        )
        return self._parse_json_response(response.choices[0].message.content)

    def _parse_json_response(self, response_text: str) -> Dict[str, Any]:
        try:
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
