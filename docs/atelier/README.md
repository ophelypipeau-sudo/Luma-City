# Atelier local gratuit de vêtements

Accès : **Boutique → Atelier d’import**, compte créateur Aurore / Iris. Les pièces existantes, imports, corbeille et versions publiées sont conservés.

## Importer et essayer

1. **Importer une image** : choisir un PNG/JPEG/WebP (12 Mo max). Enregistrer l’image Pinterest sur l’ordinateur au préalable ; les liens Pinterest ne sont pas importés directement.
2. Choisir la coupe : débardeur, tee-shirt ou manches longues. Ce premier lot accepte les hauts frontaux sur la base unique.
3. **Retirer le fond des bords** efface les couleurs connectées aux bords. **Fond au clic** retire la zone connectée choisie. Régler la tolérance avec prudence sur un vêtement clair.
4. Sur une tenue complète, **Contour de la pièce** : cliquer autour du haut puis **Garder le contour**. La **Gomme** retire peau, cheveux et autres vêtements. **Restaurer au pinceau** récupère les pixels de départ ; **Annuler la retouche** garde huit étapes pendant la séance.
5. **Enregistrer et essayer sur Iris** conserve le PNG localement et le place sur le patron. Dans **Ajuster**, régler position, largeur et longueur du vêtement. Le corps, le visage et les mains gardent leur taille. On peut retoucher le calque enregistré ou repartir de la source.
6. Dans **Couleurs**, corriger les deux masques de matière et protéger imprimés/coutures. Les masques initiaux par luminosité sont des propositions à vérifier. Aucun motif n’est inventé.
7. Dans **Vérifier**, inspecter les raccords, sous-vêtements couverts, visage et mains libres, pièce entière dans le canevas et couleurs claires/foncées. Cocher les six contrôles humains, fixer le prix, publier. Un test de pixels ne valide pas la qualité du dessin.

Un PNG détouré peut aussi être chargé via **J’ai déjà un PNG transparent prêt à porter**. Cocher l’option de canevas aligné uniquement s’il conserve le repère complet 1:2 du mannequin.

## Gratuit et local

Canvas dans le navigateur et un algorithme de couleur connectée assurent le détourage. Aucun modèle à télécharger, aucune clé, aucun abonnement et aucun appel OpenAI. Seul le serveur local reçoit les sources et calques. Les anciennes routes de génération/analyse refusent les requêtes, même avec une clé d’environnement. Le fournisseur historique et ses tests restent conservés mais ne sont plus raccordés aux routes actives.

Ce système ne reconnaît pas les coutures ni les vêtements sémantiquement. Un fond chargé, une manche cachée ou des cheveux sur le col demandent une retouche manuelle. Il ne reconstruit pas les zones invisibles et ne garantit pas une coupe parfaite en un clic. Les bas, chaussures et perruques existants restent disponibles ; leurs nouveaux imports ne font pas partie de ce premier lot.

Les grandes sources sont réduites à 1400 pixels sur le côté le plus long dans l’éditeur, pour maîtriser la mémoire. La source originale reste conservée. Les calques déjà enregistrés au repère du mannequin gardent leur résolution native. Vignette et cabine utilisent la même pièce indépendante ; le corps et les mains sont inchangés.

## Sauvegarde et suppression

Enregistrer les retouches avant de quitter ou changer de source. **Supprimer** place l’import dans la **Corbeille**, retire ses versions du catalogue et permet **Restaurer**. Les modifications non enregistrées sont abandonnées lors de la suppression.

Sauvegarder `.data/atelier` avec le projet : sources privées au créateur, PNG préparés, calques natifs 887×1774, masques et versions immuables. Les versions publiées restent accessibles aux comptes connectés.

## Fichiers et contrôles

- `apps/web/src/atelier/LocalCutout.tsx` : éditeur local, contour, gomme, restauration, annulation.
- `packages/domain/src/local-cutout.ts` : retrait de couleur connectée, alpha seulement, RGB préservé.
- `apps/web/src/atelier/Atelier.tsx` : parcours, essayage, sauvegarde et publication.
- `apps/server/src/atelier-routes.ts` : API locale sans fournisseur externe actif.
- `apps/server/src/atelier-{store,images}.ts` : stockage, contrôles et placement.
- `packages/domain/src/atelier-patterns.ts` : trois patrons et repères.
- `packages/domain/src/atelier-color.ts` : recoloration par masques.

Vérification : `npm test` et `npm run build`. Captures conservées dans ce dossier. Les tests de détourage contrôlent les fonds connectés, les imprimés enclavés, la tolérance, les PNG transparents et les pixels RGB. Un test des routes vérifie qu’aucun fournisseur externe ne peut être invoqué.

## Recette du 9 novembre 2026

- Compilation réussie ; suite complète : 70 tests réussis.
- Import par le sélecteur de fichiers, retrait du fond uni dans Canvas, annulation puis réapplication, enregistrement au repère complet et essayage contrôlés dans le navigateur.
- Le fichier `local-background-fixture.png` est une image de test construite avec le caraco existant sur fond uni ; il ne prétend pas être une reconstruction depuis une nouvelle photo.
- Le tee-shirt du brouillon utilisateur a été placé sur Iris dans l’atelier, sans publication automatique. Le brouillon de contrôle a été rangé dans la corbeille.
- Captures : `local-background-removed.jpg`, `local-mobile.jpg`, `local-final.jpg`.
- Les corps et mains restent inchangés. Aucune validation artistique automatique n’est revendiquée.
