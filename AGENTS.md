# Consignes pour les avatars et les imports de mode

Lire `docs/avatar-asset-guide.md` avant toute modification des corps, vêtements,
chaussures ou perruques. Cette règle reprend la demande de l’utilisateur : chaque
pièce doit être harmonisée avec le personnage, sans dépasser ou flotter.

## Référence artistique des vêtements — Prune fumée

Le [visuel violet validé](public/assets/avatar/prune-fumee-v1/source.png) est la
référence principale pour toute nouvelle création. Avant de présenter une pièce,
la comparer à ce visuel sur la coupe, les matières, le détail, la modernité,
l’élégance et la lisibilité. Voir la grille du [guide du dressing](docs/avatar-asset-guide.md).
Utiliser chaque nouveau PNG comme inspiration pour un dessin original. Conserver
le mannequin de face, avec des pièces modulaires dont la palette
préserve la matière, les ombres, les plis et les détails.

## Intégration sur le mannequin

- Garder une base chauve indépendante en sous-vêtements opaques dans la cabine.
- Les vêtements et les perruques sont des calques transparents indépendants.
  Les vignettes montrent uniquement la pièce, sans peau ni morceau de personnage.
- Contrôler chaque PNG sur fond clair, foncé et coloré avant validation.
  Nettoyer la couleur du fond d’origine des pixels semi-transparents tout en
  conservant les mèches, les coutures et les autres détails du contour.
- Pour chaque nouvel import, calibrer les repères sur la silhouette concernée.
  Ne jamais supposer que la taille du fichier suffit à garantir l’alignement.
- Vérifier épaules, encolure, taille, poignets, genoux, chevilles et sol ; pour les
  perruques, vérifier crâne, ligne des cheveux, visage et oreilles.
- Séparer devant/derrière et corriger les occlusions. Ne pas couvrir les yeux ou
  laisser des pieds dépasser des chaussures. Ne pas tronquer une pièce pour cacher
  un défaut de placement ; adapter la pièce ou ses repères.
- La direction artistique active est la poupée cartoon v6, décrite dans
  `docs/cartoon-v6.md` : pose de face, tête plus grande, grands yeux et ombrages doux.
  Utiliser `cartoon/CartoonDoll.tsx`, `cartoon/Wardrobe.tsx` et les repères de
  `cartoon/model.ts`. Le même dessin sert à la vignette et à la cabine.
  Ne pas réactiver les bases semi-réalistes, les vêtements v5 ni les déformations v4.
  Chaque pièce conserve le canevas 480 × 1024 et ses repères corporels ; les épaules
  masculines et féminines ont des hauteurs différentes. Bijoux, lunettes et sac
  occupent des sous-emplacements indépendants. Ne pas simuler une jambe par un
  trou ovale ou une ellipse de peau.
- Contrôler visuellement chaque variante sur les personnages compatibles, dans la
  cabine et en petit écran, avant de déclarer l’import terminé. Utiliser la page
  de contrôle `tests/fixtures/fitting.html` avec Vite et conserver une capture.
- Conserver les sources et versionner les nouveaux assets.

## Vêtements de face — règle active

Le mannequin unique approuvé utilise les sources 887 × 1774, rendues uniformément
dans le repère 480 × 1024. Seule la pose de face est utilisée dans le jeu et
sert de référence pour créer, ajuster et vérifier les prochains vêtements.
Pour une nouvelle pièce, renseigner le `poseProfile` frontal et déclarer
`hand-on-hip` et `heart-hands` avec `kind: "unavailable"`. Les anciens dessins
des deux poses restent disponibles dans les planches de contrôle.
Vérifier les emmanchures, les poignets, les couleurs secondaires et les
coutures protégées de face. Exécuter `npm run check:poses` et conserver une
capture frontale avant publication.

## Patron mesuré obligatoire pour les prochains vêtements

Lire `docs/redrawn-clothes-v1/README.md`. Utiliser les repères réels de
`packages/domain/src/avatar-pattern.ts` comme guides de dessin, sans étirer les
textures. Redessiner sur le mannequin puis isoler les pièces à leurs pixels natifs
avec `scripts/prepare-redrawn-clothes.ts`. Le pipeline de déformation
`scripts/calibrate-winter-patterns.ts` est archivé : ne pas le relancer sur les
dessins approuvés. Dessiner les manches de face et caler leurs masques de
matière. Le lien au patron et à l’empreinte du corps est requis
avant publication. Ne pas approuver un vêtement sur le seul format de son PNG.
Les cols, manches amples, cardigans ouverts et fentes nécessitent une séparation
adaptée à la coupe. Préserver leur volume au lieu de les rogner.
