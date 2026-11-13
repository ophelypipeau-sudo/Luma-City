# Pose cœur v3 — raccord anatomique et profondeur

Après le retour sur les positions, la pose a été redessinée sur une vue complète du mannequin avant séparation des calques. Le dessin de contrôle est conservé dans `painted-source.png`. Le visage, le corps et les jambes affichés restent ceux du projet, jamais ceux de cette image de travail.

Corrections : épaules du mannequin conservées, coudes rapprochés du buste, avant-bras raccourcis dans la pose et mains proportionnées. Suppression du facteur horizontal de 1,18 des versions précédentes. La v3 utilise une translation de repères (-23/-7), sans étirement horizontal des bras. Les trois nouvelles sources sont conservées dans `public/assets/avatar/poses/heart-hands-v3` ; v1 et v2 restent archivées.

`HeartHandsDoll` sépare désormais explicitement les bras sous le torse, la composition originale corps/vêtements, les avant-bras au premier plan et les mains au-dessus des poignets. Les raccords des bras nus conservent les épaules originales avec une transition courte. Les manches remplacent entièrement les anciennes manches ; elles ne se mélangent pas avec des manches au repos. Pour le pull dénudé, les épaules proviennent du calque corporel existant en sous-vêtements sans bretelles et le revers vient du vêtement original.

La cabine reste frontale. Les identifiants, achats, couleurs et tenue enregistrée restent inchangés. Aucune respiration n'est réactivée.

Validation technique : build TypeScript/Vite et trois tests ciblés (absence d'animation, cabine frontale, conservation du visage/torse/jambes, disparition des anciennes mains et présence du nouveau coude). Validation visuelle de travail : page `tests/fixtures/fitting.html`, quatre hauts, cardigan recoloré, épaules du pull, aperçu réel à la taille de la colonne. Les captures servent à évaluer le dessin ; les tests ne valident pas à eux seuls son réalisme anatomique.
