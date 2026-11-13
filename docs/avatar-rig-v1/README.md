# Ossature 2D et corbeille de construction — v1

## Ce qui est livré

- Le catalogue n'affiche plus de check superposé au cœur. Le cœur reste un contrôle de favoris indépendant.
- En mode éditeur (`/api/atelier/capabilities.editor`), chaque article possède une petite poubelle. La corbeille du bas permet de restaurer les articles. Le retrait est local à ce navigateur, persiste après rechargement, et s'applique aussi aux articles actuellement portés ou essayés. Aucun asset source, achat, identifiant ou choix de couleur n'est détruit. La restauration remet la pièce au catalogue ; un essayage retiré peut être rééquipé normalement.
- Page de contrôle : `http://127.0.0.1:3001/?avatar-rig=1`. Elle ne modifie aucune tenue, aucun achat et aucun solde du jeu.

## Organisation du rig

`apps/web/src/avatar/rig/skeleton.ts` définit une hiérarchie de 15 articulations en pixels natifs (887 × 1774), sur la pose main sur la hanche déjà approuvée. Les enfants héritent des transformations des parents. Les positions d'articulation restent communes : pas de déplacement indépendant d'un coude et de son avant-bras.

`mesh.ts` prépare un maillage triangulé partagé et des poids de déformation. La tête et les mains restent rigides ; les zones de raccord se mélangent progressivement. Corps et vêtements suivent les mêmes poids. Le visage n'est pas étiré. Les pieds restent au sol dans les mouvements livrés.

`HandOnHipDoll.tsx` conserve son rendu normal. Un paramètre facultatif `rigPart` permet de produire quatre surfaces : bras posé, corps habillé, ceinture, main. Le corps et les vêtements restent des assets indépendants dans le dressing ; cette composition temporaire sert uniquement au rendu animé. Changer une pièce reconstruit ses surfaces avec les mêmes repères. La main passe devant la ceinture ; la ceinture suit le bassin, indépendamment du pantalon.

`renderer.ts` incorpore les assets et leurs masques de matière dans les SVG, puis applique le maillage avec WebGL natif. Les textures sont calculées au changement de tenue, pas à chaque image. Les ressources GPU et la boucle d'animation sont libérées au démontage. Aucun service payant ni nouvelle dépendance.

`RigLab.tsx` compare le dessin existant au rendu articulé, avec quatre hauts, deux types de bas et la ceinture. On peut afficher les articulations, mettre en pause et passer progressivement entre repos, respiration et petit geste. Transition interpolée sur 650 ms ; angles par le chemin le plus court. Le jeu normal conserve la pose main sur la hanche à gauche, et la cabine de face.

## Limite graphique explicite

Il s'agit d'une première plage de mouvements légers, pas d'un catalogue d'animations terminé. La hiérarchie des jambes est prête, mais aucune marche ni pose assise n'est activée. Pour lever fortement les bras, tourner, croiser les jambes ou s'asseoir, il faudra calibrer des déformations supplémentaires et dessiner les surfaces nouvellement visibles. Un squelette ne peut pas inventer les parties absentes d'un dessin raster. Chaque grande pose devra être contrôlée visuellement avec ses manches, ses chaussures et ses accessoires.

## Vérifications

- Build TypeScript/Vite.
- Tests ciblés : identité du maillage au repos, somme des poids, raccords parent/enfant, tête/mains rigides, transitions, corbeille réversible, préservation des achats et des variantes, pose du portrait et cabine frontale.
- Contrôle navigateur : retrait d'un cargo non porté, rechargement, restauration ; solde de 7 800 et tenue utilisateur conservés. Captures `corbeille.jpg`, `boutique.jpg`.
- Comparaison visuelle des quatre hauts, geste léger et ossature, dont le pull et la ceinture. Captures dans ce dossier.

Ces tests techniques ne remplacent pas la validation artistique des animations futures. Le PNG du corps et les PNG des mains n'ont pas été modifiés.

Validation finale : compilation réussie, 19 tests ciblés distincts réussis (ossature/corbeille, achats, tenues portées, pose, matières et ceinture). Les SVG préparés attendent désormais les textures enregistrées et les masques de matière avant de produire les surfaces animées ; aucun instantané du rendu temporaire par bandes n'est utilisé. Contrôles de la cabine et du catalogue à 390 × 844 conservés dans `fitting.jpg` et `mobile.jpg`.

## Respiration du portrait — correction après retour visuel

Le geste du bras a été retiré des commandes de l'aperçu : son enveloppe de déformation n'était pas suffisamment calibrée, malgré la continuité mathématique des articulations. La respiration expérimentale ne fait plus tourner les bras.

Le portrait de gauche utilise maintenant `avatar/BreathingDoll.tsx`, uniquement sur demande explicite de `Portrait` (`breathing`). La cabine et les petits portraits ne l'activent pas. Une déformation SVG verticale très légère est confinée à l'intérieur du torse, dans le repère logique 480 × 1024 (centre 240/300, rayons 65/95). Les bras, les mains, le visage, la ceinture et le sol restent hors de cette zone. La composition complète corps/masques/vêtement reçoit la même déformation, ce qui conserve les raccords et les couleurs, sans repasser par le maillage expérimental du bras.

Cycle de 5,2 s avec interpolation douce, amplitude maximale de 3,5 pixels logiques au centre du torse. Les préférences système de réduction des animations désactivent la respiration, y compris lorsqu'elles changent pendant la session. Aucun asset source ni tenue enregistrée n'est modifié. Capture : `respiration-boutique.jpg`.

Validation : build, deux tests de respiration et quatre tests existants du portrait/de la cabine. Contrôle navigateur : un seul portrait animé, cabine sans animation ; vérification visuelle du bras maintenu dans la pose approuvée.

### Respiration plus visible

Après le retour utilisateur, amplitude doublée (échelle 14, déplacement central maximal de 7 pixels logiques), zone centrale uniforme jusqu'à 35 % du rayon pour éviter de concentrer tout le mouvement en un point. Les limites de la zone restent identiques : aucun déplacement supplémentaire sur les bras, les mains, la ceinture ou les pieds. Cycle doux de 4,8 s. Build et deux tests ciblés réussis ; capture `respiration-visible.jpg`.
