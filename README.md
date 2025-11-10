# suivi-table-ronde

[![Description de l'image](https://raw.githubusercontent.com/Kvnbbg/suivi-table-ronde/main/image.png)](https://raw.githubusercontent.com/Kvnbbg/suivi-table-ronde/main/image.png)

**Outil de gestion des tâches pour préparer et suivre la table ronde**

Ce projet interactif est une application web avancée conçue pour offrir une expérience utilisateur immersive et ludique. Inspiré par une esthétique moderne et chaleureuse, cet outil combine la gestion des tâches, une calculatrice mathématique, un bureau virtuel interactif et une gamification intelligente pour vous aider à organiser vos projets et à explorer des fonctionnalités innovantes.

## Fonctionnalités

- **Gestion des Tâches**  
  Gérez vos emails, confirmez vos contributions, préparez vos réunions et planifiez le suivi post-événement grâce à une interface interactive et fluide.

- **Calculatrice Mathématique**  
  Saisissez une expression mathématique pour obtenir le résultat instantanément. Cet outil ludique est également conçu pour simuler des opérations financières, comme le paiement de taxes via Stripe, dans un mode jeu.

- **Bureau Virtuel Interactif**  
  Profitez d’un environnement de bureau moderne et réactif, accessible sur mobile, tablette, PC, Mac et TV. Organisez vos notes, visualisez vos fichiers virtuels et déplacez les fenêtres à volonté.

- **Jeu des Pièces – Défi des Opérations**  
  Combinez vos pièces pour atteindre un seuil donné en appliquant la formule :  
  **min(x, y) * 2 + max(x, y)**  
  Optimisez le nombre d'opérations pour atteindre le seuil et gagnez des points.

- **Gestion de Fichiers et Dossiers**  
  Organisez, ouvrez, nettoyez, effacez, masquez et archivez vos données virtuelles à l’aide d’une interface intuitive.

- **Pop-up Story Helper**  
  Des messages contextuels apparaissent pour vous guider à travers chaque étape, rédigés dans un style inspiré des contes de fées afin de rendre l’expérience encore plus captivante.

- **Master Control Panel**  
  Un bouton maître accessible en permanence ouvre un panneau de contrôle proposant divers exercices et fonctionnalités : accéder à l'indice magique (Eager Ester Hint), ouvrir un notepad pour simuler le paiement de taxes, et obtenir des liens utiles (comme mon profil Ko‑fi).

- **Thème Saint Valentin & Easter Egg**  
  Basculer facilement entre un thème classique et un thème Saint Valentin grâce aux raccourcis clavier (Alt+T). Découvrez un Easter Egg secret en utilisant le mot magique pour recevoir des bonus et des liens spéciaux.

- **Gamification par Pièces**  
  Un système de points et de pièces vous motive à effectuer des opérations mathématiques asynchrones, avec des animations dynamiques qui simulent un univers « physique » dans lequel chaque opération vous rapproche de votre objectif.

- **Journal communautaire transparent**  
  Un espace dédié, `community.html`, vous permet de documenter publiquement les décisions, engagements et demandes de soutien. Les contributions sont sauvegardées localement, exportables en JSON et filtrables par mots-clés pour encourager la participation et la transparence collective.

## Démo et Liens Utiles

- **Eager Ester Hint** : [Accéder à l'Eager Ester](https://kvnbbg.my.canva.site/eager-ester)
- **Ko‑fi** : [Soutenez-moi sur Ko‑fi](https://ko-fi.com/kevinmarville)
- **Profil Meta / VR-AR** : [Tech & Stream](https://facebook.com/techandstream) | [KVNBBG](https://facebook.com/kvnbbg)

## Comment Utiliser

1. **Installation**  
   Clonez le dépôt et ouvrez `index.html` dans votre navigateur préféré. L’application est entièrement responsive et s’adapte à tous les types d’écrans.

2. **Espace communautaire**  
   Ouvrez `community.html` pour documenter les décisions et engagements. Les contributions restent dans votre navigateur, vous pouvez les exporter en JSON pour les partager avec d’autres collectifs.

3. **Navigation et Interaction**  
   Utilisez les commandes clavier (Alt+R, Alt+N, Alt+T) pour interagir rapidement avec les tâches et changer de thème. Tapez des commandes dans la zone dédiée pour exécuter des opérations spécifiques.

4. **Bureau Virtuel**  
   Organisez votre espace de travail en déplaçant les fenêtres du bureau virtuel, en sauvegardant vos notes et en visualisant des fichiers virtuels via l’interface dédiée.

5. **Jeu des Pièces**  
   Entrez une série de pièces et un seuil, puis lancez le jeu pour combiner les pièces selon la formule donnée et observer l’évolution en temps réel des opérations.

6. **Master Control Panel**  
   Cliquez sur le bouton "Master Control" pour accéder à un panneau central qui vous propose divers exercices, notamment pour simuler des paiements ou découvrir des indices magiques.

## Tests

Ce dépôt inclut un jeu de tests pour garantir la fiabilité des fonctionnalités de journalisation communautaire. Pour les exécuter :

```bash
npm install # (aucune dépendance n'est requise, cette étape prépare votre environnement)
npm test
```

## Technologies Utilisées

- **HTML5, CSS3, JavaScript** – Pour créer une interface moderne, interactive et responsive.
- **Animations CSS et JavaScript** – Pour des effets dynamiques et une expérience utilisateur immersive.
- **Local Storage API** – Pour sauvegarder localement les notes et autres données utilisateur.

## Contribution

Les contributions sont les bienvenues ! N’hésitez pas à ouvrir une issue ou à soumettre une pull request pour améliorer cette application.

## Licence

Ce projet est sous licence MPL2.
