# Tenue rose — import adapté au mannequin unique

Source utilisateur conservée dans `source.png`. Les trois pièces sont des adaptations graphiques générées à partir de cette référence et du mannequin canonique, pas des extractions identiques pixel pour pixel. Les prompts exacts sont dans `prompts.json`.

- `public/assets/avatar/rose-v1/top.png` : caraco blanc, bord noir et nœud.
- `public/assets/avatar/rose-v1/cargo.png` : cargo rose, poches et motif noir sur la jambe droite de l’image.
- `public/assets/avatar/rose-v1/sneakers.png` : baskets plateforme blanches.

Le catalogue et les repères sont dans `apps/web/src/avatar/rose.ts`. Chaque emplacement se remplace indépendamment. La tenue lilas/indigo reste disponible et constitue toujours la tenue initiale. Collection reste vide.

Le mannequin et les mains de l’utilisateur n’ont pas été modifiés. SHA256 du corps : `8e3b61c5a45e5ddc9ee528530ced84eea3bd883a1a2e05914b81fd46e3b269e4`.

Les bretelles opaques sont calibrées dans le repère natif du corps ; elles complètent la matière PNG. La même géométrie est utilisée en vignette, en cabine et dans le masque. La largeur du caraco suit la poitrine puis la taille. Les baskets passent sous le cargo ; leur revers arrière ne découpe pas le corps.

Contrôles : 54 tests réussis, `npm run build` réussi. `tests/rose-outfit.test.ts` vérifie les changements indépendants, la disparition des sous-vêtements et pieds couverts, et les bras/mains conservés. Planche exportable avec `npx tsx scripts/export-rose-outfit.tsx`. Captures de la fixture, des masques, de la boutique et de l’écran 390 × 844 dans ce dossier.

Cette livraison concerne uniquement haut, bas et chaussures : la coiffure, le foulard et les bijoux du modèle source ne sont pas importés.

## Correction chaussures, panier et nuancier RGB

- Correction du 9 novembre : suppression de la découpe arrière horizontale des baskets. Elle plaçait des rectangles de cheville devant les languettes/lacets. Toute la tige dessinée de ce modèle est désormais au premier plan et découpe réellement le pied dessous. Le cargo conserve sa priorité devant les baskets.
- Prix provisoires : cardigan 650, jean 550, bottines 700, caraco 350, cargo 600, baskets 450. Configuration centralisée dans `apps/web/src/shop/fashion-options.ts`.
- Les vignettes n’affichent que le prix ; leurs noms restent accessibles aux lecteurs d’écran. Panier = sélection essayée, avec retrait, total et couleur choisie. Aucun paiement ni débit ; le système économique n’existe pas encore.
- Nuancier RGB : 12 familles × 7 variations + 7 neutres. Disponible pour le caraco blanc. Filtre SVG local au tissu, détails noirs conservés ; ni corps, ni masques, ni autres vêtements recolorés. Couleurs mémorisées par identifiant de pièce dans l’essayage, même après changement de haut.
- Couleur libre : sélecteur natif et code HEX validé. Contrôles verrouillés par défaut, futurs comptes autorisés via la capacité `uiCapabilities.customGarmentColors`. Cette capacité n’est pas encore attribuée par le serveur. La page Vite `tests/fixtures/palette.html` simule explicitement le statut pour la vérification ; elle n’active aucun abonnement et ne fait pas partie du build du jeu.
- 56 tests réussis et build réussi. Régression dédiée aux languettes sans pantalon, aux zones noires conservées lors de la teinte rose et à la conservation de la couleur dans le panier. Contrôle visuel sur fixture chaussures, boutique et écran 390 × 844. Mains et corps toujours identiques à la source.

## Tous les articles recolorables et échelle fixe

Les six articles actifs acceptent désormais le nuancier et le sélecteur libre VIP. Les gains de luminance du jean et du cardigan permettent de remplacer leur teinte d’origine, au lieu de simplement multiplier leurs anciens canaux colorés. Le filtre conserve le dessin source, sa transparence, les ombrages et les détails noirs ; aucun motif ni nouvel asset n’est généré. Les passages arrière utilisent la même teinte. Les contrôles VIP restent conditionnés à la capacité du compte décrite plus haut.

La ligne Haut / Bas / Chaussures reste présente avec une hauteur fixe, y compris lorsqu’un emplacement est vide. La présence d’un haut ne réduit donc plus la zone du mannequin. Mesures navigateur conservées dans `avatar-size-desktop.json` et `avatar-size-mobile.json` : 421 px de haut sur ordinateur, 376 px dans l’écran de contrôle 390 × 844, identiques avant/après changement de haut. Ce sont des mesures propres à ces dimensions de fenêtre, pas des tailles codées en dur.

57 tests réussis et build réussi. Le nouveau test rend réellement chaque pièce à sa résolution native, vérifie que la matière change de couleur, que l’alpha reste identique et que les zones noires intérieures sont conservées. Les transitions entre vêtement équipé, autre haut et emplacement vide ont aussi été contrôlées dans le navigateur. Les mises à jour d’essayage utilisent la dernière sélection React pour éviter de rétablir un ancien équipement pendant un changement rapide de couleur.

## Suppression des raccords rayés et deux couleurs indépendantes

L’ajustement par bandes SVG produisait des raccords répétitifs sur les teintes sombres. Le rendu navigateur assemble désormais chaque pièce une seule fois sur un canevas natif 887 × 1774 (`useRegisteredTexture.ts`), une ligne de destination par passage, et met le résultat transparent en cache. La cabine et la vignette utilisent cette même texture. Les filtres de couleur s’appliquent après l’ajustement ; ils ne redessinent aucune matière. Le rendu SVG de secours reste disponible pour le rendu serveur et les contrôles existants.

Les pièces bicolores possèdent maintenant une métadonnée `secondaryColor` et deux sélections indépendantes :
- caraco : tissu / bordures et nœud ;
- cargo : tissu / motif et détails foncés ;
- cardigan : cardigan / caraco intérieur.

Les autres pièces conservent un seul sélecteur. `detailColors` garde la seconde teinte par identifiant de pièce, indépendamment de `colors`. Les deux teintes sont conservées pendant les changements d’équipement et affichées dans le panier. Les zones actuelles sont définies par la couleur source (détails sombres ou panneau clair), et non par la couleur déjà recolorée. Pour de futurs imports complexes, prévoir des masques explicites par matière.

Validation : 59 tests réussis, compilation réussie ; contrôle visuel du caraco vert sans rayures régulières, des bordures blanches et de la cabine sur petit écran. Fixtures indépendantes du compte : `tests/fixtures/dressing.html` et `dressing-mobile.html` (simulation VIP uniquement dans la fixture). Corps et mains toujours identiques à la source.
