# 🔧 BugFix : Planning de Coaching Admin Vide

## Problème Identifié

Lorsque vous vous connectez en tant qu'**admin** et accédez à la section **"Planning de Coaching"**, aucune session n'apparaît. Cependant :
- ✅ Les entrepreneurs voient leurs sessions réservées dans "Mes sessions"
- ✅ Les coachs voient les sessions réservées dans "Mes sessions"  
- ❌ L'admin ne voit rien dans le planning

## Cause Racine

Le **frontend** appelle les endpoints suivants :
- `GET /api/admin/planning/coaches` → **N'EXISTE PAS** ❌
- `GET /api/admin/planning/entrepreneurs` → **N'EXISTE PAS** ❌

Le **backend** avait seulement :
- `GET /api/admin/planning/coach/{coachId}` (avec ID spécifique)
- `GET /api/admin/planning/entrepreneur/{entrepreneurId}` (avec ID spécifique)

## Solution Appliquée

J'ai **ajouté deux nouveaux endpoints** au `AdminPlanningController.java` :

### 1. `GET /api/admin/planning/coaches` 
Retourne **TOUS les coachs avec leurs sessions**, avec support :
- Recherche par nom/email
- Calcul des statistiques (total, à venir, complétées)
- Détails complets des sessions (titre, date, entrepreneur, programme, etc.)

### 2. `GET /api/admin/planning/entrepreneurs`
Retourne **TOUS les entrepreneurs avec leurs sessions**, avec support :
- Recherche par nom/email
- Récupération du coach assigné via Matching
- Calcul des statistiques (total, à venir)
- Détails complets des sessions

## Changements Backend

**Fichier modifié :** `/redboost_backend/src/main/java/team/project/redboost/controllers/AdminPlanningController.java`

### Code ajouté :

```java
// Endpoint 1 : Tous les coachs (ligne 28)
@GetMapping("/coaches")
public ResponseEntity<?> getAllCoachesPlannings(@RequestParam(required = false) String search) {
    List<User> coaches = userRepository.findByRole(Role.COACH);
    // Filtre par recherche, mappe les sessions, calcule les stats
    // Retourne List<CoachPlanningItem> avec sessions enrichies
}

// Endpoint 2 : Tous les entrepreneurs (ligne 140)
@GetMapping("/entrepreneurs")
public ResponseEntity<?> getAllEntrepreneursPlannings(@RequestParam(required = false) String search) {
    List<User> entrepreneurs = userRepository.findByRole(Role.ENTREPRENEUR);
    // Filtre par recherche, mappe les sessions, récupère coach via matching
    // Retourne List<EntrepreneurPlanningItem> avec sessions enrichies
}
```

## Structure des Réponses

Les endpoints retournent une liste contenant pour chaque coach/entrepreneur :

```json
{
  "coachId": "123",
  "coachName": "Jean Dupont",
  "email": "jean@example.com",
  "sessions": [
    {
      "id": "session-456",
      "titre": "Stratégie Marketing",
      "date": "2024-05-20T14:30:00",
      "dureeMinutes": 60,
      "statut": "CONFIRMEE",
      "entrepreneurName": "Alice Martin",
      "programmeName": "RedStart 2024",
      "meetLink": "https://meet.google.com/..."
    }
  ],
  "totalSessions": 5,
  "upcomingSessions": 2,
  "completedSessions": 3
}
```

## Tests à Effectuer

1. **Connectez-vous en tant qu'admin**
2. **Allez dans "Planning de Coaching"**
3. **Onglet "Par Coach"** → Vous devriez voir tous les coachs et leurs sessions
4. **Onglet "Par Entrepreneur"** → Vous devriez voir tous les entrepreneurs et leurs sessions
5. **Fonction de recherche** → Testez la recherche par nom/email

## Notes Techniques

- ✅ Les deux endpoints utilisent les repositories existants (`UserRepository`, `SessionRepository`, `MatchingRepository`)
- ✅ Support du filtrage par recherche (case-insensitive)
- ✅ Statistiques calculées sur les sessions (upcoming vs completed)
- ✅ Récupération du coach pour chaque entrepreneur via `MatchingRepository`
- ✅ Respecte la sécurité (`@PreAuthorize("hasAnyRole('ADMIN', 'SUPERADMIN')")`)

## Intégration Frontend

Le frontend **n'a besoin d'aucun changement**. Les composants et services attendaient exactement ces endpoints !

---

**Date du fix** : 2024
**Impact** : Les admins peuvent maintenant voir le planning global de coaching avec tous les coachs et entrepreneurs
