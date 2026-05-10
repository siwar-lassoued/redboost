# Implémentation des Listes Déroulantes Dynamiques et Envoi Automatique

## Vue d'ensemble

Cette implémentation améliore le système de formulaires d'évaluation en remplaçant les saisies manuelles d'IDs par des listes déroulantes dynamiques et en automatisant l'envoi des formulaires aux entrepreneurs sélectionnés.

## Changements Backend

### 1. **KpiFormService.java** - Enrichissement avec nouvelles méthodes

#### Injection des repositories
```java
private final ThematiqueRepository thematiqueRepository;
private final MatchingRepository matchingRepository;
```

#### Nouvelles méthodes de service

**getThematiquesByProgramme(Long programmeId)**
- Récupère toutes les thématiques associées à un programme
- Utilisé pour alimenter la liste déroulante thématiques

**getCoachesByProgramme(Long programmeId)**
- Récupère tous les coachs uniques associés aux thématiques du programme
- Utilisé pour alimenter la liste déroulante coachs

**getEntrepreneursForEvaluation(Long programmeId, Long thematiqueId)**
- Récupère les entrepreneurs actifs avec un matching valide pour programme + thématique
- Utilisé pour sélectionner automatiquement les destinataires

**getEntrepreneursForProgramme(Long programmeId)**
- Récupère tous les entrepreneurs actifs du programme
- Alternative pour sélection alternative des entrepreneurs

#### Amélioration de createForm()
- Détecte automatiquement quand un formulaire d'évaluation est créé
- Récupère les entrepreneurs correspondants (programme + thématique)
- Envoie automatiquement le formulaire via `sendFormToEntrepreneurs()`
- **Impact** : Zéro action manuelle pour l'envoi des évaluations

### 2. **KpiFormController.java** - 5 nouveaux endpoints

```
GET /api/kpi-forms/programme/{programmeId}/thematiques
→ Liste des thématiques du programme

GET /api/kpi-forms/programme/{programmeId}/coaches
→ Liste des coachs du programme

GET /api/kpi-forms/programme/{programmeId}/thematique/{thematiqueId}/entrepreneurs
→ Entrepreneurs pour programme + thématique

GET /api/kpi-forms/programme/{programmeId}/entrepreneurs
→ Tous les entrepreneurs du programme

GET /api/kpi-forms/evaluation/thematique/{thematiqueId}
→ Formulaires d'évaluation par thématique
```

## Changements Frontend

### 1. **kpi-form.service.ts** - Interfaces et méthodes

**Interfaces ajoutées**
```typescript
export interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
}

export interface ThematiqueCoaching {
    id: number;
    titre: string;
    description?: string;
    programmeId: number;
    coachId: number;
}
```

**Méthodes ajoutées**
```typescript
getThematiquesByProgramme(programmeId)
getCoachesByProgramme(programmeId)
getEntrepreneursForEvaluation(programmeId, thematiqueId)
getEntrepreneursForProgramme(programmeId)
```

### 2. **admin-kpi-forms.component.ts** - UX améliorée

#### Signaux réactifs
```typescript
thematiques = signal<ThematiqueCoaching[]>([]);
coaches = signal<User[]>([]);
entrepreneurs = signal<User[]>([]);
```

#### Méthodes de gestion dynamique
- `onProgrammeChange()` - Charge thématiques et coachs au changement de programme
- `onThematiqueChange()` - Charge les entrepreneurs pour la thématique sélectionnée
- `loadThematiquesForProgramme()` - Requête async thématiques
- `loadCoachesForProgramme()` - Requête async coachs
- `loadEntrepreneursForEvaluation()` - Requête async entrepreneurs

#### Template amélioré

**Avant (inputs numériques)**
```html
<input type="number" [(ngModel)]="editingForm.thematiqueId" placeholder="ID de la thématique">
<input type="number" [(ngModel)]="editingForm.coachId" placeholder="ID du coach">
```

**Après (selects déroulantes)**
```html
<!-- Section Programme (ajoutée) -->
<select [(ngModel)]="editingForm.programmeId" (change)="onProgrammeChange()">
  <option>-- Sélectionner un programme --</option>
  @for (p of programmes(); track p.id) {
    <option [value]="p.id">{{ p.nom }}</option>
  }
</select>

<!-- Thématiques dynamiques -->
<select [(ngModel)]="editingForm.thematiqueId" (change)="onThematiqueChange()">
  <option>-- Sélectionner une thématique --</option>
  @for (t of thematiques(); track t.id) {
    <option [value]="t.id">{{ t.titre }}</option>
  }
</select>

<!-- Coachs dynamiques -->
<select [(ngModel)]="editingForm.coachId">
  <option>-- Sélectionner un coach --</option>
  @for (c of coaches(); track c.id) {
    <option [value]="c.id">{{ c.firstName }} {{ c.lastName }}</option>
  }
</select>

<!-- Affichage dynamique du nombre d'entrepreneurs -->
@if (entrepreneurs().length > 0) {
  <div class="info-box">
    {{ entrepreneurs().length }} entrepreneur(s) sélectionné(s) 
    recevront ce formulaire automatiquement
  </div>
}
```

## Flux d'utilisation

### Cas 1: Créer un formulaire d'évaluation (Automatic Dispatch)
1. Admin clique "Nouveau Formulaire"
2. Sélectionne "Évaluation (Feedback)" comme type
3. Sélectionne un **programme**
   - Les thématiques de ce programme se chargent
4. Sélectionne une **thématique**
   - Les coachs associés se chargent
   - Les entrepreneurs du programme+thématique se chargent
5. Sélectionne un **coach** (optionnel - affichage info)
6. Ajoute les questions d'évaluation
7. Clique "Sauvegarder"
   - **Automatiquement** : Les entrepreneurs sélectionnés reçoivent le formulaire
   - Statut passe à "SENT"

### Cas 2: Envoyer un formulaire KPI (Manual Dispatch)
1. Admin sélectionne un formulaire KPI existant
2. Clique "Envoyer"
3. Saisit les IDs des entrepreneurs (ou interface future avec sélection multiple)
4. Clique "Envoyer"
5. Les entrepreneurs reçoivent le formulaire

## Avantages

✅ **Moins d'erreurs** - Plus besoin de saisir d'IDs manuellement
✅ **UX améliorée** - Interface intuitive avec listes intelligentes
✅ **Automation** - Envoi automatique des évaluations
✅ **Performance** - Requêtes optimisées via matching actifs
✅ **Flexibilité** - Chargement dynamique adaptatif
✅ **Backward compatible** - Formulaires KPI inchangés

## Points techniques importants

### Requêtes de base de données
- `ThematiqueRepository.findByProgrammeId()` → Thématiques d'un programme
- `MatchingRepository.findByProgrammeAndThematique()` → Entrepreneurs filtrés
- `UserRepository.findById()` → Données coachs et entrepreneurs

### Signaux Angular (OnPush)
- Mise à jour réactive sans détection manuelle
- Performance optimale avec `ChangeDetectionStrategy.OnPush`
- Listes synchronisées avec état du formulaire

### Validation
- Programme requis pour charger thématiques
- Thématique requise pour charger entrepreneurs
- Coach optionnel mais disponible via dropdown

## Tests recommandés

1. **Créer une évaluation** → Vérifier que les entrepreneurs reçoivent
2. **Changer de programme** → Vérifier réinitialisation des champs
3. **Sélectionner thématique** → Vérifier nombre entrepreneurs correct
4. **Modal d'envoi** → Tester saisie IDs avec validation
5. **Affichage table** → Vérifier affichage Programme/Thématique correctement

## Migration depuis l'ancienne version

Les formulaires KPI existants ne sont pas affectés.
Seuls les nouveaux formulaires d'évaluation bénéficient du nouveau système.
L'endpoint `/api/kpi-forms/{id}/send` continue de fonctionner pour l'envoi manuel.

