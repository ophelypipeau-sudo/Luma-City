# Direction visuelle — 8 novembre 2026

Demande utilisateur : interface moderne avec personnage à gauche, illustration mode
plus détaillée, personnage en trois quarts. Les deux images fournies servent de
références de composition et d'esthétique. Le logo, l'interface distinctive et la
carte du jeu de référence ne sont pas intégrés au projet.

## Fichiers intégrés

- `public/assets/avatars-three-quarter-v1.png` : atlas transparent, 1774 × 887,
  quatre personnages, ordre Iris / Milo / June / Noa. Chaque personnage est affiché
  dans sa propre fenêtre SVG de 443,5 pixels, sans modifier l'image originale.
- `public/assets/neighborhood-v1.png` : quartier original, fond de la vue Explorer.
- `apps/web/src/Avatar.tsx` : cadrage plein pied ou portrait et miniature en salle.
- `apps/web/src/world.css` : composition à gauche sur ordinateur et adaptation mobile.

Génération : outil intégré **image_gen**, sans CLI ni appel API personnalisé.
Ces visuels restent provisoires et ne constituent pas un système de vêtements
interchangeables. Les soldes et niveaux n'ont pas été inventés pour décorer l'écran.

## Prompt de l'atlas

```text
Use case: stylized-concept. Create a production-ready transparent PNG sprite atlas for an original 2D social fashion browser game. Input image is STYLE REFERENCE only for detailed hand-painted 2D fashion doll aesthetic, NOT a character to copy. Wide landscape canvas, exactly FOUR adult full-body characters in FOUR equal-width vertical cells arranged in one horizontal row. Each character completely contained in their own quarter, generous clear gaps, identical scale, feet on same baseline, NO overlap, no labels, no text, no background, no floor, truly transparent alpha. All characters in clear THREE-QUARTER VIEW, head AND torso AND hips turned about 30 degrees toward screen-right, both eyes visible asymmetrically, one shoulder nearer camera, relaxed standing pose, full bodies and shoes visible. Fashion illustration, adult slender long-legged proportions, expressive almond eyes, finely shaded faces, detailed clothing and strands of hair, crisp outlines and soft painterly highlights, polished 2D, NOT 3D, NOT chibi, NOT photorealism. Character 1 (first quarter, main character): adult woman warm medium caramel skin, very long honey-blonde hair half-up loose with small pearl clips, almond brown eyes visible (no sunglasses), glossy neutral lips, ivory satin cropped camisole, blue pleated denim mini skirt with subtle silver waist chain, long cream boots with fluffy cuffs, small pale lavender shoulder bag, layered fine silver necklaces. Original outfit and face, do not reproduce exact reference. Character 2 (second quarter): adult masculine character with warm olive skin, wavy dark brown hair, sage cropped utility jacket over white shirt, loose charcoal trousers, white sneakers, silver necklace. Character 3 (third quarter): adult woman light freckled skin, long auburn hair, dusty rose fitted cardigan and ivory pleated mini skirt, dark brown knee-high boots, small blush shoulder bag, fine silver earrings. Character 4 (fourth quarter): adult masculine character with deep brown skin, short textured dark hair, periwinkle varsity jacket over cream shirt, dark wide-legged jeans, pale sneakers, subtle silver accessories. Keep all FOUR clearly separated, same complete full-body framing and same consistent original game-art style. All characters angle into the screen toward the RIGHT, especially first woman's face and body must be three-quarter and not front-facing.
```

Référence de style : seconde image fournie par l'utilisateur. Sortie transparente.

## Prompt du quartier

```text
Use case: stylized-concept. Asset type: background map illustration for an original 2D social fashion browser game. Create a richly illustrated welcoming isometric miniature neighborhood, landscape 3:2 composition, viewed elevated three-quarter angle. One elegant lavender-and-cream glass-roofed winter garden conservatory is the main landmark near center-right; a softly curving pedestrian promenade leads to its entrance. Charming small fashion ateliers with striped lilac awnings on the left, pale coral cafe with outdoor parasols in bottom left, cream and mauve townhouses in upper left, a small circular flower fountain near center-bottom, elegant wrought iron lamps, magnolia trees, flowering cherry trees, rounded topiary and lush landscaped gardens. A canal with tiny arched footbridge runs along right edge. A few pastel city silhouettes in distant background. Cohesive lavender, blush, mint, creamy white and soft sky blue palette, bright warm afternoon light. Clean detailed hand-painted cartoon game environment, crisp 2D architectural illustration with subtle dimensional shading, sophisticated modern cozy social world, dense and explorable with clear paths, no people, no text, NO LABELS, no signage lettering, no logo, no UI, no icons, no watermarks. An ORIGINAL neighborhood and architecture, avoid reproducing any existing game layout, buildings or distinctive landmark. Use entire canvas, no border.
```

Aucune image de jeu existant n'est passée comme référence pour la carte.

Révision suivante : [animalerie et pastilles](map-markers.md), avec l'asset
`public/assets/neighborhood-pet-shop-v2.png` et le prompt de retouche.
