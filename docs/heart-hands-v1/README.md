# Pose fixe : mains en cœur

La respiration est retirée du portrait en production. `main.tsx` demande maintenant `pose="heart-hands"`, sans animation ni déformation temporelle. La cabine garde son rendu frontal `LayeredDoll`. La pose main sur la hanche reste disponible dans le code et dans la page de contrôle, mais n'est plus la pose choisie dans la colonne de gauche.

## Corps et vêtements conservés

`avatar/HeartHandsDoll.tsx` reprend le même corps, visage, torse, bas, chaussures, ceinture, identifiants et couleurs. Les anciens bras/mains au repos sont masqués suivant leurs limites intérieures ; les nouveaux bras et mains en cœur sont des calques transparents fixes. Le visage et les jambes ne proviennent pas du dessin généré.

Les manches lilas et bordeaux sont dessinées dans cette pose et disposent de masques de matière séparés. Les mains se composent devant les poignets ; le revers du pull est repris du vêtement existant. Les hauts sans manches utilisent directement les bras nus. Les vignettes et les vêtements de cabine ne sont pas remplacés par des personnages habillés.

## Sources et repères

Outil utilisé : imagegen intégré, sans clé API du projet. Sources conservées dans `public/assets/avatar/poses/heart-hands-v1/` : `arms-source.png`, `lilac-source.png`, `burgundy-source.png`. Le dessin de contrôle complet est conservé dans `painted-source.png`, dans ce dossier, mais ne remplace pas le corps du jeu.

La source des bras mesure 953 × 1651 ; `scripts/prepare-heart-pose.ts` calibre les épaules sur la base native 887 × 1774 et applique ce même repère aux manches. Les fichiers finaux gardent le canevas entier, sans recadrage automatique. Le corps source n'est pas transformé. Chaque nouvelle coupe à manches devra posséder sa variante dessinée et contrôlée dans cette pose ; les imports futurs ne doivent pas simplement reprendre la manche frontale.

## Vérification

- `tests/avatar-breathing.test.ts` vérifie désormais l'absence d'animation du portrait, même avec un ancien drapeau de respiration, et la cabine frontale.
- `tests/heart-pose.test.ts` vérifie par rendu natif la conservation du visage/torse/jambes, l'effacement des anciennes mains, la présence du coude replié et l'ouverture transparente entre les doigts.
- Tests existants de la pose hanche et des tenues conservées.
- Contrôle visuel Vite : `tests/fixtures/fitting.html`, bouton « Pose fixe · mains en cœur », quatre hauts, manches et couleurs. Captures dans ce dossier.
- Le mannequin fourni par l'utilisateur est intact : SHA256 `8E3B61C5A45E5DDC9EE528530CED84EEA3BD883A1A2E05914B81FD46E3B269E4`.

Compilation finale réussie et neuf tests ciblés réussis (pose fixe/absence de respiration, rendu natif de la pose cœur, pose hanche conservée et tenues sauvegardées). Le test de conservation des pixels compare le rendu frontal existant au rendu posé, afin de tenir compte du filtre alpha déjà présent dans `LayeredDoll`.
