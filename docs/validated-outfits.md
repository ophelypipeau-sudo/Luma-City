# Porter une tenue depuis la boutique

Le bouton **Panier → Valider et porter cette tenue** applique une copie complète de l'essayage au portrait de gauche : haut, bas, chaussures, ceinture, couleurs principales et secondaires. Les simples essayages ne changent pas cette tenue portée. Fermer puis rouvrir la boutique reprend la dernière tenue validée.

La tenue est conservée dans le stockage local du navigateur sous `worn-outfits-v1`, avec une clé distincte par compte et personnage. Elle est restaurée après rechargement sur ce navigateur. Il ne s'agit pas encore d'une sauvegarde serveur ni d'un achat : aucun solde n'est débité. Les prix provisoires restent visibles dans le panier.

## Fichiers

- `main.tsx` conserve les tenues portées et transmet leur validation à la boutique et au portrait.
- `avatar/worn-outfits.ts` crée les copies indépendantes et valide la lecture du stockage local.
- `Avatar.tsx` accepte les pièces portées, au lieu d'imposer la tenue fixe.
- `shop/Shop.tsx` initialise l'essayage depuis la tenue portée ; `shop/LayeredDressing.tsx` expose la validation dans le panier.
- `avatar/HandOnHipDoll.tsx` applique également la couleur du cardigan à la manche calibrée de la pose. Le masque de matière associé est produit par `scripts/prepare-pose-material-mask.ts`. Les dessins du corps et des mains restent inchangés.

## Vérifications

Quatre tests ciblés : `tests/worn-outfits.test.ts` et `tests/rail-pose.test.ts`. Contrôles visuels : tenue léopard avec pantalon rose, fourrure blanche et ceinture portée à gauche ; essayage de jupe temporaire sans modification de la tenue portée ; rechargement puis réouverture de la boutique ; cardigan bleu et caraco rose sur la pose et dans la cabine de face ; validation du panier à 390 × 844.

Captures dans `docs/material-colors-v1/` : `validated-outfit-rail.jpg`, `validated-pose-colors.jpg`, `validate-mobile-cart.jpg`.
