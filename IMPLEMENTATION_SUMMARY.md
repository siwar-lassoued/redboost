# Résumé d'implémentation : Système de Formulaires KPI & Évaluation

## Vue d'ensemble
Implémentation complète du système permettant aux administrateurs de créer deux types de formulaires :
1. **Formulaires KPI** : Liés à un Programme, les réponses mettent à jour automatiquement les KPI avec historique
2. **Formulaires d'Évaluation** : Liés à une Thématique + Coach, sans mise à jour de KPI

---

## Modifications Backend

### 1. Entité KpiForm
**Fichier**: `redboost_backend/src/main/java/team/project/redboost/entities/KpiForm.java`

**Changements**:
- Ajout de deux champs optionnels pour supporter les formulaires d'évaluation:
  - `Long thematiqueId` - Lien vers la thématique de coaching
  - `Long coachId` - Lien vers le coach (utilisateur)
- L'enum `FormType` avec valeurs `KPI` et `EVALUATION` était déjà présent
- Validation logique : 
  - Formulaires KPI : `programmeId` requis
  - Formulaires EVALUATION : `thematiqueId` + `coachId` requis

### 2. Service KpiFormService
**Fichier**: `redboost_backend/src/main/java/team/project/redboost/services/KpiFormService.java`

**Changements**:
- **updateForm()** : Ajout de la mise à jour des champs `thematiqueId`, `coachId`, et `formType`
- **Nouvelles méthodes de filtrage** :
  - `getFormsByType(FormType)` - Filtrer par type
  - `getKpiForms()` - Retourner seulement les KPI
  - `getEvaluationForms()` - Retourner seulement les évaluations
  - `getEvaluationFormsByThematique(Long)` - Évaluations d'une thématique
  - `getEvaluationFormsByCoach(Long)` - Évaluations d'un coach
- **submitResponse()** : Logique améliorée pour gérer les deux types :
  - **Type KPI** : Appelle `programmeKpiService.updateEntrepreneurValue()` pour chaque réponse avec `kpiId`, créant automatiquement l'historique
  - **Type EVALUATION** : Sauvegarde seulement les réponses, sans mise à jour KPI (valide que pas de `kpiId`)

### 3. Contrôleur KpiFormController
**Fichier**: `redboost_backend/src/main/java/team/project/redboost/controllers/KpiFormController.java`

**Changements** :
- Nouveaux endpoints GET :
  - `/api/kpi-forms/type/kpi` - Liste tous les formulaires KPI
  - `/api/kpi-forms/type/evaluation` - Liste tous les formulaires d'évaluation
  - `/api/kpi-forms/evaluation/thematique/{thematiqueId}` - Évaluations d'une thématique
  - `/api/kpi-forms/evaluation/coach/{coachId}` - Évaluations d'un coach

---

## Modifications Frontend

### 1. Service KpiFormService
**Fichier**: `redboost_frontend/src/app/pages/backoffice/kpi_forms/kpi-form.service.ts`

**Changements**:
- **Interface KpiForm** : Ajout de 4 champs :
  - `thematiqueId?: number`
  - `coachId?: number`
  - `thematiqueLabel?: string` (pour affichage)
  - `coachName?: string` (pour affichage)
- **Nouveaux endpoints HTTP** :
  - `getKpiForms()` - Récupérer formulaires KPI
  - `getEvaluationForms()` - Récupérer formulaires d'évaluation
  - `getEvaluationFormsByThematique(thematiqueId)` - Évaluations par thématique
  - `getEvaluationFormsByCoach(coachId)` - Évaluations par coach

### 2. Composant Admin KpiFormsComponent
**Fichier**: `redboost_frontend/src/app/pages/backoffice/kpi_forms/admin-kpi-forms.component.ts`

**Changements** :
- **Modal du formulaire** :
  - Le champ "Type de formulaire" est maintenant en haut (avant Programme)
  - **Si type = KPI** : Affiche seulement le champ "Programme" (obligatoire)
  - **Si type = EVALUATION** : Affiche les champs "Thématique" et "Coach" (obligatoires)
  - Le champ "Programme" n'apparaît plus pour les évaluations
  
- **Tableau des formulaires** :
  - Réorganisation des colonnes : Titre → Type → Lien → Créé → Deadline → Questions → Statut → Actions
  - **Colonne "Lien"** affiche :
    - Pour KPI : Badge avec icône livre + nom du Programme
    - Pour EVALUATION : Badge rose avec icône users + ID de la Thématique
  - Type de formulaire reste visible avec badge coloré (bleu pour Évaluation, violet pour KPI)

---

## Flux de données

### Flux KPI (automatisation de l'historique)
```
1. Admin crée formulaire KPI → lié à Programme
2. Admin ajoute questions avec kpiId (liaison avec BackofficeKpi)
3. Admin envoie formulaire à entrepreneurs
4. Entrepreneur remplit et soumet → submitResponse()
5. Pour chaque réponse avec kpiId :
   → Appel programmeKpiService.updateEntrepreneurValue()
   → Crée automatiquement entrée ProgrammeKpiHistory
6. Historique visible dans dashboard entrepreneur
```

### Flux Évaluation (sans KPI)
```
1. Admin crée formulaire EVALUATION → lié à Thématique + Coach
2. Admin ajoute questions (SANS kpiId)
3. Admin envoie formulaire à entrepreneurs
4. Entrepreneur remplit et soumet → submitResponse()
5. Réponses sauvegardées SANS mise à jour KPI
6. Coach peut consulter les réponses d'évaluation
```

---

## Points clés de sécurité et validation

1. **Validation au niveau du service** : 
   - Évaluations ne mettent PAS à jour les KPI (même si kpiId présent par erreur)
   - Logs de warning si incohérence détectée

2. **Backward compatibility** :
   - Formulaires KPI existants continuent de fonctionner
   - Champs `thematiqueId` et `coachId` sont optionnels (null pour KPI)

3. **Requêtes filtrées** :
   - Endpoints séparés permettent à l'admin de voir distinctement les deux types
   - Interface adapte l'affichage au type sélectionné

---

## Tests recommandés

1. **Création formulaire KPI** → Vérifier Programme requis, Thématique/Coach cachés
2. **Création formulaire EVALUATION** → Vérifier Thématique/Coach requis, Programme caché
3. **Soumission KPI** → Vérifier création d'historique ProgrammeKpiHistory
4. **Soumission EVALUATION** → Vérifier pas de création d'historique KPI
5. **Filtrage** → Tester les endpoints `/type/kpi`, `/type/evaluation`, etc.
6. **Affichage table** → Vérifier Programme pour KPI, Thématique pour Évaluation

---

## Notes d'implémentation

- Utilisation de patterns existants (injectable, transactional, signals Angular)
- Pas de dépendances nouvelles ajoutées
- Code compatible avec la base de données existante
- Structure facilement extensible pour futures améliorations (rapports, statistiques, etc.)
