# Capsule de robes Iris

Dix modèles frontaux à 950 pièces, dans la catégorie Robes. Chaque robe s’équipe comme une pièce unique et libère les emplacements des hauts et des bas. Chaussures et coiffures restent indépendantes.

Les sources ImageGen suivent l’ordre de la planche validée. Pour chaque modèle, la consigne était de peindre la robe de la cellule correspondante sur Iris de face, avec le même corps et la même pose, sur fond vert et sans liseré clair. Le fichier du mannequin canonique est contrôlé par son empreinte.

`npm exec -- tsx scripts/prepare-iris-dresses.ts` reconstruit les calques à partir des contours tracés sur les sources, avec placement uniforme. Le script nettoie la couleur du fond et les franges blanches. Le velours, la maille, la dentelle et les autres matières restent recolorables. L’anneau de Comète et les boutons de Terrasse ont un masque protégé.

La cabine locale est accessible via `tests/fixtures/fitting.html?bottoms=dresses-iris`. Les paramètres `dye` et `variant` permettent de contrôler la teinte et une autre combinaison de chaussures et de coiffure.
