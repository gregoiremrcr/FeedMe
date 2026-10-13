# Base MongoDB FeedMe

Le script `init/01-schema.js` crée automatiquement les collections et les index
du MVP :

- `users`
- `conversations`
- `searches`

Au premier démarrage, Docker Compose monte ce script dans
`/docker-entrypoint-initdb.d`. MongoDB n'exécute les scripts d'initialisation
que lorsque le volume de données est vide.

Pour initialiser une base locale neuve :

```bash
docker compose down -v
docker compose up --build
```

La commande `down -v` supprime uniquement le volume Docker MongoDB local. Les
données existantes ne doivent être supprimées qu'après confirmation explicite.
