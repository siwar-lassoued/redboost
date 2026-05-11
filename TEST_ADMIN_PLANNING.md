# 📋 Guide de Test : Planning de Coaching Admin

## Scénario de Test Complet

Ce guide vous aidera à vérifier que le fix fonctionne correctement.

---

## Étape 1 : Préparation des Données

### Prérequis
- ✅ Au moins 1 coach créé dans la base de données
- ✅ Au moins 1 entrepreneur créé dans la base de données
- ✅ Au moins 1 matching VALIDE entre un coach et un entrepreneur
- ✅ Au moins 1 session réservée par un entrepreneur avec ce coach

### Exemple de données attendues
```
Coach: Jean Dupont
├─ Session 1: "Stratégie Marketing" - 2024-05-20 14:30 - CONFIRMEE
└─ Session 2: "Présentation Produit" - 2024-05-21 15:00 - PLANIFIEE

Entrepreneur: Alice Martin
├─ Coach assigné: Jean Dupont
├─ Session 1: "Stratégie Marketing" - 2024-05-20 14:30 - CONFIRMEE
└─ Session 2: "Retour" - 2024-05-22 16:00 - PLANIFIEE
```

---

## Étape 2 : Test du Frontend

### 2.1 Connexion Admin
1. Ouvrez l'application
2. **Connectez-vous avec un compte ADMIN ou SUPERADMIN**
3. Allez dans le menu principal → **"Planning Global"** ou **"Planning de Coaching"**

### 2.2 Test de l'Onglet "Par Coach"
1. Cliquez sur l'onglet **"Par Coach"**
2. **Vérifications attendues** :
   - ✅ Vous voyez une liste de **tous les coachs** avec sessions
   - ✅ Pour chaque coach, les cartes affichent :
     - Nom du coach
     - Nombre de sessions (ex: "5 sessions")
     - Sessions à venir (ex: "2 à venir")
     - Sessions complétées (ex: "3 complétées")
   - ✅ Vous pouvez **dérouler chaque coach** pour voir ses sessions
   - ✅ Les sessions affichent :
     - Titre
     - Date & Heure
     - Entrepreneur associé
     - Statut (PLANIFIEE, CONFIRMEE, etc.)
     - Bouton "Meet" (s'il y a un lien)

### 2.3 Test de l'Onglet "Par Entrepreneur"
1. Cliquez sur l'onglet **"Par Entrepreneur"**
2. **Vérifications attendues** :
   - ✅ Vous voyez une liste de **tous les entrepreneurs**
   - ✅ Pour chaque entrepreneur, les cartes affichent :
     - Nom de l'entrepreneur
     - Coach assigné
     - Programme
     - Nombre de sessions
     - Sessions à venir
   - ✅ Vous pouvez **dérouler chaque entrepreneur** pour voir ses sessions
   - ✅ Les sessions affichent tous les détails (voir section 2.2)

### 2.4 Test de la Recherche
1. Dans l'onglet **"Par Coach"**, tapez dans le champ de recherche :
   - Nom du coach (ex: "Jean")
   - Email du coach
   - Spécialité du coach
2. **Résultat attendu** : Seul le/les coach(s) correspondant(s) s'affiche(nt)

3. Répétez dans l'onglet **"Par Entrepreneur"**

### 2.5 Test des Statistiques
1. **Vérifiez les statistiques** en haut de la page :
   - Nombre total de coachs
   - Nombre total d'entrepreneurs
   - **Nombre total de sessions** (devrait correspondre aux sessions réservées)
   - Nombre de sessions cette semaine

---

## Étape 3 : Test du Backend (API)

Si vous avez accès à un outil API (Postman, curl, etc.) :

### 3.1 Test de l'endpoint `/coaches`
```bash
curl -X GET "http://localhost:8080/api/admin/planning/coaches" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Réponse attendue** :
```json
[
  {
    "coachId": 123,
    "id": 123,
    "coachName": "Jean Dupont",
    "email": "jean@example.com",
    "sessions": [
      {
        "id": "session-456",
        "titre": "Stratégie Marketing",
        "date": "2024-05-20T14:30:00",
        "dureeMinutes": 60,
        "statut": "CONFIRMEE",
        "entrepreneurId": 789,
        "entrepreneurName": "Alice Martin",
        "programmeName": "RedStart 2024"
      }
    ],
    "totalSessions": 2,
    "upcomingSessions": 1,
    "completedSessions": 1
  }
]
```

### 3.2 Test de l'endpoint `/entrepreneurs`
```bash
curl -X GET "http://localhost:8080/api/admin/planning/entrepreneurs" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Réponse attendue** : Structure similaire, avec `entrepreneurId` et `coachName` au lieu de `coachId`

### 3.3 Test de la recherche
```bash
curl -X GET "http://localhost:8080/api/admin/planning/coaches?search=Jean" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Résultat attendu** : Seuls les coachs avec "Jean" dans nom/email/spécialité

---

## Étape 4 : Vérifications Critiques

### Checklist
- [ ] **Les sessions réservées par entrepreneur apparaissent** dans "Par Coach"
- [ ] **Les sessions réservées par entrepreneur apparaissent** dans "Par Entrepreneur"
- [ ] **Les statistiques affichent les bons nombres** (au moins totalSessions > 0)
- [ ] **La recherche fonctionne** (tapez du texte, les résultats se filtrent)
- [ ] **Les détails des sessions sont complets** (date, entrepreneur, coach, statut)
- [ ] **Pas d'erreur en console** (F12 → Console)
- [ ] **Pas d'erreur 404 ou 500** dans les Network requests

---

## Étape 5 : Cas d'Erreur (What if?)

### Si vous voyez "Aucun coach trouvé"
**Diagnostic** :
- ❌ Aucun coach n'existe dans la base
- ❌ Aucun coach n'a de sessions
- ✅ **Solution** : Créez des coaches et des sessions via les autres sections

### Si vous voyez "Erreur lors du chargement"
**Diagnostic** :
- ❌ L'endpoint retourne une erreur 404 ou 500
- ❌ Le backend n'a pas été redémarré après la modification
- ✅ **Solution** : 
  1. Vérifiez les logs backend
  2. Redémarrez le serveur backend
  3. Vérifiez que l'admin a les rôles ADMIN ou SUPERADMIN

### Si vous voyez les données mais pas de détails dans les sessions déroulées
**Diagnostic** :
- ❌ Les sessions existent mais les données ne sont pas enrichies
- ✅ **Solution** : Vérifiez que les sessions ont bien un entrepreneur et un coach assignés

---

## Étape 6 : Déboggage

### Activer le mode Debug
1. Ouvrez F12 (DevTools)
2. Onglet **"Network"**
3. Rafraîchissez la page
4. Cherchez les requêtes :
   - `GET /api/admin/planning/coaches`
   - `GET /api/admin/planning/entrepreneurs`
   - `GET /api/admin/planning/overview`

### Vérifier les Réponses
Pour chaque requête :
1. Cliquez dessus
2. Onglet **"Response"**
3. Vérifiez que la réponse JSON contient les sessions

### Logs Backend
Si vous avez accès aux logs :
```
INFO: GET /api/admin/planning/coaches - User [ADMIN] accessed
INFO: Returned 5 coaches with sessions
```

---

## Résumé des Changements Attendus

**Avant le fix** :
- Admin → Planning → Affiche "Aucun coach trouvé" / "Aucun entrepreneur trouvé"

**Après le fix** :
- Admin → Planning → Affiche tous les coachs et leurs sessions
- Admin → Planning → Affiche tous les entrepreneurs et leurs sessions
- Admin → Planning → Les statistiques reflètent les vraies données

---

## Support

Si vous rencontrez d'autres problèmes :

1. **Vérifiez les logs du backend** pour les erreurs d'accès à la base de données
2. **Vérifiez la console frontend** (F12) pour les erreurs JavaScript
3. **Vérifiez que votre compte a le rôle ADMIN ou SUPERADMIN**
4. **Vérifiez qu'il existe des sessions dans la base de données**

Bonne chance ! 🚀
