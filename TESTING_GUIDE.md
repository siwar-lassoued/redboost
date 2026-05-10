# Guide de Test : Système Formulaires KPI & Évaluation

## Prérequis
- Backend RedBoost compilé et en cours d'exécution
- Frontend Angular en cours d'exécution
- Base de données avec data de test (Programmes, Utilisateurs, Thématiques)

---

## Scénarios de Test

### 1. Créer un Formulaire KPI

#### Étapes :
1. Accédez à Admin → Formulaires KPI & Évaluation
2. Cliquez sur "Nouveau Formulaire"
3. Remplissez :
   - Titre : "Enquête Chiffre d'Affaires Q2"
   - Description : "Suivi du chiffre d'affaires pour le Q2 2024"
   - **Type de formulaire** : Sélectionnez "KPI (Tableau de bord)"
4. Observez que le champ "Programme" s'affiche
5. Sélectionnez un programme existant
6. Définissez une date limite
7. Ajoutez une question :
   - Texte : "Quel est votre chiffre d'affaires actuel (en €) ?"
   - Type : "Nombre / Montant"
   - Obligatoire : ✓
   - **Liaison KPI** : Entrez l'ID d'un KPI existant (ex: 5)
8. Cliquez "Sauvegarder"

#### Vérifications :
- Le formulaire s'affiche dans la liste
- Type = "KPI" avec badge violet
- Colonne "Lien" affiche le nom du Programme
- La question contient bien l'ID du KPI

---

### 2. Créer un Formulaire d'Évaluation

#### Étapes :
1. Cliquez sur "Nouveau Formulaire"
2. Remplissez :
   - Titre : "Évaluation de la Formation Digital Marketing"
   - Description : "Feedback sur la session de coaching du 15/05"
   - **Type de formulaire** : Sélectionnez "Évaluation (Feedback)"
3. Observez que les champs "Programme" disparaissent
4. Les champs "Thématique" et "Coach" s'affichent
5. Entrez :
   - Thématique : 3 (ID de la thématique coaching)
   - Coach : 12 (ID de l'utilisateur coach)
6. Ajoutez des questions :
   - Q1 : "Avez-vous trouvé cette formation utile ?" (Type: SELECT, Options: "Très utile, Utile, Peu utile")
   - Q2 : "Commentaires libres" (Type: Multi-lignes, Non obligatoire)
   - Important : **NE PAS ajouter de liaison KPI** pour les questions d'évaluation
7. Cliquez "Sauvegarder"

#### Vérifications :
- Le formulaire s'affiche dans la liste
- Type = "Évaluation" avec badge bleu
- Colonne "Lien" affiche "Thém: 3"
- Questions sans KPI

---

### 3. Envoyer un Formulaire KPI

#### Étapes :
1. Depuis la table, cliquez sur l'icône "Envoyer" (icône avion) sur le formulaire KPI créé
2. Dans la modale, entrez les IDs des entrepreneurs : "1, 2, 3"
3. Cliquez "Envoyer"

#### Vérifications :
- Le statut du formulaire passe à "SENT" (badge vert)
- Les entrepreneurs reçoivent le formulaire dans leur section "Formulaires à compléter"

---

### 4. Soumettre une Réponse KPI (Vérification de l'Historique)

#### Étapes :
1. Connectez-vous en tant qu'entrepreneur
2. Allez dans "Formulaires à compléter"
3. Ouvrez le formulaire KPI "Enquête Chiffre d'Affaires Q2"
4. Entrez une réponse : "250000" (chiffre d'affaires)
5. Cliquez "Soumettre"

#### Vérifications - **Point clé** :
- Vérifiez que l'historique KPI est automatiquement créé
- Allez dans le dashboard des KPI du programme
- Cherchez le KPI lié (ID 5)
- Vérifiez qu'une nouvelle entrée d'historique (ProgrammeKpiHistory) a été créée avec :
  - La valeur "250000"
  - Le timestamp de soumission
  - L'ID de l'entrepreneur

#### Logs à vérifier (Backend) :
```
[INFO] KpiFormService.submitResponse() - Processing KPI form response
[INFO] ProgrammeKpiService.updateEntrepreneurValue() - Updating KPI 5
[INFO] ProgrammeKpiHistoryRepository.save() - History created
```

---

### 5. Soumettre une Réponse d'Évaluation (Vérification : PAS d'Historique KPI)

#### Étapes :
1. Connectez-vous en tant qu'entrepreneur
2. Ouvrez le formulaire d'évaluation "Évaluation de la Formation Digital Marketing"
3. Répondez aux questions :
   - Q1 : "Très utile"
   - Q2 : "Excellente formation, très intéressant !"
4. Cliquez "Soumettre"

#### Vérifications - **Point clé** :
- Les réponses sont sauvegardées
- **Vérifiez qu'AUCUN historique KPI n'a été créé**
- Allez dans le dashboard des KPI du programme
- Vérifiez qu'aucune nouvelle entrée d'historique n'a été créée

#### Logs à vérifier (Backend) :
```
[INFO] KpiFormService.submitResponse() - Processing EVALUATION form response
[DEBUG] Evaluation form - No KPI update, just storing answers
```

---

### 6. Tester les Endpoints de Filtrage

#### Avec Postman ou cURL :

**Récupérer tous les formulaires KPI** :
```bash
GET /api/kpi-forms/type/kpi
```
Résultat : Liste contenant uniquement les formulaires KPI

**Récupérer tous les formulaires d'Évaluation** :
```bash
GET /api/kpi-forms/type/evaluation
```
Résultat : Liste contenant uniquement les formulaires d'évaluation

**Récupérer les évaluations d'une thématique** :
```bash
GET /api/kpi-forms/evaluation/thematique/3
```
Résultat : Formulaires d'évaluation liés à la thématique ID 3

**Récupérer les évaluations d'un coach** :
```bash
GET /api/kpi-forms/evaluation/coach/12
```
Résultat : Formulaires d'évaluation assignés au coach ID 12

---

### 7. Test d'Interface - Validation Formulaire

#### Cas 1 : Créer un KPI sans Programme
- Sélectionnez "KPI" comme type
- Tentez de sauvegarder sans Programme
- **Attendu** : Message d'erreur ou bouton désactivé

#### Cas 2 : Créer une Évaluation sans Thématique
- Sélectionnez "EVALUATION" comme type
- Tentez de sauvegarder sans Thématique
- **Attendu** : Validation échoue

#### Cas 3 : Changer le type de formulaire
- Créez un formulaire KPI avec Programme
- Changez le type en "EVALUATION"
- Observez que le champ Programme disparaît et les champs Thématique/Coach apparaissent

---

## Checklist de Validation Finale

- [ ] Créer formulaire KPI avec Programme - OK
- [ ] Créer formulaire Évaluation avec Thématique + Coach - OK
- [ ] Interface masque/affiche les champs appropriés - OK
- [ ] Table affiche Programme pour KPI, Thématique pour Évaluation - OK
- [ ] Envoyer formulaire KPI et recevoir comme entrepreneur - OK
- [ ] Soumettre réponse KPI → **Historique créé automatiquement** - OK
- [ ] Soumettre réponse Évaluation → **AUCUN historique KPI** - OK
- [ ] Endpoints de filtrage retournent les bonnes données - OK
- [ ] Validations frontend et backend fonctionnent - OK
- [ ] Logs backend indiquent le bon flux (KPI vs EVALUATION) - OK

---

## Dépannage

### Problème : Le type "EVALUATION" ne s'affiche pas
**Solution** : Vérifier que `FormType.EVALUATION` existe dans l'enum KpiForm.java

### Problème : Historique KPI créé pour une Évaluation
**Solution** : Vérifier que `submitResponse()` vérifie bien `formType == EVALUATION` avant de skip la mise à jour

### Problème : Champs Thématique/Coach ne s'affichent pas
**Solution** : Vérifier la directive `@if` dans le template Angular pour le type de formulaire

### Problème : API retourne 404 sur les nouveaux endpoints
**Solution** : Recompiler le backend et redémarrer le serveur

---

## Données de Test Recommandées

```sql
-- Ajouter un programme pour le test
INSERT INTO programme (id, nom, description) VALUES (10, 'Digital Marketing', 'Programme de formation');

-- Ajouter une thématique de coaching
INSERT INTO thematiques_coaching (id, programme_id, nom, description, date_debut, date_fin) 
VALUES (3, 10, 'Digital Marketing', 'Coaching en marketing digital', '2024-01-01', '2024-12-31');

-- Coach utilisateur (role: COACH)
INSERT INTO user (id, email, first_name, last_name, role) 
VALUES (12, 'coach@example.com', 'Jean', 'Dupont', 'COACH');

-- Entrepreneurs
INSERT INTO user (id, email, first_name, last_name, role) 
VALUES (1, 'ent1@example.com', 'Alice', 'Martin', 'ENTREPRENEUR');
INSERT INTO user (id, email, first_name, last_name, role) 
VALUES (2, 'ent2@example.com', 'Bob', 'Durand', 'ENTREPRENEUR');
```
