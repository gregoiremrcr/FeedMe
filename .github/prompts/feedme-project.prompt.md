---
name: FeedMe — contexte et implémentation
description: "Continuer le développement de FeedMe en respectant le README, l’architecture cible et le plan des tâches."
argument-hint: "Décris la tâche à réaliser, ou indique ‘prochaine tâche’ pour prendre le prochain élément ouvert du plan."
agent: agent
---

# Mission

Tu interviens sur **FeedMe**, un projet fil rouge d’application web full-stack avec recommandations de restaurants assistées par IA. Réalise la tâche demandée par l’utilisateur. Si la demande est « prochaine tâche », consulte [le plan des tâches](../../PLAN_TACHES.md) et choisis le premier élément non terminé en respectant ses dépendances.

# Contexte du projet

- **Objectif :** aider une personne à trouver un restaurant à proximité à partir de ses envies, de sa position ou d’une adresse, et de critères comme le type de cuisine, le budget et ses préférences.
- **Parcours attendu :** conversation avec un chatbot, extraction des critères, recherche de restaurants réels, filtrage/classement, puis recommandations claires et structurées.
- **Équipe :** cheffe de projet — DIAKHABY Dienaba ; membres — ULRICH Fedjo et MERCIER Grégoire.
- **Périmètre MVP :** monolithe modulaire, avec séparation nette des responsabilités et possibilité d’extraire des services ultérieurement.

# Technologies et décisions

- Frontend : React / **Next.js**, CSS (choix détaillé de librairie et version à confirmer selon le dépôt).
- Backend : **Python / FastAPI**.
- Base de données : **MongoDB**.
- IA : **Claude**, appelée uniquement depuis le backend.
- Hébergement cible : **AWS**.
- CI/CD et contrôles : **GitHub Actions**.
- Recherche de restaurants : intégrer une API réelle. Le choix reste à faire entre Google Places (plus complète, potentiellement payante) et OpenStreetMap/Overpass (gratuite, couverture et homogénéité variables). Ne prétends pas que ce choix est déjà acté.
- Déploiement cible envisagé : CloudFront / Amplify pour le frontend, Application Load Balancer et ECS Fargate pour FastAPI, MongoDB Atlas, Claude API et API de restaurants. Secrets dans AWS Secrets Manager, logs dans CloudWatch, rôles IAM au moindre privilège et alerte AWS Budgets.

Les technologies et composants ci-dessus décrivent la cible du projet, pas nécessairement l’état déjà implémenté. Vérifie les fichiers réellement présents avant de conclure ou de modifier l’architecture.

# Architecture et responsabilités

Le navigateur/mobile utilise le frontend Next.js, qui communique en HTTPS avec une API REST JSON versionnée (`/api/v1`). Le backend FastAPI centralise : configuration, validation, authentification JWT, logique métier, conversations, extraction des préférences, recherche/classement des restaurants, intégrations externes et gestion des erreurs. MongoDB conserve les données applicatives.

Organisation cible indicative :

- `frontend/app/` : pages (connexion, chat, restaurants) ; `components/`, `lib/`, `types/` et Dockerfile.
- `backend/app/` : `main.py`, `core/`, `api/v1/`, `schemas/`, `models/`, `repositories/`, `services/` ; tests sous `backend/tests/`, plus dépendances et Dockerfile.
- Racine : `docker-compose.yml`, `.env.example`, `.github/workflows/ci.yml` et README.

Ne force pas cette organisation si le dépôt a évolué : suis ses conventions existantes et n’introduis que les fichiers nécessaires.

# Fonctionnement attendu de l’IA et de la recherche

Claude ne constitue jamais la source de vérité des restaurants. Le flux serveur attendu est :

1. valider le message et les critères reçus ;
2. demander à Claude d’extraire les critères dans un JSON contraint ;
3. valider le JSON avec des schémas Pydantic ;
4. rechercher des établissements auprès du fournisseur de données choisi ;
5. filtrer et classer les résultats réels ;
6. demander à Claude de rédiger une réponse fondée uniquement sur ces résultats ;
7. valider la réponse avant de la retourner. Rejeter une sortie invalide ou effectuer une nouvelle tentative contrôlée.

# API prévisionnelle

Toutes les routes sont sous `/api/v1` et documentées avec OpenAPI :

- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`
- `POST /conversations`, `GET /conversations`, `GET /conversations/{id}`, `POST /conversations/{id}/messages`
- `POST /restaurants/search`, `GET /restaurants/{id}`

Adapte ce contrat uniquement après vérification du code et de la demande ; maintiens la compatibilité documentée.

# Données prévues

- `users` : email, hash du mot de passe, dates de création/modification.
- `conversations` : utilisateur, titre, messages et dates.
- `searches` : critères, conversation associée et résultats.

Les mots de passe sont exclusivement stockés sous forme de hash Argon2 ou bcrypt, jamais en clair.

# Exigences transverses

- Authentification JWT contrôlée côté serveur ; secrets injectés par l’environnement.
- Validation stricte de toutes les entrées et des réponses des services externes.
- Gestion centralisée des erreurs, sans traces ni détails internes exposés aux utilisateurs.
- Aucune clé, donnée sensible ou secret dans le frontend, le dépôt ou `.env.example`.
- Limitation des requêtes et protections contre les abus lorsque les routes exposées sont ajoutées.
- Tests adaptés à chaque changement ; maintenir les conventions et éviter les régressions.
- Docker Compose pour le démarrage local ; images multi-stage et utilisateur non privilégié lorsque les Dockerfiles sont ajoutés.
- GitHub Actions pour tests, vérifications et scans de sécurité.
- AWS : moindre privilège IAM, gestion sûre des secrets, observabilité et budget.

# Phases et tâches du projet

Le suivi détaillé et les cases à cocher sont dans [PLAN_TACHES.md](../../PLAN_TACHES.md). Les phases prévues sont :

1. **Fondations :** structure frontend/backend, Docker Compose, MongoDB et `/health`.
2. **Authentification :** inscription, connexion, JWT, hash et protection des routes.
3. **Recherche :** décider du fournisseur, gérer position/adresse et filtres, intégrer recherche et classement.
4. **Chatbot :** intégration Claude, extraction JSON validée, conversations et réponses fondées sur les résultats réels.
5. **Qualité :** tests, erreurs, limitation des requêtes, sécurité et documentation.
6. **Livraison :** workflow GitHub Actions, déploiement AWS et démonstration live de 7 minutes sur ordinateur ou smartphone.

# Règles de travail

1. Commence par lire le README et inspecter les fichiers concernés ; le dépôt peut ne contenir pour le moment que la documentation.
2. Distingue explicitement l’existant, les objectifs et les décisions encore ouvertes. N’invente ni fonctionnalités réalisées, ni fournisseur choisi, ni commandes de lancement disponibles.
3. Si l’utilisateur désigne une tâche, limite les changements à son périmètre et à ses dépendances nécessaires. Sinon, pour « prochaine tâche », prends le premier élément ouvert et non bloqué de [PLAN_TACHES.md](../../PLAN_TACHES.md).
4. Respecte les technologies et objectifs de ce contexte, les conventions réellement présentes et les principes de sécurité ci-dessus. Ne remplace pas une technologie cible sans demande ou justification claire.
5. Ajoute ou adapte des tests et la documentation utiles, puis exécute les vérifications réalisables. Ne déclare pas un contrôle réussi s’il n’a pas été exécuté.
6. Ne déploie pas et n’utilise pas de vrais secrets sans demande explicite.
7. À la fin, résume les changements, les vérifications exécutées et les décisions/blocages restant à traiter. Coche dans le plan uniquement ce qui est réellement terminé et vérifié.
