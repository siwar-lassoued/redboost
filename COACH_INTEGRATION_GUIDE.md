# Coach Dashboard Frontend-Backend Integration Guide

## Vue d'ensemble

Le dashboard du coach a été intégré dynamiquement avec le backend pour charger les données en temps réel au lieu d'utiliser des données statiques/mockées.

## Changements Implémentés

### 1. **Service CoachService Enrichi** (`coach.service.ts`)

#### Nouvelles Interfaces DTOs:
- **CoachEntrepreneurDTO**: Représente un entrepreneur assigné au coach
  - `id`: ID de l'utilisateur
  - `firstName`, `lastName`: Nom et prénom
  - `entreprise`: Nom de l'entreprise/projet
  - `secteur`: Secteur d'activité
  - `profilePictureUrl`: URL de la photo de profil
  - `completionRate`: Taux de complétion du projet (%)
  - `delayedTasksCount`: Nombre de tâches en retard

- **DashboardStatsDTO**: Statistiques du dashboard
  - `nbRendezVous`: Nombre de rendez-vous
  - `nbTaches`: Nombre de tâches
  - `nbPhases`: Nombre de phases
  - `nbProjet`: Nombre de projets
  - `completionRate`: Taux de complétion global (%)
  - `activity`: Liste des activités récentes

- **UpcomingSessionDTO**: Représente une session prochaine
  - `id`: ID de la session
  - `entrepreneurName`: Nom de l'entrepreneur
  - `dateSession`: Date de la session
  - `heureDebut`: Heure de début
  - `statut`: Statut (CONFIRMED, PENDING, CANCELLED)
  - `meetingLink`: Lien vers la réunion (Google Meet, Zoom, etc.)

#### Nouvelles Méthodes Publiques:

```typescript
// Récupère les statistiques du dashboard
getDashboardStats(coachId: number): Observable<DashboardStatsDTO>

// Récupère les entrepreneurs assignés au coach
getCoachEntrepreneurs(coachId: number): Observable<CoachEntrepreneurDTO[]>

// Récupère les sessions prochaines
getUpcomingSessions(coachId: number): Observable<UpcomingSessionDTO[]>

// Récupère l'ensemble du dashboard (one-shot call)
getDashboardOverview(coachId: number): Observable<{
  stats: DashboardStatsDTO;
  entrepreneurs: CoachEntrepreneurDTO[];
  sessions: UpcomingSessionDTO[];
}>
```

### 2. **Composant CoachDashboard Modifié** (`CoachDashboard.ts`)

#### Propriétés Dynamiques Ajoutées:
```typescript
entrepreneurs: CoachEntrepreneurDTO[] = [];
upcomingSessions: UpcomingSessionDTO[] = [];
isLoadingEntrepreneurs = false;
isLoadingSessions = false;
```

#### Méthodes Privées Ajoutées:

**loadCoachEntrepreneurs()**: 
- Charge la liste des entrepreneurs du coach depuis le backend
- Affiche un indicateur de chargement pendant la requête
- Gère les erreurs avec notification utilisateur

**loadUpcomingSessions()**:
- Charge la liste des sessions à venir du coach
- Affiche un indicateur de chargement
- Gère les erreurs avec notification utilisateur

#### Améliorations du Template:

**Section "Mes Entrepreneurs"**:
- ✅ Remplacée par une boucle `*ngFor` sur `entrepreneurs`
- ✅ Affiche les initiales dynamiques basées sur les noms réels
- ✅ Affiche le nom réel de l'entreprise et le secteur
- ✅ Affiche le taux de complétion réel
- ✅ Affiche le nombre de tâches en retard (si applicable)
- ✅ Indicateur de chargement et état vide (pas d'entrepreneurs)

**Section "Prochaines Sessions"**:
- ✅ Remplacée par une boucle `*ngFor` sur `upcomingSessions`
- ✅ Affiche le statut dynamique avec les bonnes couleurs
- ✅ Affiche la date et l'heure réelles
- ✅ Affiche le lien vers la réunion (si disponible)
- ✅ Indicateur de chargement et état vide (pas de sessions)

## Architecture des Endpoints Attendus

Le backend doit fournir les endpoints suivants:

```
GET /coach/{coachId}/entrepreneurs
Response: CoachEntrepreneurDTO[]

GET /coach/{coachId}/upcoming-sessions
Response: UpcomingSessionDTO[]

GET /coach/{coachId}/dashboard-stats
Response: DashboardStatsDTO

GET /coach/{coachId}/dashboard-overview
Response: {
  stats: DashboardStatsDTO;
  entrepreneurs: CoachEntrepreneurDTO[];
  sessions: UpcomingSessionDTO[];
}
```

## Prochaines Étapes de Backend

Pour compléter l'intégration, le backend doit:

1. **Implémenter les endpoints de dashboard**:
   - `/coach/{coachId}/entrepreneurs` - Récupérer les entrepreneurs assignés
   - `/coach/{coachId}/upcoming-sessions` - Récupérer les sessions prochaines
   - Optionnel: `/coach/{coachId}/dashboard-overview` - Endpoint combiné

2. **Mapper les données correctement**:
   - S'assurer que `completionRate` est calculé correctement
   - S'assurer que `delayedTasksCount` représente le nombre réel de tâches en retard
   - Fournir les statuts corrects pour les sessions (CONFIRMED, PENDING, CANCELLED)

3. **Considérations de Performance**:
   - Implémenter la pagination si la liste des entrepreneurs est longue
   - Ajouter des filtres (par statut, par programme, etc.)
   - Implémenter le caching si nécessaire

4. **Améliorations Futures**:
   - Intégration WebSocket pour les mises à jour en temps réel
   - Pagination des entrepreneurs et sessions
   - Filtrage avancé
   - Historique d'activité

## Tests et Validation

### Points de Vérification:

1. ✅ Le service charge les entrepreneurs depuis `/coach/{coachId}/entrepreneurs`
2. ✅ Le service charge les sessions depuis `/coach/{coachId}/upcoming-sessions`
3. ✅ Les indicateurs de chargement s'affichent pendant les requêtes
4. ✅ Les erreurs sont gérées avec des notifications toast
5. ✅ Le template affiche les données dynamiques correctement
6. ✅ Les états vides s'affichent quand aucune donnée disponible
7. ✅ La pagination et le filtrage fonctionnent (si implémentés)

## Fichiers Modifiés

- `/redboost_frontend/src/app/pages/dashboard/coachDashboard/services/coach.service.ts` - Service enrichi
- `/redboost_frontend/src/app/pages/dashboard/coachDashboard/CoachDashboard.ts` - Composant mis à jour
- `/redboost_frontend/src/app/pages/dashboard/coachDashboard/CoachDashboard.component.html` (si séparé) - Template dynamique

## Notes Importantes

- Le chargement des entrepreneurs et sessions commence immédiatement après l'authentification du coach
- Les données sont rechargées manuellement (pas de polling automatique) - considérez WebSocket pour le temps réel
- Le composant gère correctement le nettoyage des subscriptions dans `ngOnDestroy`
- Les erreurs réseau sont affichées à l'utilisateur via des notifications toast
