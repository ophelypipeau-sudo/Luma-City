# Contrôle des matières du dressing

Les 77 articles du catalogue ont été vérifiés lors de l’audit initial dans la planche
`tests/fixtures/material-colors.html`, sur quatre colonnes : original, blanc,
rose et noir. Lorsqu’une seconde matière existe, elle est volontairement
testée avec une teinte distincte. Les 11 captures `audit-*.png` conservent ce
contrôle ; les captures `final-*.png` montrent les corrections sur Iris
dans les trois poses.

Pour les prochains contrôles, ouvrir la planche dans le même navigateur et
sur la même origine que la boutique : elle reprend sa liste de corbeille.
Les captures de l’audit initial restent des archives.

Lancer `npm exec -- tsx scripts/refine-wardrobe-masks.ts <identifiants-visibles>`
avec les seuls articles encore en vente. Le script ne modifie que leurs
masques. L’audit initial a notamment corrigé le motif de Fleur
framboise, boucle d’Espresso, rayures et passepoils, séparation du tissu et de
la fourrure d’Étoile givrée, broderies du mini denim, coutures de shorts et du
gilet Prune fumée, fermoir et chaîne des sacs, rivets de la ceinture argentée.
Les étoiles brodées de la veste Étoile givrée restent d’origine ; sa seconde
couleur ne s’applique qu’à la fourrure.

Pour la capsule, `npm exec -- tsx scripts/prepare-capsule-mode.ts` produit
le masque du buste de Nocturne et la variante arrondie de Champagne.
Cerise conserve ses empiècements crème et les manches de Nocturne restent
hors du nuancier. Le calque `champagne-arrondi.png` est séparé de l’ancien
calque et de la peinture source.
