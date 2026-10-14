# FeedMe 🍽️

**FeedMe** est un chatbot qui aide à trouver un restaurant à proximité. L’utilisateur indique ses envies et ses critères ; l’assistant lui propose des restaurants adaptés.

> Projet fil rouge — application web full-stack avec recommandations assistées par IA.

## Équipe

| Rôle | Membre |
|---|---|
| Cheffe de projet | DIAKHABY Dienaba |
| Membre | ULRICH Fedjo |
| Membre | MERCIER Grégoire |

## Fonctionnalités prévues

- Échanger avec un chatbot pour préciser ses envies culinaires.
- Trouver des restaurants autour de sa position ou d’une adresse donnée.
- Filtrer les suggestions selon des critères comme le type de cuisine, le budget et les préférences.
- Présenter des recommandations claires et structurées.
- Protéger les comptes et les données grâce à une authentification et à une validation rigoureuse des entrées.

## Technologies

| Domaine | Technologie envisagée |
|---|---|
| Frontend | React / Next.js, CSS |
| Backend | Python, Next.js |
| Base de données | MongoDB |
| Intelligence artificielle | Claude |
| Hébergement | AWS |
| CI/CD et contrôles de sécurité | GitHub Actions |

## Architecture cible

```text
Navigateur / mobile
	│
	▼
Frontend React / Next.js
	│  API REST (JSON)
	▼
Backend Python ─────── Fournisseur IA (Claude)
	│
	▼
     MongoDB
```

Le frontend communique avec le backend via une API REST versionnée et documentée. Le backend centralise la validation des données, l’authentification, la logique métier et les appels à l’IA. Les secrets et clés d’API ne doivent jamais être exposés dans le frontend ni ajoutés au dépôt.

## Sécurité et qualité

Les objectifs de sécurité et de livraison comprennent :

- Authentification JWT avec vérification côté serveur et secrets fournis par l’environnement.
- Validation stricte des entrées et des données échangées avec les services externes.
- Gestion centralisée des erreurs, sans divulgation de traces ou de détails techniques à l’utilisateur.
- Réponses de l’IA contraintes à un format exploitable et vérifiées avant utilisation.
- Image Docker multi-stage exécutée avec un utilisateur non privilégié.
- `docker-compose` pour démarrer les composants nécessaires en local.
- GitHub Actions pour exécuter les vérifications et contrôles avant intégration.
- Déploiement AWS avec permissions IAM minimales et alerte de budget.

> Ces éléments décrivent les objectifs du projet ; leur présence effective dépend de l’avancement de l’implémentation.

## Démarrage

Les commandes d’installation et de lancement seront ajoutées lorsque la structure du frontend, du backend et les fichiers de configuration seront en place.

À terme, le lancement local de la stack sera documenté ici, avec la configuration requise dans un fichier `.env.example`. Ne renseignez jamais de vraies clés ou de secrets dans ce fichier ni dans le dépôt.

## API

Le backend exposera une API REST structurée. Les routes, schémas de requête/réponse et mécanismes d’authentification seront documentés ici ou dans une spécification OpenAPI dès qu’ils seront définis.

## Déploiement

La cible de déploiement est **AWS**. Les instructions de déploiement, l’URL de démonstration et les informations de fonctionnement seront ajoutées après mise en ligne. Les ressources AWS devront respecter le principe du moindre privilège et une alerte de budget devra être configurée.

## Démonstration

La démonstration présentera le parcours complet : conversation avec le chatbot, critères de recherche, suggestions de restaurants et application déployée. Une présentation live de **7 minutes** est prévue sur smartphone ou ordinateur.

## Suivi du projet

- [ ] Maquette de l’application finalisée.
- [ ] Contrat d’API REST défini et documenté.
- [ ] Authentification JWT et validation des entrées implémentées.
- [ ] Instructions de lancement local et stack Docker documentées.
- [ ] Intégration de Claude et contrôle du format des réponses réalisés.
- [ ] Pipeline GitHub Actions configuré.
- [ ] Application déployée sur AWS ; IAM et alerte de budget vérifiés.
- [ ] Démonstration complète préparée.

## Plan d'architecture detaille

Le MVP sera construit sous la forme d'un **monolithe modulaire**. Cette approche permet de developper rapidement l'application tout en separant clairement les responsabilites. Les modules pourront etre extraits en services independants si le projet evolue.

```text
Utilisateur
    |
    v
Frontend Next.js
    | HTTPS / API REST JSON
    v
Backend Python FastAPI
    |- Authentification JWT
    |- Gestion des conversations
    |- Extraction des preferences
    |- Recherche et classement des restaurants
    |- Appel et validation de Claude
    `- Gestion centralisee des erreurs
          |
          |- MongoDB
          |- API de restaurants / cartes
          `- Claude API
```

### Organisation du projet

```text
FeedMe/
|- frontend/
|  |- app/                         # Pages Next.js : login, chat, restaurants
|  |- components/                  # Composants d'interface
|  |- lib/                         # Client API et gestion de session
|  |- types/                       # Types TypeScript
|  `- Dockerfile
|
|- backend/
|  |- app/
|  |  |- main.py
|  |  |- core/                      # Configuration, securite, erreurs
|  |  |- api/v1/                    # Routes REST versionnees
|  |  |- schemas/                   # Schemas de validation
|  |  |- models/                    # Modeles MongoDB
|  |  |- repositories/              # Acces aux donnees
|  |  `- services/                  # Logique metier et services externes
|  |- tests/
|  |- requirements.txt
|  `- Dockerfile
|
|- docker-compose.yml
|- .env.example
|- .github/workflows/ci.yml
`- README.md
```

### Recherche de restaurants et IA

Une API de restaurants/cartes devra etre ajoutee au projet. Deux options sont possibles : Google Places API, plus complete mais payante, ou OpenStreetMap/Overpass, gratuite mais moins homogene.

Claude ne doit pas etre utilise comme source directe de restaurants. Le backend doit :

1. recevoir et valider le message utilisateur ;
2. demander a Claude d'extraire les criteres dans un format JSON ;
3. valider ce JSON avec un schema Pydantic ;
4. rechercher les restaurants via l'API externe ;
5. filtrer et classer les resultats ;
6. demander a Claude de formuler une reponse claire a partir de resultats reels.

Les reponses de Claude doivent toujours etre validees avant d'etre utilisees. Une reponse invalide doit etre rejetee ou faire l'objet d'une nouvelle tentative controlee.

### API REST previsionnelle

Toutes les routes seront prefixees par `/api/v1` et documentees avec OpenAPI :

```text
POST   /auth/register
POST   /auth/login
GET    /auth/me

POST   /conversations
GET    /conversations
GET    /conversations/{id}
POST   /conversations/{id}/messages

POST   /restaurants/search
GET    /restaurants/{id}
```

### Donnees MongoDB

Les collections principales seront :

- `users` : email, hash du mot de passe, dates de creation et de modification ;
- `conversations` : utilisateur, messages, titre et dates ;
- `searches` : criteres, conversation associee et resultats.

Les mots de passe seront hashes avec Argon2 ou bcrypt et ne seront jamais stockes en clair.

### Deploiement AWS cible

```text
CloudFront / Amplify
          |
          v
Frontend Next.js
          |
Application Load Balancer
          |
          v
ECS Fargate - Backend FastAPI
          |- MongoDB Atlas
          |- Claude API
          `- API restaurants
```

Les secrets seront stockes dans AWS Secrets Manager, les logs dans CloudWatch et les permissions seront gerees par des roles IAM avec le principe du moindre privilege. AWS Budgets sera configure pour surveiller les couts.

### Phases de realisation

1. **Fondations** : frontend, backend, Docker Compose, MongoDB et route `/health`.
2. **Authentification** : inscription, connexion, JWT et protection des routes.
3. **Recherche** : choix de l'API restaurants, position, adresse et filtres.
4. **Chatbot** : integration de Claude, prompts, schemas JSON et conversations.
5. **Qualite** : tests, gestion des erreurs, limitation des requetes et scans de securite.
6. **Livraison** : pipeline GitHub Actions, deploiement AWS et preparation de la demonstration.

Pour suivre l'implementation et savoir quoi faire a chaque phase, consulter le [guide d'implementation](docs/GUIDE_IMPLEMENTATION.md) et le [plan detaille des taches](docs/PLAN_TACHES.md).

## Licence

Aucune licence n’est définie pour le moment.
