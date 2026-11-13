# Mannequin de mode et tenue dans la boutique

## Base retenue par l’utilisateur

La source active est le PNG envoyé avec les mains redessinées :
`codex-clipboard-f85faa50-3530-4981-ab9a-06c980afa776.png`.
Il est copié SANS MODIFICATION dans :

- `public/assets/avatar/fashion-v2/body-user.png` : base utilisée par le jeu.
- `user-body-source.png` : copie témoin pour la conservation et les tests.

Les fichiers sont identiques octet pour octet. Le SHA-256 est
`8e3b61c5a45e5ddc9ee528530ced84eea3bd883a1a2e05914b81fd46e3b269e4`.
Les mains sont celles dessinées par l’utilisateur, sans régénération, remplacement,
retouche de doigts, symétrisation ou nouveau détourage. Le visage, le corps et les
sous-vêtements opaques sont également conservés. Canevas natif : 887 × 1774.

Les essais `body.png`, `body-r2.png`, `hands.png`, `body-five-fingers.svg` et les
planches d’essais de mains ne sont PAS utilisés par le jeu. Ils restent comme sources
historiques rejetées/supplantées. Ne pas relancer `prepare-fashion-body.cjs` pour
remplacer la source active : ce script correspond à un essai abandonné.

## Tenue conservée

Trois pièces séparées, préparées avant la dernière correction des mains :

| Identifiant | Pièce | Source active |
| --- | --- | --- |
| `fashion.cardigan-lilac` | Cardigan lilas sur caraco ivoire, un seul emplacement haut | `public/assets/avatar/fashion-v2/top.png` |
| `fashion.jeans-indigo` | Jean indigo évasé | `public/assets/avatar/fashion-v2/jeans.png` |
| `fashion.boots-ivory` | Bottines ivoire à plateforme | `public/assets/avatar/fashion-v2/boots.png` |

Les dessins des vêtements n’ont pas été régénérés après l’envoi des mains de
l’utilisateur. Ils sont issus de l’outil intégré imagegen à partir de la planche
`docs/proposals/fashion-doll-v1/concept.png` et du corps de référence avant sa
correction des mains. Les prompts exacts sont dans `prompt-top.txt`,
`prompt-jeans.txt`, `prompt-boots.txt`. Sources et empreintes : `provenance.json`.
La coiffure de la planche n’est pas incluse dans cet essai d’habillage.

## Intégration

- `avatar/base.ts` : `FASHION_BASE` référence le fichier fourni par l’utilisateur.
  L’ancien `AVATAR_BASE` reste le repère de compatibilité des essais archivés.
  Aucun sélecteur de morphologie n’est réintroduit.
- `avatar/catalog.ts` : les trois pièces actives, leurs crops et leur placement.
  Les anciens identifiants restent résolus dans les catalogues d’archives.
  Les fichiers de vêtements restent intacts : seuls les repères de placement
  servent à raccorder le vêtement au mannequin.
- `avatar/model.ts` : tenue initiale composée de ces trois identifiants. Les
  emplacements se retirent indépendamment et ne changent pas le corps.
- `avatar/LayeredDoll.tsx` : choix explicite de la base, masque du corps et ordre
  des passes. Les bottines passent sous les ourlets du jean. La peau des jambes
  et des pieds couverts est effacée, sans pied de mannequin dans le vêtement.
- Le cardigan masque aussi les silhouettes anatomiques des bras sous ses manches
  fermées, jusqu’aux poignets. Les mains restent découvertes et proviennent toujours
  du fichier utilisateur. Ce masque disparaît avec le haut.
- `cartoon/CartoonDoll.tsx` et `shop/FittingAvatar.tsx` transmettent la base active
  au compositeur ; ils gardent leurs adaptateurs historiques.
- `shop/LayeredDressing.tsx` utilise explicitement cette base, même quand toutes
  les pièces sont retirées ou lorsque « Voir le corps » est activé.
- `Avatar.tsx` emploie la même base et la tenue initiale pour Iris dans la colonne,
  les portraits et la salle. L’essayage temporaire de boutique ne remplace pas
  une tenue enregistrée. Les autres personnages restent compatibles avec l’ancien
  rendu. L’onglet Collection reste vide comme demandé.

Le rendu est encore une pose fixe. Cette intégration ne livre pas de squelette
d’animation ni de manches articulées ; la préparation de ces parties et un essai
de salut resteront nécessaires pour les animations envisagées.

## Vérifications et captures

52 tests réussis et compilation TypeScript/Vite réussie.
Les tests existants sont conservés. Les tests de l’ancien import utilisent
explicitement ses constantes archivées. `tests/fashion-doll-v2.test.ts` vérifie
la conservation du fichier utilisateur, les retraits indépendants, l’effacement
des sous-vêtements, bras/jambes/pieds couverts, la conservation des mains et la
superposition du jean sur le haut des bottines.

Contrôle visuel : cabine du jeu, `tests/fixtures/fitting.html`, corps sans tenue,
retrait de haut et de chaussures avec jean conservé, et mobile à 390 × 844.
Captures : `boutique-final.jpg`, `body-user-in-game.jpg`, `jeans-only.jpg`,
`masks.jpg`, `mobile.jpg`.

La compilation et les tests ne constituent pas une validation artistique.
Planche du composant réel : `fitting-board.png`, reproductible avec
`npx tsx scripts/export-fashion-v2.tsx`.
