# Pose indépendante de la tenue

`HandOnHipDoll` ne retourne plus la pose frontale lorsque le haut change. Les quatre hauts de la boutique utilisent maintenant la même pose et la même main approuvée. Le corps source, le visage, la main et les pièces frontales de boutique restent inchangés. La cabine conserve `LayeredDoll` de face.

Le bras nu et la manche bordeaux sont séparés, enregistrés dans `public/assets/avatar/poses/hand-on-hip-v3/`. La manche lilas existante et son masque sont réutilisés. Les hauts sans manches conservent leurs bretelles ; le pull conserve son revers d'encolure au premier plan. Le masque efface complètement l'ancien bras, y compris son contour intérieur. La main se compose en dernier devant la ceinture et les poignets. Les jambes et les ajustements de ceinture sont issus du même rendu que la cabine.

`avatar/hip-pose.ts` porte le registre de manches et les repères du mouvement. Une déformation par deux segments conserve cette pose pour les hauts de l'atelier non encore dessinés dans cette pose ; elle doit être remplacée par une manche calibrée et contrôlée pour valider une nouvelle coupe. Ce secours ne garantit pas la qualité d'un futur import arbitraire.

## Sources et génération

Mode utilisé : outil imagegen intégré, transparence conservée. `scripts/prepare-hip-pose-v3.ts` copie les deux sources générées, calibre leurs contours sur le canevas 887 × 1774 et produit le masque de recoloration de la manche. Les coutures de poignet restent protégées. Aucune clé API locale n'est utilisée.

Fichiers : `source-bare-arm.png`, `bare-arm.png`, `source-burgundy-sleeve.png`, `burgundy-sleeve.png`, `burgundy-sleeve-mask.png`, dans le dossier v3 ci-dessus. La main reste `/assets/avatar/poses/hand-on-hip-lilac-v2/hand.png`.

Prompt bras nu : « Precise-object-edit, registered 2D dress-up sprite. Image1 is the EDIT TARGET: a bent long sleeve on full transparent 887x1774 canvas. Replace ONLY this sleeve with the anatomically correct BARE SKIN ARM inside it, same upper arm and elbow and wrist pose, matching image2's warm orange tan skin style, soft shading and outline. Image2 is skin/style reference only, DO NOT draw a body or face or torso. Image3 is a supporting wrist anchor only: the hand will be composited separately, DO NOT draw a hand or fingers. Draw bare shoulder/upper-arm from about x556 y343 to outer elbow x754 y550 to wrist x633 y696, inner elbow around x700 y552; natural arm slenderness, smooth round shoulder, softer elbow, smooth wrist junction matching hand. Isolated arm ONLY, transparent everywhere else, no sleeve or clothes, no hand. Preserve full original canvas registration, no recentering or cropping. Outer contour slightly narrower than existing sleeve. The user's existing hand is immutable. »

Prompt manche : « Precise-object-edit for registered 2D game sprite. Image1 is EDIT TARGET, a bent lilac sleeve on a full 887x1774 transparent canvas. Keep exactly the same bent arm pose, elbow location, wrist, and full-canvas placement. Replace this lilac cardigan sleeve with ONE dark burgundy ribbed knit sleeve matching the original sweater in image2. Image2 is material/cut reference only. It is an off-shoulder sweater: sleeve begins below bare shoulder around y391 and follows same bent pose to cuff at x632 y697. Rich burgundy knit, vertical fine ribbing that follows the bent arm, soft folds at elbow and cuff, clean cartoon outlines. Draw only the isolated sleeve; no hand, no body, no face, no torso, no other garment. Transparent background. Do not recenter, crop, enlarge, or move the arm. Keep matching the reference sweater's original red colour, texture, seams, shadows. No lilac. »

## Vérification

Six tests ciblés réussis dans `tests/rail-pose.test.ts` et `tests/worn-outfits.test.ts`, dont rendu pixel du coude et de la paume et suppression de l'ancienne main. Compilation de production validée.

Planche : `tests/fixtures/hip-poses.html`, reliée à `fitting.html`. Contrôles visuels : quatre hauts, ceinture, pantalon/jupe, couleurs du cardigan, tenue validée en boutique et portrait à 390 × 844. Captures : `docs/material-colors-v1/hip-pose-all-tops.jpg`, `hip-pose-shop.jpg`, `hip-pose-mobile.jpg`.
