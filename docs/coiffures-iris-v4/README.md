# Vingt coiffures pour Iris

Les deux planches jointes et validées servent de référence. Chaque source ImageGen, numérotée de 01 à 20, isole la coiffure de la cellule correspondante sur fond vert avec le mannequin d’Iris comme repère. La consigne conserve le volume, l’implantation et la silhouette du modèle et dégage les deux yeux.

`npm exec -- tsx scripts/prepare-iris-hair-v4.ts` supprime le fond, corrige les franges claires, aligne les coiffures sur la base canonique, produit les passes devant et derrière et prépare les masques de recoloration. Les coiffures sont disponibles de face à 850 pièces dans la boutique locale.

Contrôle dans Vite avec `tests/fixtures/fitting.html?bottoms=hair-iris-v4`. Le paramètre `dye` permet de contrôler la recoloration.
