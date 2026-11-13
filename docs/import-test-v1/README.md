> Correction suivante : dos du col derrière le cou, rebord arrière de la ceinture derrière le corps et taille du jogging ajustée progressivement. 50 tests réussis. Voir [raccords-r2.md](raccords-r2.md) et [gros plans](raccords-r2.png).

# Import d’essai depuis la planche de l’utilisateur

Source conservée : `source.png`, copie de `Design sans titre (7).png`.
Les trois pièces ont été adaptées avec l’outil intégré imagegen depuis cette
planche et la base corporelle approuvée. Ce sont des adaptations graphiques
calibrées, pas des découpes pixel pour pixel du fichier source.

## Pièces actives

- `public/assets/avatar/clothes/import-test-v1/polo.png` : polo crème et bleu,
  manches courtes, col ouvert transparent, plis et ombres conservés dans l’esprit
  du dessin source ; correction des épaules après la première passe.
- `public/assets/avatar/clothes/import-test-v1/camisole.png` : débardeur blanc et
  marine. Encolure rendue moins profonde pour couvrir le bandeau opaque de la
  base, sans repeindre de peau ou altérer le corps.
- `public/assets/avatar/clothes/import-test-v1/pants.png` : jogging gris à cordon,
  taille froncée et plis ombrés ; deux jambes distinctes et ourlets au-dessus des
  orteils. Aucune chaussure n’était fournie ; les pieds restent nus.

Les trois images sont transparentes et mesurent 887 × 1774. Elles ne contiennent
pas de personnage. Les prompts exacts sont dans `prompt-*.txt`. Les sorties
originales restent dans le dossier Codex de génération ; les fichiers utilisés
par le jeu sont copiés dans le projet. `polo-r1.png` conserve la première passe.

## Calibration et rendu

`apps/web/src/avatar/catalog.ts` contient les identifiants `import.*`, les crops
des vignettes, la largeur calibrée et les bandes verticales de placement.
Les ajustements concernent uniquement le tissu ; ni le corps ni le visage ne sont
étirés. Les bandes contiguës partagent leurs limites et se recouvrent de 0,75 px
pour éviter les joints de rasterisation. Elles couvrent toute la pièce visible.
Elles permettent notamment de régler les bretelles indépendamment du buste et
la hauteur de taille indépendamment des jambes du jogging.

`LayeredDoll.tsx` réutilise ces mêmes images et transformations pour la vignette,
le vêtement porté et le masque de couverture. Le filtre de masque convertit
l’alpha du tissu en encre noire : les parties corporelles couvertes sont vraiment
effacées, tandis que les ouvertures du col et l’entrejambe restent transparentes.
Il n’y a pas de plaque de peau ni de vêtement contenant un morceau de corps.

`model.ts` équipe par défaut le polo et le jogging, avec `shoes: null`.
Le débardeur remplace uniquement le haut. Le pantalon reste équipé et son masque
reste appliqué. Retirer une pièce restitue la base indépendante en sous-vêtements.

Les trois anciens dessins simplifiés sont retirés du catalogue actif. Leurs IDs
restent résolus pour la compatibilité et leurs tests historiques sont conservés.
La boutique historique, les portraits et la colonne de gauche restent inchangés.
L’onglet Collection reste vide pour les futurs packs nommés.

## Vérifications

49 tests réussis, compilation TypeScript/Vite réussie. Les trois tests d’import
contrôlent le remplacement du catalogue actif, l’indépendance des hauts et du bas,
la disparition des pixels violets des sous-vêtements avec les deux hauts,
l’effacement des jambes couvertes et la conservation du visage, des mains et des
orteils. Les anciens tests de la tenue vectorielle restent exécutés séparément.

Contrôles visuels : cabine du jeu sur le port 3001, page
`tests/fixtures/fitting.html`, masque sans tissu, et écran de 390 × 844.
Captures : `boutique-polo.jpg`, `boutique-debardeur.jpg`, `masques-polo.jpg`,
`mobile-polo.jpg`, `mobile-debardeur.jpg`. Ces contrôles techniques ne constituent
pas une validation artistique de l’utilisateur.

Planche issue du vrai composant : `fit-board.png`.
Reproduction : `npx tsx scripts/export-import-test.tsx`.
Empreintes et paramètres : `provenance.json`.
