# Dressing redessiné sur le corps unique

La demande active remplace l'étirement des anciens imports : dessiner chaque
vêtement en 2D directement sur le mannequin, reconstruire cols/manches/coupes,
conserver ses volumes puis extraire des calques transparents indépendants.

27 pièces, huit ensembles : lilas/jean, caraco/cargo Dragon, bordeaux/jupe,
léopard/cargo fourrure, Étoile givrée, Neige & Perles, Ivoire doux, Ruban rose.
Les 43 identifiants du catalogue restent stables. Cheveux, bijoux, ceintures et
sacs restent indépendants ; les achats, couleurs et poses enregistrés ne sont
pas réinitialisés. Le corps et les mains fournis ne sont pas modifiés.

## Sources et production

Mode utilisé : **outil image_gen intégré**, édition d'images avec référence au
mannequin existant. Aucun appel à une API du jeu, aucune clé utilisateur.
Les prompts exacts, les fichiers sources et les références sont enregistrés dans
`scripts/redraw-sources.json`. Tous les résultats retenus sont copiés dans
`public/assets/avatar/redrawn-v1/sources/`. Les références de tenues disponibles
dans les pièces jointes ont été consultées ; le mannequin original et les guides
de poses exportés du rendu de production servent de cibles d'édition.

`scripts/export-redraw-guides.ts` exporte les guides. Les dessins frontaux et
les douze variantes de manches sont nativement en 887 × 1774. Les résultats
recomposés dans un autre format ont été rejetés, pas déformés pour rentrer.
Des chaussures entièrement visibles et un caraco complet sont dessinés séparément
pour pouvoir retirer pantalons, guêtres et cardigan sans laisser de trous.

`npm run assets:fit` isole les peintures à leurs coordonnées natives, sans
redimensionnement, bande UV ni changement de largeur. Il produit les sprites,
masques de matière/détails/contours et cadrages des vignettes. Les régions de
séparation suivent chaque coupe ; elles ne remplacent pas un contrôle visuel.
La fourrure appartient au pantalon ou aux guêtres, pas aux chaussures.
Les bas transparents utilisent la peau originale, sans peau cuite dans le sprite.

`redrawn-garments.ts` remplace l'art des articles existants avec ces calques.
Les six coupes à manches ont un dessin complet par pose, avec le panneau de taille
et l'ourlet frontal réutilisés aux mêmes pixels pour éviter une ouverture à la taille.
Les hauts sans manches,
bas et chaussures partagent leur dessin car le torse et les jambes restent fixes.
Le même sprite sert à la cabine et à la vignette. Les coutures/imprimés/métaux
protégés restent hors des zones de teinture.

## Vérification

Les pages `tests/fixtures/fitting.html` et `tests/fixtures/pose-wardrobe.html`
contrôlent le rendu réel et la palette. Les captures de ce dossier montrent les
trois poses ; `render-*.png` sont également exportés des composants de production.
Les tests vérifient les calques natifs, l'absence de fragments d'autres pièces,
l'immutabilité du corps, les couleurs, les équipements et les achats.
Ils ne constituent pas une validation artistique de l'utilisateur.

Validation finale : `npm test` **117/117**, `npm run test:avatar` **44/44**,
`npm run build` réussi. Captures conservées pour les huit ensembles et la cabine
à 390 pixels ; la boutique sur le port 3001 est ouverte sur un essayage temporaire.
Le solde utilisateur de 7 800 n'a pas été débité.

Les scripts et assets précédents sont conservés pour l'historique. La commande
`assets:fit:archive` sert seulement à reproduire cet ancien état rejeté, pas à
fabriquer les futurs vêtements.
