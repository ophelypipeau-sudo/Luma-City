# Tenue Léopard — dessin sur le mannequin

> Correction active : la fourrure appartient désormais au pantalon, et les chaussures sont des plateformes à boucles sans fourrure. Voir `../leopard-outfit-v2/README.md`. Les notes ci-dessous documentent la première extraction.

Méthode demandée par l’utilisateur : dessiner la tenue sur la base d’Iris dans sa pose de jeu, garder le volume du tissu, puis isoler les pièces indépendantes pour la boutique. Ne pas détourer les vêtements du personnage de référence et les étirer globalement.

Source `painted-source.png` réalisée avec l’outil intégré image_gen à partir de la base et de la référence fournie. Prompt exact dans `prompt.txt`. Repère natif 887 × 1774, transformation identité ; les contours de séparation sont dans `contours.json`. Préparation : `scripts/prepare-leopard-outfit.ts`. Vignette et cabine partagent les mêmes PNG transparents, sans cheveux, mains, visage ou bras importés dans le vêtement.

Trois pièces : Léopard froncé (550), Cargo évasé Médaillons (850), Plateformes Fourrure & boucles (750). Les montants sont des prix provisoires en monnaie du jeu. La ceinture fait partie du pantalon ; la fourrure fait partie des chaussures. Les médaillons, les rosettes noires et les boucles métalliques sont protégés du masque de recoloration principal. Les trois pièces sont enregistrées dans `avatar/leopard.ts` et ajoutées au catalogue, sans remplacer les précédentes.

## Sous-vêtements et indépendance du corps

La source canonique `fashion-v2/body-user.png` reste intacte, notamment les contours, le visage, les mains et l’échelle. Comme ses sous-vêtements sont intégrés dans l’image, des variantes locales de coupe des sous-vêtements sont préparées : sans bretelles, taille basse et combinaison des deux. Seules ces régions sont adaptées à partir du dessin sur le même mannequin. L’alpha et donc les contours restent identiques partout ; les couleurs du reste du corps sont identiques à un réencodage PNG sans modification (normalisation des couleurs prémultipliées sur les pixels translucides). Le soutien-gorge opaque reste présent sous le bustier et la culotte sous le pantalon.

`underwearCut` choisit la variante du calque corps uniquement lorsqu’une pièce l’exige. Retirer le haut ou le bas rétablit indépendamment la coupe originale correspondante. Ces images ne sont jamais utilisées dans les vignettes et ne changent pas les proportions de l’avatar. Le pull bordeaux préféré (encolure basse) utilise la même variante sans bretelles ; son ancienne version reste archivée.

Contrôles : tests des emplacements indépendants, intégrité de l’anatomie et de l’alpha des variantes de sous-vêtements, masquage des orteils par les chaussures et tests existants des calques. Compilation et vérification visuelle de la cabine, de la boutique et du petit écran. Captures conservées dans ce dossier. Les tests techniques ne valent pas validation artistique.

Validation exécutée : `tests/leopard-outfit.test.ts` (2 réussis) et `tests/avatar-layers.test.ts` (3 réussis). La suite globale `npm test` a aussi été lancée ; elle a été interrompue après plusieurs minutes dans les rendus historiques de `rose-outfit.test.ts`, sans résultat global complet. Ne pas présenter cette exécution comme une validation de toute la suite.
