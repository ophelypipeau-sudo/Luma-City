# Capsule Mode v2 — Cerise, Champagne et Nocturne

Les trois hauts sont intégrés au dressing d’Iris. Les sept peintures ImageGen
de ce dossier sont conservées à l’identique. Ce lot est distinct de l’ancien
essai ImageGen (McBling, Dentelle noire, Satin platine) et des dix t-shirts.

`npm exec -- tsx scripts/prepare-capsule-mode.ts` prépare les calques et masques
dans `public/assets/avatar/capsule-mode-v2`. Le script vérifie l’empreinte du
mannequin. Les calques finaux utilisent le repère 887 × 1774 ; les matières
principales, secondaires et ornements protégés sont séparés. Les tracés servent
au détourage et au calage, et la peinture visible provient des PNG existants.

| Haut | Ajustement sur Iris |
| --- | --- |
| Cerise | Épaules et emmanchures ajustées sur les trois poses avec les manches peintes. Le torse et la broderie restent aux mêmes pixels ; les mains d’Iris passent devant. Seul le tissu principal est recolorable : les empiècements restent crème. |
| Champagne | Le bord du satin couvre le dessous et suit un arrondi plus doux à gauche de l’image. Ce calque dérivé conserve le drapé et la boucle dorée. |
| Nocturne | Même corsage et mêmes agrafes dans les trois poses. Seul le buste est recolorable ; le voile et les poignets conservent leurs pixels d’origine. La source hanche (953 × 1651) fournit la matière des manches par prélèvements locaux. |

Les boutons « · capsule » de `tests/fixtures/fitting.html` et
`tests/fixtures/pose-wardrobe.html` utilisent les articles du catalogue.
`controles/` conserve les rendus de face, main sur la hanche et mains en cœur,
les variantes claires et foncées, les vignettes et la cabine à 390 × 844.
`nocturne-coeur-calage.png` conserve le contrôle intermédiaire de la
première reprise. Prune fumée reste la référence de coupe et de finition.

La palette protège le fil clair de la broderie, la boucle et les agrafes.
Le fil rouge de Cerise suit la teinte du tissu jusqu’au col, aux manches et
à l’ourlet ; sa lumière garde les coutures lisibles sans résidu rouge.
Pour Nocturne, chaque pose a un masque du buste et une carte de lumière
calculée à partir du tissu d’origine. Le masque suit le vrai bord évasé
jusqu’à l’ourlet ; le léger lissage conserve le grain, le contraste des
coutures et les reflets du satin. Les agrafes, le voile et les poignets sont
exclus. Voir [la planche de contrôle](controles/nocturne-finition.png).
La peinture originale de Champagne et son calque précédent sont conservés
à côté de la variante arrondie.

`npm run build` et `npm run check:poses` passent : 77 pièces et 268
calques ou masques. `npm run test:avatar` : 54 réussites ; le test de l’attache
de ceinture du short Minuit polaire reste en échec, hors de cette capsule.
