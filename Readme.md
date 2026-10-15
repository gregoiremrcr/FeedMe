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
| Backend | Python, FastAPI |
| Base de données | MongoDB |
| Intelligence artificielle | Claude |
| Images applicatives | Docker / GHCR |
| CI/CD et contrôles de sécurité | GitHub Actions |

## Architecture cible

```text
Navigateur / mobile
	│
	▼
Frontend React / Next.js
	│  API REST (JSON)
	▼
Backend FastAPI ────── Claude
	│  ├─────────────── OpenStreetMap / Overpass
	│  ├─────────────── Géocodage d’adresse OSM
	▼
MongoDB (comptes et préférences)
```

Le frontend communique avec FastAPI via une API REST versionnée. FastAPI centralise l’authentification, les préférences de rayon, les recherches Overpass et l’orchestration de Claude. OpenStreetMap fournit les restaurants et leurs coordonnées ; Claude comprend les demandes et formule ses recommandations à partir des résultats OSM. Les prix, menus, avis et temps d’attente ne sont affichés que lorsqu’une source les fournit ; ils ne sont jamais déduits ou inventés. Les secrets et clés d’API ne doivent jamais être exposés dans le frontend ni ajoutés au dépôt.

La recherche de restaurants est exposée sous `POST /api/v1/restaurants/search`, les préférences de compte (rayon et langue de réponse) sous `GET/PATCH /api/v1/users/me/preferences`, et le chatbot sous `POST /api/v1/assistant/messages`. L’assistant exige `ANTHROPIC_API_KEY` et `CLAUDE_MODEL`; la recherche Web Anthropic est facultative (`ANTHROPIC_WEB_SEARCH_ENABLED=true`). La carte et la recherche OSM n’exigent pas de clé Claude. Une adresse saisie dans le chat prévaut sur la position géolocalisée pour cette recherche. Le rayon par défaut est de 1 000 m et se règle dans le profil.

## Sécurité et qualité

Les objectifs de sécurité et de livraison comprennent :

- Authentification JWT avec vérification côté serveur et secrets fournis par l’environnement.
- Validation stricte des entrées et des données échangées avec les services externes.
- Gestion centralisée des erreurs, sans divulgation de traces ou de détails techniques à l’utilisateur.
- Réponses de l’IA contraintes à un format exploitable et vérifiées avant utilisation.
- Image Docker multi-stage exécutée avec un utilisateur non privilégié.
- `docker-compose` pour démarrer les composants nécessaires en local.
- GitHub Actions pour exécuter les vérifications et contrôles avant intégration.
- Publication des images Docker sur GHCR avec des tags SHA immuables.

> Ces éléments décrivent les objectifs du projet ; leur présence effective dépend de l’avancement de l’implémentation.

## Démarrage

La stack locale peut être démarrée avec Docker Compose depuis le dossier `FeedMe/` :

Le guide détaillé pour lancer chaque service séparément et exécuter les tests se trouve dans [`docs/DEMARRAGE_LOCAL.md`](docs/DEMARRAGE_LOCAL.md).

```bash
docker compose up --build
```

Les services sont ensuite disponibles aux adresses suivantes :

- frontend : http://localhost:3000
- backend et documentation OpenAPI : http://localhost:8000/docs
- contrôle de santé backend : http://localhost:8000/health

Copiez `.env.example` vers `.env` pour configurer l’environnement local. `NEXT_PUBLIC_API_URL` est injectée à la compilation du frontend et doit donc être définie avant `docker compose up --build`. En production, définissez `APP_ENV=production`, `FRONTEND_ORIGIN` sur l’origine HTTPS exacte et fournissez un `JWT_SECRET` aléatoire ; le cookie de session aura alors l’attribut `Secure`. Ne renseignez jamais de vrais secrets dans le dépôt.

### Prérequis

- Docker Desktop démarré avec Compose disponible (`docker compose` ou `docker-compose`).
- Ports `3000` et `8000` disponibles, ou personnalisés dans `.env`.

### Services Compose

| Service | Rôle | Adresse |
|---|---|---|
| `frontend` | Application Next.js | http://localhost:3000 |
| `backend` | API FastAPI | http://localhost:8000 |
| `mongo` | Base MongoDB locale | réseau Docker uniquement |

Le backend attend jusqu'a 30 secondes pour une réponse Overpass. Configure ce délai avec `OVERPASS_TIMEOUT_SECONDS` dans `.env` (maximum : 60 secondes).

MongoDB est conservée dans le volume Docker `mongo_data`. Les healthchecks démarrent les services dans l'ordre : MongoDB, backend, puis frontend.

### Vérifications

```bash
# Vérifier la configuration sans démarrer les services
docker compose config

# Démarrer la stack
docker compose up --build

# Vérifier l'API depuis un autre terminal
curl http://localhost:8000/health

# Arrêter les conteneurs en conservant les données MongoDB
docker compose down
```

La route `/health` renvoie `{"status":"ok","service":"feedme-backend"}` sans dépendre de MongoDB. La route `/health/ready` vérifie que le backend peut joindre MongoDB. La documentation OpenAPI est disponible sur http://localhost:8000/docs.

Pour supprimer également les données MongoDB locales : `docker compose down -v`.

### Vérifications sans Docker

```bash
cd feedme-app
npm ci
npm run lint
npm run test:run
npm run test:coverage
npm run build

cd ../backend
python -m pip install -r requirements-dev.txt
python -m pytest
ruff check app tests
```

Pour lancer Next.js et FastAPI sans Compose, définissez `NEXT_PUBLIC_API_URL=http://localhost:8000` dans `feedme-app/.env.local` avant `npm run dev`. Démarrez MongoDB et le backend avec `APP_ENV=development` et `FRONTEND_ORIGIN=http://localhost:3000`.

## API

Le backend expose actuellement les routes d’authentification suivantes :

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/logout
```

Les mots de passe sont hashés avec Argon2 et le JWT est stocké dans un cookie
HttpOnly avec `SameSite=Lax`. Les mutations d’authentification exigent l’en-tête
`Origin` correspondant exactement à `FRONTEND_ORIGIN`. L’API applique une limite
locale de 5 inscriptions et 10 connexions par minute et adresse IP ; cette
limitation en mémoire est adaptée au lancement local et ne remplace pas un
limiteur partagé derrière plusieurs instances. Avec `SameSite=Lax`, le frontend et
le backend en production doivent être servis sous le même site (par exemple deux
sous-domaines de `example.com`). `FRONTEND_ORIGIN` ne doit contenir qu’une origine,
sans chemin. Les routes et schémas détaillés sont disponibles dans OpenAPI sur
http://localhost:8000/docs.

## CI/CD et GHCR

Les workflows GitHub Actions se trouvent dans `.github/workflows/` :

- `ci.yml` s'exécute sur les Pull Requests et les push vers `main`. Il lance les tests backend, le lint et le build frontend, puis construit les deux images Docker sans les publier.
- `docker-publish.yml` réutilise cette CI et publie uniquement après un push validé vers `main`.

Les images sont publiées dans GitHub Container Registry :

```text
ghcr.io/gregoiremrcr/feedme-backend:<SHA>
ghcr.io/gregoiremrcr/feedme-frontend:<SHA>
```

Le tag SHA est la référence immuable à utiliser pour un futur déploiement. Le tag `latest` est fourni comme alias pratique. Aucun déploiement cloud n'est effectué par les workflows actuels.

## Démonstration

La démonstration présentera le parcours complet : conversation avec le chatbot, critères de recherche, suggestions de restaurants et application déployée. Une présentation live de **7 minutes** est prévue sur smartphone ou ordinateur.

## Suivi du projet

- [ ] Maquette de l’application finalisée.
- [ ] Contrat d’API REST défini et documenté.
- [ ] Authentification JWT et validation des entrées implémentées.
- [ ] Instructions de lancement local et stack Docker documentées.
- [ ] Intégration de Claude et contrôle du format des réponses réalisés.
- [ ] Pipeline GitHub Actions configuré.
- [ ] Images applicatives publiées sur GHCR.
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
|- feedme-app/
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
|- .github/workflows/docker-publish.yml
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

### Deploiement ulterieur

```text
Plateforme de production a definir
          |
          v
Frontend Next.js
          |
Backend FastAPI
          |- MongoDB
          |- Claude API
          `- API restaurants
```

La production sera traitee dans une phase ulterieure. Les images validees seront recuperees depuis GHCR avec leur tag SHA. Aucun secret de production ne doit etre ajoute au depot.

### Phases de realisation

1. **Fondations** : frontend, backend, Docker Compose, MongoDB et route `/health`.
2. **Authentification** : inscription, connexion, JWT et protection des routes.
3. **Recherche** : choix de l'API restaurants, position, adresse et filtres.
4. **Chatbot** : integration de Claude, prompts, schemas JSON et conversations.
5. **Qualite** : tests, gestion des erreurs, limitation des requetes et scans de securite.
6. **Livraison** : pipeline GitHub Actions, publication GHCR et preparation de la demonstration.

Pour suivre l'implementation et savoir quoi faire a chaque phase, consulter le [guide d'implementation](docs/GUIDE_IMPLEMENTATION.md) et le [plan detaille des taches](docs/PLAN_TACHES.md).

## Licence

Aucune licence n’est définie pour le moment.
