# Cabine 3D — essai annulé

Essai annulé à la demande de l’utilisateur. Le code, les dépendances et l’accès ont été retirés. Les captures et les notes ci-dessous sont conservées uniquement comme historique.

Accès : Boutique → **Essayer la cabine 3D**. Retour à la boutique 2D à tout moment. Le prototype ne modifie ni la carte, ni les données d’équipement, ni les images du mannequin 2D. Aucun appel externe, modèle payant ou clé API.

## Ce que permet le test

- Un mannequin 3D stylisé construit localement, base unique, cinq doigts par main, sous-vêtements opaques.
- Deux hauts (pull et caraco), deux jupes (plissée et droite), deux chaussures (bottines et baskets), retrait individuel des pièces et couleurs de matière indépendantes.
- Un même squelette pour le corps et les vêtements via Three.js SkinnedMesh ; les manches suivent les bras, les chaussures les chevilles. Les doigts et les éléments du visage suivent leurs os respectifs.
- Corps et vêtements issus des mêmes profils géométriques avec une aisance explicite. Le corps reste identique lorsqu’une pièce est remplacée.
- Vue de face, trois quarts, dos, rotation 360°, glisser pour orbiter, zoom à la molette ; animations de repos, marche légère sur place et salut. Pause conserve la pose inspectée.
- Vue de la base en sous-vêtements, sans remplacer les pièces sélectionnées.

## Limites explicites

Le modèle est une sculpture procédurale de démonstration, pas un avatar final ni une conversion de l’illustration approuvée. Le visage, les cheveux, les mains et la finition des matières sont provisoires. Aucune qualité artistique finale n’est revendiquée.

Pas de simulation physique du tissu, détection de collision générale, import automatique depuis Pinterest, import GLB/FBX, retargeting arbitraire, économie 3D ou sauvegarde des tenues 3D. Les vêtements du prototype ont été créés sur cette base. Les poses testées restent limitées ; une garde-robe réelle demandera des assets modélisés et pondérés pour le même mannequin, avec des contrôles supplémentaires.

Une migration ne doit être entreprise qu’après validation visuelle du personnage. La prochaine étape artistique serait une base 3D travaillée dédiée, avec un rig et des vêtements compatibles, tout en réutilisant la cabine.

## Fichiers

- `apps/web/src/three-doll/model.ts` : profils de forme, corps et pièces séparés, squelette, pondérations, animations, visibilités et nettoyage.
- `apps/web/src/three-doll/ThreeDressing.tsx` : scène WebGL, caméra, éclairage, ombres, interactions et gestion du contexte graphique.
- `apps/web/src/three-doll/three-dressing.css` : studio responsive.
- `apps/web/src/shop/LayeredDressing.tsx` : entrée et retour à la boutique, chargement différé du module 3D.
- `tests/fixtures/three.html` et `three-mobile.html` : contrôles isolés avec Vite.
- `tests/three-doll.test.ts` : squelette effectivement partagé, poids normalisés, indices d’os valides, géométrie du corps conservée et déformation des manches, pause de la pose.

Three.js et ses types sont installés depuis npm. Le module 3D est chargé uniquement à son ouverture. Les réglages de cet essai sont temporaires et séparés de la tenue 2D.

## Vérification

Compilation : `npm run build`. Tests ciblés : `npx tsx --test tests/three-doll.test.ts tests/avatar-layers.test.ts` (5 tests). Contrôles visuels de la tenue complète, du salut en pause, de la seconde coupe, des vues, des couleurs et de la base ; affichage 390×844. Le corps 2D conserve son hash canonique.

Captures : `wave.jpg`, `mobile.jpg` et `studio.jpg`. Les captures illustrent la version de démonstration et ne constituent pas une validation de son style graphique.

Références techniques : https://threejs.org/docs/pages/SkinnedMesh.html et https://threejs.org/docs/pages/OrbitControls.html.
