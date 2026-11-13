# Ceinture indépendante — v4

## Ajustement des bas

Chaque bas actif possède maintenant un `beltFit` (largeur et décalage vertical) : cargo Médaillons, jupe minuit, jean indigo et cargo Dragon. Le passage ceinture utilise ces repères sans changer la pièce ni sa couleur quand on remplace le bas. La taille reconstruite du cargo reçoit une transition de largeur de 0,84 à y=680 vers 1 à y=850, appliquée au dessin et à sa couverture corporelle. Les jambes et la fourrure conservent leur largeur. Aucun morceau n'est tronqué et le corps reste identique.

Planche comparative : `tests/fixtures/belt-fits.html`, reliée depuis `fitting.html`. Captures `docs/material-colors-v1/belt-bottom-fits.jpg`, `belt-skirt-shop.jpg`, `belt-fit-mobile.jpg`. Neuf tests ciblés réussis et compilation validée ; les contrôles comprennent les bords du pantalon aux hauteurs de taille et hanches face au vrai contour du corps.

La ceinture Médaillons quitte le dessin du pantalon et devient une pièce `fashion.medallion-belt`, dans l'emplacement indépendant `belt`. La catégorie « Accessoires » permet de l'essayer et de la retirer ; le panier et le choix de couleur incluent cet emplacement. Les anciens looks sans champ `belt` restent valables. Les futurs bijoux, lunettes ou sacs devront avoir leurs propres sous-emplacements, sans remplacer la ceinture.

Les assets sont conservés dans `public/assets/avatar/leopard-v4/` : pantalon sans ceinture, ceinture transparente, masque du pantalon et deux sources générées. Le corps et les mains restent inchangés. Le bas des jambes, les coutures, poches et fourrures sous y=920 conservent le dessin original. La taille reconstruite est recalibrée pour couvrir les sous-vêtements sans retouche de peau. La ceinture est inscrite aux repères x=283, y=703, largeur=315, hauteur=207 du canevas 887 × 1774. Elle se dessine devant haut et bas.

Méthode : outil imagegen intégré pour la reconstruction de taille et l'extraction de la ceinture ; `scripts/prepare-separated-belt.ts` normalise les repères et limite la reconstruction à la taille. `scripts/prepare-material-masks.ts` prépare les zones recolorables et protège les coutures et métaux. Les sources v2 restent disponibles.

## Prompts utilisés

Pantalon : « Precise-object-edit. Edit target is this transparent registered game garment, 887x1774 source canvas. Remove ONLY the entire large round gold-studded medallion belt at the waist and its hanging chain/medallions. Reconstruct plain continuous matching dark brown trouser fabric beneath it with a low-rise curved waistband and normal small trouser button/fly, in this exact front facing pose. Keep the original pants width and hip outline, leg outline, seams, pockets, buttons, fur cuffs and all their shading and positions exactly as supplied. No body, no skin, no mannequin, no shoes. Keep a transparent background and original full-canvas registration, no recentering, no resizing or cropping. Do not add any belt. The visible garment must remain pixel aligned to the reference; only waist region needs reconstruction. »

Ceinture : « Background-extraction precise-object-edit for registered 2D game sprite. Keep ONLY the original large dark leather medallion belt with gold studs at waist AND hanging medallions and chain charm. Remove ALL trousers, pockets, seams, fabric, legs and fur. Do not redesign or change the belt. It must remain at exact same size and original position on the exact full 887x1774 transparent canvas. Do not recenter nor enlarge the belt. The belt's medallions start around y705 and dangling charm ends y910. Retain transparent gaps between medallions. Output a true transparent belt layer, no body, no skin or mannequin. »

## Contrôles

Cabine avec et sans ceinture, catégorie Accessoires, panier 3 puis 4, fixture fitting.html, petit écran 390 × 844. Captures dans `docs/material-colors-v1/` : `pants-without-belt.jpg`, `accessory-belt-shop.jpg`, `accessory-belt-fitting.jpg`, `accessory-belt-mobile.jpg`.

Tests : indépendance de l'équipement, compatibilité des anciens looks, profondeur, pixels des jambes conservés, masque de fourrure, recoloration avec coutures protégées et couverture des pieds. La comparaison de PNG tient compte du même aller-retour de prémultiplication alpha des deux images.
