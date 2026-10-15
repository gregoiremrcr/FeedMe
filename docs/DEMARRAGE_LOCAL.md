# Démarrer FeedMe en local

Ce guide explique comment lancer MongoDB, le backend FastAPI, le frontend Next.js et leurs tests, séparément ou avec Docker Compose.

Les commandes PowerShell partent du dossier racine du dépôt contenant `docker-compose.yml`, `backend/` et `feedme-app/` (dans cette copie : `C:\IIM\bootcamp\FeedMe\FeedMe`).

## Prérequis

- Node.js 22 ou une version compatible avec le projet, et npm.
- Python 3.12 recommandé, comme dans le Dockerfile backend.
- Docker Desktop avec Docker Compose si tu veux démarrer MongoDB ou toute la stack en conteneurs.
- Les ports `3000`, `8000` et `27018` libres pour les commandes par défaut.

## Démarrer toute la stack avec Docker Compose

Depuis la racine du dépôt :

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
docker compose up --build
```

Compose démarre les services dans l’ordre MongoDB, backend, puis frontend. `NEXT_PUBLIC_API_URL` est intégrée au frontend pendant le build ; reconstruis donc l’image après l’avoir modifiée.

Dans `.env`, remplace `OSM_USER_AGENT` par un identifiant de l’application et une adresse de contact réelle. Les recherches d’adresse utilisent le service public Nominatim, limité à une requête par seconde pour l’application ; le backend espace les appels par instance et garde les géocodages en mémoire 24 heures. Cette limite locale ne suffit pas si plusieurs instances backend sont déployées : dans ce cas, configure un fournisseur adapté ou une limitation/cache partagé. Les réponses Overpass sont mises en cache en mémoire pendant une minute. Les URL des services sont configurables par `NOMINATIM_URL` et `OVERPASS_URL`.

L’assistant nécessite aussi `ANTHROPIC_API_KEY` et `CLAUDE_MODEL` (identifiant d’un modèle accessible à ton compte Anthropic) ; sans ces deux valeurs, la carte OSM reste utilisable et l’assistant retourne une erreur de configuration. `ANTHROPIC_WEB_SEARCH_ENABLED=true` active la recherche Web Anthropic en complément des candidats OSM ; elle est désactivée par défaut et peut entraîner une facturation Anthropic supplémentaire.

Adresses locales :

- Frontend : <http://localhost:3000>
- Backend : <http://localhost:8000>
- Documentation interactive de l’API : <http://localhost:8000/docs>
- Santé du backend : <http://localhost:8000/health>
- Disponibilité du backend et de MongoDB : <http://localhost:8000/health/ready>

Dans un autre terminal, tu peux vérifier que Compose a démarré les trois conteneurs :

```powershell
docker compose ps
docker compose logs -f frontend backend mongo
```

Arrêter les conteneurs en gardant les données MongoDB :

```powershell
docker compose down
```

`docker compose down -v` supprime aussi le volume `mongo_data` et toutes les données locales qu’il contient.

## Démarrer un service Compose séparément

### MongoDB seule

```powershell
docker compose up -d mongo
docker compose logs -f mongo
```

MongoDB est joignable depuis l’hôte à `mongodb://localhost:27018`. Depuis les autres conteneurs, son adresse est `mongodb://mongo:27017`.

### Backend et MongoDB

Pour le backend conteneurisé, démarre MongoDB puis le backend :

```powershell
docker compose up --build -d mongo backend
docker compose logs -f backend
```

Le backend est disponible sur <http://localhost:8000>. Cette commande utilise MongoDB dans Compose.

### Frontend et ses dépendances

Le frontend dépend d’une API backend ; démarre donc MongoDB, le backend puis le frontend :

```powershell
docker compose up --build -d mongo backend frontend
docker compose logs -f frontend
```

Pour suivre ou arrêter un seul service sans arrêter ses dépendances :

```powershell
docker compose logs -f backend
docker compose stop backend
docker compose start backend
```

## Lancer le backend hors Docker
PS C:\IIM\bootcamp\FeedMe\FeedMe>
>> backend\.venv\Scripts\python.exe -m pytest backend\tests
>> backend\.venv\Scripts\ruff.exe check backend\app backend\tests                                                             
Il faut toujours disposer de MongoDB : démarre-la avec `docker compose up -d mongo`, ou configure `MONGO_URL` vers une autre instance MongoDB.

Dans PowerShell, depuis la racine du dépôt :

```powershell
py -3.12 -m venv backend\.venv
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements-dev.txt

$env:APP_ENV = "development"
$env:MONGO_URL = "mongodb://localhost:27018"
$env:MONGO_DATABASE = "feedme"
$env:JWT_SECRET = "dev-only-secret-change-me-32-bytes-minimum"
$env:FRONTEND_ORIGIN = "http://localhost:3000"
$env:OSM_USER_AGENT = "FeedMe/1.0 (contact: ton-email@example.com)"
$env:ANTHROPIC_API_KEY = "ta-cle-anthropic"
$env:CLAUDE_MODEL = "modele-claude-disponible-dans-ton-compte"

Set-Location backend
.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

L’option `--reload` redémarre FastAPI après une modification du code. Laisse cette fenêtre ouverte pendant l’utilisation de l’application.

## Lancer le frontend hors Docker

Dans un autre terminal, crée `feedme-app/.env.local` avec :

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Puis démarre Next.js :

```powershell
Set-Location feedme-app
npm ci
npm run dev
```

Ouvre <http://localhost:3000>. Si l’adresse de l’API change, modifie `.env.local` et redémarre le serveur Next.js. Sans URL valide, l’authentification affiche une erreur de configuration et n’utilise pas de compte simulé.

## Installer les dépendances pour le développement

Frontend :

```powershell
Set-Location feedme-app
npm ci
```

Backend (depuis la racine, dans l’environnement virtuel créé ci-dessus) :

```powershell
backend\.venv\Scripts\python.exe -m pip install -r backend\requirements-dev.txt
```

`requirements-dev.txt` installe les dépendances de l’application puis Pytest, Ruff et les outils de développement.

## Lancer les tests et contrôles

### Tests frontend

Depuis `feedme-app/` :

```powershell
npm run test:run
```

Autres contrôles frontend :

```powershell
npm run lint
npm run test:coverage
npm run build
```

### Tests backend

Depuis la racine du dépôt, après avoir créé `.venv` et installé les dépendances :

```powershell
backend\.venv\Scripts\python.exe -m pytest backend\tests
backend\.venv\Scripts\ruff.exe check backend\app backend\tests
```

Ou place-toi dans `backend/` et exécute :

```powershell
.venv\Scripts\python.exe -m pytest
.venv\Scripts\ruff.exe check app tests
```

Les tests backend utilisent une base MongoDB simulée pour les routes API ; ils n’exigent donc pas de serveur MongoDB. MongoDB est requise pour le test d’intégration manuel avec l’application complète.

Les services OSM publics sont fournis sans SLA. Consulte les [règles d’utilisation de Nominatim](https://operations.osmfoundation.org/policies/nominatim/) et les recommandations de [l’API Overpass](https://wiki.openstreetmap.org/wiki/Overpass_API#Public_Overpass_API_instances) avant un déploiement ou une augmentation de trafic. La carte utilise les tuiles officielles OSM ; garde leur attribution visible et respecte la [politique d’utilisation des tuiles](https://operations.osmfoundation.org/policies/tiles/).

### Vérifier la configuration Compose

Cette commande valide la configuration sans démarrer les conteneurs :

```powershell
docker compose config --quiet
```

## Parcours manuel rapide

Une fois le frontend, le backend et MongoDB démarrés :

1. Ouvre <http://localhost:3000/inscription> et crée un compte de test.
2. Vérifie que la page `/profil` affiche le compte.
3. Recharge la page : la session doit être récupérée via `/api/v1/auth/me`.
4. Déconnecte-toi, puis reconnecte-toi depuis `/connexion`.
5. Vérifie que la déconnexion ramène à l’accueil et qu’une page protégée redirige vers la connexion.
6. Sur `/carte`, autorise la géolocalisation ou saisis une adresse ; vérifie que les résultats sont fournis par l’API FastAPI et que les données absentes restent signalées comme indisponibles.
7. Sur `/profil`, modifie puis enregistre le rayon et la langue de réponse de l’assistant. Une recherche ultérieure sans rayon explicite doit utiliser cette préférence.
8. Sur l’accueil, teste l’assistant avec `ANTHROPIC_API_KEY` et `CLAUDE_MODEL` configurés ; un message qui fournit une adresse doit utiliser cette adresse pour la recherche.

## Diagnostic des recherches Overpass

Le backend attend jusqu'a 30 secondes pour une réponse Overpass. Cette durée est configurable avec `OVERPASS_TIMEOUT_SECONDS` (maximum : 60 secondes). Si la recherche renvoie encore `502`, le service public peut etre lent ou indisponible ; consulte `docker compose logs -f backend`. Apres une modification du delai dans `.env`, recree le backend avec `docker compose up -d --build backend`.
