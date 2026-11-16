# Luma City — Capsule maille

[Planche de validation](planche-validation.png)

Dix propositions de face sur Iris. Les vues individuelles mesurent 887 × 1774. Le visage, les mains et le bas de la silhouette reprennent les calques existants à leurs coordonnées natives. Le jean et les bottines sont des pièces de présentation communes. La peau visible au voisinage de certains cols et poignets garde les nuances peintes par ImageGen.

Les recherches dans les épingles Pinterest étaient inaccessibles. Les références visuelles utilisées sont indiquées par modèle. [Prune fumée](../../public/assets/avatar/prune-fumee-v1/source.png) a servi de référence pour la lumière, les plis et la finesse des finitions. Le [pull Charbon](../textile-pilot-v1/browser-final.png), le [pull bordeaux](../redrawn-clothes-v1/burgundy-poses.png), le [cardigan lilas](../redrawn-clothes-v1/lilac-poses.png) et la [capsule premium](../capsule-premium-v1/planche.png) ont servi à comparer les coupes existantes.

| Vue individuelle | Coupe et matière | Comparaison avec le catalogue | Inspiration visuelle | Recoloration envisagée |
| --- | --- | --- | --- | --- |
| [01 Nuage](vues/01-nuage.png) | Grosse laine écrue, torsades en corde et côtes épaisses. Coupe cocon, épaule tombante et bas qui se pose sur la ceinture. | Les mailles existantes sont plus près du corps. Nuage construit son volume par des emmanchures basses et l’ampleur des manches. | [Toteme](https://www.reversible.com/ca/shopping/women/item/toteme-chunky-cable-knit-cream-673520144) | Laine et côtes ton sur ton. |
| [02 Alaska](vues/02-alaska.png) | Mérinos vert pin, col roulé souple à double épaisseur et côtes fines qui convergent à la taille. | Le col roulé est plus haut que celui du pull Charbon et accompagne une silhouette cintrée. | [Khaite, Annette](https://www.net-a-porter.com/en-us/shop/product/khaite/clothing/turtleneck/annette-merino-wool-turtleneck-sweater/46376663163076318) | Teinte du mérinos, avec conservation du relief des côtes. |
| [03 Mila](vues/03-mila.png) | Mohair pervenche, petit col en V, buste court et souple, manches généreuses. | Par rapport à Charbon, le V et les épaules arrondies changent le dessin de la ligne courte. Les fibres sont visibles aux bords. | [Ganni, Brushed Mohair](https://www.ganni.com/us/sweater-in-brushed-mohair-K2622.html) | Mohair et bordures ton sur ton, fibres fines à préserver. |
| [04 Épaules nues](vues/04-epaules-nues.png) | Maille sauge, deux bandes croisées sur la poitrine et fines côtes verticales à la taille. | Le croisement sculpté distingue la coupe du revers horizontal du Pull bordeaux et de Rosalie. | [Reformation, Florie](https://www.thereformation.com/products/florie-twist-front-sweater/1316579BLK.html) | Maille principale et relief des bandes croisées. |
| [05 Éclipse](vues/05-eclipse.png) | Maille gris mauve, col dissymétrique, côtes en chevron et ourlet en pointe. | À la différence de Velvet, l’épaule dégagée est encadrée par une manche rattachée. La symétrie des côtes change à l’encolure. | [Helmut Lang, Asymmetric Long Sleeve](https://www.helmutlang.com/asymmetric-long-sleeve-top/purple/883389898327.html) | Maille et coutures ton sur ton. |
| [06 Mocha](vues/06-mocha.png) | Cachemire cacao à col en V, pointelle au haut du buste et cinq boutons nacrés cerclés. | La patte boutonnée et le bord picot distinguent Mocha du Cardigan lilas zippé sur caraco. | [Sézane, Gaspard Crop](https://www.sezane.com/us-en/product/gaspard-crop-cardigan/ecru) | Maille principale, boutons à protéger. |
| [07 Tokyo](vues/07-tokyo.png) | Double maille encre, empiècement rouille, épaule descendue et fentes basses. | Tokyo est la coupe la plus longue. La double maille tombe droit sur le jean tandis que les grosses côtes de Nuage resserrent son ourlet. | [Todayful, Pattern Hand Knit](https://wear.jp/item/50325192/) | Encre et rouille séparées, surpiqûres protégées si contrastantes. |
| [08 Velvet côtelé](vues/08-velvet-cotele.png) | Maille stretch cerise noire, col montant, ouverture en amande et petite barrette. | Le nom devient Velvet côtelé. Le Velvet du catalogue est en velours à une manche, tandis que cette proposition a deux manches, un col montant et des plis centrés sous le col. | [Helmut Lang, Draped Rib Knitted Top](https://clothbase.com/items/2a76dc80_helmut-lang-draped-rib-knitted-top_helmut-lang) | Maille principale, barrette à protéger. |
| [09 Sienna](vues/09-sienna.png) | Maille terre cuite, col bateau, trois torsades fines sur un buste cintré et poignets longs. | Les manches gonflent au niveau des coudes et contrastent avec la taille ajustée. Le volume de Nuage se répartit sur tout le vêtement. | [Day Closet, manches ballon](https://wear.jp/item/66621793/) | Maille principale et torsades ton sur ton. |
| [10 Astral](vues/10-astral.png) | Maille stretch bleu pétrole, ouverture sur les côtes basses et jonction argentée. | L’ouverture est à la taille et les deux épaules sont couvertes. La construction diffère de la découpe d’épaule de Nova. | [Coperni, Ribbed Knit Cut-outs](https://www.luisaviaroma.com/en/coperni/women/clothing/knitwear/ribbed-knit-top-with-cut-outs-156814.html) | Maille principale, jonction métallique à protéger. |

Les [prompts](prompts.txt) documentent les dix créations et les retouches. Les [essais ImageGen](essais) et le [mannequin de présentation](iris-jean-reference.png) sont conservés. Les vues retenues de Mocha, Velvet côtelé et Sienna reprennent les retouches du raccord au jean.

## Essayage et couleurs en local

Les dix pulls sont essayables dans **Boutique → Hauts**, via la recherche par nom. Le prix de catalogue local est de 900 pièces. Il suffit d’essayer une pièce pour ouvrir sa palette. Les boutons de Mocha et les barrettes de Velvet côtelé et d’Astral gardent leur couleur. Tokyo propose un second réglage pour son empiècement rouille.

`npm run assets:fit -- --iris-knits` extrait les calques à leurs coordonnées natives de 887 × 1774. Chaque coupe est inscrite sur le patron frontal d’Iris, avec un masque de matière mesuré et un masque de couverture. Les petits raccords de manches suivent les bords mesurés des bras, et l’alpha conserve les fibres fines de Mila.

- [Détourage sur blanc, noir et vert](controle-detourage.png)
- [Essayage avec le jean](controle-face.png) et [cabine à 390 pixels](controle-mobile.png)
- [Teintes claires avec une jupe](controle-teintes-claires.png) et [teintes foncées avec un short](controle-teintes-foncees.png)
- [Palette de Tokyo dans la boutique](controle-boutique-palette.png)

## Retouches après essayage

Tokyo a un ourlet continu avec deux surpiqûres protégées. Les nouveaux pixels proviennent du [dessin de l’ourlet](essais/07-tokyo-ourlet-ferme.png). Le bord du col d’Éclipse suit la découpe asymétrique sans pixels de peau dans le calque du pull. Au milieu dans **Calques**, Mila garde le volume de ses manches et le bas de Nuage suit la taille du pantalon.

- [Vue de face](controle-retouches-face.png) et [pulls rentrés dans le jean](controle-retouches-calques.png)
- [Pantalon Rocade](controle-retouches-rocade.png) et [cabine à 390 pixels](controle-retouches-mobile.png)
- [Mila devant le jean Dalle](controle-mila-devant.png) et [au milieu](controle-mila-milieu.png) après reprise du détourage des deux manches.
