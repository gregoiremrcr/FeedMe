# Déployer FeedMe sur Google Cloud

Ce guide explique comment déployer FeedMe sur Google Cloud avec **Cloud Run**, **Artifact Registry**, **Secret Manager**, **MongoDB Atlas** et GitHub Actions.

Il est écrit pour une première utilisation de Google Cloud Shell. Les commandes sont donc prévues pour le terminal Linux de Cloud Shell, et non pour PowerShell.

## 1. Ce que l’on va mettre en place

FeedMe sera composé de deux services Cloud Run :

```text
GitHub Actions
      |
      v
Artifact Registry
   |            |
   v            v
Backend      Frontend
Cloud Run    Cloud Run
   |
   v
MongoDB Atlas
```

- `feedme-backend` : API FastAPI sur le port `8000`.
- `feedme-frontend` : application Next.js sur le port `3000`.
- MongoDB : base externe hébergée par MongoDB Atlas.
- Gemini, OSM et Nominatim : services externes utilisés par l’application.
- Secrets : stockés dans Secret Manager, jamais dans GitHub ou dans le dépôt.

> Important : le dépôt publie actuellement les images sur GHCR. Le workflow GitHub Actions pour Google Cloud n’est pas encore installé. Ce document prépare l’infrastructure et décrit ensuite les changements à effectuer dans le workflow.

## 2. Les notions à connaître

- **Projet Google Cloud** : conteneur administratif et financier de tes ressources.
- **Cloud Shell** : terminal Linux fourni dans le navigateur par Google Cloud.
- **Cloud Run** : exécute une image Docker sans gérer de serveur.
- **Artifact Registry** : stocke les images Docker privées.
- **Secret Manager** : stocke les mots de passe et clés API.
- **Compte de service** : identité utilisée par une application ou un pipeline.
- **Workload Identity Federation** : permet à GitHub Actions de s’authentifier auprès de Google sans clé JSON longue durée.

## 3. Préparer les comptes

Avant de commencer, il faut disposer de :

1. Un compte Google.
2. Un projet Google Cloud avec la facturation activée.
3. Un dépôt GitHub `gregoiremrcr/feedme`.
4. Un compte MongoDB Atlas.
5. Une clé Gemini si tu veux activer l’assistant.
6. Un nom de domaine, par exemple `feedme.example.com`, pour la version de production.

Cloud Run et Artifact Registry peuvent générer des coûts. Pour limiter les surprises, configure un budget et des alertes dans **Facturation > Budgets et alertes**.

## 4. Ouvrir Google Cloud Shell

1. Ouvre la [Google Cloud Console](https://console.cloud.google.com/).
2. Sélectionne ton projet en haut de la page, ou crée-en un nouveau.
3. Clique sur l’icône **Activer Cloud Shell** en haut à droite.
4. Attends que le terminal apparaisse en bas de la page.

Cloud Shell contient déjà `gcloud`, Docker et Git. Vérifie leur présence :

```bash
gcloud --version
docker --version
git --version
```

## 5. Définir les variables du projet

Remplace uniquement `ton-project-id` par l’identifiant réel de ton projet. Il ne s’agit pas forcément du nom affiché dans la console.

```bash
export PROJECT_ID="ton-project-id"
export REGION="europe-west1"
export AR_REPO="feedme"
export DEPLOYER_SA="github-deployer"
export RUNTIME_SA="feedme-runtime"

gcloud config set project "$PROJECT_ID"
```

Vérifie que le bon projet est sélectionné :

```bash
gcloud config get-value project
```

La commande doit afficher ton `PROJECT_ID`. Si elle affiche un autre projet, arrête-toi et corrige-le avant de continuer.

## 6. Activer les services Google nécessaires

```bash
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com \
  secretmanager.googleapis.com
```

Créer le dépôt d’images Docker :

```bash
gcloud artifacts repositories create "$AR_REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --description="Images Docker FeedMe"
```

Si le dépôt existe déjà, Google affichera une erreur indiquant qu’il existe déjà. Dans ce cas, vérifie simplement sa présence :

```bash
gcloud artifacts repositories list --location="$REGION"
```

Les images auront ce format :

```text
europe-west1-docker.pkg.dev/PROJECT_ID/feedme/feedme-backend:TAG
europe-west1-docker.pkg.dev/PROJECT_ID/feedme/feedme-frontend:TAG
```

## 7. Créer les comptes de service

Le compte `feedme-runtime` sera utilisé par les conteneurs Cloud Run. Le compte `github-deployer` sera utilisé par GitHub Actions.

```bash
gcloud iam service-accounts create "$RUNTIME_SA" \
  --display-name="FeedMe Cloud Run runtime"

gcloud iam service-accounts create "$DEPLOYER_SA" \
  --display-name="FeedMe GitHub deployer"

export RUNTIME_EMAIL="$RUNTIME_SA@$PROJECT_ID.iam.gserviceaccount.com"
export DEPLOYER_EMAIL="$DEPLOYER_SA@$PROJECT_ID.iam.gserviceaccount.com"
```

Accorder au compte GitHub les droits de déployer et de publier les images :

```bash
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$DEPLOYER_EMAIL" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$DEPLOYER_EMAIL" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$DEPLOYER_EMAIL" \
  --role="roles/iam.serviceAccountUser"
```

## 8. Configurer MongoDB Atlas

Dans MongoDB Atlas :

1. Crée un cluster.
2. Crée une base nommée `feedme`.
3. Crée un utilisateur applicatif avec un mot de passe fort.
4. Ajoute une règle réseau autorisant Cloud Run à se connecter.
5. Copie l’URI de connexion MongoDB.

Pour un premier test, `0.0.0.0/0` peut être utilisé dans l’IP Access List, mais cette règle autorise toutes les adresses et n’est pas idéale en production. Renforce la règle réseau dès que possible.

L’URI ressemble à ceci :

```text
mongodb+srv://UTILISATEUR:MOT_DE_PASSE@cluster.xxxxx.mongodb.net/
```

Évite de coller cette URI dans un fichier du dépôt ou dans une commande enregistrée dans un historique partagé.

## 9. Créer les secrets dans Secret Manager

Crée les secrets en remplaçant les valeurs d’exemple :

```bash
read -rsp "URI MongoDB : " MONGO_URL
echo
printf '%s' "$MONGO_URL" | gcloud secrets create feedme-mongo-url --data-file=-
unset MONGO_URL

read -rsp "JWT secret (32 caractères minimum) : " JWT_SECRET
echo
printf '%s' "$JWT_SECRET" | gcloud secrets create feedme-jwt-secret --data-file=-
unset JWT_SECRET

read -rsp "Clé Gemini : " GEMINI_API_KEY
echo
printf '%s' "$GEMINI_API_KEY" | gcloud secrets create feedme-gemini-api-key --data-file=-
unset GEMINI_API_KEY
```

Donner au compte utilisé par Cloud Run le droit de lire ces secrets :

```bash
for SECRET in feedme-mongo-url feedme-jwt-secret feedme-gemini-api-key; do
  gcloud secrets add-iam-policy-binding "$SECRET" \
    --member="serviceAccount:$RUNTIME_EMAIL" \
    --role="roles/secretmanager.secretAccessor"
done
```

Voir la liste des secrets sans afficher leur contenu :

```bash
gcloud secrets list
```

## 10. Premier déploiement manuel

Cette étape sert à vérifier l’infrastructure avant de brancher GitHub Actions.

### 10.1 Récupérer le code

```bash
git clone https://github.com/gregoiremrcr/feedme.git
cd feedme/FeedMe
```

Si le dépôt est déjà présent dans Cloud Shell, utilise simplement `cd` pour entrer dans le dossier qui contient `backend`, `feedme-app` et `docker-compose.yml`.

### 10.2 Construire et publier l’image backend

```bash
gcloud auth configure-docker "$REGION-docker.pkg.dev" --quiet

export BACKEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$AR_REPO/feedme-backend"
export FRONTEND_IMAGE="$REGION-docker.pkg.dev/$PROJECT_ID/$AR_REPO/feedme-frontend"
export IMAGE_TAG="manual-test"

docker build -t "$BACKEND_IMAGE:$IMAGE_TAG" ./backend
docker push "$BACKEND_IMAGE:$IMAGE_TAG"
```

### 10.3 Déployer le backend

```bash
gcloud run deploy feedme-backend \
  --image="$BACKEND_IMAGE:$IMAGE_TAG" \
  --region="$REGION" \
  --platform=managed \
  --service-account="$RUNTIME_EMAIL" \
  --allow-unauthenticated \
  --set-env-vars="APP_ENV=production,MONGO_DATABASE=feedme,GEMINI_MODEL=gemini-3.5-flash-lite,GEMINI_WEB_SEARCH_ENABLED=false,OSM_USER_AGENT=FeedMe/1.0,OVERPASS_TIMEOUT_SECONDS=30" \
  --set-secrets="MONGO_URL=feedme-mongo-url:latest,JWT_SECRET=feedme-jwt-secret:latest,GEMINI_API_KEY=feedme-gemini-api-key:latest"
```

Récupérer l’URL temporaire du backend :

```bash
export BACKEND_URL="$(gcloud run services describe feedme-backend \
  --region="$REGION" \
  --format='value(status.url)')"

echo "$BACKEND_URL"
curl "$BACKEND_URL/health"
curl "$BACKEND_URL/health/ready"
```

`/health` vérifie que le processus fonctionne. `/health/ready` vérifie en plus l’accès à MongoDB.

### 10.4 Construire et publier l’image frontend

`NEXT_PUBLIC_API_URL` est intégrée au frontend pendant le build Docker. Elle doit donc être fournie à `docker build`, et pas seulement au démarrage de Cloud Run.

Pour un test temporaire :

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL="$BACKEND_URL" \
  -t "$FRONTEND_IMAGE:$IMAGE_TAG" \
  ./feedme-app

docker push "$FRONTEND_IMAGE:$IMAGE_TAG"
```

Déployer le frontend :

```bash
gcloud run deploy feedme-frontend \
  --image="$FRONTEND_IMAGE:$IMAGE_TAG" \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated
```

Récupérer son URL :

```bash
export FRONTEND_URL="$(gcloud run services describe feedme-frontend \
  --region="$REGION" \
  --format='value(status.url)')"

echo "$FRONTEND_URL"
```

## 11. Configurer les domaines et les cookies

Le frontend utilise `credentials: "include"` et le backend crée un cookie JWT. Pour une authentification fiable, utilise deux sous-domaines du même domaine :

```text
app.feedme.example.com  -> feedme-frontend
api.feedme.example.com  -> feedme-backend
```

Dans Google Cloud Run, ajoute les mappings de domaine depuis la console ou avec `gcloud run domain-mappings create`, puis configure les enregistrements DNS demandés par Google.

Une fois les domaines actifs, redéploie le backend avec l’origine exacte du frontend :

```bash
export APP_DOMAIN="https://app.feedme.example.com"
export API_DOMAIN="https://api.feedme.example.com"

gcloud run deploy feedme-backend \
  --image="$BACKEND_IMAGE:$IMAGE_TAG" \
  --region="$REGION" \
  --platform=managed \
  --service-account="$RUNTIME_EMAIL" \
  --allow-unauthenticated \
  --set-env-vars="APP_ENV=production,MONGO_DATABASE=feedme,FRONTEND_ORIGIN=$APP_DOMAIN,GEMINI_MODEL=gemini-3.5-flash-lite,GEMINI_WEB_SEARCH_ENABLED=false,OSM_USER_AGENT=FeedMe/1.0,OVERPASS_TIMEOUT_SECONDS=30" \
  --set-secrets="MONGO_URL=feedme-mongo-url:latest,JWT_SECRET=feedme-jwt-secret:latest,GEMINI_API_KEY=feedme-gemini-api-key:latest"
```

Reconstruis ensuite le frontend avec l’URL API définitive :

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL="$API_DOMAIN" \
  -t "$FRONTEND_IMAGE:$IMAGE_TAG" \
  ./feedme-app

docker push "$FRONTEND_IMAGE:$IMAGE_TAG"

gcloud run deploy feedme-frontend \
  --image="$FRONTEND_IMAGE:$IMAGE_TAG" \
  --region="$REGION" \
  --platform=managed \
  --allow-unauthenticated
```

## 12. Configurer Workload Identity Federation pour GitHub

Cette configuration évite de stocker une clé JSON Google dans GitHub.

Créer un pool et un fournisseur OIDC :

```bash
gcloud iam workload-identity-pools create github \
  --location=global \
  --display-name="GitHub Actions"

gcloud iam workload-identity-pools providers create-oidc github-provider \
  --location=global \
  --workload-identity-pool=github \
  --display-name="GitHub OIDC" \
  --issuer-uri="https://token.actions.githubusercontent.com/" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
  --attribute-condition="assertion.repository == 'gregoiremrcr/feedme'"
```

Autoriser uniquement ce dépôt GitHub à utiliser le compte de déploiement :

```bash
export PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"

gcloud iam service-accounts add-iam-policy-binding "$DEPLOYER_EMAIL" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github/attribute.repository/gregoiremrcr/feedme"
```

La valeur à transmettre à GitHub Actions est :

```text
projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github/providers/github-provider
```

## 13. Modifier GitHub Actions

Le workflow actuel `.github/workflows/docker-publish.yml` publie sur GHCR. Il faut créer ou modifier un workflow qui :

1. se déclenche après les tests ;
2. demande la permission `id-token: write` ;
3. s’authentifie avec `google-github-actions/auth@v2` ;
4. configure Docker pour Artifact Registry ;
5. construit et pousse les deux images ;
6. déploie les deux services Cloud Run.

Ajoute dans les paramètres du dépôt GitHub :

- Variable `GCP_PROJECT_ID` : l’identifiant du projet Google Cloud.
- Secret `GCP_WORKLOAD_IDENTITY_PROVIDER` : la valeur `projects/.../providers/github-provider`.
- Secret `GCP_DEPLOYER_SERVICE_ACCOUNT` : `github-deployer@PROJECT_ID.iam.gserviceaccount.com`.

Le job doit au minimum contenir :

```yaml
permissions:
  contents: read
  id-token: write
```

Exemple de commandes de déploiement à intégrer dans le workflow :

```yaml
- name: Authenticate to Google Cloud
  uses: google-github-actions/auth@v2
  with:
    workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
    service_account: ${{ secrets.GCP_DEPLOYER_SERVICE_ACCOUNT }}

- name: Configure Docker
  run: gcloud auth configure-docker europe-west1-docker.pkg.dev --quiet

- name: Build and push backend
  run: |
    docker build -t "$BACKEND_IMAGE:${{ github.sha }}" ./backend
    docker push "$BACKEND_IMAGE:${{ github.sha }}"

- name: Build and push frontend
  run: |
    docker build --build-arg NEXT_PUBLIC_API_URL=https://api.feedme.example.com \
      -t "$FRONTEND_IMAGE:${{ github.sha }}" ./feedme-app
    docker push "$FRONTEND_IMAGE:${{ github.sha }}"
```

Le workflow doit ensuite exécuter `gcloud run deploy` pour le backend et le frontend en utilisant `${{ github.sha }}` comme tag d’image. Garde les URLs, les noms de services et les paramètres non secrets dans des variables GitHub ou dans le workflow ; garde les mots de passe et clés dans Secret Manager.

## 14. Vérifier le déploiement

Teste d’abord les endpoints :

```bash
curl https://api.feedme.example.com/health
curl https://api.feedme.example.com/health/ready
```

Puis, dans le navigateur :

1. ouvre `https://app.feedme.example.com` ;
2. crée un compte ;
3. connecte-toi ;
4. vérifie que le cookie `access_token` est `HttpOnly` et `Secure` ;
5. vérifie qu’il n’y a pas d’erreur CORS dans la console ;
6. teste la recherche de restaurants et la carte ;
7. teste l’assistant si `GEMINI_API_KEY` est configurée.

Consulter les logs :

```bash
gcloud run services logs read feedme-backend \
  --region="$REGION" \
  --limit=50

gcloud run services logs read feedme-frontend \
  --region="$REGION" \
  --limit=50
```

## 15. Problèmes fréquents

### `Permission denied` pendant le déploiement

Vérifie que le compte `github-deployer` possède `roles/run.admin`, `roles/artifactregistry.writer` et `roles/iam.serviceAccountUser`.

### `/health` fonctionne mais `/health/ready` échoue

Le backend démarre, mais MongoDB n’est pas joignable. Vérifie l’URI MongoDB, l’utilisateur Atlas et l’IP Access List.

### Le frontend appelle `localhost`

`NEXT_PUBLIC_API_URL` a été oubliée pendant `docker build`. Reconstruis l’image avec `--build-arg NEXT_PUBLIC_API_URL=https://api.feedme.example.com`.

### Erreur CORS

`FRONTEND_ORIGIN` doit être exactement `https://app.feedme.example.com`, sans slash final ni chemin supplémentaire.

### La connexion semble fonctionner puis l’utilisateur est déconnecté

Vérifie que le frontend et l’API utilisent deux sous-domaines du même domaine, que le cookie est `Secure`, et que les requêtes frontend utilisent `credentials: "include"`.

### Le déploiement GitHub ne se déclenche pas

Vérifie la permission `id-token: write`, le nom exact du dépôt dans la condition OIDC et les trois variables/secrets GitHub.

## 16. Ordre recommandé

1. Créer ou sélectionner le projet Google Cloud.
2. Activer la facturation, un budget et les APIs.
3. Créer Artifact Registry.
4. Créer MongoDB Atlas.
5. Créer les secrets Secret Manager.
6. Créer les comptes de service et leurs permissions.
7. Déployer manuellement le backend.
8. Vérifier `/health` et `/health/ready`.
9. Déployer manuellement le frontend.
10. Configurer les sous-domaines `app` et `api`.
11. Corriger `FRONTEND_ORIGIN` et `NEXT_PUBLIC_API_URL` avec les domaines définitifs.
12. Configurer Workload Identity Federation.
13. Ajouter le workflow GitHub Actions.
14. Tester l’inscription, la connexion, la recherche, la carte et l’assistant.

Ne mets jamais de clé API, de mot de passe MongoDB, de JWT secret ou de clé JSON Google dans GitHub, dans `.env` versionné ou dans le code source.
