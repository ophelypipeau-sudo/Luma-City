# Capsule shorts Iris

Dix pièces de face, validées sur la planche puis redessinées avec ImageGen à partir du mannequin frontal et des références approuvées. Les dix sources originales sont conservées dans `sources/` dans l’ordre de la planche.

Le script `scripts/prepare-iris-shorts.ts` vérifie l’empreinte du mannequin, cale chaque illustration par translation et mise à l’échelle uniforme et extrait le tissu sur le canevas commun 887 × 1774. Les masques couvrent la matière, les détails protégés et l’occlusion du corps. Pixel utilise la variante existante de sous-vêtements pour les tailles basses.

Les captures `controle-face.png`, `controle-mobile.png` et `controle-teinte-*.png` proviennent de `tests/fixtures/fitting.html?bottoms=shorts-iris`. Les trois captures nommées par couleur de fond montrent les raccords à plus grande échelle.
