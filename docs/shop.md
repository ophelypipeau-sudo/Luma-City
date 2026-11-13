> Rendu actif remplacé par la poupée cartoon v6 : voir `cartoon-v6.md`. Cette page conserve les versions antérieures.

> Rendu actif : voir `render-v5.md`. Les atlas de tenues et prompts ci-dessous documentent les premières versions.

# Boutique et cabine d’essayage

La boutique s’ouvre depuis sa pastille sur la carte ou depuis le bouton du haut.
La composition suit le croquis fourni : Top achats / Collections / Recherche en
haut, catégories rondes, articles à gauche et avatar à droite. Une révision ultérieure
a remplacé la colonne d'historique par une fenêtre récapitulative et introduit les
vrais calques séparés : voir [base et vêtements isolés](paper-doll.md).
Le thème reste celui du jeu, sans panneaux blancs.

## Fonctions réalisées

- Neuf articles par personnage : trois hauts, trois bas et trois paires de chaussures.
- Trois tenues complètes prédéfinies, et combinaison indépendante des catégories.
- Sélection de collection, filtre de catégorie et recherche insensible aux accents.
- Aperçu immédiat du personnage actif en trois quarts, conservant sa coiffure et son visage.
- Comparaison avec la tenue de départ, réinitialisation et retrait par catégorie.
- Catalogue distinct pour Iris, Milo, June et Noa ; changement de personnage réinitialise l’essai.
- Retour à la carte et raccourci Échap depuis la boutique.
- Historique local des pièces essayées en fenêtre flottante, sans achats simulés.
- Top achats vide : aucun classement de ventes inventé.

## Périmètre

Les vêtements sont des propositions visuelles pour l’essai. Les prix et l’économie
restent à définir : le bouton Achat est désactivé, aucun solde n’est débité et aucun
article n’est ajouté à l’inventaire. L’essai est local à la cabine ; quitter la
boutique ne modifie pas la tenue du personnage en salle.

Le rendu actuel utilise une base en sous-vêtements et trois atlas de vêtements
seuls, superposés en SVG. Les variantes anciennes ci-dessous sont conservées comme
sources. Les assets actifs et les nouveaux prompts sont dans `paper-doll.md`.

## Assets

- `public/assets/avatars-three-quarter-v1.png` : tenue de départ, conservée.
- `public/assets/outfits-lavender-ivory-v1.png` : variante lilas/ivoire.
- `public/assets/outfits-rose-midnight-v1.png` : variante rosé/minuit.

Les deux variantes ont été réalisées avec l’outil intégré image_gen en retouchant
l’atlas original, sans CLI ni API personnalisée. Chaque atlas mesure 1774 × 887.
Les contours peuvent présenter de petites différences liées à la retouche générative.
Les fenêtres et les règles de sélection sont dans `apps/web/src/shop/`.

## Prompts de retouche

### Variante 1

```text
Edit target: supplied transparent FOUR-character fashion sprite atlas, exact same canvas size and same four characters in exactly same pixel positions. This is a clothing TEXTURE AND MATERIAL edit ONLY. Absolutely preserve character faces, head size, hair, skin, anatomy, all poses, arms, hands, jewelry, bags, outlines, proportions, height and feet locations. Preserve the exact outer silhouette and length of each garment. DO NOT shift or redraw bodies. Keep all transparency outside silhouettes transparent. All four adult characters remain three-quarter facing right. No text, labels or background. Make this a lavender and ivory boutique collection. First blonde woman: change her ivory cropped camisole to a lilac satin camisole with delicate silver celestial embroidery, same straps and cut; change the blue pleated denim mini skirt to IVORY pleated satin mini skirt, same waist and hem shape and length, preserve silver chain; change the cream furry tall boots to BLACK tall leather boots retaining the EXACT original outer silhouette and lacing, fur cuff can become black. Second male: same utility jacket silhouette in soft LAVENDER twill, same white undershirt; same wide-leg trousers silhouette in IVORY fabric; white sneakers become dark CHARCOAL sneakers of exact same shape. Third auburn woman: same cropped cardigan silhouette in LAVENDER, same cream lace beneath; same skirt silhouette in dark BLUE DENIM; same boots silhouette in CREAM leather. Fourth male: same varsity jacket silhouette in SAGE and cream; same jeans silhouette in IVORY; same sneakers silhouette in CHARCOAL. Everything except garment textures/colors/materials remains unchanged. Exact original canvas size 1774x887, each quarter identical alignment to source.
```

### Variante 2

```text
Edit target: supplied transparent FOUR-character fashion sprite atlas, exact same canvas size and same four characters in exactly same pixel positions. This is a clothing TEXTURE AND MATERIAL edit ONLY. Absolutely preserve character faces, head size, hair, skin, anatomy, all poses, arms, hands, jewelry, bags, outlines, proportions, height and feet locations. Preserve the exact outer silhouette and length of each garment. DO NOT shift or redraw bodies. Keep all transparency outside silhouettes transparent. All four adult characters remain three-quarter facing right. No text, labels or background. Make this a blush and midnight boutique collection. First blonde woman: change ivory cropped camisole into same-cut dusty ROSE satin top with fine lace trim and tiny pearl accents, same straps, cut and length; blue pleated denim mini skirt becomes BLACK pleated fabric, identical silhouette and length, preserve silver chain; cream furry tall boots become dusty ROSE suede tall boots with same fluffy cuffs and lacing and exactly same outline. Second male: same utility jacket silhouette in midnight NAVY denim; same wide-leg trousers silhouette in light BLUE DENIM; same sneakers silhouette in pale ROSE and white. Third auburn woman: same cropped cardigan silhouette in warm IVORY; same skirt silhouette in BLACK; same boots silhouette in dusty ROSE suede. Fourth male: same varsity jacket silhouette in dusty ROSE and cream; same jeans silhouette in muted BLUE DENIM; same sneakers silhouette in lavender and cream. Preserve original bodies, poses, faces, hair, skin, hands, bags, jewelry and exact framing. Exact original canvas size 1774x887, each quarter identical alignment to source.
```

