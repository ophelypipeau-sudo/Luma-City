# Prune fumée

Le gilet cintré, le pantalon évasé taille haute et les escarpins espresso sont disponibles séparément dans la boutique. La silhouette utilise le mannequin d’Iris et ses mains d’origine.

Le dessin d’essayage se trouve dans `public/assets/avatar/prune-fumee-v1/source.png`. Le script `npx tsx scripts/prepare-prune-fumee.ts` isole les pièces aux pixels natifs sur le patron de 887 × 1774. Les masques teignent le tissu du gilet et du pantalon ainsi que le cuir des escarpins. Le fermoir et les contours des chaussures sont protégés.

Le pantalon occupe l’emplacement `bottom`. Son calque se termine par deux ourlets complets et son masque laisse apparaître les pieds quand les chaussures sont retirées. Les escarpins occupent `shoes`. Leur silhouette complète et leur masque des orteils sont calés sur le mannequin. Si le pantalon descend sur le pied, son ourlet passe devant l’escarpin. Le même escarpin reste visible en entier avec des jambes découvertes.

Les chaussettes, résilles et guêtres indépendantes utilisent l’emplacement existant `legwear`. Pour des bottes, la tige cousue fait partie de la chaussure. Une guêtre que l’on peut enlever séparément reste dans `legwear`. Prune fumée n’a pas de troisième calque sur les jambes.

La page `/previews/prune-fumee.html` utilise le même rendu que la cabine. Elle permet d’essayer le pantalon seul, les escarpins jambes nues, le tailleur complet, ainsi que les escarpins avec un short, une jupe ou une robe.
