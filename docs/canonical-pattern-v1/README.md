# Patron canonique et poses — version active

Le corps fourni par l’utilisateur reste inchangé (887 × 1774). Son empreinte SHA-256 est vérifiée avant chaque recalage. Les versions précédentes restent conservées ; les assets actifs recalés sont dans `public/assets/avatar/winter-v2`.

## Repères communs

`packages/domain/src/avatar-pattern.ts` contient les mesures du torse et des membres. La taille haute est à y=690, les chevilles à y=1600, et les points d’épaule, coude et poignet sont fixés pour chaque pose. Les vêtements ne modifient ni le visage, ni les mains de la base, ni son échelle.

Chaque coupe conserve son aisance : un haut ajusté, une manche ballon, un col de fourrure et une jupe évasée ne partagent pas le même contour extérieur. Ils partagent les attaches corporelles. Les cols restent des panneaux distincts ; les fentes et ouvertures appartiennent au torse et ne sont pas interprétées comme des bras.

## Composition et poses

Les hauts utilisent le même panneau frontal du torse dans les trois poses. Les manches sont des textures liées au même maillage que les bras, avec un raccord progressif à l’épaule et un coude continu. Les masques supprimant les bras au repos sont issus exactement de la découpe du patron ; ils ne retirent plus une portion supplémentaire d’épaule.

Le pull bordeaux et le cardigan lilas existants utilisent également cette méthode. Leur source frontale reste conservée. Les bas et chaussures partagent leur dessin entre poses puisque les jambes restent identiques. Les sacs, perruques et bijoux gardent leurs emplacements indépendants.

## Pipeline pour les prochains ajouts

1. Choisir une coupe et relever ses repères source (encolure, épaule, poitrine, taille, ourlet, poignet ; ou taille, hanches, genou, cheville, semelle). Le format PNG n’est jamais une calibration.
2. Ajouter une spécification dans `scripts/calibrate-winter-patterns.ts`. Une nouvelle coupe doit renseigner ses propres repères source et son aisance, tout en utilisant les cibles corporelles communes.
3. Séparer les panneaux de torse et les manches, en tenant compte de la coupe. Ne pas découper une manche ample sur le contour plus étroit du bras nu.
4. Recaler le tissu, ses zones recolorables et ses détails dans les mêmes coordonnées. Générer les trois poses à partir de la même source.
5. Exécuter `npx tsx scripts/calibrate-winter-patterns.ts`, qui termine par la protection des contours via `scripts/finalize-pattern-materials.ts`.
6. Contrôler `tests/fixtures/fitting.html`, puis `tests/fixtures/pose-wardrobe.html`, toutes les poses et les couleurs. Garder des captures et exécuter les tests et la compilation.

Le catalogue possède un lien explicite au patron et à l’empreinte du corps. Une publication sans ce lien est refusée et les anciens imports non calibrés restent conservés en attente. Ce contrôle empêche l’oubli des repères ; il ne constitue pas une validation artistique automatique d’une image quelconque.

## Vérifications

`tests/avatar-pattern.test.ts` vérifie le corps de référence, les attaches, la continuité du maillage, les poignets et l’identité des textures de taille entre poses. Les tests existants vérifient aussi les équipements et couleurs après achat/rechargement, les masques corporels, les perruques, la protection des matières et le volume des jupes. Les captures de ce dossier montrent le rendu réellement contrôlé, distinct des résultats des tests.

## Résultat du contrôle

42 tests réussis (`npm run test:avatar`), compilation réussie (`npm run build`). Le hash du corps reste inchangé. La boutique conserve le solde et la tenue enregistrée ; les essayages de contrôle restent temporaires.

Captures : [robe, trois poses](ivoire-trois-poses.png), [cardigan rose](ruban-trois-poses.png), [tenue Neige](neige-trois-poses.png), [cardigan lilas](lilas-trois-poses.png), [pull bordeaux](bordeaux-trois-poses.png), [boutique réelle](boutique.png), [petit écran](mobile.png).
