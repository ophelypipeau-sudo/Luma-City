# Recoloration par matière

Les douze pièces de la boutique disposent de masques calibrés dans les coordonnées de leur image source : matière principale, matière secondaire et détails protégés. Les PNG sources, la base du corps, les ancrages et les masques corporels restent inchangés.

`scripts/prepare-material-masks.ts` conserve les contours, coutures sélectionnées, boutons, boucles, médaillons et imprimés hors des zones recolorables. Il produit les PNG de `public/assets/avatar/materials-v1` et le registre `apps/web/src/avatar/material-map.ts`. Une nouvelle pièce nécessite sa propre calibration ; ce traitement ne reconnaît pas automatiquement toutes les coutures d'une photo quelconque.

Le rendu conserve les valeurs d'ombre et de lumière, y compris pour le blanc et le noir. Les pixels protégés restent identiques à la source. Canvas et le rendu SVG de secours utilisent la même réponse de matière. La transparence et les dimensions restent constantes.

La fenêtre de couleur affiche les matières séparément et propose le retour à la couleur d'origine de la seule zone sélectionnée. Le nuancier RGB et l'accès VIP aux couleurs libres sont conservés. Le principe de sélection de plusieurs parties correspond au fonctionnement décrit dans [l'aide officielle de MovieStarPlanet](https://en.help.moviestarplanet.com/article/367-how-does-the-shop-work), sans présumer de leur technique de rendu interne.

## Vérification

- Sept tests ciblés réussis : `tests/material-colors.test.ts`, `tests/rail-pose.test.ts`, `tests/leopard-outfit.test.ts`.
- Test de compatibilité « explicit material masks » de `tests/atelier.test.ts` réussi.
- Compilation de production réussie.
- Planche des douze articles : original, blanc, rose et noir, via `tests/fixtures/material-colors.html`, accessible depuis la page de contrôle de l'habillage.
- Boutique : pantalon rose, seconde zone fourrure blanche puis retour à son brun d'origine ; ce retour conserve le rose du pantalon.
- Contrôle du nuancier à 390 × 844 : sélection et retour à l'origine accessibles.

Captures : `board-top.jpg`, `board-knit.jpg`, `shop-pink.jpg`, `mobile-palette.jpg`. Les tests de pixels ne remplacent pas la validation visuelle des masques.
