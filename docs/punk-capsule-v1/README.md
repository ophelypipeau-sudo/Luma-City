# Éclipse rose — capsule textile 2D

Neuf pièces inspirées de la photo fournie, dessinées en code, sans détourage ni pixels de cette photo : polo court à motifs, jupe plissée à carreaux et poche, cravate, ceinture, collier ras-du-cou, créoles, coiffure ondulée à mèches roses, résille et bottes. Les bottes sont une proposition pour compléter la partie partiellement visible de la référence.

Les vêtements déjà présents et le fichier du corps canonique sont conservés. La base reste unique ; aucun réglage corporel n’est ajouté.

## Organisation

`packages/domain/src/punk-pattern.ts` définit les coupes, couleurs de base, recadrages des vignettes, repères des manches et identifiants. `apps/web/src/avatar/PunkGarment.tsx` applique les matières et ombres vectorielles : tartan, panneaux plissés, métal, résille et reflets de cheveux. Les mèches roses font partie de la coiffure et restent recolorables séparément du noir. Les bijoux et accessoires sont des articles distincts. Les vignettes utilisent exactement le même composant que le mannequin.

`punk-catalog.ts` inscrit les neuf articles et leurs prix provisoires. Le nouvel emplacement facultatif `tie` permet de cumuler cravate et collier ; les anciens enregistrements restent valables. Les achats, couleurs et enregistrements utilisent les mécanismes existants.

Pour les manches courtes, `RedrawnPoseDoll` réutilise les bras posés existants propres (`redraw-v4/heart-arms.png` et `hand-on-hip-v3/bare-arm.png`). Les avant-bras et mains passent devant la cravate ; le col et les manches sont dessinés dans la pose choisie. Le reste du corps et le dessin des mains restent ceux du jeu. La cabine reste de face.

La résille est limitée par l’alpha du corps, passe sous la jupe et sous les bottes. Ce masque ne dessine aucune peau dans la pièce. Les bottes suivent les mesures des mollets, chevilles et pieds de la base actuelle. Les cheveux disposent de passages avant/arrière sans recouvrir les yeux.

## Contrôles

- `tests/fixtures/fitting.html` : bouton « Éclipse rose complète », comparaison cabine / pose.
- `scripts/export-punk-capsule.tsx` : rendus réels du composant de production en pied et en détail.
- `tests/punk-capsule.test.ts` : indépendance des articles, cravate et collier simultanés, conservation des couleurs après achat/rechargement, silhouette inchangée par les couleurs et résille confinée au corps.
- Les captures de navigateur sont conservées dans ce dossier. La validation artistique reste à l’utilisateur.
