> Rendu actif remplacé par la poupée cartoon v6 : voir `cartoon-v6.md`. Cette page conserve les versions antérieures.

# Rendu de boutique v5 — silhouette fixe et matières peintes

Référence visuelle : vidéo fournie par l’utilisateur (22,6 secondes), examinée au début, à 9,1 s, à 18,1 s et à 21,5 s. Le besoin retenu est une pièce qui épouse le même corps et conserve la même coupe dans la vitrine et à l’essayage. Aucune hypothèse n’est faite sur le moteur interne de MovieStarPlanet.

## Sources actives

- Corps et visages conservés : `public/assets/avatar-base-bald-v3.png`.
- Perruques amovibles conservées : `public/assets/wigs-original-v1.png`.
- Géométrie et couleurs des vêtements : `apps/web/src/shop/FittedGarment.tsx`.
- Matières détaillées : `public/assets/garment-materials-v5.png` (1774 × 887, transparent).
- Composition corps / vêtements / mains / cheveux : `apps/web/src/shop/FittingAvatar.tsx`.

Le même composant `FittedGarment` est utilisé dans la cabine, dans les vignettes et dans l’historique. Les contours sont dessinés dans le repère du corps : ils ne changent pas à chaque peinture ni à chaque couleur. L’atlas de matières est désaturé et appliqué en produit à l’intérieur des contours. Il ne peut donc pas modifier la coupe. Les ombres de contact restent sur la peau uniquement, et les mains reviennent devant les manches.

Les zones où les pièces se recouvrent dans le guide sont exclues de la texture des autres pièces (haut des pantalons, ourlets, manches du cardigan). Une vignette ne récupère ainsi aucun fragment du haut, de la chaussure ou du corps voisin.

Les PNG de vêtements v1 et le moteur de déformation v4 sont conservés comme archives, mais ils ne sont plus le rendu actif de la boutique. Le code de maillage et ses tests sont archivés dans `docs/archive/render-v4/` sous extension texte. Les tests backend actifs restent inchangés.

## Fabrication de l’atlas

Le guide natif est exporté par `npx tsx scripts/export-garment-guide.tsx` dans `.data/references/garment-guide-v5.svg` et `.png`. Le script utilise le même dessin, avec `painted={false}`, et le moteur SVG Resvg pour produire le PNG de référence. Il ne retouche pas une image bitmap existante.

La peinture a été créée avec le skill imagegen et l’outil **intégré image_gen**, en mode retouche transparente, sans CLI. Cible : le guide. Référence de style uniquement : `public/assets/avatars-three-quarter-v1.png`. Résultat original conservé sous le dossier de génération Codex ; copie de production enregistrée dans `public/assets/garment-materials-v5.png`.

## Prompt final

```text
Edit target IMAGE 1: a 1774x887 TRANSPARENT garment-only registration atlas exported from native SVG. IMAGE 2 is ONLY a PAINTING STYLE reference, do not copy its silhouettes or positions. Paint IMAGE 1 with the rich, softly shaded, hand-painted 2D fashion-game illustration detail of image 2: fine fabric texture, stitched seams, natural folds, satin highlights, knitted cardigan ribs, short fluffy boot-cuff fur, detailed leather and lacing, soft volume, subtle material variation. ALL garments must be LIGHT NEUTRAL IVORY / PALE GRAY with softly dark gray shadows, NOT their original colors. This is a neutral luminance/detail map recolored by the game; keep light fabric bright and use moderate shadows, no black garments. ABSOLUTELY preserve the exact outer silhouette, cut, perspective, pose and absolute position of EVERY piece from image 1: four equal columns, column1 fitted narrow-strap corset at y190-338, pleated skirt y350-495, curved laced boots y614-885; column2 jacket y149-448 with bent left sleeve, trousers y380-870, sneakers y820-884; column3 fitted cardigan y190-465, skirt y370-487, curved tall boots y615-885; column4 varsity jacket y149-448 with bent left sleeve, trousers and sneakers in original positions. All boots must retain the BENT SHAFTS of image1; do not make them vertical, do not add empty oval openings or move cuff heights. Leave neck, arm, waist and leg openings transparent, with no mannequin interiors; the visible clothing is the FRONT surface on a body. Render directly ON TOP OF image1 artwork as a paint-over so the geometry remains pixel-registered, NOT a new arrangement. Background truly transparent. NO faces, heads, hair, jewelry, arms, hands, skin, bodies, legs or feet. No text, new objects or shadows outside clothes. Exact canvas 1774x887, unchanged scale and baselines. Garment borders stay within the original image1 silhouettes, with soft painted contours. Prioritize exact registration over adding any features.
```

## Vérifications

- TypeScript et build Vite validés.
- 8 tests backend réussis ; la validation artistique se fait visuellement, pas avec ces tests.
- Les quatre personnages et les variantes sont examinés dans `tests/fixtures/fitting.html`, avec et sans perruque. Le sélecteur Personnage permet une inspection en grand.
- Catégories, mélange des pièces, retrait/remise, historique et affichage mobile ont été vérifiés dans la cabine pour cette révision. Répéter ce contrôle à chaque nouvel import.

