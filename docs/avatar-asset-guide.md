# Référence artistique des vêtements — Prune fumée

**Règle active pour le lancement.** Utiliser uniquement Iris de face pour
dessiner, ajuster et contrôler les nouveaux vêtements. Les poses main sur la
hanche et mains en cœur décrites plus bas sont conservées à titre d’archive.

Le [visuel de la tenue violette validée](../public/assets/avatar/prune-fumee-v1/source.png)
fixe le niveau de qualité attendu pour les prochaines créations. Observer le gilet
cintré et structuré, la ligne du pantalon, le grain discret du tissu, les plis aux
points de tension et les reflets différenciés du tissu, du cuir et de l’attache dorée.
Ces finitions guident les nouvelles pièces, avec une coupe et des matières propres à chacune.

Comparer chaque pièce au visuel de référence dans la cabine et à la taille d’affichage en jeu.

| Critère | À vérifier avant de présenter une pièce |
| --- | --- |
| Coupe | Ajustement au corps, lignes de construction nettes et tombé cohérent. |
| Matière | Grain à la bonne échelle, ombres propres, reflets subtils et plis qui suivent les volumes. |
| Détail | Coutures fines, ourlets crédibles et fermetures ou accessoires intégrés avec finesse. |
| Modernité | Coupe et finitions cohérentes avec une illustration de mode contemporaine. |
| Élégance | Silhouette structurée et proportions du vêtement harmonieuses sur le mannequin. |
| Lisibilité | Coupe, volumes et détails principaux reconnaissables en cabine et en vignette. |

Reprendre les critères insuffisants avant de présenter la création. Traiter les
PNGs d’inspiration comme des références de coupe, de style et de matière, puis
dessiner une pièce originale adaptée au mannequin existant.

Conserver le corps, ses proportions et le fonctionnement en poses statiques.
Garder les pièces indépendantes dans le dressing, y compris le pantalon et les
chaussures. Recolorer les zones de matière via leurs masques dédiés. Vérifier sur
des teintes claires et foncées que les ombres, les plis, les reflets et le grain
restent lisibles, et que les coutures et détails protégés gardent leur finition.
Pour les prochains imports, prendre Cerise comme référence de recoloration :
la teinte couvre le tissu entier, y compris le fil ton sur ton et les ourlets.
Le relief vient des valeurs du dessin, jamais d’un reste de la couleur de départ.

Avant de valider une pièce, afficher le PNG transparent sur trois fonds unis
(clair, foncé et coloré), à taille de jeu et en zoom sur les bords. Vérifier
l’intérieur des boucles, les mèches fines, la dentelle, les coutures et les
accessoires. Éliminer la contamination du fond dans le RGB des pixels de bord
semi-transparents avant de générer les masques de teinture. Préserver leur alpha
et les détails intentionnels du dessin. Refaire le détourage si un halo blanc,
un reflet vert parasite ou un contour tronqué reste visible. Conserver une
planche de contrôle sur les trois fonds avec les sources de la pièce.
Isoler les motifs, les pièces métalliques et les matières réellement distinctes.
L’atelier démarre avec une matière uniforme et mesure ses valeurs dans le masque ;
les protections et la seconde matière sont à vérifier sur l’image, dans les trois poses.
Les [notes techniques de Prune fumée](prune-fumee-v1/README.md) décrivent l’intégration de la tenue.

## Historique du dressing

> [Éclipse rose de face](punk-front-v2/README.md) documente le passage au mannequin frontal dans le jeu et dans la cabine, avec le bouton Pose masqué.

> Capsule ajoutée : [Éclipse rose](punk-capsule-v1/README.md), neuf pièces vectorielles indépendantes, col et manches courtes ajustés aux trois poses, cravate séparée du collier, résille sous la jupe et les bottes. La photo reste une inspiration.

> Nouveau pilote demandé : [coupe et matière textile 2D](textile-pilot-v1/README.md). Pull Charbon et short Cendre créés à partir de patrons vectoriels et de matières procédurales, la photo servant uniquement d’inspiration. Les anciens articles sont conservés.

> Reprise limitée en cours : [pull bordeaux, détourage par contours](burgundy-cut-v2/README.md). Seul ce pull utilise les nouveaux masques sans filtrage de couleur. Attendre sa validation visuelle avant de reprendre les autres pièces.

> Méthode active : [vêtements redessinés sur le mannequin](redrawn-clothes-v1/README.md). Les 27 pièces textiles et chaussures ont de nouveaux dessins natifs ; les six coupes à manches ont des versions dessinées dans les trois poses. Les mesures corporelles restent des repères de contrôle. Le pipeline de déformation hiver v2 est archivé et ne doit pas remplacer ces dessins.

> État actuel : [Dressing hiver et poses redessinées](winter-dressing-v1/README.md). 43 pièces, 11 emplacements indépendants, sacs latéraux ou main fermée ; les paragraphes suivants conservent aussi l’historique.

> Sélection des poses fixes et découpe complète des anciennes épaules : voir [static-poses-v1/README.md](static-poses-v1/README.md). Le bouton Pose conserve un choix par personnage ; la cabine reste de face.

> Pose active à gauche : mains en cœur, fixe et sans respiration. La cabine reste de face. Voir [heart-hands-v3/README.md](heart-hands-v3/README.md) pour le geste actuel inspiré de la dernière référence. Les nouvelles coupes à manches doivent fournir des manches calibrées dans cette pose ; ne pas réutiliser directement les bras frontaux.

> Méthode demandée pour les prochaines tenues : redessiner les vêtements directement dans la pose du mannequin canonique, en conservant leurs volumes, plis et détails, puis isoler les pièces et les ajouter à la boutique. Une référence de tenue ne remplace ni le personnage, ni ses mains, ni sa pose. Ne pas revenir au simple redimensionnement d’une image détourée. Conserver le dessin sur mannequin comme source de contrôle et vérifier les calques isolés sur le corps réellement affiché.

> Lire aussi [body-fit-reference.md](body-fit-reference.md) : les prochains vêtements doivent être adaptés aux dimensions réelles du corps d’Iris, avec leurs repères communs. Le corps ne change pas. Tenue corrigée : [burgundy-outfit-v2/README.md](burgundy-outfit-v2/README.md).

> Atelier d’import historique pour les hauts frontaux à base unique : voir [atelier/README.md](atelier/README.md). Sources et brouillons conservés. Le détourage local reste conservé ; les nouveaux ajouts passent directement par les assets calibrés de la boutique.

> État actif : mannequin fourni par l’utilisateur, mains conservées à l’identique dans `public/assets/avatar/fashion-v2/body-user.png`. Tenue séparée cardigan-caraco / jean / bottines. Voir [fashion-doll-v2/README.md](fashion-doll-v2/README.md). Les sections suivantes conservent aussi les étapes historiques.

> État actif : dressing à base unique (X approuvé), avec emplacements indépendants top/bottom/shoes. Le choix des six morphologies est suspendu. Voir `avatar-layers.md`. Les sections suivantes décrivent aussi le travail historique conservé.

> Poses actuelles : face, main sur la hanche, mains en cœur. Les 13 pièces du
> dressing possèdent un profil commun de compatibilité, dans
> `apps/web/src/avatar/pose-wardrobe.ts`. Le dessin source approuvé mesure
> 887 × 1774 ; son rendu logique reste 480 × 1024 par transformation uniforme.
> Voir `pose-wardrobe-v1/README.md` pour la calibration obligatoire des nouveaux
> imports et la planche de contrôle des trois poses. Les développements historiques
> sur les atlas et les six morphologies ci-dessous ne doivent pas être réactivés.

# Guide des avatars et du dressing — v6 cartoon

La référence artistique active est la poupée 2D fournie par l’utilisateur, avec une pose de face et de grands yeux. Lire `cartoon-v6.md` avant toute création. Cette direction remplace les anciennes poses en trois quarts et les rendus v4/v5.

Le corps canonique est chauve et porte des sous-vêtements opaques. Les vêtements ne modifient ni sa pose, ni ses proportions. Les cheveux, le haut, le bas, les chaussures et les accessoires restent indépendants.

## Repère et sources

Le repère logique d’un personnage mesure 480 × 1024. L’atlas contient quatre cellules, dans l’ordre Iris, Milo, June, Noa. Les deux PNG actifs sont `cartoon-base-v6.png` et `cartoon-hair-v6.png`. Ils mesurent tous deux 1717 × 916 pixels réels, mais sont montés ensemble sur le même atlas logique 1920 × 1024. Aucune pièce n’est recentrée automatiquement après détourage.

Les repères sont dans `apps/web/src/cartoon/model.ts`. Les silhouettes féminine et masculine possèdent leurs propres épaules, poignets, taille et chevilles. Les couleurs et contours de vêtements sont dans `Wardrobe.tsx` ; la composition est dans `CartoonDoll.tsx`. `FittingAvatar`, `Portrait` et `Avatar` utilisent tous cette même poupée.

## Imports et raccords

Le portrait de gauche conserve la pose main sur la hanche indépendamment du haut, du bas et de la ceinture. La cabine reste de face. Voir `docs/hip-pose-v3.md` : chaque nouvelle coupe à manches doit fournir une manche posée calibrée et son masque de matière ; les hauts sans manches utilisent le bras nu commun et la main approuvée. Le raccord d'épaule et l'effacement de l'ancien bras doivent être contrôlés, sans faire revenir le portrait de face.

- Dessiner chaque nouvel élément sur la base correspondante en conservant le canevas entier.
- Haut : aligner épaules, encolure, poitrine, taille et poignets ; couvrir les dessous sans cacher des défauts par une réparation de peau.
- Bas : suivre la taille et les hanches avant de définir l’évasement et l’ourlet.
- Chaussures : suivre les genoux, chevilles et pieds ; respecter le sol et dessiner un revers frontal, sans vide de mannequin.
- Cheveux : séparer arrière et devant, vérifier crâne et tempes, préserver les deux yeux. La base ne contient aucun cheveu.
- Accessoires : prévoir anses derrière les mains et poche devant. Bijoux, lunettes et sac se combinent sans remplacer les vêtements.
- Garder le style cartoon : contours propres, matières dessinées, ombres douces et couleurs lumineuses. Ne pas réutiliser des textures semi-réalistes.
- Le catalogue affiche le même élément isolé que celui porté, sans morceau du corps ou d’une autre pièce.

## Vérification obligatoire

Pour recolorer une pièce, calibrer des masques de matière dans les coordonnées du PNG source et protéger explicitement ses coutures, contours, imprimés et éléments métalliques. Utiliser le registre `avatar/material-map.ts` et le traitement de `scripts/prepare-material-masks.ts` ; un filtre global fondé sur la luminosité ne suffit pas. Contrôler aussi le blanc, le noir, les zones secondaires et le retour à la couleur d'origine. Voir `docs/material-colors-v1/README.md`.

Utiliser `tests/fixtures/fitting.html` avec Vite, contrôler chaque variante compatible et conserver une capture. Vérifier également la cabine à 390 × 844 via `tests/fixtures/mobile.html` : sélection, retrait, comparaison, historique, perruques et combinaison des accessoires. Exécuter `npm run build`. Les sources sont conservées et les nouveaux assets versionnés.

Les guides individuels sont exportables avec `scripts/export-cartoon-guides.tsx` ; la planche base/coiffure/tenue est exportable avec `scripts/export-cartoon-board.tsx`. Les instructions et prompts historiques v4/v5 ne sont plus des consignes de rendu actif.

## Découpe du corps et profondeur

`geometry.ts` porte les contours communs au dessin et à `BodyCoverage.tsx`. Un haut retire sa zone du torse (et les manches couvertes), une jupe retire seulement la région sous son ourlet, un pantalon retire les deux jambes couvertes. Les chaussures utilisent leur contour et deux zones de pieds calibrées aux chevilles et au sol. Aucune découpe horizontale ne traverse tout le canevas. La peau visible est toujours issue de la base, jamais repeinte.

Le masque est appliqué au corps ET au passage de restauration des mains : les manches ne peuvent pas être recouvertes par de la peau réintroduite ensuite. Les chaussures ont un passage arrière pour les revers puis un passage avant ; cheveux arrière/avant sont complémentaires ; les anses passent derrière les doigts, la poche du sac devant. Les vignettes regroupent les mêmes passages.

Toute nouvelle coupe doit fournir sa silhouette de couverture dans le même repère, avec les ouvertures réellement découvertes. Une matière transparente ne doit pas remplacer cette couverture. Les tests `tests/body-coverage.test.ts` rendent la peau seule, sans vêtement visible, pour vérifier les régions effacées et conservées.

## Identité, profil corporel et pièces

Le modèle de données est dans `cartoon/appearance.ts`, décrit dans `appearance-model.md`. Le catalogue fournit un `pieceId` stable en plus des anciens alias. Les profils v6 actuels restent des profils de compatibilité ; les six corps X/A/O/H/V/8 sont maintenant disponibles pour la tenue pilote d’Iris. Ne jamais remplacer silencieusement une pièce faute de coupe, ni confondre son identité avec son indice de variante.

## Tenue pilote sur les six corps validés

Les nouveaux corps sont les PNG approuvés de public/assets/morphology-v6/. Leurs contours de vêtements et repères sont dans cartoon/morphology-fits.ts, en pixels source 887 × 1774. MorphologyDoll applique une seule transformation uniforme à toutes les couches pour obtenir le repère logique 480 × 1024 ; aucun visage ni membre n’est étiré. Ne pas leur appliquer les repères du vieil atlas à quatre cellules.

CartoonDoll, Wardrobe, BodyCoverage et FittingAvatar orientent explicitement les trois pièces calibrées vers le rendu morphologique. Le caraco, la jupe et les bottes gardent leurs pieceId. Les contours du vêtement servent aussi au masque corporel ; le catalogue utilise les mêmes dessins. Toute autre coupe reste explicitement non calibrée. Les tests contrôlent les pixels de sous-vêtements et de pieds réellement effacés, mais ne remplacent pas l’inspection visuelle.

Voir proposals/pilot-v6/README.md et proposals/pilot-v6/calibrage.json. Le rendu historique des quatre personnages et la boutique principale sont conservés. Le pilote est accessible avec Iris depuis la boutique et garde un essai temporaire distinct.
