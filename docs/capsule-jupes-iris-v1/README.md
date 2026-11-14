# Capsule jupes Iris

Les dix jupes de la [planche validée](planche-validee.png) sont dessinées pour Iris de face. Traverse conserve le bouton et la fente sans la poche à soufflet. Obsidienne conserve ses panneaux de cuir sans le zip diagonal. Prix unitaire de 750 pièces, comme la capsule de shorts Iris.

Les sources ImageGen dans `sources/` suivent l’ordre de la planche. Pour chaque modèle, la consigne était de peindre la jupe de sa cellule sur le mannequin frontal canonique, en gardant sa pose, ses proportions et son haut lilas. Les personnages des sources servent à positionner les jupes. Le jeu compose les vêtements détourés sur le PNG canonique.

`npm exec -- tsx scripts/prepare-iris-skirts.ts` extrait les contours mesurés, place les dessins avec des transformations uniformes, génère les masques de matière, de détails protégés et d’occlusion, et lie le manifeste à l’empreinte du patron d’Iris. Les profils déclarent uniquement la pose de face.

La [planche de rendu](rendu-face.png) est produite par le composant du jeu. Elle montre les couleurs originales et un essai de recoloration. La page Vite `tests/fixtures/fitting.html?bottoms=skirts-iris` affiche les dix jupes sur des fonds clair, foncé et coloré. Les paramètres `dye` et `tucked` permettent de vérifier la teinte et le raccord avec un haut rentré.
