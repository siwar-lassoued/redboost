# Guide de Débogage - Listes Déroulantes Vides

## Problème
Après sélection du type de formulaire et du programme, les listes déroulantes des thématiques et des coachs restent vides.

## Diagnostic

### 1. Vérifier les logs du navigateur
Ouvrez la console du navigateur (F12 > Console) et sélectionnez un programme.

Vous devriez voir des logs `[v0]` comme :
```
[v0] Loading thematiques for programme: 1
[v0] Thematiques received: [...]
```

Si vous voyez une erreur HTTP (404, 500, etc.), consultez la section "Erreurs HTTP".

### 2. Vérifier les réponses de l'API

Dans l'onglet Network du navigateur (F12 > Network) :
- Filtrez par `thematiques` ou `coaches`
- Cliquez sur la requête et regardez l'onglet "Response"
- La réponse doit contenir un tableau JSON d'objets

Exemple de réponse correcte pour `/programme/1/thematiques` :
```json
[
  {
    "id": 1,
    "titre": "Ventes et Marketing",
    "description": "...",
    "programmeId": 1,
    "coachId": 5
  },
  ...
]
```

### 3. Vérifier la base de données

Les données doivent exister dans les tables :

**Pour les thématiques :**
```sql
SELECT * FROM thematique_coaching WHERE programme_id = [PROGRAMME_ID];
```

**Pour les coaches :**
```sql
SELECT * FROM disponibilite 
WHERE thematique_id IN (
  SELECT id FROM thematique_coaching WHERE programme_id = [PROGRAMME_ID]
);
```

## Causes Possibles et Solutions

### Cas 1: Réponse HTTP vide `[]`

**Cause** : La base de données ne contient pas de thématiques pour ce programme.

**Solution** :
1. Vérifiez que le programme existe avec l'ID correct
2. Créez des thématiques associées au programme
3. Associez des coachs aux thématiques via la table `disponibilite`

### Cas 2: Erreur 404 Not Found

**Cause** : L'endpoint n'existe pas ou l'URL est incorrecte.

**Solution** :
1. Vérifiez que les endpoints sont déployés dans le backend :
   - `GET /api/kpi-forms/programme/{programmeId}/thematiques`
   - `GET /api/kpi-forms/programme/{programmeId}/coaches`
2. Vérifiez que `apiUrl` dans `kpi-form.service.ts` est correct (par défaut : `/api/kpi-forms`)

### Cas 3: Erreur 500 Internal Server Error

**Cause** : Une exception s'est produite dans le backend lors du traitement.

**Solution** :
1. Vérifiez les logs du serveur backend
2. Assurez-vous que les repositories sont correctement injectés
3. Testez les méthodes du service backend directement (via Postman/curl)

### Cas 4: Signal vide après réponse valide

**Cause** : Le signal n'est pas mis à jour correctement ou la réponse est `null`.

**Solution** :
1. Vérifiez dans la console que la ligne `[v0] Thematiques received: ...` affiche bien des données
2. Si le tableau est vide `[]`, allez au Cas 1
3. Vérifiez que les interfaces TypeScript matchent les données du serveur

## Test Rapide

Testez directement les endpoints avec curl :

```bash
# Test thématiques
curl http://localhost:8080/api/kpi-forms/programme/1/thematiques

# Test coaches
curl http://localhost:8080/api/kpi-forms/programme/1/coaches
```

Remplacez `1` par un ID de programme réel et `8080` par le port réel du serveur.

## Points de Vérification Clés

- ✓ Programme sélectionné a un ID valide (pas null)
- ✓ Thématiques existent dans la base pour ce programme
- ✓ Coachs sont associés aux thématiques (table disponibilite)
- ✓ Endpoint backend déployé et accessible
- ✓ Service Angular appelle la bonne URL
- ✓ Pas d'erreurs HTTP dans les logs

## Résumé des Logs Attendus

Quand tout fonctionne correctement :

1. Clic sur le dropdown du programme
2. Log : `[v0] Loading thematiques for programme: X`
3. Log : `[v0] Thematiques received: [...]` (avec données)
4. Dropdown des thématiques se remplit
5. Même processus pour les coaches

Si vous manquez l'une de ces étapes, consultez le cas correspondant ci-dessus.
