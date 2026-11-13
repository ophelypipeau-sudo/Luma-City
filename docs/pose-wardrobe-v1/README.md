# Dressing compatible avec les poses statiques

Archive de la préparation des trois poses. Pour le lancement, le jeu
utilise la pose de face et les nouveaux vêtements se vérifient uniquement
sur cette pose. Voir la règle active dans [AGENTS.md](../../AGENTS.md).

Les 13 pièces actuelles utilisent les mêmes identifiants, couleurs et emplacements
dans les trois poses. Les quatre hauts sont vérifiés avec les quatre bas, les quatre
paires de chaussures et la ceinture indépendante. Les jambes restent identiques
dans ces trois poses : les bas, la fourrure, les chaussures et la ceinture conservent
donc leurs contours et leurs repères, sans déformation supplémentaire.

## Fichiers

- `packages/contracts/src/avatar-poses.ts` : format du profil de compatibilité.
- `apps/web/src/avatar/pose-wardrobe.ts` : profils des 13 pièces, dessins de manches,
  masques de matière, raccords d’encolure et vérification des profils.
- `HandOnHipDoll.tsx` et `HeartHandsDoll.tsx` : consomment ces profils sans choisir
  le dessin des manches d’après l’identifiant du vêtement.
- `pose-compatibility.ts`, `Avatar.tsx` et `CharacterPose.tsx` : un ancien import
  non calibré reste montrable de face, sans changer son identifiant, ses couleurs
  ou la pose enregistrée. Les cartes des poses incompatibles sont désactivées.
- `catalog.ts` : publication refusée avant mutation si le profil manque ; les
  anciens imports incomplets restent résolus par identifiant et sont conservés
  en attente, hors du catalogue publié. Aucune source n’est supprimée.
- `scripts/check-pose-wardrobe.ts` : vérifie les profils et les dimensions des PNG
  de manches/masques ; exécuté aussi par `npm run build`.

## Prochain vêtement

1. Dessiner la pièce sur la base unique approuvée, sans modifier le corps ou les
   mains. Conserver le canevas transparent complet 887 × 1774.
2. Pour un haut à manches : préparer la manche droite pliée sur la hanche, puis les
   deux manches pliées pour le cœur. Prévoir un masque principal et, si nécessaire,
   un masque secondaire. Chaque masque conserve les coutures et les imprimés.
3. Déclarer un `poseProfile` avec `body: 'fashion-user-hands-v2'`,
   `canvas: [887,1774]`, `reviewed: true`, et les trois entrées de `fits`.
   `front` utilise `kind: 'shared'`. Les autres poses d’un haut utilisent
   `kind: 'bare-arms'` pour une coupe sans manches, ou `kind: 'sleeves'` avec
   `sleeves: {front: '…png', main: '…mask.png', detail?: '…mask.png'}`.
   Les valeurs `mainBase` / `detailBase` peuvent préciser les couleurs de référence.
4. Les épaules découvertes utilisent `bareShoulders: true` ; un revers à restaurer
   devant l’épaule utilise `neckband: [x,y,width,height]`, dans le même repère source.
   Calibrer ces zones, ne pas copier celles du pull sur une autre coupe sans contrôle.
5. Les bas/chaussures/ceintures contrôlés peuvent utiliser `stationaryPoseProfile()`.
   Les hauts sans manches contrôlés peuvent utiliser `sleevelessPoseProfile()`.
   Ces fonctions décrivent un contrôle déjà réalisé ; elles ne font pas ce contrôle.
6. Ajouter le profil au registre pour une pièce intégrée, ou à la publication pour
   une pièce importée. Conserver source et variantes. Vérifier les trois poses,
   les dessous masqués, les épaules, poignets, mains, chevilles et sol. Contrôler les
   deux couleurs, le blanc/noir et le retour à la couleur d’origine.

L’ancien atelier masqué prépare uniquement des brouillons de face. Il n’invente
pas de manches posées et ne peut pas publier ces brouillons comme vêtements
compatibles sans calibration. Les photos arbitraires demandent toujours un travail
de dessin ; les profils sont une garantie de contrôle explicite, pas une adaptation
graphique automatique. Une future pose des jambes nécessitera aussi d’autres bas
et chaussures calibrés.

## Contrôles effectués

- `tests/fixtures/pose-wardrobe.html` : quatre tenues, trois poses, couleurs au choix.
- Captures : `leopard.png`, `burgundy.png`, `cardigan.png`, `cardigan-colors.png`,
  `caraco-colors.png`. Dessins et masques existants conservés.
- 31 tests ciblés réussis : profils, imports incomplets, masques de peau, main
  sur la hanche, cœur, couleurs protégées, ceinture, achats et tenues portées.
- Le corps source reste inchangé. Les tests vérifient les invariants techniques ;
  l’inspection des captures reste nécessaire pour juger la qualité graphique.
