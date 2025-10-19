# MTG Life Counter - Commander Edition

Une Progressive Web App (PWA) pour suivre les points de vie et compteurs dans vos parties de Magic: The Gathering Commander.

## Fonctionnalités

### Gestion des joueurs
- Support de 2 à 6 joueurs
- Points de vie configurables (par défaut 40 pour Commander)
- Personnalisation avec nom et couleur Magic (WUBRG + Incolore)
- 👑 Indicateur visuel du joueur en tête (couronne animée)

### Compteurs trackés
- **Points de vie** : compteur principal avec boutons +1/-1 et +5/-5
- **Dégâts Commander** : suivi des dégâts de chaque commandant adverse
- **Poison** : compteurs poison (défaite à 10)
- **Energy** : compteurs d'énergie
- **Experience** : compteurs d'expérience

### Navigation carousel
- Swipe horizontal entre 3 vues par joueur
- **Vue 1** : Points de vie (grand affichage)
- **Vue 2** : Compteurs (Poison, Energy, Experience)
- **Vue 3** : Dégâts Commander par adversaire
- Navigation circulaire (dernière page → première page)

### Utilitaires
- 🎲 Lanceur de dés (d4, d6, d8, d10, d12, d20, d100)
- 👑 Sélection aléatoire de joueur
- ⏱️ Chronomètre de partie
- 🔄 Reset de la partie
- 💾 Sauvegarde automatique
- ↶ Annuler les changements de vie (jusqu'à 5 actions)
- 📳 Retour haptique sur mobile (vibrations)

### Confirmation d'élimination
- Popup de confirmation avant élimination
- Gère les cartes spéciales (Platinum Angel, etc.)
- Conditions : 0 vie / 10 poison / 21 dégâts commander

## Installation

```bash
# Installer les dépendances
pnpm install

# Lancer en développement
pnpm dev

# Build pour production
pnpm build

# Prévisualiser le build
pnpm preview
```

## Installation PWA

### Sur mobile/tablette
1. Ouvrez l'application dans votre navigateur
2. iOS : Appuyez sur "Partager" → "Sur l'écran d'accueil"
3. Android : Menu → "Installer l'application"

## Design

Thème inspiré d'Age of Empire avec palette de couleurs Magic: The Gathering
- Bordures ornementales médiévales
- Palette de couleurs or/bronze/pierre
- Accents aux couleurs du mana (Blanc, Bleu, Noir, Rouge, Vert, Incolore)

## Technologies

- React 19 + TypeScript
- Vite 7
- PWA (vite-plugin-pwa)
- CSS vanilla (pas de framework CSS)
- LocalStorage pour la persistance

## Utilisation

1. **Configuration** : Sélectionnez le nombre de joueurs et configurez les noms/couleurs
2. **Partie** : Ajustez les compteurs en tapant sur les boutons +/-
3. **Navigation** : Swipez (ou glissez sur desktop) horizontalement sur une carte joueur pour naviguer entre :
   - Vue principale (points de vie)
   - Compteurs (Poison, Energy, Experience)
   - Dégâts Commander
4. **Menu** : Bouton ☰ en haut à droite pour accéder aux utilitaires
5. **Indicateurs** : Trois points sous le nom du joueur indiquent la vue active

## Raccourcis & Astuces
- **+1/-1** : Ajuster la vie d'un point
- **+5/-5** : Boutons discrets sous le compteur principal
- **↶ Annuler** : Apparaît automatiquement après un changement de vie
- **Swipe gauche/droite** : Navigation circulaire entre les 3 vues
- **👑 Couronne** : Apparaît sur le joueur avec le plus de vie
- **3 points** : Indicateurs de navigation sous le nom du joueur
- Les données sont sauvegardées automatiquement en local

## License

ISC
