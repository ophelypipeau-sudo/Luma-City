# Capsule pantalons et leggings d’Iris

[Planche de validation](planche.png) · [Chrome et Motion après retouche](retouches.png) · [Illustrations individuelles](vues) · [Prompts ImageGen](prompts.txt)

[Contrôle du détourage et des couleurs](controle-couleurs.png) · [Essayages sur Iris](controle-essayages.png)

[Raccords ajustés sur Iris avec Cerise et Piste](controle-raccords.png). Les coutures de côté de Sculpt, Flow, Chrome et Veil suivent les hanches du corps frontal. Le détourage de Flow préserve les deux fentes des ourlets et élimine les résidus de contour issus des escarpins de référence.

Quatre leggings et six pantalons originaux, illustrés sur le mannequin frontal approuvé. Le [visuel Prune fumée](../../public/assets/avatar/prune-fumee-v1/source.png) sert de référence pour les matières, les contrastes et la finesse des finitions. Les [sources ImageGen](sources) et le [visuel d’essayage](iris-reference.png) sont conservés. Les dix modèles validés sont essayables dans **Boutique → Pantalons** en local, à 900 pièces chacun.

## Coupes et couleurs

| Modèle | Coupe et différence avec le catalogue | Zones de couleur |
| --- | --- | --- |
| [01 Sculpt](vues/01-sculpt.png) | Ceinture haute et large, coutures ergonomiques courbes et micro-maille taupe prune. La construction tranche avec le Studio à bords simples. | Une zone de maille. Garder les coutures dans le même ton et conserver le grain. |
| [02 Flow](vues/02-flow.png) | Jersey stretch bleu minéral et évasement souple sous le genou. Le tombé léger distingue Flow du jean bootcut Denim Nova et de l’ajusté Fuseau. | Une zone de jersey, avec conservation du relief aux genoux et des plis près de l’ourlet. |
| [03 Shadow](vues/03-shadow.png) | Effet cuir mûre charbon à reflets étroits et coutures fines. Le fini peu brillant et la ceinture continue le distinguent d’un pantalon habillé. | Une zone pour le cuir souple, en conservant les reflets et la valeur des coutures. |
| [04 Motion](vues/04-motion.png) | Maille pétrole et panneaux cobalt asymétriques. Les deux barrettes argentées ont été retirées. | Base pétrole et empiècements cobalt séparés. |
| [05 District](vues/05-district.png) | Taille basse, plis creux à la hanche, larges poches angulaires et denim indigo ardoise. Les jambes larges et droites se distinguent du volume resserré en bas de Dalle. | Denim principal, délavage conservé. Surpiqûres contrastantes et ferrures protégées. |
| [06 Muse](vues/06-muse.png) | Tissu tailleur gris taupe, rayure fine et revers de taille café. La ceinture rabattue et les pinces le distinguent de Ligne. | Tissu et revers de ceinture séparables. Attache métallique protégée. |
| [07 Chrome](vues/07-chrome.png) | Crêpe satiné vert émeraude profond, ceinture fine, jambes droites et fluides, ourlets fendus. | Crêpe satiné dans une seule teinte, avec ses reflets doux. |
| [08 Rebel](vues/08-rebel.png) | Sergé prune ardoise, poches et fermetures dissemblables, sangles courtes rapportées sur une jambe. Les ourlets ouverts le distinguent de Rocade. | Une zone de sergé. Glissières et attaches protégées. |
| [09 Denim Nova](vues/09-denim-nova.png) | Hanches ajustées, évasement léger sous le genou et poches courbes surpiquées. La coupe est plus près du corps que District. | Denim, contraste de délavage maintenu. Surpiqûres, clous et rivets protégés. |
| [10 Veil](vues/10-veil.png) | Crêpe aubergine fluide, taille haute et plis asymétriques qui se fondent dans une jambe. | Une teinte de crêpe partagée par les jambes et le drapé pour conserver la continuité. |

## Références

Les recherches d’épingles individuelles ont donné peu de résultats exploitables. Les [tendances mode de Pinterest](https://newsroom.pinterest.com/news/summer-trend-report-2026/?filters=trends) ont guidé la maille technique de Motion, le volume du denim District et les poches de Rebel. Pour la construction, les repères complémentaires étaient les [leggings techniques et flare d’ALO](https://www.aloyoga.com/collections/7-8-leggings?page=1&view=fallback), le [cuir stretch de Spanx](https://spanx.com/products/spanxshape-faux-leather-leggings), le [volume taille basse d’AGOLDE](https://agolde.com/products/low-slung-baggy-recess) et le [bootcut de Diesel](https://diesel.com/en-us/woman/denimguide/bootcut/1969-debbey/).

## Préparation de la planche

Les vues reprennent le haut, les mains et les pointes des escarpins de la même référence. Chaque modèle est présenté de face dans le cadrage 887 × 1774. Pour comparer les matières à l’échelle de la planche, le détail de chaque carte conserve les proportions du dessin. Leur dossier reste distinct des articles du catalogue.

Les PNG de la boutique sont des calques transparents indépendants. Le nuancier propose une deuxième teinte pour les panneaux de Motion et le revers de Muse. La planche de contrôle montre chaque calque sur trois fonds, puis dans deux teintes. Avec Alta, les tiges passent devant Sculpt, Shadow et Motion. Pour les coupes plus larges, les ourlets passent devant les tiges. Rentrer les coupes larges dans les bottes demanderait un masque d’occultation adapté à leur volume.

`npx tsx docs/capsule-pantalons-iris-v4/vues.ts` produit les vues. `docs/capsule-pantalons-iris-v4/planche.ps1` assemble la planche.

`npm run assets:fit -- --iris-pants` exporte les calques et les masques. `npx tsx docs/capsule-pantalons-iris-v4/controles.ts` régénère les planches de contrôle. Les essayages sont aussi disponibles dans la page Vite `tests/fixtures/fitting.html?pantalons=baskets`, avec les variantes `escarpins`, `bottines`, `bottes` et `plateformes`.
