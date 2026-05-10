# Quick Start : Utiliser les Nouveaux Formulaires

**Pour les administrateurs RedBoost**

---

## En 5 Minutes : Créer un Formulaire KPI

### Étape 1 : Ouvrir l'interface
1. Allez dans **Backoffice > Suivi Accompagnement > Formulaires KPI & Évaluation**

### Étape 2 : Créer un nouveau formulaire
1. Cliquez sur le bouton **"+ Nouveau Formulaire"** (en haut à droite)

### Étape 3 : Remplir les informations basiques
```
Titre : "Enquête Chiffre d'Affaires"
Description : "Suivi mensuel du CA"
Type de formulaire : KPI (Tableau de bord) ← IMPORTANT
Date limite : 31/12/2024
Programme : Digital Marketing ← Obligatoire pour KPI
```

### Étape 4 : Ajouter des questions
1. Cliquez sur **"+ Ajouter"** dans la section Questions
2. Pour chaque question :
   ```
   Texte : "Quel est votre chiffre d'affaires ?"
   Type : Nombre / Montant
   Obligatoire : ✓
   Liaison KPI : 5  ← L'ID du KPI à mettre à jour
   ```

### Étape 5 : Sauvegarder
1. Cliquez **"Sauvegarder"** en bas

### Étape 6 : Envoyer aux entrepreneurs
1. De retour dans la liste, trouvez votre formulaire
2. Cliquez sur l'icône **"Envoyer"** (avion)
3. Entrez les IDs des entrepreneurs : `1, 2, 3`
4. Cliquez **"Envoyer"**

✅ **C'est fait !** Les entrepreneurs peuvent maintenant compléter le formulaire et les KPI se mettront à jour automatiquement.

---

## En 5 Minutes : Créer un Formulaire d'Évaluation

### Étape 1-2 : Même que KPI (ouvrir + créer)

### Étape 3 : Remplir les informations basiques
```
Titre : "Évaluation Coaching Digital Marketing"
Description : "Feedback sur la session de coaching"
Type de formulaire : Évaluation (Feedback) ← DIFFERENT
Date limite : 31/12/2024
Thématique : 3  ← ID de la thématique coaching
Coach : 12      ← ID du coach (utilisateur)
```

⚠️ **Important** : Pour Évaluation, PAS de Programme. À la place : Thématique + Coach

### Étape 4 : Ajouter des questions
```
Question 1 : "Avez-vous trouvé le coaching utile ?"
Type : Choix Unique
Options : Très utile, Utile, Peu utile, Non utile
Obligatoire : ✓
⚠️ NE PAS ajouter de liaison KPI

Question 2 : "Commentaires libres"
Type : Multi-lignes
Obligatoire : ✗ (optionnel)
⚠️ NE PAS ajouter de liaison KPI
```

### Étape 5-6 : Sauvegarder et envoyer
(Même que KPI)

✅ **C'est fait !** Les réponses sont stockées pour que le coach les consulte.

---

## 🎯 Différences Clés

### Formulaire KPI
| Aspect | Détail |
|--------|--------|
| **Lien à** | Programme (obligatoire) |
| **Questions** | Ont des liaisons KPI |
| **Résultat** | Met à jour automatiquement les KPI |
| **Historique** | Création auto d'historique KPI |
| **Cas d'usage** | Suivi des indicateurs |

### Formulaire Évaluation
| Aspect | Détail |
|--------|--------|
| **Lien à** | Thématique + Coach (obligatoires) |
| **Questions** | SANS liaisons KPI |
| **Résultat** | Stockage des réponses seulement |
| **Historique** | Aucun impact sur les KPI |
| **Cas d'usage** | Feedback et évaluations |

---

## ❓ FAQ Rapide

### Q1: Je ne vois plus le champ Programme après avoir sélectionné "Évaluation"
**R:** C'est normal ! Le système affiche les champs appropriés selon le type.

### Q2: Puis-je ajouter une liaison KPI à une question d'Évaluation ?
**R:** Techniquement oui, mais ce n'est pas recommandé. Les évaluations ne mettent pas à jour les KPI.

### Q3: Que se passe-t-il quand un entrepreneur soumet une réponse KPI ?
**R:** 
1. La réponse est sauvegardée
2. Le KPI de l'entrepreneur est mis à jour automatiquement
3. Un historique est créé dans le système
4. L'entrepreneur voit son KPI changé dans son dashboard

### Q4: Que se passe-t-il quand un entrepreneur soumet une réponse Évaluation ?
**R:**
1. La réponse est sauvegardée
2. AUCUN KPI n'est modifié
3. Le coach peut consulter les réponses

### Q5: Puis-je modifier un formulaire après l'avoir envoyé ?
**R:** Non recommandé. Les entrepreneurs qui l'ont déjà complété verront une version différente. Créez une nouvelle version si besoin.

### Q6: Comment voir les réponses des entrepreneurs ?
**R:** Cliquez sur l'icône **"Réponses"** (icône personnes) dans la table des formulaires.

---

## 🚀 Cas d'Usage Courants

### Cas 1: Suivi Mensuel du Chiffre d'Affaires
```
Type : KPI
Programme : Digital Marketing
Question : "Chiffre d'affaires du mois (€) ?"
Liaison KPI : 5 (CA KPI)
→ Chaque mois, collectez et mettez à jour automatiquement
```

### Cas 2: Évaluation de Formation
```
Type : Évaluation
Thématique : Formation Digital Marketing
Coach : Jean Dupont
Questions :
  - "Trouvez-vous la formation utile ?"
  - "Quels sont les points à améliorer ?"
→ Feedback direct au coach, aucun impact KPI
```

### Cas 3: Suivi des Activités
```
Type : KPI
Programme : Accompagnement PME
Question : "Nombre de clients prospectés ?"
Liaison KPI : 12 (Prospection KPI)
→ Suivi mensuel d'un KPI opérationnel
```

---

## ⚙️ Configuration Recommandée

### Fréquence d'envoi
- KPI : Mensuel ou trimestriel (selon la métrique)
- Évaluation : À la fin de chaque session de coaching

### Date limite
- KPI : Fin du mois + 3 jours (ex: 3 février pour janvier)
- Évaluation : Quelques jours après la session

### Qui envoyer
- KPI : Tous les entrepreneurs du programme
- Évaluation : Entrepreneurs assignés au coach de la thématique

---

## 🛟 Besoin d'aide ?

### Pour les détails techniques
→ Voir `IMPLEMENTATION_SUMMARY.md`

### Pour valider que ça marche
→ Voir `TESTING_GUIDE.md` (scénarios de test)

### Pour les fonctionnalités futures
→ Voir `FUTURE_ENHANCEMENTS.md`

---

## ✅ Checklist Avant Déploiement

- [ ] J'ai créé au moins 1 formulaire KPI
- [ ] J'ai créé au moins 1 formulaire Évaluation
- [ ] J'ai envoyé un formulaire à des entrepreneurs
- [ ] Les formulaires s'affichent correctement dans la table
- [ ] Les champs dynamiques fonctionnent (Programme pour KPI, Thématique/Coach pour Éval)

---

## 🎓 Prochaines Étapes

1. **Immédiat** : Créer vos formulaires de test
2. **Semaine 1** : Envoyer aux entrepreneurs, vérifier les réponses
3. **Semaine 2** : Valider que les KPI se mettent à jour (pour KPI)
4. **Semaine 3** : Former les coaches sur consultation des évaluations
5. **Semaine 4** : Déploiement complet

---

**Bon courage ! 🚀 L'équipe technique est disponible si vous avez des questions.**
