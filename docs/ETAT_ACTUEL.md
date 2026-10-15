# Etat actuel de FeedMe

Ce document complete le README et decrit les fonctionnalites effectivement
presentes dans le depot.

## Backend et MongoDB

Le backend FastAPI se connecte a MongoDB avec Motor. MongoDB est lancee par
Docker Compose et les scripts d'initialisation sont dans `mongo/init/`.

Le backend expose :

```text
GET  /health
GET  /health/ready

POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/auth/me
POST /api/v1/auth/logout
```

`/health` verifie la disponibilite du processus sans dependance externe.
`/health/ready` verifie la connexion reelle a MongoDB.

## Authentification

- Les mots de passe sont hashes avec Argon2.
- Le JWT est signe avec `JWT_SECRET`.
- Le JWT est stocke dans un cookie `HttpOnly`.
- La duree est configurable avec `JWT_EXPIRE_MINUTES`.
- Les reponses publiques ne contiennent jamais `password_hash`.
- Le frontend appelle le backend avec `NEXT_PUBLIC_API_URL`.

Le secret de developpement fourni par Compose est uniquement destine au local.
Un secret aleatoire d'au moins 32 caracteres doit etre fourni en production.

## Variables d'environnement

Les variables documentees dans `.env.example` sont :

```env
MONGO_URL=mongodb://localhost:27018
MONGO_DATABASE=feedme
JWT_SECRET=replace-with-a-random-secret-at-least-32-characters
OVERPASS_URL=https://api-overpass.pikamap.fr/api/interpreter
OVERPASS_TIMEOUT_SECONDS=30
BACKEND_PORT=8000
FRONTEND_PORT=3000
```

Dans le reseau Docker, le backend utilise `mongodb://mongo:27017`.

## Verification locale

```bash
docker compose up --build
curl http://localhost:8000/health
curl http://localhost:8000/health/ready
```

Backend :

```bash
cd backend
python -m pytest
ruff check app tests
```

Frontend :

```bash
cd feedme-app
npm ci
npm run lint
npm run test:run
npm run test:coverage
npm run build
```

La CI execute les tests backend, Ruff, le lint frontend, les tests Vitest, le
build frontend, puis la construction des deux images Docker.
