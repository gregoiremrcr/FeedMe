# Guide d'implémentation FeedMe

Ce document transforme la documentation du projet en feuille de route opérationnelle. Il décrit quoi faire, dans quel ordre, ce qui doit être livré et comment vérifier chaque étape.

## 1. État actuel

- Le dépôt contient un squelette Next.js dans `feedme-app/`.
- Le backend FastAPI est présent dans `backend/` avec configuration MongoDB et routes JWT.
- MongoDB, Docker Compose, l'authentification, les tests frontend et la CI sont partiellement implémentés ; l'API restaurants backend, Claude et AWS restent à réaliser.
- Le fournisseur de restaurants reste à choisir : Google Places ou OpenStreetMap/Overpass.
- Aucun secret réel ne doit être ajouté au dépôt.

## 2. Ordre de réalisation

1. Prendre les décisions bloquantes.
2. Construire les fondations locales.
3. Ajouter les comptes et la sécurité.
4. Intégrer la recherche de restaurants.
5. Ajouter les conversations et Claude.
6. Ajouter les tests, la documentation et les contrôles de sécurité.
7. Mettre en place la CI/CD et le déploiement AWS.
8. Préparer puis répéter la démonstration.

Chaque phase doit être validée avant de passer à la suivante.

## 3. Décisions à prendre avant le développement

### 3.1 Versions et outils

Décider et noter les versions de Next.js, Node.js, Python, FastAPI, MongoDB, des outils de test, du formateur et du linter. Les versions retenues doivent être utilisées localement et dans la CI.

**Livrable :** section « Versions » dans le README et fichiers de dépendances versionnés.

### 3.2 Fournisseur de restaurants

Comparer Google Places et OpenStreetMap/Overpass sur le coût, les quotas, la couverture, les données disponibles, les conditions d'utilisation et l'attribution. Choisir un fournisseur avant de coder l'adaptateur.

**Décision importante :** Claude ne fournit jamais la vérité sur les restaurants. Il peut extraire des critères et rédiger une réponse, mais les établissements viennent toujours de l'API choisie.

### 3.3 Géolocalisation et données

Définir si l'utilisateur peut utiliser sa position, saisir une adresse ou les deux. Prévoir le consentement, le refus de géolocalisation, le rayon de recherche et la politique de conservation/suppression des comptes, conversations et recherches.

### 3.4 Hébergement

Confirmer l'hébergement frontend (Amplify ou CloudFront) et la configuration MongoDB Atlas. Estimer le coût AWS avant tout provisionnement.

## 4. Phase 1 — Fondations

### T1 — Maquette et parcours

Concevoir les écrans accueil, inscription, connexion, chat, recherche, résultats, détail restaurant, chargement, aucun résultat et erreur. Prévoir une interface responsive et accessible sur smartphone et ordinateur.

**Livrables :** maquette validée, liste des parcours et composants nécessaires.

**Validation :** un utilisateur peut comprendre le parcours complet avant l'intégration technique.

### T2 — Structure frontend

Organiser Next.js avec les pages, composants communs, client API, gestion de session et types TypeScript. Créer les écrans progressivement sans exposer de clé API dans le navigateur.

**Livrables :** `app/`, `components/`, `lib/`, `types/` et base CSS responsive.

**Validation :** l'application démarre localement et les écrans principaux sont navigables.

### T3 — Structure backend FastAPI

Créer un monolithe modulaire avec `backend/app/main.py`, puis les modules `core`, `api/v1`, `schemas`, `models`, `repositories` et `services`. Centraliser la configuration par variables d'environnement.

**Livrables :** application FastAPI, dépendances, configuration locale et séparation des responsabilités.

### T4 — Route de santé

Créer `GET /health` avec une réponse stable et documentée. Ajouter un test qui vérifie le code HTTP et le contenu utile de la réponse.

**Validation :** l'API répond sans dépendre de Claude ou de l'API restaurants.

### T5 — MongoDB et environnement local

Ajouter la connexion MongoDB, les variables de configuration et `docker-compose.yml`. Ajouter `.env.example` avec uniquement des exemples sûrs : aucune vraie clé, aucun mot de passe réel.

**Livrables :** MongoDB joignable localement, configuration reproductible et procédure README.

### T6 — Images Docker

Créer les Dockerfiles frontend et backend. Utiliser des étapes de build séparées lorsque pertinent et exécuter les processus avec un utilisateur non privilégié.

**Validation de fin de phase :** frontend, backend et MongoDB démarrent selon une procédure documentée ; `/health` répond ; aucun secret n'est versionné.

## 5. Phase 2 — Authentification et comptes

### T7 — Schémas et modèle utilisateur

Définir les schémas d'inscription, connexion et utilisateur public. Le modèle `users` contient au minimum email, hash du mot de passe et dates de création/modification.

### T8 — Inscription

Implémenter `POST /api/v1/auth/register`. Valider strictement l'email et le mot de passe, refuser les doublons et hasher avec Argon2 ou bcrypt. Ne jamais stocker le mot de passe en clair.

### T9 — Connexion et JWT

Implémenter `POST /api/v1/auth/login`. Émettre un JWT avec durée de vie configurable, comparer le hash côté serveur et renvoyer une erreur non révélatrice en cas d'échec.

### T10 — Utilisateur courant et protection

Implémenter `GET /api/v1/auth/me` et une dépendance FastAPI de vérification du JWT. Protéger toutes les routes qui manipulent les données privées.

### T11 — Session frontend et anti-abus

Choisir une stratégie de stockage du jeton adaptée aux risques XSS/CSRF. Ajouter une limitation des tentatives de connexion et ne jamais afficher de détails internes.

**Tests obligatoires :** succès, validation invalide, doublon, mauvais identifiants, jeton invalide/expiré et accès non authentifié.

**Validation de fin de phase :** les routes protégées refusent les requêtes anonymes et le hash n'apparaît ni dans les réponses ni dans les logs.

## 6. Phase 3 — Recherche de restaurants

### T12 — Contrat de recherche

Définir les entrées : position ou adresse, rayon, type de cuisine, budget et préférences. Valider les coordonnées, les limites numériques et les champs optionnels avec Pydantic.

### T13 — Adaptateur fournisseur

Créer une interface de service indépendante du fournisseur retenu. Isoler les appels externes afin de pouvoir changer d'API et de simuler les réponses dans les tests.

### T14 — Recherche réelle

Implémenter la recherche avec timeout, gestion des quotas, erreurs fournisseur, données incomplètes et obligations d'attribution. Ne pas appeler directement l'API depuis le frontend.

### T15 — Filtrage et classement

Filtrer et classer les résultats selon les critères reçus. Rendre explicites les critères utilisés et normaliser les champs utiles : nom, adresse, coordonnées, note, prix, horaires, URL et identifiant fournisseur.

### T16 — Routes restaurants

Implémenter `POST /api/v1/restaurants/search` et `GET /api/v1/restaurants/{id}` sous `/api/v1`, puis documenter le contrat OpenAPI.

### T17 — Interface de recherche

Créer la saisie des critères, les cartes de résultats, le détail, les états de chargement, vide et erreur, ainsi que l'affichage responsive et l'attribution obligatoire du fournisseur.

**Tests :** réponses fournisseur simulées, filtres, classement, erreurs, absence de résultats et tests API sans réseau réel.

**Validation de fin de phase :** les établissements affichés proviennent bien de l'API choisie, jamais d'une invention du modèle IA.

## 7. Phase 4 — Conversations et chatbot Claude

### T18 — Modèles de données

Créer les schémas de conversation, message, critères extraits et réponse. Ajouter les collections `conversations` et `searches`, avec dates, propriétaire et lien entre recherche et conversation.

### T19 — Routes de conversation

Implémenter :

- `POST /api/v1/conversations` ;
- `GET /api/v1/conversations` ;
- `GET /api/v1/conversations/{id}` ;
- `POST /api/v1/conversations/{id}/messages`.

Vérifier systématiquement que l'utilisateur a le droit d'accéder à la conversation.

### T20 — Client Claude côté serveur

Créer un client configurable par environnement, avec timeout, gestion d'erreur et nouvelle tentative contrôlée. Aucun appel Claude ne doit partir du navigateur et aucune clé ne doit être envoyée au frontend.

### T21 — Extraction structurée

Concevoir un prompt qui demande uniquement les critères de recherche dans un JSON contraint. Valider la sortie avec Pydantic ; rejeter une sortie invalide ou appliquer une tentative contrôlée.

### T22 — Orchestration métier

Respecter exactement ce flux :

1. valider le message utilisateur ;
2. extraire les critères avec Claude ;
3. valider le JSON ;
4. rechercher les restaurants réels ;
5. filtrer et classer ;
6. demander à Claude de rédiger à partir des résultats ;
7. valider la réponse avant de la retourner.

Claude ne doit pas suivre d'instructions présentes dans des données externes non fiables et ne doit pas inventer d'établissement.

### T23 — Interface de chat

Ajouter l'historique, l'envoi de message, l'état de traitement, les erreurs, les réponses contrôlées et les cartes de recommandations.

**Tests :** JSON valide/invalide, timeout Claude, erreur Claude, aucun restaurant, résultats trouvés et contrôle de propriété d'une conversation.

**Validation de fin de phase :** le chatbot aide à formuler et présenter les résultats réels ; toutes les sorties externes sont validées.

## 8. Phase 5 — Qualité, sécurité et documentation

### T24 — Qualité automatisée

Définir formatage, lint, typage éventuel et tests pour frontend et backend. Documenter chaque commande et faire échouer la CI en cas d'erreur.

### T25 — Gestion des erreurs

Uniformiser les erreurs API, ne pas exposer traces, secrets, tokens ou données personnelles. Ajouter des limites de taille et des validations côté serveur.

### T26 — Accès et protection

Vérifier CORS, cookies/tokens, en-têtes de sécurité, contrôle d'accès par propriétaire et limitation de débit sur les routes sensibles.

### T27 — Scans

Ajouter les scans de dépendances et de secrets. Vérifier le dépôt, les logs, les images Docker et les bundles frontend.

### T28 — Contrat OpenAPI

Documenter routes, authentification, schémas, erreurs et exemples sans données sensibles. Maintenir cette documentation à chaque changement d'API.

**Validation de fin de phase :** les vérifications sont reproductibles, les tests passent et aucune fuite de secret n'est détectée.

## 9. Phase 6 — CI/CD et AWS

### T29 — GitHub Actions

Créer `.github/workflows/ci.yml` pour installer les dépendances, lancer formatage/lint, tests, typage et scans de sécurité.

### T30 — Architecture et coûts AWS

Documenter frontend, Application Load Balancer, ECS Fargate, MongoDB Atlas, Claude, API restaurants, CloudWatch et les variables d'environnement. Estimer les coûts avant provisionnement.

### T31 — Secrets et IAM

Stocker les secrets dans AWS Secrets Manager. Créer des rôles IAM au moindre privilège et ne jamais placer de clé dans GitHub, Docker ou le frontend.

### T32 — Déploiement et observabilité

Déployer d'abord un environnement de test. Vérifier `/health`, les parcours utilisateurs et les logs CloudWatch. Configurer AWS Budgets avec alerte de seuil et documenter le retour arrière.

**Validation de fin de phase :** pipeline réussi, application vérifiée dans AWS, permissions documentées et alerte de budget active.

## 10. Phase 7 — Démonstration et clôture

### T33 — Données de démonstration

Préparer un compte et des données sans informations personnelles réelles.

### T34 — Répétition technique

Répéter : critères, conversation, recherche, recommandations et détail d'un restaurant. Tester ordinateur, smartphone, état vide, erreur et indisponibilité simulée d'un service.

### T35 — Présentation de 7 minutes

Préparer un scénario oral, vérifier l'URL, la connexion, le matériel et le plan de secours avant la présentation.

### T36 — Clôture documentaire

Mettre à jour le README, le statut des tâches, les versions déployées, l'URL, les limites connues et les consignes de dépannage.

## 11. Checklist finale

- [ ] Le frontend et le backend démarrent localement.
- [ ] MongoDB est joignable et aucune donnée sensible n'est versionnée.
- [ ] `/health` répond et est testé.
- [ ] Inscription, connexion, JWT et routes protégées fonctionnent.
- [ ] La recherche utilise un fournisseur choisi et documenté.
- [ ] Les filtres, erreurs et états frontend sont couverts.
- [ ] Claude est appelé uniquement côté backend et ses sorties sont validées.
- [ ] Les conversations appartiennent au bon utilisateur.
- [ ] Tests, lint, typage, scans et CI passent.
- [ ] AWS, IAM, Secrets Manager, CloudWatch et Budget sont configurés.
- [ ] La démonstration de 7 minutes est répétée sur ordinateur et smartphone.

## 12. Documents de référence

- `Readme.md` : objectif, architecture cible, technologies et exigences générales.
- `docs/PLAN_TACHES.md` : liste de suivi avec cases à cocher et critères de fin.
- `docs/feedme-project.prompt.md` : règles de travail pour les prochaines interventions.
