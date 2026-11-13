# Tenue pilote sur les six morphologies validees

Les six illustrations X, A, O, H, V et 8 ont ete validees par l'utilisateur.
Elles sont copiees sans modification dans `public/assets/morphology-v6/`.
Le caraco, la jupe denim et les bottes ivoire ont chacun six coupes adaptees.
Cette tenue est proposee a la revue visuelle ; ses tests techniques ne remplacent
pas la validation artistique de l'utilisateur.

## Essayer dans le jeu

Avec Iris, ouvrir Boutique puis « Tenue pilote · 6 morphologies ».
Les six boutons de morphologie changent seulement le corps. Les cartes permettent
de porter ou retirer independamment chaque piece. « Voir le corps » compare avec
la base en sous-vetements sans modifier les choix. Le retour conserve l'essayage
et l'historique de la boutique principale. Echap ferme le pilote et restitue le focus.

Le pilote est un essai temporaire separe, initialement equipe des trois pieces
calibrees. Sa fermeture termine cet essai. Les autres vetements, coiffures et
accessoires restent dans la boutique existante. Les portraits et salles gardent
encore leur tenue fixe. L'interface d'enregistrement des looks reste une etape separee.

## Identifiants conserves

- `camisole.ivory` : Caraco lumiere.
- `pleated-skirt.denim` : Denim plisse.
- `lace-boots.ivory` : Bottes givrees.

Le pilote utilise `AvatarAppearance`, `changeMorphology` et les memes `pieceId`
que le catalogue. Une piece retiree reste retiree lors du changement de corps.
Les modeles et fonctions de looks existants sont conserves et testes. Les pieces
non calibrees sont refusees explicitement sans suppression ni substitution.

## Rendu et calibration

- `morphology-fits.ts` : mesures individuelles, contours de chaque coupe,
  points de raccord et semelles, en pixels source 887 x 1774.
- `geometry.ts` reexporte cette geometrie pour le pipeline de vetements.
- `PilotGarment.tsx` dessine les pieces ; `Wardrobe` oriente les trois pieces
  pilotes vers ce dessin. Le meme SVG est utilise pour la vignette et la cabine.
- `BodyCoverage` efface le corps et les sous-vetements sous les contours des
  vetements. Les pieds d'origine sont masques integralement sous les bottes.
- `MorphologyDoll`, appele par `CartoonDoll`, compose revers arriere des bottes,
  corps decoupe puis faces avant de la jupe, des bottes et du haut. Un passage
  avant restitue les avant-bras uniquement dans leur intersection avec la jupe,
  depuis les pixels du corps approuve. La ceinture reste decoupee dans la jupe.
- `FittingAvatar` garde le repere logique 480 x 1024. Toutes les couches natives
  subissent UNE meme mise a l'echelle uniforme : 1024/1774, avec centrage horizontal.
  Il n'y a ni deformation globale de l'avatar, ni modification du visage ou des mains.

Les trois pieces couvrent toutes les zones des sous-vetements opaques d'origine.
Le corps conserve ses ombrages, ses mains et les jambes decouvertes. Les six coupes
sont mesurees sur les nouveaux PNG approuves, pas sur les corps vectoriels v1 refuses.
`calibrage.json` est exporte depuis les memes definitions que le rendu actif.

## Livrables et preuves

- `tenue-pilote-six-morphologies.png` / `.svg` : planche du rendu reel.
- `controle-masques.png` / `.svg` : corps decoupe sans les vetements visibles.
- `capture-six-coupes.jpg`, `capture-masques.jpg` : controle avec Vite.
- `mobile-X.jpg`, `mobile-A.jpg`, `mobile-O.jpg`, `mobile-H.jpg`, `mobile-V.jpg`,
  `mobile-8.jpg`, `mobile-corps.jpg` : controle de la cabine a 390 x 844.
- `boutique-tenue-pilote.jpg` : capture finale dans le jeu sur le port 3001.
- `body-sources.json` : fichiers approuves et empreintes des copies utilisees.

Reproduire les exports : `npx tsx scripts/export-morphology-pilot.tsx`.
Controle interactif : `tests/fixtures/fitting.html` avec Vite, bouton
« Controler la tenue pilote sur les six corps ».

## Verification technique et visuelle

Suite complete : 43 tests reussis. Compilation TypeScript/Vite reussie.
Les 8 tests du pilote couvrent aussi le passage avant des bras sur O et 8,
avec controle des pixels de peau et absence de sous-vetements reintroduits.
Ils verifient la conservation des identifiants et looks, les combinaisons partielles,
l'effacement reel des pixels des sous-vetements et pieds, et la conservation du
visage, des mains et des genoux visibles. Aucun ancien test n'a ete supprime.

Inspection visuelle des six coupes, des masques seuls et de chaque morphologie
sur mobile. Controle reel d'un retrait de haut et de bottes suivi d'un changement
de morphologie ; les deux pieces sont restees retirees. Le retour a la boutique
a conserve le caraco rose et son historique deja essayes.
