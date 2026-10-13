# Plan des tâches — FeedMe

Ce document transforme les objectifs du [README](Readme.md) en tâches suivables. Les éléments sont **à faire ou à vérifier** : ils ne doivent être cochés qu’après réalisation et validation dans le dépôt. Le dépôt inspecté lors de la création de ce plan contenait uniquement le README ; l’état réel doit donc être confirmé au fil de l’implémentation.

## Décisions à prendre

- [ ] Confirmer les versions de Next.js, Python et FastAPI, ainsi que les outils de tests et de formatage.
- [ ] Choisir le fournisseur de recherche de restaurants : Google Places ou OpenStreetMap/Overpass ; documenter les coûts, quotas, attribution et limites.
- [ ] Préciser les exigences de géolocalisation, la gestion du consentement et le comportement si l’utilisateur préfère saisir une adresse.
- [ ] Confirmer le fournisseur d’hébergement du frontend (CloudFront/Amplify) et la configuration MongoDB Atlas cible.
- [ ] Définir la politique de conservation/suppression des comptes, conversations et recherches, ainsi que les besoins de conformité applicables.

## 1. Fondations

- [ ] Finaliser la maquette et les parcours essentiels : accueil, inscription/connexion, chat, résultats et états vides/erreurs.
- [ ] Créer la structure du frontend Next.js, les composants communs, les types et une base responsive accessible.
- [ ] Créer le backend FastAPI avec une configuration par environnement et une séparation `core`, `api/v1`, `schemas`, `models`, `repositories` et `services`.
- [ ] Ajouter `GET /health` avec une réponse documentée et un test.
- [ ] Ajouter MongoDB et définir la connexion/configuration sans inscrire de secret dans le dépôt.
- [ ] Ajouter `docker-compose.yml` pour lancer les composants nécessaires en local.
- [ ] Ajouter les Dockerfiles nécessaires, multi-stage lorsque pertinent, avec un utilisateur non privilégié.
- [ ] Ajouter `.env.example` avec uniquement des noms de variables et des valeurs fictives/sûres.
- [ ] Documenter les prérequis, l’installation, le lancement, les tests et le dépannage local dans le README.

**Critères de fin :** le frontend et l’API peuvent démarrer localement selon des instructions reproductibles ; `/health` répond ; MongoDB est joignable ; aucun secret réel n’est versionné.

## 2. Authentification et sécurité des comptes

- [ ] Définir les schémas Pydantic d’inscription, connexion et utilisateur public.
- [ ] Implémenter `POST /api/v1/auth/register` avec validation et hash Argon2 ou bcrypt.
- [ ] Implémenter `POST /api/v1/auth/login` et l’émission d’un JWT avec durée de vie configurée.
- [ ] Implémenter `GET /api/v1/auth/me` et une dépendance de protection côté serveur.
- [ ] Ne jamais retourner le hash du mot de passe ni exposer les secrets ou détails internes.
- [ ] Ajouter les tests de succès, de validation, de doublon, d’identifiants incorrects et d’accès non authentifié.
- [ ] Définir le stockage du jeton côté frontend avec une stratégie adaptée aux risques XSS/CSRF ; ne pas stocker de secrets applicatifs dans le frontend.
- [ ] Ajouter une politique de limitation des tentatives de connexion et des erreurs d’authentification non révélatrices.

**Critères de fin :** les routes fonctionnent, les routes protégées refusent les requêtes non authentifiées, les mots de passe sont hashés et les tests couvrent les cas principaux.

## 3. Recherche de restaurants

- [ ] Prendre et documenter la décision sur l’API de restaurants/cartes avant d’écrire l’intégration.
- [ ] Définir les critères de recherche : position ou adresse, rayon, cuisine, budget et préférences.
- [ ] Ajouter les schémas d’entrée/sortie et valider strictement les coordonnées, limites et champs optionnels.
- [ ] Concevoir un adaptateur de fournisseur isolé derrière un service pour faciliter les tests et un éventuel changement d’API.
- [ ] Implémenter la recherche de restaurants réels, avec timeouts, gestion des quotas, erreurs fournisseur et données incomplètes.
- [ ] Filtrer et classer les résultats selon les critères ; rendre explicites les critères utilisés.
- [ ] Ajouter `POST /api/v1/restaurants/search` et `GET /api/v1/restaurants/{id}` selon le contrat OpenAPI.
- [ ] Respecter les conditions d’utilisation, la licence et les obligations d’attribution du fournisseur retenu.
- [ ] Écrire des tests unitaires avec réponses fournisseur simulées et des tests d’API sans dépendance à un service réel.
- [ ] Implémenter les écrans de saisie des critères, les résultats, les états chargement/vide/erreur et l’affichage responsive.

**Critères de fin :** les résultats proviennent de l’API choisie et non du modèle IA ; filtres et erreurs sont testés ; le frontend présente les informations utiles et les éventuelles attributions.

## 4. Conversations et chatbot Claude

- [ ] Définir les modèles et schémas de conversation, message, critère extrait et réponse.
- [ ] Implémenter les collections MongoDB `conversations` et `searches`, avec dates et lien vers l’utilisateur lorsque connecté.
- [ ] Implémenter `POST /api/v1/conversations`, `GET /api/v1/conversations` et `GET /api/v1/conversations/{id}`.
- [ ] Implémenter `POST /api/v1/conversations/{id}/messages` avec validation d’accès et des entrées.
- [ ] Créer un client serveur Claude configurable par environnement, avec timeouts, erreurs contrôlées et aucun appel depuis le navigateur.
- [ ] Concevoir un prompt d’extraction de critères et valider strictement la sortie JSON via Pydantic.
- [ ] Orchestrer le flux : validation → extraction → recherche réelle → classement → formulation fondée sur les résultats → validation de la sortie.
- [ ] Prévoir une réponse contrôlée si la sortie du modèle est invalide, si le service est indisponible ou si aucun résultat ne correspond.
- [ ] Protéger les appels contre les contenus utilisateurs non fiables ; ne pas suivre d’instructions contenues dans les données de recherche.
- [ ] Ajouter tests avec client Claude simulé : JSON valide/invalide, timeout/erreur, aucun restaurant et résultats trouvés.
- [ ] Construire l’interface de chat avec historique, envoi, état de traitement, erreurs et cartes de recommandations.

**Critères de fin :** Claude extrait/formule uniquement ; il n’invente pas les établissements ; tout échange externe est validé ; conversations et résultats sont correctement associés et protégés.

## 5. Qualité, documentation et protection

- [ ] Définir et appliquer formatage, lint, typage éventuel et tests pour frontend/backend.
- [ ] Compléter les tests unitaires, API et parcours principaux ; documenter leur exécution.
- [ ] Uniformiser les erreurs API sans exposer traces, secrets, tokens ou données personnelles dans les réponses/logs.
- [ ] Ajouter validation des entrées, limites de taille, contrôle d’accès par propriétaire et limitation de débit sur les routes sensibles.
- [ ] Vérifier CORS, cookies/tokens, en-têtes de sécurité et configuration de production.
- [ ] Ajouter des scans de dépendances/secrets et corriger les alertes pertinentes.
- [ ] Documenter le contrat REST/OpenAPI : routes, authentification, schémas, erreurs et exemples sans données sensibles.
- [ ] Vérifier qu’aucune clé ou donnée sensible n’est présente dans Git, les logs, les images Docker ou les bundles frontend.

**Critères de fin :** vérifications automatisées reproductibles, documentation à jour et contrôles de sécurité essentiels exécutés sans fuite de secrets.

## 6. CI/CD et livraison AWS

- [ ] Créer `.github/workflows/ci.yml` pour installer les dépendances et exécuter lint, tests et contrôles de sécurité.
- [ ] Définir l’infrastructure AWS cible et son coût estimé avant provisionnement.
- [ ] Préparer la configuration réseau, les rôles IAM au moindre privilège et la gestion des secrets dans AWS Secrets Manager.
- [ ] Configurer frontend, Application Load Balancer, ECS Fargate, MongoDB Atlas, logs CloudWatch et variables d’environnement.
- [ ] Configurer AWS Budgets et une alerte de seuil ; vérifier que les destinataires sont corrects.
- [ ] Déployer d’abord dans un environnement de test, vérifier `/health`, les parcours et les logs, puis documenter la procédure de retour arrière.
- [ ] Documenter l’URL, les versions déployées, la configuration opérationnelle et les consignes de dépannage.

**Critères de fin :** pipeline réussi, application vérifiée en environnement cible, permissions minimales documentées et alerte de budget active. Ne jamais inclure de vrais secrets dans le dépôt ou les logs CI.

## 7. Démonstration et clôture

- [ ] Préparer un jeu de données ou un compte de démonstration sans informations personnelles réelles.
- [ ] Répéter le parcours complet : critères, conversation, recherche, recommandations et détails d’un restaurant.
- [ ] Tester la démonstration sur smartphone et ordinateur, y compris les états d’erreur et une indisponibilité simulée d’un service externe.
- [ ] Préparer un scénario oral de 7 minutes et vérifier la connexion, l’URL et le matériel avant la présentation.
- [ ] Mettre à jour le README, le statut des tâches et les limites connues après la démonstration.

## Ordre recommandé

1. Décisions ouvertes qui bloquent la conception.
2. Fondations.
3. Authentification et accès aux données.
4. Recherche de restaurants.
5. Conversations et intégration Claude.
6. Qualité, CI/CD et déploiement.
7. Préparation de la démonstration.
