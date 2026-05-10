# Guide de Test Rapide - Formulaires d'Évaluation avec Listes Déroulantes

## Pré-requis

- Base de données avec au moins:
  - 1 Programme
  - 2+ Thématiques liées au programme
  - 2+ Coachs liés aux thématiques
  - 3+ Entrepreneurs avec matchings actifs (VALIDE)

## Scénario de Test 1: Créer et Envoyer Automatiquement

### Étapes
1. **Accéder à la page** → `http://localhost:4200/admin-kpi-forms`

2. **Cliquer "Nouveau Formulaire"**
   - Modal s'ouvre

3. **Remplir les infos basiques**
   - Titre: "Évaluation Marketing Q2 2026"
   - Description: "Évaluer la performance marketing du Q2"
   - Type: Sélectionner **"Évaluation (Feedback)"**

4. **Sélectionner Programme**
   - Dropdown affiche: "-- Sélectionner un programme --"
   - Sélectionner: "Redboost Startup 2026"
   - ✓ Les thématiques doivent se charger automatiquement

5. **Sélectionner Thématique**
   - Dropdown affiche: "-- Sélectionner une thématique --"
   - Sélectionner: "Marketing Digital"
   - ✓ Les coachs doivent se charger automatiquement
   - ✓ Les entrepreneurs doivent se charger automatiquement
   - ✓ Une info box doit afficher: "3 entrepreneur(s) sélectionné(s) recevront ce formulaire automatiquement"

6. **Sélectionner Coach** (optionnel)
   - Dropdown affiche: "-- Sélectionner un coach --"
   - Sélectionner: "Marie Dupont"
   - ✓ Il doit y avoir un coach dans la liste

7. **Ajouter une question**
   - Cliquer "+ Ajouter"
   - Texte: "Êtes-vous satisfait de la performance marketing?"
   - Type: "SELECT"
   - Options: "Très satisfait, Satisfait, Peu satisfait, Insatisfait"
   - Obligatoire: Cocher

8. **Sauvegarder**
   - Cliquer "Sauvegarder"
   - ✓ Modal doit se fermer
   - ✓ Formulaire doit apparaître dans la table
   - ✓ Statut doit être "SENT" (pas "DRAFT")
   - ✓ Vérifier que les entrepreneurs ont reçu le formulaire (check BDD: `KpiFormResponse` avec status "PENDING")

### Validation attendue
- [ ] Thématiques se chargent au changement de programme
- [ ] Coachs se chargent au changement de programme
- [ ] Entrepreneurs se chargent au changement de thématique
- [ ] Nombre d'entrepreneurs affiché correctement
- [ ] Envoi automatique aux entrepreneurs après sauvegarde

---

## Scénario de Test 2: Changer de Programme

### Étapes
1. **Ouvrir modal modification** → Cliquer crayon sur un formulaire d'évaluation

2. **Changer Programme**
   - Sélectionner un autre programme
   - ✓ Thématiques doivent se réinitialiser
   - ✓ Coachs doivent se réinitialiser
   - ✓ Entrepreneurs doivent se réinitialiser

3. **Sélectionner nouvelle Thématique**
   - ✓ Les coachs et entrepreneurs du NOUVEAU programme doivent se charger

### Validation attendue
- [ ] Les listes se réinitialisent au changement de programme
- [ ] Les nouvelles listes se remplissent correctement

---

## Scénario de Test 3: Validation des Champs

### Étapes
1. **Créer formulaire d'évaluation sans programme**
   - Créer évaluation sans sélectionner de programme
   - Thématique input doit rester vide

2. **Créer sans thématique**
   - Sélectionner programme
   - Mais ne pas sélectionner thématique
   - Entrepreneurs doivent rester vides

3. **Sauvegarder incomplet**
   - Essayer de sauvegarder sans remplir tous les champs
   - ✓ Validation doit bloquer ou avertir

### Validation attendue
- [ ] Les champs requis ne peuvent pas être vides
- [ ] La liste entrepreneurs est vide si pas de thématique

---

## Scénario de Test 4: Formulaire KPI (unchanged)

### Étapes
1. **Créer formulaire KPI**
   - Nouveau Formulaire → Type: "KPI (Tableau de bord)"
   - Sélectionner Programme
   - ✓ Pas de champs Thématique/Coach
   - ✓ Un seul input Programme (pas dropdown dynamique pour KPI)

2. **Sauvegarder et Envoyer**
   - Sauvegarder (statut doit rester "DRAFT")
   - Cliquer "Envoyer"
   - Modal avec saisie manuelle des IDs entrepreneurs
   - Saisir: "1, 2, 3"
   - Cliquer "Envoyer"
   - ✓ Formulaire doit maintenant être "SENT"

### Validation attendue
- [ ] Les formulaires KPI ne sont pas envoyés automatiquement
- [ ] L'envoi manuel fonctionne toujours

---

## Scénario de Test 5: Table d'affichage

### Étapes
1. **Créer plusieurs formulaires**
   - 2 formulaires KPI
   - 2 formulaires Évaluation

2. **Vérifier la table**
   - Colonne "Type": Affiche "KPI" ou "Évaluation"
   - Colonne "Lien":
     - KPI: Affiche "Programme: Redboost..."
     - Évaluation: Affiche "Thém: 42" (ID)
   - ✓ Les labels doivent être corrects

### Validation attendue
- [ ] La table affiche les bonnes infos pour KPI et Évaluation
- [ ] Les icônes et couleurs sont cohérentes

---

## Checklist de Test Complète

### Frontend
- [ ] Dropdown Programme se charge
- [ ] Dropdown Thématique se remplit dynamiquement
- [ ] Dropdown Coach se remplit dynamiquement
- [ ] Info box "X entrepreneurs..." affiche le bon nombre
- [ ] Modal envoi affiche les IDs sélectionnés avec badges
- [ ] Table affiche Programme pour KPI et Thématique pour Évaluation

### Backend
- [ ] GET `/api/kpi-forms/programme/{id}/thematiques` retourne les données
- [ ] GET `/api/kpi-forms/programme/{id}/coaches` retourne les coachs
- [ ] GET `/api/kpi-forms/programme/{id}/thematique/{id}/entrepreneurs` retourne les entrepreneurs
- [ ] POST `/api/kpi-forms` avec évaluation envoie automatiquement aux entrepreneurs
- [ ] Les KpiFormResponse sont créées automatiquement (status: PENDING)

### Base de Données
- [ ] Vérifier `kpi_forms` table avec nouvelle évaluation
- [ ] Vérifier `kpi_form_responses` table avec réponses créées
- [ ] Vérifier `matching` table pour les entrepreneurs actifs

---

## Détection des Problèmes

### Problème: Thématiques ne se chargent pas
**Causes possibles:**
- [ ] Le programme n'a pas de thématiques en BDD
- [ ] L'endpoint `/thematiques` ne retourne rien
- [ ] Le signal `thematiques` ne se met pas à jour

**Solution:**
```bash
# Vérifier l'API
curl "http://localhost:8080/api/kpi-forms/programme/1/thematiques"

# Vérifier la BDD
SELECT * FROM thematique_coaching WHERE programme_id = 1;
```

### Problème: Entrepreneurs ne reçoivent pas le formulaire
**Causes possibles:**
- [ ] Pas de matchings actifs (VALIDE) en BDD
- [ ] La méthode `getEntrepreneursForEvaluation()` retourne une liste vide
- [ ] `sendFormToEntrepreneurs()` n'est pas appelée

**Solution:**
```bash
# Vérifier les matchings
SELECT * FROM matching 
WHERE programme_id = 1 AND thematique_id = 42 AND statut = 'VALIDE';

# Vérifier les envois
SELECT * FROM kpi_form_response 
WHERE form_id = 99 AND status = 'PENDING';
```

### Problème: Coachs ne s'affichent pas
**Causes possibles:**
- [ ] Les thématiques n'ont pas de `coach_id` en BDD
- [ ] Le User avec l'ID coach_id n'existe pas
- [ ] La méthode `getCoachesByProgramme()` est buggée

**Solution:**
```bash
# Vérifier les coaches dans les thématiques
SELECT DISTINCT coach_id FROM thematique_coaching 
WHERE programme_id = 1;

# Vérifier que les users existent
SELECT * FROM user WHERE id IN (1, 2, 3);
```

---

## Debug en Frontend

Si vous avez besoin de debugger, ajouter des console.log dans le composant:

```typescript
onThematiqueChange() {
  console.log('[v0] Thématique changée:', this.editingForm.thematiqueId);
  
  const programmeId = this.editingForm.programmeId;
  const thematiqueId = this.editingForm.thematiqueId;
  
  console.log('[v0] Chargement entrepreneurs pour:', { programmeId, thematiqueId });
  
  this.loadEntrepreneursForEvaluation(programmeId, thematiqueId);
}
```

Puis vérifier la console du navigateur (F12 → Console).

---

## Après les Tests

- [ ] Tous les tests réussis → Prêt pour staging
- [ ] Quelques petits bugs → Corriger et retester
- [ ] Bugs majeurs → Revoir la logique backend

