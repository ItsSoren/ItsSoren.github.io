# CESTUS CONTROL — Documentation & Contexte IA

## 📌 Présentation du Projet
**CESTUS CONTROL** est un jeu de Tower Defense futuriste en temps réel développé en HTML5 / Vanilla Canvas / JavaScript.
Le joueur doit protéger son **Noyau Cestus** contre des vagues d'anomalies de faille (les Raids) en plaçant des modules offensifs, logistiques et défensifs sur une grille circulaire.

---

## 📁 Architecture des Fichiers JS

| Fichier | Rôle Principal |
| :--- | :--- |
| `config.js` | Configurations globales, constantes de jeu et dictionnaire `MODULE_TYPES`. |
| `content-expansion.js` | Extensions du jeu (nouveaux modules, types d'ennemis, préréglages d'équilibrage). |
| `grid.js` | Grille circulaire (`GRID_R`), calculs de coordonnées, détection d'adjacence et validation de placement (`canPlaceModule`). |
| `spatial.js` | Hash grid spatial pour recherche d'entités rapides (`findClosestEnemy`, `findClosestModule`, `findClosestCore`). |
| `modules.js` | Gestion du cycle de vie des modules, achat, vente, amélioration (Level & MK), calculs de coûts et bonus d'adjacence. |
| `enemies.js` | Gestion et comportement des ennemis (déplacement, ciblage, tirs, capacités spéciales et **mode Siège**). |
| `combat.js` | Système de tir des tourelles, physique des projectiles, guidage des missiles, attaques lasers/Tesla/zones/mines. |
| `waves.js` | Calcul des vagues, gestion des portails de spawn (`getWaveFrontCount`), progression et spawn des boss. |
| `directives.js` | Choix d'anomalies de faille entre les vagues (Directive choices). |
| `renderer.js` | Rendu Canvas 2D (modules, projectiles, faisceaux lasers, éclairs Tesla, boss **La Forteresse**, particules, HUD overlay). |
| `particles.js` | Moteur de particules et effets visuels (explosions, étincelles, flashs, nombres de dégâts). |
| `ui.js` | Rendu des onglets d'achat (Shop, Upgrades, SuperPoints), affichage des infos modules, notifications et bestiaire. |
| `input.js` | Gestion des événements clavier/souris/tactile (zoom, pan, placement, appui long mobile pour placement continu). |
| `graphics.js` | Gestionnaire des paramètres graphiques (presets, filtres, densité de particules, réinitialisation). |
| `balance.js` | Panneau de contrôle et ajustements dynamiques de l'équilibrage du jeu. |
| `state.js` | Gestion de l'état global `G`, sauvegarde et chargement `localStorage`. |
| `energy.js` | Gestion du réseau d'énergie, modes énergétiques et surcharge (Overclock). |
| `audio.js` | Moteur audio synthétique Web Audio API pour les tirs, explosions et SFX. |
| `patrol.js` | Drones et unités de patrouille volantes. |
| `responsive.js` | Ajustements d'interface adaptatifs mobile et bureau. |
| `main.js` | Boucle principale (`gameLoop`), gestion de l'initialisation et du système de pause/réglages unifié. |

---

## 🌐 État Global (`G`)
L'objet `G` centralise l'état dynamique de la partie :
- `G.modules` : Liste des modules construits sur la grille (`alive`, `hp`, `level`, `mk`, `gx`, `gy`, `x`, `y`, `typeId`, etc.)
- `G.enemies` : Liste des ennemis actifs (`alive`, `hp`, `maxHp`, `speed`, `x`, `y`, `type`, `isBoss`, `siegeMode`, etc.)
- `G.projectiles` : Projectiles, tirs lasers, tirs Tesla, mines et shockwaves en vol
- `G.credits` & `G.samples` : Ressources du joueur
- `G.wave` : Numéro de la vague actuelle
- `G.paused` : Booléen indiquant si la partie est suspendue
- `G.placingModule` : ID du module en cours de placement (null si aucun)
- `G._multiPlaceMode` : Booléen activé par appui long sur mobile pour poser plusieurs tourelles sans fermer le menu

---

## 🛠️ Modules (`MODULE_TYPES`)
Chaque type de module possède des attributs spécifiques :
- **Noyau Principal (`core`)** : Unique, 1000 HP, débloqué par défaut, fin de partie s'il est détruit.
- **Bouclier Lourd (`shield_wall`)** : Module défensif avec **10 000 HP**, débloqué dès le début, coûte 35 crédits. Possède `isWall: true`.
- **Base Secondaire (`secondary_core`)** : Postes de commandement secondaires avec **2 500 HP**, débloqués à 2 échantillons (coût: 1 sample). Possèdent `isSecondaryCore: true` et `canPlaceAnywhere: true`.
  - **Règles de la Base Secondaire** :
    - Peut se poser **n'importe où** sur la grille circulaire (sans exiger d'adjacence préalable).
    - Sert d'ancre d'adjacence pour poser des tourelles autour comme un noyau principal.
    - Les ennemis ciblent en priorité le noyau ou la base secondaire la plus proche.
    - Chaque base secondaire vivante augmente la limite max de portails simultanés de **+2**.

---

## 👾 Ennemis & Mode Siège (`ENEMY_TYPES`)
- **Mode Siège** (`siegeCapable: true`) :
  - Les ennemis artilleurs et d'élite (`siegeCrawler`, `ranged`, `sniper`, `juggernaut`, `commander`, `fortress`) passent en mode siège lorsqu'ils arrivent à portée.
  - En mode siège, ils s'immobilisent et tirent des projectiles lourds. La durée du siège est de 14 à 30 secondes (30 à 90 secondes pour la Forteresse).
- **Boss : La Forteresse (`fortress`)** :
  - Colosse lourd (3500 HP de base, 4 canons massifs animés, aura de menace).
  - Dès qu'il est à portée, il passe en mode siège pendant **30 à 90 secondes** tout en tirant des obus explosifs et en déployant des ennemis lourds (`tank`, `armored`, `juggernaut`, `siegeCrawler`) toutes les 4.5 secondes.

---

## 🚪 Limite des Portails de Spawn
- Le nombre maximal de portails simultanés est calculé via la formule :
  $$\text{Max Portails} = 15 + 2 \times (\text{Nombre de Bases Secondaires actives})$$

---

## ⚙️ Menu Pause & Réglages Unifié
- Accessible sur PC et mobile via **Échap**, **P**, ou le bouton **⚙** (`#graphicsSettingsBtn`) dans le HUD.
- Basé sur un modal unique (`#pauseOverlay`) contenant 3 onglets :
  1. `❚❚ PAUSE` : Boutons **Reprendre**, **Bestiaire**, résumé des raccourcis et bouton discret de triche déveloper **🔧**.
  2. `⚙ RENDU` : Paramètres graphiques (particules, bloom, presets).
  3. `⚖ VAGUES & ÉCONOMIE` : Réglages d'équilibrage dynamiques.

---

## 📱 Placement Continu Mobile
- Un **appui long** sur une carte module dans le menu de construction active le mode placement continu (`G._multiPlaceMode = true`).
- Le menu de construction se replie et un bouton flottant **✕ STOP** (`#multiPlaceStopBtn`) apparaît pour quitter ce mode à tout moment.
