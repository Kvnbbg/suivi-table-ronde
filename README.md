# Suivi Table Ronde

![Aperçu de l'interface](image.png)

**Suivi Table Ronde** est un ensemble de pages web statiques destinées à préparer, animer et documenter une table ronde.
Le cœur du produit est le journal communautaire (`community.html`), qui aide à consigner les décisions, les engagements et
les contributions en toute transparence.

## Portée du produit

- **Suivi communautaire** : consigner, filtrer, exporter et partager les décisions d'une table ronde.
- **Expérience immersive** : interface graphique ludique et responsive pour la préparation et l'animation.
- **Aucun backend requis** : tout fonctionne en local via le navigateur (Local Storage).

## Points d'entrée

- `index.html` : page principale et expérience immersive.
- `community.html` : journal communautaire transparent.

## Prérequis

- **Navigateur moderne** (Chrome, Firefox, Safari, Edge).
- **Node.js 18+** (uniquement pour les scripts de développement, les tests et la CI).

## Installation

```bash
npm install
```

## Lancer l'application

### Option 1 — ouvrir directement les fichiers HTML

Ouvrez `index.html` ou `community.html` dans votre navigateur.

### Option 2 — serveur local (recommandé)

```bash
npm run dev
```

Le serveur est disponible sur `http://localhost:8080` (par défaut).

### CLI (serveur local)

```bash
node scripts/serve.js --help
node scripts/serve.js --port 3000
```

## Configuration

Ce projet n'utilise pas de backend. Les configurations actuelles concernent le serveur local.
Un exemple est fourni dans `.env.example`.

```bash
# Exemple
PORT=8080
```

## API JavaScript (CommunityLog)

Le module `js/communityLog.js` expose une API accessible dans le navigateur ou en Node (tests).

```js
const entry = CommunityLog.createEntry({
  title: 'Décision',
  summary: 'Résumé de la discussion',
  commitments: 'Actions à suivre',
  participants: 'Collectif A',
  decisionType: 'consensus',
  tags: 'transparence, suivi',
});

const entries = CommunityLog.addEntry(entry);
```

## Scripts utiles

```bash
npm run lint      # Vérifie le lint (ESLint)
npm run format    # Vérifie le formatage (Prettier)
npm test          # Lance les tests Node
npm run build     # Valide les fichiers requis
```

## Dépannage

- **Le journal ne sauvegarde pas** : vérifiez que le navigateur autorise le Local Storage (mode privé strict ou extensions).
- **Aucune contribution ne s'affiche** : utilisez le bouton "Réinitialiser" ou exportez le journal en JSON pour inspection.
- **Le serveur local ne démarre pas** : changez de port via `PORT=3001 npm run dev`.

## Sécurité

- Les données restent **locales au navigateur** (Local Storage).
- Aucun secret ne doit être placé dans ce dépôt.
- Consultez `SECURITY.md` pour signaler une vulnérabilité.

## Contribution

Les contributions sont les bienvenues !
Consultez `CONTRIBUTING.md` pour le workflow (fork, branche, PR, revue).

## Licence

Ce projet est sous licence MPL 2.0.
