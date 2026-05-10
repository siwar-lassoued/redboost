# Planning Administrateur - Guide Complet

## 📋 Vue d'ensemble

Ce module fournit une interface complète pour les administrateurs permettant de visualiser et gérer:
- **Planning des sessions** par coach et par entrepreneur
- **Accès aux liens de réunion** pour les sessions planifiées
- **Suivi des To-Do** échangés entre coaches et entrepreneurs
- **Gestion des livrables** déposés ou associés aux sessions

## 🏗️ Architecture

### 1. **Modèles de Données** (`admin-planning.model.ts`)

#### SessionDetail
```typescript
interface SessionDetail {
  id: string;
  titre: string;
  date: Date;
  dureeMinutes: number;
  statut: 'PLANIFIEE' | 'CONFIRMEE' | 'REALISEE' | 'ANNULEE';
  meetLink?: string;                    // Lien de réunion
  coachId: string;
  coachName: string;
  entrepreneurId: string;
  entrepreneurName: string;
  programmeName?: string;
  description?: string;
}
```

#### TodoItem
```typescript
interface TodoItem {
  id: string;
  titre: string;
  description?: string;
  status: 'NON_DEMARREE' | 'EN_COURS' | 'BLOQUE' | 'EN_RETARD' | 'TERMINEE';
  priorite: 'BASSE' | 'MOYENNE' | 'HAUTE';
  dateDebut: Date;
  dateLimite: Date;
  dateFinReel?: Date;
  entrepreneurId: string;
  entrepreneurName: string;
  coachId: string;
  coachName: string;
  documents: DocumentItem[];           // Documents associés
}
```

#### LivrableItem
```typescript
interface LivrableItem {
  id: string;
  nom: string;
  type: string;
  dateUpload: Date;
  url: string;                          // Lien de téléchargement
  entrepreneurId: string;
  entrepreneurName: string;
  coachId: string;
  coachName: string;
  tacheId: string;
  tacheTitre: string;
  fileSize?: number;
}
```

### 2. **Service AdminPlanning** (`admin-planning.service.ts`)

Le service centralise tous les appels API:

#### Méthodes principales
- `getOverview()` - Vue d'ensemble avec statistiques
- `getCoachPlannings()` - Liste des coachs avec leurs sessions
- `getEntrepreneurPlannings()` - Liste des entrepreneurs avec leurs sessions
- `getAllTodos()` - Récupère les To-Do avec filtres
- `getAllLivrables()` - Récupère les livrables avec filtres

#### Exemple d'utilisation
```typescript
// Récupérer toutes les sessions d'un coach
this.adminPlanningService.getCoachSessions(coachId)
  .subscribe(sessions => {
    console.log(sessions);
  });

// Filtrer les To-Do par statut
this.adminPlanningService.getAllTodos({
  statut: 'EN_COURS',
  coachId: 'coach-123'
}).subscribe(todos => {
  // Traiter les To-Do
});
```

### 3. **Composant AdminPlanning** (`admin-planning.component.ts`)

#### Structure des onglets

**Tab 1: Par Coach**
- Affiche la liste des coachs
- Recherche et filtrage en temps réel
- Expansion pour voir les sessions
- Accès directs aux réunions via bouton Meet
- Statistiques par coach (total, à venir, complétées)

**Tab 2: Par Entrepreneur**
- Affiche la liste des entrepreneurs
- Association coach-entrepreneur visible
- Recherche et filtrage
- Sessions planifiées avec dates et statuts
- Accès aux liens de réunion

**Tab 3: To-Do & Livrables**
- **Section To-Do**: Liste tous les To-Do avec:
  - Statut (couleurs différentes)
  - Priorité (BASSE, MOYENNE, HAUTE)
  - Documents associés avec liens directs
  - Dates limites
  - Informations de l'entrepreneur et du coach

- **Section Livrables**: Grille des fichiers avec:
  - Nom du fichier et taille
  - Tâche associée
  - Dates d'upload
  - Bouton de téléchargement direct
  - Informations du coach et entrepreneur

## 📊 Fonctionnalités Clés

### 1. **Visualisation du Planning**

```
Par Coach
├── Coach 1 (Spécialiste, 5 sessions, 2 à venir, 1 complétée)
│   ├── Session 1 - [PLANIFIEE]
│   │   ├── Date: 15/05/2025 14:00
│   │   ├── Entrepreneur: John Doe
│   │   ├── Programme: Croissance
│   │   └── [Meet] Bouton pour rejoindre
│   └── Session 2 - [REALISEE]
│       └── ...
└── Coach 2
    └── ...
```

### 2. **Accès aux Réunions**

Chaque session propose:
- **Lien de réunion Google Meet** (s'il existe)
- **Bouton de redirection directe** vers la réunion
- **Statut de la session** visible en temps réel

### 3. **Gestion des To-Do**

```
Filtres disponibles:
├── Par Coach (dropdown)
└── Par Statut (NON_DEMARREE, EN_COURS, BLOQUE, EN_RETARD, TERMINEE)

Affichage:
├── Titre de la tâche
├── Statut avec badge couleur
├── Priorité (BASSE, MOYENNE, HAUTE)
├── Dates (début, limite, fin réelle)
├── Documents attachés (liens cliquables)
└── Informations du coach et entrepreneur
```

### 4. **Téléchargement des Livrables**

Les livrables sont affichés sous forme de cartes avec:
- **Icône de fichier** pour identification visuelle
- **Métadonnées** (taille, date, tâche associée)
- **Bouton de téléchargement** direct
- **Information complète** du coach et entrepreneur

## 🔄 Flux de Données

```
┌─────────────────────────────────────┐
│  AdminPlanningComponent (ngOnInit)  │
└────────────┬────────────────────────┘
             │
             ├─→ getOverview()
             │    └─→ Statistiques globales
             │
             ├─→ getCoachPlannings()
             │    └─→ Coachs + Sessions
             │
             ├─→ getEntrepreneurPlannings()
             │    └─→ Entrepreneurs + Sessions
             │
             └─→ loadCoachList()
                  └─→ Liste pour filtre To-Do
```

## 🎨 Interface Utilisateur

### Design System
- **Couleur primaire**: #ea5073 (Rose)
- **Couleur secondaire**: #4299E1 (Bleu)
- **Couleur succès**: #48BB78 (Vert)
- **Couleur warning**: #ED8936 (Orange)

### Composants Réutilisables

**Badges de Statut**:
- PLANIFIEE: Bleu clair
- CONFIRMEE: Vert clair
- REALISEE: Gris
- ANNULEE: Rouge clair

**Badges de Priorité**:
- BASSE: Vert
- MOYENNE: Jaune
- HAUTE: Rouge

### Responsive Design
- Desktop: 4 colonnes pour les stats
- Tablet: 2 colonnes
- Mobile: 1 colonne

## 🔌 Intégration Backend

### Endpoints attendus

```
GET /api/admin/planning/overview
Response: {
  totalCoaches: number,
  totalEntrepreneurs: number,
  totalSessions: number,
  sessionsThisWeek: number,
  pendingTodos: number,
  pendingLivrables: number
}

GET /api/admin/planning/coaches?search=...
Response: CoachPlanningItem[]

GET /api/admin/planning/entrepreneurs?search=...
Response: EntrepreneurPlanningItem[]

GET /api/admin/planning/todos?coachId=...&statut=...
Response: TodoItem[]

GET /api/admin/planning/livrables?coachId=...
Response: LivrableItem[]
```

## 📝 Cas d'Utilisation

### 1. **Suivi Global du Planning**
L'admin accède rapidement:
- Nombre total de coachs et entrepreneurs
- Nombre de sessions cette semaine
- To-Do en attente

### 2. **Gestion d'un Coach Spécifique**
- Voir toutes ses sessions
- Vérifier quels entrepreneurs il suit
- Accès rapide aux réunions programmées

### 3. **Suivi d'un Entrepreneur**
- Vue de toutes ses séances
- Coach associé visible
- Accès aux sessions pour rejoindre les réunions

### 4. **Suivi des Livrables**
- Recherche par entrepreneur, coach ou tâche
- Accès direct aux fichiers
- Vérification des dates d'upload

## 🚀 Utilisation

### Démarrage Rapide

1. **Importer le composant**:
```typescript
import { AdminPlanningComponent } from '@pages/backoffice/admin-planning/admin-planning.component';

// Utiliser dans les routes
{
  path: 'planning',
  component: AdminPlanningComponent
}
```

2. **Assurez-vous que le service est fourni**:
```typescript
// Dans app.config.ts ou un module provider
import { AdminPlanningService } from '@services/admin-planning.service';

export const appConfig = {
  providers: [
    AdminPlanningService,
    // ...autres providers
  ]
};
```

3. **Vérifiez les endpoints API**:
Tous les endpoints doivent être implémentés côté backend sur `/api/admin/planning/`

## 🔍 Recherche et Filtrage

### Recherche en Temps Réel
- Debouncing: 300ms
- Recherche sur: nom, email, spécialité
- Distinctify: pas de recherches dupliquées

### Filtrage
- **Par Coach**: Dropdown sélection
- **Par Statut**: Filtrage des To-Do
- **Par Programme**: Dans la recherche globale

## 📱 Responsive Breakpoints

```css
/* Desktop (1200px+) */
- 4 colonnes stats
- Grille livrables: auto-fill minmax(280px, 1fr)

/* Tablet (768px-1199px) */
- 2 colonnes stats
- Dispositions réadaptées

/* Mobile (<768px) */
- 1 colonne pour tout
- Filtres en colonne
- Optimisation tactile
```

## 🐛 Gestion des Erreurs

Le service gère automatiquement:
- Erreurs réseau → retourne un tableau vide
- Données manquantes → utilise des valeurs par défaut
- État de chargement → affiche un spinner

```typescript
// Exemple dans le service
.pipe(
  catchError(() => of([]))  // En cas d'erreur, retourne []
)
```

## 📚 Dépendances

- **@angular/core**: ^17.0.0
- **@angular/common**: ^17.0.0
- **@angular/forms**: ^17.0.0
- **rxjs**: ^7.8.0
- **PrimeNG Icons**: Pour les icônes (classe `pi`)

## ✅ Checklist d'Implémentation

- [x] Modèles de données
- [x] Service d'administration
- [x] Composant avec 3 onglets
- [x] Recherche et filtrage
- [x] Accès aux réunions
- [x] Affichage des To-Do
- [x] Gestion des livrables
- [x] Design responsive
- [x] Gestion des erreurs
- [ ] Endpoints backend à implémenter

## 🔮 Améliorations Futures

1. **Modales** pour voir les détails complets
2. **Filtres avancés** (date range, statut multiple)
3. **Export** de données (CSV, PDF)
4. **Notifications** en temps réel
5. **Graphiques** de statistiques
6. **Synchronisation** WebSocket pour les mises à jour instantanées
