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
| Backend | Python |
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

## Licence

Aucune licence n’est définie pour le moment.
