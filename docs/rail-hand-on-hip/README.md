# Pose de présentation : une main sur la hanche

Pose demandée uniquement pour Iris dans la colonne de gauche. La cabine reste de face, comme les portraits et les avatars de salle. `main.tsx` active explicitement `pose="hand-on-hip"` sur ce seul portrait en pied. Les autres appels à `Portrait` restent frontaux par défaut.

Le rendu conserve le corps canonique et les vêtements indépendants du dressing. Le visage, le torse, le bras gauche, le jean et les chaussures sont rendus depuis les sources existantes. Le bras droit abaissé est masqué dans une région calibrée. La manche pliée est un dessin séparé sur le canevas natif 887 × 1774. Après correction demandée par l’utilisateur, la main de la pose de face n’est plus tournée : la main posée sur la hanche est isolée directement depuis l’aperçu choisi, dans ses coordonnées d’origine, avec les doigts orientés vers la poche. Elle est stockée séparément dans `public/assets/avatar/poses/hand-on-hip-lilac-v2/hand.png`. L’ordre est : reste du personnage, main au-dessus de la hanche, manche au-dessus du raccord de poignet. Le corps original et sa main de face ne sont pas modifiés.

`HandOnHipDoll.tsx` contient les repères et les masques. La pose actuelle est calibrée pour le cardigan lilas de la colonne de gauche. Une coupe non calibrée revient à la pose de face ; il ne s’agit pas encore d’un système d’animation général pour toute la garde-robe. Les changements d’essayage restent temporaires dans la cabine et ne remplacent pas cette tenue de présentation.

## Sources et préparation

- `front-source.png` : export de la vraie tenue de face via `scripts/export-rail-pose.tsx`.
- `painted-source.png` : guide du bras plié, réalisé précédemment avec l’outil intégré image_gen. La manche et, après demande explicite de correction, la main de cette pose sont isolées. Les autres parties générées ne sont pas utilisées dans le jeu.
- `scripts/prepare-rail-pose.ts` : préparation du calque transparent `public/assets/avatar/poses/hand-on-hip-lilac-v1/arm.png`.
- `scripts/prepare-hip-hand.ts` : extraction de la main de l’aperçu, en conservant ongles, contours et raccord de poignet. Aucune nouvelle génération n’est nécessaire pour cette correction.
- `scripts/preview-rail-pose.ts` : aperçu agrandi avec le mannequin original, la manche et la main posée sur la hanche.
- `prompt.txt` : prompt exact du guide généré.

Validation : `tests/rail-pose.test.ts` (2 tests), compilation, contrôle visuel en grand, comparaison via `tests/fixtures/fitting.html` et boutique réelle. Le fichier du corps reste intact. Les tests techniques ne remplacent pas le jugement artistique.
