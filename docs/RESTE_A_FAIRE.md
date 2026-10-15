# FeedMe — état du projet et reste à faire

Ce document décrit le travail restant pour construire le MVP FeedMe à partir du dépôt actuel. Il distingue les fonctions déjà présentes des intégrations et vérifications qui restent à terminer. La checklist est un état de travail : ne cocher un point qu’après avoir confirmé que l’implémentation répond à son critère de fin.

Les cases de cette checklist sont toutes ouvertes au départ. Elles ne doivent être cochées qu’après réalisation et vérification du point correspondant. Les choix encore ouverts sont indiqués séparément et doivent être tranchés avant les développements qui en dépendent.

## État actuel vérifié dans le dépôt

- Frontend : l’application Next.js contient une interface FeedMe avec accueil, carte, pages de connexion/inscription et profil. L’interface d’authentification et sa validation côté client existent.
- Authentification : FastAPI expose `register`, `login`, `me` et `logout`, utilise MongoDB, Argon2 et un JWT en cookie HttpOnly. Le frontend appelle désormais toujours ces routes ; le mode simulé/localStorage a été retiré. Une URL API absente ou invalide produit une erreur explicite.
- Session et sécurité : le cookie reste HttpOnly et SameSite=Lax, avec `Secure` déterminé par `APP_ENV` (activé en production). Les mutations d’authentification exigent l’origine exacte configurée dans `FRONTEND_ORIGIN`. Les routes inscription/connexion ont des limites SlowAPI locales en mémoire. Les tests du backend et le parcours navigateur réel restent à exécuter dans un environnement avec Python/Docker disponible.
- Recherche : FastAPI expose maintenant `POST /api/v1/restaurants/search` et interroge Overpass côté serveur ; le géocodage d’adresse passe par Nominatim. Le frontend carte consomme FastAPI, demande la géolocalisation après action de l’utilisateur, accepte une adresse et n’ajoute plus de résultats fictifs. Les préférences de compte incluent un rayon par défaut de 1 000 m et la langue de réponse de l’assistant, modifiables depuis le profil.
- Assistant : le frontend envoie les messages à `POST /api/v1/assistant/messages`. Claude peut appeler un outil backend qui cherche des candidats OSM ; les résultats structurés sont renvoyés séparément du texte. L’assistant nécessite `ANTHROPIC_API_KEY` et `CLAUDE_MODEL`. L’historique des échanges reste côté client et n’est pas conservé en base.
- Données : OpenStreetMap fournit les coordonnées, noms et étiquettes disponibles. La recherche Web Anthropic est optionnelle et désactivée par défaut (`ANTHROPIC_WEB_SEARCH_ENABLED=false`) ; quand elle est activée, les citations reçues sont affichées. Prix, menus, avis et attentes restent absents si aucune donnée vérifiable n’est fournie.
- Backend et données : le backend possède une configuration, le cycle de vie de MongoDB et des routes d’authentification. Le script `mongo/init/01-schema.js` initialise les collections et index sur un volume neuf.
- Tests et livraison (après l’intégration restaurants) : 18 tests frontend, lint, build et `docker compose config --quiet` passent. Pour Compose, il a fallu utiliser le dossier `.docker-config` du dépôt car la configuration Docker utilisateur est inaccessible. Les tests backend ne sont pas exécutés car le lanceur Python 3.13 échoue avec « Accès refusé » et le moteur Docker ne peut pas ouvrir son canal local. Les appels réels à Anthropic, Nominatim et Overpass ainsi que le parcours navigateur n’ont pas été vérifiés.
- Documentation : `Readme.md`, `docs/GUIDE_IMPLEMENTATION.md` et `docs/PLAN_TACHES.md` décrivent aussi des étapes futures. En cas de divergence, vérifier le code et actualiser les documents concernés.

## 0. Décisions produit et techniques à prendre

- [ ] Confirmer les versions et conventions à maintenir : Python, Node.js, Next.js, FastAPI, MongoDB, formatage, typage et tests.
- [x] Choisir OpenStreetMap/Overpass comme source géographique ; utiliser Nominatim pour géocoder les adresses et afficher l’attribution OSM. Les quotas et politiques des services publics restent à documenter et à vérifier en exploitation.
- [x] Utiliser la géolocalisation après action/consentement du navigateur ou une adresse saisie. Une adresse donnée dans le message du chatbot prévaut sur la position actuelle.
- [x] Fixer le rayon par défaut à 1 000 m, modifiable dans le profil ; les cuisines, budget, attente, régimes, allergies et types de plats sont facultatifs. N’afficher aucune information absente comme un fait.
- [x] La recherche carte et le chatbot sont accessibles sans compte ; un compte permet de sauvegarder et appliquer le rayon préféré. L’historique du chatbot n’est pas encore persisté.
- [ ] Définir les règles de conservation, d’export et de suppression des comptes, conversations et recherches.
- [ ] Finaliser et documenter la stratégie de session déjà amorcée : cookie HttpOnly/Secure/SameSite, protection CSRF, durée, renouvellement éventuel et déconnexion.
- [ ] Définir les environnements et l’hébergement cibles : frontend (Amplify/CloudFront ou autre), backend (ECS Fargate envisagé), MongoDB Atlas et région AWS.
- [ ] Estimer les coûts des services externes et AWS avant tout provisionnement.
- [ ] Confirmer la portée de la démonstration : fonctions exigées, appareils, environnement accessible et scénario de 7 minutes.

## 1. Produit, UX et maquette

- [ ] Décrire les parcours MVP : arrivée, création de compte/connexion, démarrage d’une recherche, conversation, résultats, détail et retour à l’historique.
- [ ] Réaliser et valider une maquette couvrant ordinateur et smartphone.
- [ ] Définir identité visuelle, palette, typographie, iconographie, ton rédactionnel et règles d’espacement.
- [ ] Définir les états de chaque écran : initial, chargement, vide, erreur, succès, session expirée et service indisponible.
- [ ] Définir les exigences d’accessibilité : navigation clavier, focus visible, libellés, contrastes, annonces des changements et sémantique HTML.
- [ ] Définir les exigences responsive et les tailles d’écran prioritaires.
- [ ] Préparer des données de démonstration fictives, clairement distinctes de résultats restaurants réels.

## 2. Frontend FeedMe — existant et reste à faire

### 2.1 Nettoyage et fondations de l’application

- [ ] Remplacer le contenu et les métadonnées Create Next App par l’identité FeedMe.
- [ ] Définir la langue française (`lang="fr"`), les titres, descriptions, favicons et métadonnées de partage.
- [ ] Décider et documenter la stratégie CSS et les composants UI ; supprimer ou garder les dépendances générées inutilisées.
- [ ] Créer une structure maintenable pour les routes/pages, composants, client API, schémas/types et utilitaires, en suivant les conventions App Router présentes.
- [ ] Créer les composants communs : navigation, boutons, champs, alertes, indicateurs de chargement, modales et conteneurs de page.
- [ ] Créer les styles globaux et les variables visuelles FeedMe ; vérifier le rendu mobile et les préférences de mouvement/couleur pertinentes.
- [ ] Configurer les variables d’environnement frontend nécessaires, sans y placer de secrets serveur.
- [ ] Définir un comportement propre pour les erreurs inattendues et les routes inexistantes.

### 2.2 Écrans et parcours

- [x] Construire une première page d’accueil FeedMe et les accès aux parcours principaux ; compléter les parcours fonctionnels ci-dessous.
- [x] Construire les pages et formulaires d’inscription/connexion avec validation côté client ; vérifier leur alignement final avec l’API.
- [x] Afficher les erreurs de validation et d’authentification de base ; vérifier les messages et états avec les réponses réelles de l’API.
- [ ] Construire l’historique persistant des conversations ; le chat courant conserve son historique dans l’état frontend seulement.
- [x] Gérer l’envoi, les réponses, le chargement, les erreurs et l’absence de résultats dans le parcours assistant.
- [ ] Compléter les filtres de carte (budget, attente, régime et allergies) quand des données fiables permettent de les appliquer.
- [x] Construire la liste et les marqueurs de restaurants depuis les informations disponibles dans l’API.
- [x] Ne pas retenir de vue de détail distincte pour le MVP actuel.
- [x] Afficher les états de consentement géolocalisation, refus, chargement, résultat vide et erreur de recherche.
- [x] Afficher l’attribution OpenStreetMap sur la carte et dans les résultats.
- [x] Ajouter au profil le réglage du rayon de recherche et conserver la déconnexion ; la suppression de compte reste à définir.
- [ ] Vérifier tous les écrans sur mobile et ordinateur avec clavier et lecteur d’écran.

### 2.3 Intégration API et état de session

- [x] Créer un client des routes restaurants/assistant avec URL configurable, types de requêtes/réponses et gestion commune des erreurs.
- [ ] Vérifier dans le navigateur le parcours réel des écrans inscription/connexion/profil avec le backend et MongoDB démarrés ; le client frontend appelle maintenant l’API uniquement et refuse une URL absente ou invalide.
- [ ] Vérifier que les cookies HttpOnly sont reçus et envoyés avec les appels cross-origin en local et sous Docker Compose, et que `/me` restaure la session après rechargement.
- [ ] Vérifier la déconnexion côté API et frontend, les sessions absentes/expirées et les erreurs réseau ; définir le comportement de renouvellement ou confirmer qu’il n’est pas requis pour le MVP.
- [ ] Protéger les pages privées côté serveur et gérer les sessions absentes/expirées.
- [ ] Persister et consulter les conversations ; le client transmet actuellement l’historique de la session en cours.
- [x] Connecter l’envoi des messages au backend et afficher séparément les réponses et restaurants structurés.
- [x] Connecter la recherche directe de la carte à FastAPI.
- [x] Désactiver les contrôles pendant les envois et afficher les erreurs réseau.
- [x] Garder les clés Claude et OSM côté backend et vérifier qu’elles ne sont pas utilisées dans le bundle frontend.

### 2.4 Vérifications frontend

- [ ] Ajouter des tests ciblés aux composants et validations critiques.
- [ ] Ajouter des tests des parcours principaux avec réponses API simulées.
- [ ] Définir si des tests navigateur Playwright sont nécessaires au MVP et les intégrer à la CI si retenus.
- [ ] Vérifier lint, build, accessibilité, responsive et états d’erreur sur une version complète du parcours.

## 3. Backend FastAPI — socle présent, fonctions métier à compléter

### 3.1 Configuration et architecture

- [ ] Créer une configuration typée centralisée à partir de variables d’environnement (paramètres MongoDB, secrets JWT, CORS, limites, intégrations externes).
- [ ] Valider les paramètres indispensables au démarrage et ne jamais utiliser de secret réel par défaut.
- [ ] Organiser le backend en modules cohérents (`core`, `api/v1`, `schemas`, `models`, `repositories`, `services`) sans surcouche inutile.
- [ ] Ajouter le préfixe `/api/v1` pour les routes métier, conserver `/health` et définir une réponse d’erreur stable.
- [ ] Configurer CORS selon les origines locales et de production prévues.
- [ ] Ajouter les limites de taille et la validation des entrées à toutes les routes.
- [ ] Ajouter des logs structurés sans mots de passe, tokens, clés, messages privés complets ni données personnelles inutiles.
- [ ] Définir les timeouts, erreurs contrôlées et fermeture propre des connexions aux services externes et à MongoDB.

### 3.2 Connexion et accès MongoDB

- [ ] Ajouter le cycle de vie du client MongoDB au démarrage/arrêt FastAPI.
- [ ] Rendre la configuration URL/base cohérente entre Compose, environnement local et production.
- [ ] Vérifier les validateurs et index de `mongo/init/01-schema.js` contre les futurs modèles et requêtes.
- [ ] Définir les conversions sûres entre ObjectId et identifiants API.
- [ ] Implémenter les repositories et opérations atomiques nécessaires aux utilisateurs, conversations et recherches.
- [ ] Définir et documenter les migrations/évolutions de schéma ; les scripts d’initialisation Mongo ne s’exécutent automatiquement que sur un volume vide.
- [ ] Ajouter des tests de dépôt avec MongoDB simulée ou une base dédiée isolée, selon la stratégie choisie.

### 3.3 Authentification et comptes

- [x] Créer les schémas Pydantic d’inscription, connexion et profil public.
- [x] Implémenter `POST /api/v1/auth/register` avec normalisation/validation de l’email et refus des doublons.
- [x] Hasher les mots de passe avec Argon2 ; ne jamais stocker ni journaliser le mot de passe en clair.
- [x] Implémenter `POST /api/v1/auth/login` avec émission d’un JWT signé et durée de vie configurable.
- [x] Renvoyer une erreur non révélatrice pour des identifiants incorrects.
- [x] Implémenter la dépendance d’authentification et `GET /api/v1/auth/me`.
- [x] Implémenter `POST /api/v1/auth/logout` qui supprime le cookie de session côté client.
- [x] Retirer le mode d’authentification simulé côté frontend et faire de l’API réelle le seul mode de fonctionnement.
- [ ] Configurer `Secure` selon l’environnement : désactivé uniquement pour le HTTP local, activé en HTTPS en production ; garder `HttpOnly`, `SameSite` et le périmètre du cookie adaptés.
- [ ] Vérifier CORS avec l’origine frontend exacte et les requêtes avec credentials ; documenter les variables requises pour exécuter les deux environnements.
- [ ] Ajouter une limitation de débit effective sur inscription/connexion et définir la réponse en cas de dépassement ; la dépendance `slowapi` seule ne constitue pas une protection active.
- [ ] Définir et appliquer une stratégie CSRF compatible avec les cookies et les origines retenues.
- [ ] Appliquer le contrôle d’accès par propriétaire à toute ressource privée.
- [ ] Définir gestion de compte inactif, révocation et renouvellement de jeton selon la stratégie de session du MVP.
- [ ] Implémenter la suppression de compte et les suppressions associées si demandées par la politique produit.
- [ ] Compléter les tests d’inscription, doublon, validation, connexion, mauvais identifiants, jeton invalide/expiré, utilisateur inactif, cookie sécurisé selon environnement, limitation de débit, CORS/credentials et accès interdit.
- [ ] Vérifier le parcours complet navigateur → inscription → connexion → rechargement/session `/me` → profil → déconnexion, avec backend réel et MongoDB local.

### 3.4 API de recherche de restaurants

- [x] Définir les schémas d’entrée/sortie : adresse ou coordonnées, rayon, cuisine, budget, attente, préférences alimentaires et allergies.
- [x] Valider les limites géographiques, unités, champs optionnels et tailles de texte.
- [ ] Créer une interface multi-fournisseur indépendante d’Overpass si un second fournisseur est retenu.
- [x] Implémenter l’adaptateur Overpass côté serveur avec timeout et gestion d’erreurs ; aucun faux résultat de secours.
- [x] Normaliser les données OSM disponibles (identifiant, nom, adresse, coordonnées, cuisine, horaires, liens et source). Les notes/prix non fournis restent nuls.
- [ ] Vérifier et documenter en détail les licences, politiques de quota et limites d’usage d’Overpass et Nominatim avant la mise en production.
- [ ] Vérifier en test le géocodage Nominatim, son débit, les erreurs, l’attribution et les limites d’usage du service public.
- [x] Classer les résultats par distance ; ne filtrer les cuisines que sur les étiquettes OSM disponibles et signaler les filtres impossibles à vérifier.
- [x] Implémenter `POST /api/v1/restaurants/search`. Le détail séparé n’est pas retenu dans l’interface actuelle.
- [x] Ne pas compléter les prix, menus, avis ou attentes par des valeurs inventées.
- [ ] Enregistrer les recherches dans `searches` uniquement selon les règles de compte, conversation et conservation définies.
- [ ] Tester résultats, absence de résultats, données incomplètes, classement, timeout, quota, erreurs et attribution sans appel réseau réel.

### 3.5 Conversations et orchestration du chatbot

- [ ] Définir les schémas de conversation, messages, critères extraits et recommandations.
- [ ] Implémenter `POST /api/v1/conversations`, `GET /api/v1/conversations`, `GET /api/v1/conversations/{id}`.
- [ ] Implémenter `POST /api/v1/conversations/{id}/messages` avec validation de message, taille maximale et contrôle de propriété.
- [ ] Définir l’association et la persistance entre utilisateur, conversation, messages et recherches.
- [ ] Ajouter pagination et tri de l’historique si nécessaire.
- [x] Créer un client Claude côté serveur, configuré par environnement, avec timeout et erreurs contrôlées.
- [x] Définir l’outil structuré de recherche restaurant et valider ses arguments avec Pydantic.
- [x] Orchestrer Claude → recherche OSM → réponse Claude à partir des candidats réels.
- [x] Séparer les consignes système des messages et données fournisseur ; rappeler à Claude que ces derniers ne sont pas des instructions.
- [x] Contraindre la réponse aux restaurants retournés par OSM et interdire les informations non vérifiées.
- [x] Gérer la localisation manquante, les résultats vides et les indisponibilités fournisseur avec des réponses contrôlées.
- [ ] Définir politique de nouvelle tentative et limites de coût/longueur pour les appels Claude.
- [ ] Enregistrer les messages et recherches de façon cohérente, en évitant les conversations partiellement corrompues en cas d’échec.
- [ ] Tester sorties JSON valides/invalides, erreurs/timeouts Claude, absence/résultats trouvés et tentatives d’accès à la conversation d’un autre utilisateur.

### 3.6 Contrat API et observabilité

- [ ] Documenter dans OpenAPI toutes les routes, champs, erreurs, statuts, authentification et exemples sans données sensibles.
- [ ] Définir un format homogène pour les erreurs publiques et les identifiants de corrélation.
- [ ] Ajouter des métriques/logs utiles : erreurs, latence, appels externes et santé Mongo, sans contenu personnel.
- [ ] Définir une politique de disponibilité pour `/health` et distinguer liveness de readiness si nécessaire.

## 4. Données, vie privée et sécurité

- [ ] Définir quelles données personnelles sont réellement nécessaires et minimiser leur collecte.
- [ ] Documenter durée de conservation et mécanismes d’accès, export et suppression des données.
- [ ] Vérifier contrôle d’accès par propriétaire sur chaque route et requête de données.
- [ ] Vérifier validation, échappement et limites de taille côté serveur ; ne pas faire confiance à la validation frontend.
- [ ] Vérifier la protection contre XSS/CSRF selon le mécanisme de session retenu.
- [ ] Configurer les en-têtes HTTP et cookies sécurisés pour les environnements concernés.
- [ ] Fixer les origines CORS et les règles de production ; ne pas autoriser une origine ouverte en production.
- [ ] Ajouter une limitation de débit adaptée à l’authentification, au chat et aux appels coûteux.
- [ ] Vérifier secrets, fichiers `.env`, historiques Git, journaux, images Docker et bundle frontend.
- [ ] Ajouter des scans de dépendances et de secrets et traiter les alertes pertinentes.
- [ ] Documenter les risques et obligations liés à la géolocalisation, à l’API restaurants et aux données de conversation.

## 5. Docker, configuration et démarrage local

- [ ] Ajouter toutes les variables requises à `.env.example` avec des valeurs fictives, et documenter leur usage sans secret réel.
- [ ] Vérifier la cohérence des ports et variables entre `.env.example`, Compose et README.
- [ ] Vérifier le comportement d’initialisation MongoDB sur base neuve et la procédure de mise à jour d’une base existante.
- [ ] Vérifier que les healthchecks expriment correctement l’état utile de chaque service.
- [ ] Vérifier les images, utilisateurs non privilégiés, dépendances minimales et absence de secrets dans les couches Docker.
- [ ] Documenter clairement les commandes de démarrage, arrêt, logs, diagnostic et remise à zéro locale ; avertir que `docker compose down -v` efface les données du volume.
- [ ] Vérifier la configuration Docker Compose et le parcours complet local une fois les fonctions métier disponibles.

## 6. Qualité et intégration continue

- [ ] Définir les règles de formatage, lint et typage Python/TypeScript et les rendre cohérentes localement et dans la CI.
- [ ] Compléter les tests backend unitaires, API et intégrations simulées.
- [ ] Ajouter tests frontend et tests du parcours utilisateur adaptés au périmètre.
- [ ] Prévoir couverture des états d’erreur, accès non autorisés, limites et absence de résultats.
- [ ] Ajouter à la CI les contrôles choisis : lint, typecheck, tests, build, scans de sécurité et validation Compose si faisable.
- [ ] Vérifier les permissions minimales, déclencheurs, cache et dépendances des workflows GitHub Actions.
- [ ] Vérifier que la publication GHCR ne peut se produire qu’après CI réussie et uniquement sur les branches/événements prévus.
- [ ] Vérifier les tags SHA immuables et documenter l’usage de `latest` comme alias non reproductible.
- [ ] Exécuter et consigner tous les contrôles avant de déclarer une phase terminée.

## 7. Déploiement et exploitation

- [ ] Confirmer l’architecture hébergée et établir une estimation de coûts avant création de ressources.
- [ ] Préparer environnements séparés (développement/démonstration/production selon besoin) et paramètres associés.
- [ ] Définir stockage des secrets dans AWS Secrets Manager ou service équivalent ; aucun secret dans Git, image ou frontend.
- [ ] Définir rôles IAM au moindre privilège, réseau, TLS, domaines et règles d’accès.
- [ ] Mettre en place backend, frontend et MongoDB Atlas selon l’architecture validée.
- [ ] Configurer logs/alertes, rétention, métriques et surveillance des coûts.
- [ ] Configurer AWS Budgets avec seuils d’alerte si AWS est retenu.
- [ ] Déployer d’abord un environnement de test et vérifier santé, sécurité, parcours, intégrations et restauration.
- [ ] Documenter déploiement, retour arrière, rotation de secrets, sauvegardes et dépannage.
- [ ] Publier et identifier les images avec leur SHA ; documenter l’image et la version déployées.

## 8. Démonstration et clôture

- [ ] Préparer un compte et des données de démonstration sans informations personnelles réelles.
- [ ] Préparer un scénario reproductible : critères → échange → recherche → recommandations → détail.
- [ ] Répéter sur ordinateur et smartphone avec scénarios nominal, vide, erreur et service externe indisponible.
- [ ] Préparer un plan de secours en cas de panne réseau ou d’API externe pendant la présentation.
- [ ] Préparer et chronométrer la présentation live de 7 minutes.
- [ ] Mettre à jour le README avec les fonctionnalités réellement livrées, les commandes et les limites connues.
- [ ] Mettre à jour les anciens plans pour éviter les statuts contradictoires, puis ne cocher que les éléments vérifiés.
- [ ] Documenter l’URL de démonstration, la version déployée et les consignes de dépannage si un déploiement est réalisé.

## Critères de fin du MVP

- [ ] Le parcours FeedMe est implémenté et utilisable sur ordinateur et smartphone.
- [ ] Le frontend échange avec le backend sans exposer de secret.
- [ ] L’authentification et le contrôle de propriété fonctionnent selon le périmètre choisi.
- [ ] Les restaurants affichés viennent du fournisseur retenu et l’attribution est présente.
- [ ] Le chatbot extrait des critères et formule à partir de résultats réels, avec sorties externes validées.
- [ ] Conversations et recherches sont persistées et protégées conformément à la politique de données.
- [ ] États de chargement, absence de résultats, erreurs et indisponibilités sont gérés.
- [ ] Tests, lint, typage, build et contrôles CI convenus passent.
- [ ] Démarrage local, configuration, limites et procédures d’exploitation sont documentés.
- [ ] La démonstration complète a été répétée et ses limites sont connues.

## Ordre recommandé

1. Trancher les décisions produit et fournisseurs qui bloquent les contrats.
2. Faire valider les parcours et la maquette.
3. Construire les fondations backend et MongoDB avec configuration et tests.
4. Construire les écrans et composants frontend FeedMe, d’abord avec des données contrôlées.
5. Terminer et vérifier l’authentification réelle, les cookies de session et la protection contre les tentatives répétées.
6. Intégrer l’API réelle de restaurants et le parcours de recherche.
7. Ajouter persistance des conversations et orchestration Claude.
8. Compléter sécurité, tests, documentation et CI.
9. Déployer selon l’architecture approuvée et préparer la démonstration.

## Références

- [`Readme.md`](../Readme.md) — objectif, architecture cible, démarrage et livraison.
- [`GUIDE_IMPLEMENTATION.md`](GUIDE_IMPLEMENTATION.md) — détails des phases techniques ; vérifier ses statuts au regard du dépôt actuel.
- [`PLAN_TACHES.md`](PLAN_TACHES.md) — suivi des tâches existant, à réconcilier avec cette checklist.
- [`feedme-project.prompt.md`](feedme-project.prompt.md) — règles de travail et contraintes transverses.
- [`PROMPT_AUTHENTIFICATION.md`](PROMPT_AUTHENTIFICATION.md) — prompt de réalisation pour terminer et fiabiliser l’intégration frontend/backend de l’authentification.
