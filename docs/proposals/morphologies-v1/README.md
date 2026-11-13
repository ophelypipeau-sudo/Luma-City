> Statut : proposition visuelle refusée par l’utilisateur. Sources et travail technique conservés. La reprise graphique commence par une seule base X dans `../hourglass-v2/`. Les tests réussis ne constituent pas une validation du dessin.

# Six corps cartoon — proposition 01, en attente de validation

Cette proposition part des fichiers actuels. Elle ne réimporte aucun ZIP et ne
remplace pas les silhouettes actives dans le jeu. La garde-robe, les masques
actuels, la boutique et les modèles d'équipements/looks restent conservés.

## Planche et sources

- `planche-comparative.png` / `.svg` : six corps sur une même planche 2280 × 1210.
- `planche-reperes.png` / `.svg` : même planche avec les points de raccord.
- `body-X`, `body-A`, `body-O`, `body-H`, `body-V`, `body-8` : PNG transparents et
  SVG autonomes, chacun sur le canevas 480 × 1024.
- `contours-et-reperes.json` : contours et repères propres à chaque profil.
- `capture-controle.jpg` : contrôle de la planche dans le navigateur avec Vite.

Les sources natives sont dans `apps/web/src/cartoon/morphology-proposals.ts`,
`MorphologyBody.tsx` et `MorphologyComparison.tsx`. La génération reproductible
se fait avec `npx tsx scripts/export-morphology-proposals.tsx`.

## Identité et dessin

Une seule identité, Iris, issue de l'asset réellement disponible
`public/assets/cartoon-base-v6.png`. Le visage, les mains et les pieds utilisent
exactement la même source, à la même position et à la même échelle sur les six
corps. La tête est chauve ; aucun cheveu ou vêtement du dressing n'est fusionné
avec le corps. Bandeau et culotte sont opaques.

Les torses, bras et jambes sont de nouveaux contours SVG, avec des courbes propres
à chaque morphologie. Aucun étirement global de l'ancien PNG, aucune déformation
du visage ou des mains, aucune réactivation du moteur v4. Le style reste cartoon
avec contours propres et ombrages doux. Les raccords fixes ont été contrôlés sur
les pixels de la source v6 : avant-bras à y520, chevilles à y940.

Les épaules, la poitrine, la taille et les hanches changent selon les profils ;
cou, poignets, genoux, chevilles et sol gardent leurs positions communes.

Différence proposée entre X et 8 : X possède une taille creusée et des hanches
dont la courbe s'élargit progressivement plus bas ; 8 a une poitrine plus pleine,
un bassin plus arrondi et des hanches hautes (repère y470, contre y487 pour X).
Il s'agit d'une convention artistique proposée pour le jeu, à valider.

## Statut et suite autorisée après validation

Ces corps sont des propositions, pas encore des coupes vestimentaires validées.
Le modèle `BodySelection`, la conservation des `pieceId` et les looks ne sont pas
modifiés par cette étape. Le moteur de compatibilité continue de refuser les
coupes non calibrées : aucun sélecteur de six morphologies incomplet n'est ajouté
à la boutique.

Après validation des corps par l'utilisateur : adapter une seule tenue pilote
(haut, bas, chaussures) à chacun des six profils, avec les mêmes identifiants de
pièces, les masques partagés et les passages devant/derrière ; vérifier tous les
raccords et les changements de morphologie. Ne pas décliner toute la garde-robe
avant ce contrôle. L'interface d'enregistrement des looks reste hors de cette étape.

## Vérification

`tests/morphology-proposals.test.ts` vérifie par rendu de pixels l'identité commune
du visage, des mains et des pieds, l'opacité des sous-vêtements, les zones de peau
visibles, les six contours et la différence X/8. Les tests existants restent présents.
Suite complète : 35 tests réussis. Compilation TypeScript/Vite réussie.

Contrôle visuel : `tests/fixtures/fitting.html` avec Vite, bouton « Comparer les six
morphologies proposées », puis « Afficher les repères ». Le contrôle v6 existant
reste accessible via le bouton de retour.
