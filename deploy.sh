#!/bin/bash
# deploy.sh
# Option A (Plus sûre) : Arrête l'ancienne version avant de compiler la nouvelle
# pour libérer de la RAM, idéal pour un serveur avec 2 Go de RAM.

echo "🛑 Étape 1 : Arrêt des conteneurs existants pour libérer la RAM..."
# Arrête les conteneurs et supprime les réseaux créés
docker compose down

echo "🧹 Étape 2 : Nettoyage du système Docker..."
# Supprime les images non utilisées et les restes de l'ancien build pour faire de la place
docker system prune -f

echo "🔨 Étape 3 : Compilation et démarrage de la nouvelle version..."
# Lance la nouvelle version en arrière-plan
docker compose up -d --build

echo "✅ Déploiement en cours. Voici les derniers logs :"
docker compose logs -f --tail=50
