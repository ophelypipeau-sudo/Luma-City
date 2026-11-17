# Catalogue du Puzzle

Le Coin détente tire une photo parmi les entrées actives du registre
`apps/server/src/puzzle-catalog.ts`. Il exclut la photo de la partie précédente
dès que deux photos actives sont disponibles.

1. Exporte la photo en WebP dans `public/assets/puzzle/`, avec un nom unique.
   Les 16 photos de départ utilisent un côté maximal de 1 200 px et une qualité
   WebP de 91. Conserve les proportions de l’original.
2. Ajoute une entrée au registre avec le nom de fichier sans extension comme
   `id`, le nom de la photo, ses dimensions exportées et `active: true`.
   Les trois grilles sont calculées automatiquement selon ces dimensions.
3. Lance `node scripts/run-tests.mjs tests/puzzle.test.ts` pour contrôler le
   catalogue et les trois difficultés.

`active: false` retire la photo des prochains tirages. Pour retirer une entrée
du registre, conserve son WebP tant que des parties sauvegardées peuvent encore
l’utiliser. Une partie sauvegarde la configuration de sa photo au démarrage.
