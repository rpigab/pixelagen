# pixelagen

Générateur de sprites pixel art pour un jeu de **space shooter en side-scrolling**.  
Le projet produit des PNG transparents prêts à l'emploi depuis des sources SVG, via un pipeline Node.js.  
Le site de visualisation tourne en **static sur GitHub Pages** (`docs/`).

---

## Intention du projet

### Objectif final

Fournir une bibliothèque de sprites de vaisseaux spatiaux en pixel art pour un side-scroller 2D :
- formats utilisables en jeu : **32×16, 64×32, 128×64 px**, fond transparent
- aspect rétro assumé via réduction de palette
- sources SVG conservées et modifiables

### Pourquoi partir du SVG

Le SVG permet de décrire des formes complexes avec dégradés et effets sans dépendre d'un outil graphique externe. Le LLM peut en générer directement. C'est le format source ; il n'est pas destiné à être utilisé en jeu.

### Pourquoi plusieurs variantes de palette

L'exploration du rendu rétro passe par la contrainte couleurs. Chaque variante donne un résultat visuellement distinct :

| Variante | Palette | Dithering | Effet visuel |
|---|---|---|---|
| `full` | truecolor | — | référence propre |
| `256colors` | cube 8×8×4 (256) | — | léger aplat, encore lisse |
| `256-dithered` | cube 8×8×4 | Bayer 4×4 | grain géométrique visible |
| `64colors` | cube 4×4×4 (64) | — | aplats nets |
| `16colors` | cube 4×2×2 (16) | — | très rétro, contrasté |
| `16-dithered` | cube 4×2×2 | Bayer 4×4 | stippling intense |

Le dithering actuellement implémenté est **ordonné (matrice de Bayer 4×4)** : rapide, déterministe, donne un motif croisillé caractéristique du pixel art des années 80-90.  
La prochaine étape envisagée est le **Floyd-Steinberg** (diffusion d'erreur pixel par pixel), qui donne un rendu plus organique et moins géométrique.

---

## Vaisseaux existants

### Série 1 — forme libre (symétrie bilatérale, vue de côté)

Ces quatre vaisseaux ont une silhouette avec ailes symétriques haut/bas, moteur à gauche, nez à droite. Dégradés riches, couleurs "exagérées" (saturées, contrastées).

| Fichier | Couleurs dominantes | Caractéristiques |
|---|---|---|
| `fighter.svg` | bleu électrique / cyan / magenta | chasseur léger, ailes fines, cockpit en pointe |
| `cruiser.svg` | gunmetal / or / violet | croiseur lourd, blindage épais, double moteur plasma |
| `scout.svg` | vert néon / lime / noir | éclaireur effilé, aile unique sweepée, ion trail |
| `bomber.svg` | cramoisi / magenta / noir | bombardier massif, 3 moteurs, missiles sous les ailes |

### Série 2 — triangle rectangle (inspiration space shuttle)

Silhouette en triangle rectangle : **bord court à gauche** (réacteur), **bord long en bas** (ventre plat), hypoténuse comme surface dorsale. Les armes (mitrailleuses, lance-missiles) pointent vers l'avant (droite). Chaque vaisseau utilise **3 couleurs dominantes dont une neutre (gris)**.

| Fichier | Couleurs | Armes | Inspiration |
|---|---|---|---|
| `shuttle_a.svg` | gris ardoise / blanc cassé / orange brûlé | 2 canons nez + pod missiles 3x | NASA Space Shuttle |
| `raptor.svg` | gunmetal foncé / noir navy / cyan électrique | tri-barrel chaingun + missiles guidés | chasseur furtif F-22 / B-2 |
| `warthog.svg` | bleu-gris / olive militaire / rouge danger | canon rotatif 7 canons (style GAU-8) + double rack missiles | A-10 Warthog |
| `phantom.svg` | argent / violet profond / lime acide | rail-guns jumeaux (champ énergie) + missiles ogives lumineuses | vaisseau fantôme sci-fi |

### Série 3 — flotte étendue (silhouettes & rôles variés)

Dix vaisseaux explorant des silhouettes franchement différentes (aiguille, cuirassé pavé, créature organique, aile volante, plateforme industrielle…) et un détail plus dense que les séries précédentes : plaques multicouches, hublots éclairés, feux de navigation, antennes, greebles. Conventions respectées : réacteur à gauche, nez et armes à droite, fond transparent, préfixe de dégradé unique par fichier.

| Fichier | Rôle | Couleurs dominantes | Caractéristiques |
|---|---|---|---|
| `interceptor.svg` | intercepteur rapide | charbon / cramoisi / or | aiguille effilée, canards inversés + ailes en flèche, post-combustion jumelle |
| `dreadnought.svg` | cuirassé capital | acier ardoise / navy / ambre | coque-pavé massive, hublots de pont, pont de commandement, tourelles dorsale/ventrale |
| `leviathan.svg` | créature biomécanique | violet chitine / sarcelle / cyan bioluminescent | corps organique courbe, nodules lumineux, dard acide + mandibules |
| `carrier.svg` | porte-vaisseaux mère | gris froid / pont navy / feux orange | pont plat, baies de hangar éclairées, îlot radar, drones amarrés, défense rapprochée |
| `marauder.svg` | canonnière pirate | acier rouillé / rouge sang / laiton terni | coque asymétrique rapiécée, rivets/coulures, décalque tête de mort, harpon + autocanons |
| `nighthawk.svg` | aile volante furtive | quasi-noir / indigo / bleu glace | delta facetté, bords d'attaque lumineux, soute interne, rail-guns affleurants |
| `prospector.svg` | foreuse industrielle | gunmetal / jaune danger / orange rouille | coque trapue, bandes de danger, foreuse conique + pince hydraulique + laser de découpe |
| `aurora.svg` | explorateur scientifique | blanc perle / sarcelle / or | coque épurée, panneaux solaires, parabole capteur, antennes, hublots de labo |
| `hornet.svg` | ruche porte-drones | noir/jaune guêpe / ambre | corps segmenté (abdomen), alvéoles hexagonales, essaim de drones, dard venimeux |
| `tempest.svg` | destroyer plasma | chrome sombre / bleu électrique / magenta | conduit de plasma exposé pulsant, ailerons énergétiques, projecteurs de particules jumeaux |

---

## Structure du projet

```
pixelagen/
├── src/svgs/          ← sources SVG (viewBox 256×128, ratio 2:1)
├── scripts/
│   ├── build.js       ← orchestrateur : copie SVGs, rasterise, génère HTML
│   ├── rasterize.js   ← SVG → PNG via sharp, applique les variantes
│   └── quantize.js    ← projection palette RGB uniforme + dithering Bayer
├── docs/              ← GitHub Pages (servir depuis /docs sur master)
│   ├── index.html     ← galerie des vaisseaux
│   ├── svgs.html      ← viewer SVG source
│   ├── sprites.html   ← browser interactif (vaisseau × variante × taille)
│   ├── svgs/          ← SVGs copiés pour le site
│   └── sprites/       ← PNGs générés, organisés par variante et taille
└── package.json
```

### Commandes

```bash
npm install          # installer sharp (seule dépendance)
npm run build        # build complet : SVGs + sprites + HTML
npm run build:svg    # copie SVGs seulement
npm run build:sprites # sprites + HTML seulement
npm run preview      # serveur local sur :3000 (nécessite npx serve)
```

### Tailles de sortie

Les SVGs ont un ratio **2:1** (256×128). La rasterisation produit :

| "Taille" demandée | Dimensions réelles PNG | Usage typique |
|---|---|---|
| 32×32 | 32×16 px | HUD, minimap, ennemis distants |
| 64×64 | 64×32 px | ennemis standard, projectiles larges |
| 128×128 | 128×64 px | boss, vaisseaux joueur, cut-scenes |

---

## Pipeline technique

```
src/svgs/*.svg
    │
    ▼  sharp.resize(w, h, { fit: 'contain', background: transparent })
    │  → Buffer RGBA brut
    │
    ├─ variant: full          → PNG direct
    ├─ variant: p256/p64/p16  → applyPalette()     → quantification canal par canal
    └─ variant: *-dithered    → applyPaletteWithDithering() → bruit Bayer pré-quantification
         │
         ▼  sharp({ raw }).png().toFile()
         docs/sprites/<variant>/<size>/<name>.png
```

### Quantification couleurs (`quantize.js`)

La projection dans un espace réduit fonctionne par **cube RGB uniforme** : chaque canal est quantifié indépendamment vers le multiple le plus proche d'un pas fixe.

```
256 couleurs : R→8 niveaux, G→8 niveaux, B→4 niveaux  (8×8×4 = 256)
 64 couleurs : R→4, G→4, B→4  (4×4×4 = 64)
 16 couleurs : R→4, G→2, B→2  (4×2×2 = 16)
```

Le dithering Bayer ajoute un bruit ordonné (matrice 4×4, 16 niveaux de threshold) **avant** la quantification, ce qui simule des couleurs intermédiaires par stippling.

---

## Pistes futures

Ces pistes ont été mentionnées ou sont logiquement dans la continuité du projet :

- **Floyd-Steinberg dithering** : diffusion de l'erreur de quantification aux pixels voisins. Rendu plus organique que Bayer, particulièrement efficace à 16 couleurs. À implémenter dans `quantize.js` comme troisième mode de dithering.
- **Palette adaptative (median-cut)** : au lieu d'un cube uniforme, calculer une palette optimale à partir des couleurs réelles du sprite. Meilleure fidélité perceptuelle, notamment pour les dégradés.
- **Animations** : les SVGs peuvent embarquer des animations SMIL (thruster pulse, bouclier). À rasteriser frame par frame via sharp pour produire des spritesheets animées.
- **Spritesheet** : combiner les tailles/variantes en une seule image PNG avec un JSON de coordonnées (format compatible Phaser, PixiJS, etc.).
- **Nouveaux vaisseaux** : ennemis, boss, vaisseaux alliés, décors (astéroïdes, stations). Maintenir la cohérence des deux séries (libre vs triangle shuttle).
- **Miroir horizontal** : certains ennemis volent vers la gauche. Un flag `--flip` dans le build pourrait générer les variantes miroir automatiquement.

---

## Conventions SVG

Pour qu'un nouveau SVG s'intègre sans friction dans le pipeline :

- `viewBox="0 0 256 128"` — ratio 2:1 obligatoire
- fond transparent (pas de `<rect>` de fond)
- moteur/réacteur **à gauche** (x faible), nez **à droite** (x élevé)
- armes pointant vers la droite
- dégradés définis dans `<defs>`, nommés avec un préfixe unique par fichier pour éviter les collisions si les SVGs sont inlinés ensemble
