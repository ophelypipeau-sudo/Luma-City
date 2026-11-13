# Pull bordeaux — détourage de contrôle

Reprise limitée à `fashion.burgundy-fold-sweater`, en attente de validation visuelle de l’utilisateur. Les autres vêtements ne sont pas repris dans cette étape.

Les trois sources sont conservées dans `public/assets/avatar/redrawn-v1/sources/`. Leurs empreintes figurent dans `public/assets/avatar/burgundy-cut-v2/sources.json`. Le corps `fashion-v2/body-user.png` et les mains approuvées restent inchangés.

## Extraction

`scripts/prepare-burgundy-cut-v2.ts` utilise les contours SVG tracés dans `public/assets/avatar/burgundy-cut-v2/contours.json`. Le masque agit sur l’alpha : aucune suppression par couleur, érosion, élimination des petites composantes ou déformation de l’image entière. Le lecteur PNG natif conserve les valeurs RGB source, y compris les côtes sombres, plis et coutures.

Le torse, le revers et l’ourlet frontaux sont identiques dans les trois poses. Les manches sont des découpes indépendantes des sources posées. Leur extrémité est ajustée localement aux poignets approuvés par rééchantillonnage du tissu source, avec une influence nulle au coude et hors de l’avant-bras : ni le corps, ni le torse, ni les mains ne sont déformés. Le revers et le torse sont composés devant les têtes de manches pour éviter le raccord de texture diagonal. Le tissu frontal est conservé derrière les mains au lieu de créer des trous en forme de doigts. Les doigts et paumes du personnage sont composés devant. Les deux anciens triangles d’avant-bras du calque mains en cœur sont exclus par un contour de poignet, sans modifier les doigts ni les paumes. Le bord des poignets en maille est ensuite composé au-dessus du raccord de peau. Un masque corporel cache les anciens segments de bras sous les manches et suit les poignets ; il ne modifie pas le corps source.

Les nouveaux calques, masques de matière et repères sont versionnés séparément. Le catalogue conserve l’identifiant de l’article et sa couleur de référence ; les achats et couleurs enregistrés restent associés à la même pièce. Les masques de recoloration sont distincts du détourage.

## Contrôle

- `tests/fixtures/burgundy-cut.html` : véritable composant `Portrait`, trois poses, vignette sur damier et jupe de contrôle facultative.
- `tests/fixtures/fitting.html` : bouton « Tenue bordeaux complète », cabine de face ; capture également à 1101 × 884.
- `browser-three-poses.png`, `browser-fitting.png`, `browser-fitting-small.png` : captures du navigateur.
- `trois-poses.png` et `detail.png` : rendus du composant de production, sans génération d’une nouvelle illustration.
- `tests/burgundy-cut.test.ts` : conservation du RGB source, continuité du tissu, absence de tête/mains/sous-vêtements dans la pièce, torse commun aux poses et identifiant stable. Les tests existants contrôlent notamment l’empreinte du corps.

Ces vérifications techniques ne valent pas validation artistique. Attendre l’avis de l’utilisateur sur ce pull avant de reprendre les autres pièces.

## Retours sur le premier aperçu

Correction du raccord col/manche de la pose hanche, retrait des anciens triangles d’avant-bras près des mains en cœur, recalage local des poignets et passage du bord des manches devant la peau. La correction demeure limitée au pull bordeaux.
