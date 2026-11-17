# Luma City · Capsule de coiffures premium

[Planche des dix propositions](planche.png)

| Coiffure | Coupe | Vue individuelle |
| --- | --- | --- |
| Ambre | Dégradé butterfly ambré, frange rideau et pointes étagées sur la poitrine. | [Ambre](vues/01-ambre.png) |
| Sienna | Lisse brun foncé jusqu’à la taille, frange droite effilée. | [Sienna](vues/02-sienna.png) |
| Zahra | Boucles ressort châtain foncé de plusieurs diamètres, jusqu’à la poitrine. | [Zahra](vues/03-zahra.png) |
| Velvet | Queue basse lisse, raie centrale et attache gainée de cheveux. | [Velvet](vues/04-velvet.png) |
| Nova | Deux couettes hautes en larges vagues, nuances magenta et attaches argentées. | [Nova](vues/05-nova.png) |
| Éden | Ondulations longues et tresses fines mêlées aux longueurs. | [Éden](vues/06-eden.png) |
| Raven | Wolf cut bleu-noir, sommet relevé et mèches effilées. | [Raven](vues/07-raven.png) |
| Opaline | Chignon bas décalé, raie latérale et mèches ondulées. | [Opaline](vues/08-opaline.png) |
| Ruby | Brushing grenat, raie profonde et larges vagues sur une épaule. | [Ruby](vues/09-ruby.png) |
| Luna | Mi-long beige brun, pointes texturées et deux mini-tresses frontales. | [Luna](vues/10-luna.png) |

Les portraits opaques servent à la validation artistique. Ils réutilisent les traits centraux du visage du mannequin officiel et reprennent le cadrage, le fond prune et le gilet de la planche fournie. Les zones autour du visage et les parties visibles du gilet proviennent du rendu ImageGen et présentent de légères variations.

Les [sources ImageGen](sources) et les [prompts](prompts.json) sont conservés. `npx tsx docs/capsule-coiffures-premium-iris/planche.ts` reconstruit les vues et la planche.

Les dégradés aérés, les chignons souples et les microtresses puisent dans ces références. [Pinterest Beauty Trend Report](https://newsroom.pinterest.com/en-ca/news/beauty-trend-report-2026/) · [Pinterest Wedding Trends Report](https://newsroom.pinterest.com/en-gb/news/wedding-trend-report-2026/?change_language=true) · [Microtresses et Y2K sur Pinterest](https://newsroom.pinterest.com/news/summer-trends-report-2024/?filters=creators)

## Intégration locale

Les dix coiffures sont disponibles sous **Boutique → Cheveux**, à 850 pièces chacune. Chaque coiffure est portée dans l’emplacement `hair` d’Iris de face. Les longueurs se dessinent par défaut devant le haut.

Le PNG graphique unique est inscrit dans le repère natif de 887 × 1774 du mannequin, avec un décalage vertical de −90 px qui réserve la place des volumes au sommet. Le masque de teinture suit ses pixels visibles. Les deux attaches de Nova restent argentées dans les variantes de couleur.

`npx tsx scripts/prepare-iris-premium-hair.ts` recalcule les PNG et les masques à partir des portraits approuvés et des [sources des retouches](reprises/sources). Le script vérifie l’empreinte du corps avant d’appliquer le placement frontal.

### Retouches en cabine

Ambre et Éden ont des mèches continues qui passent devant le coin des yeux. Sienna gagne du volume de chaque côté du cou. La queue de Velvet est plus fournie et revient vers la poitrine. Raven porte une frange latérale plus souple. La mèche de Ruby passe devant l’œil à droite et Luna conserve ses petites tresses avec un contour nettoyé.

Nova propose deux réglages indépendants dans la palette. **Cheveux** recolore la base brune et **Mèches roses** recolore les accents. Les attaches argentées sont protégées dans les deux zones.

- [Détourages après retouche sur trois fonds](controle-retouches-fonds.png)
- [Retouches avec le haut Cerise en bleu](controle-retouches-cerise.png)
- [Essayage après retouche à 390 px](controle-retouches-mobile.png)
- [Teinture avec le col roulé et Nova en deux tons](controle-retouches-nuancier.png)
- [Commandes de couleur de Nova dans la boutique](controle-retouches-boutique.png)
- [Prompts ImageGen utilisés pour les retouches](reprises/prompts.json)

### Pointes de Nova et raccords au cou

Les pointes de Nova se prolongent des deux côtés sous les épaules. Éden et Raven ont des mèches intérieures qui recouvrent les côtés du cou et suivent la ligne de la nuque. Le masque de Nova suit les pointes prolongées dans les deux zones de teinture.

- [Les trois coiffures avec le haut Cerise bleu](controle-raccords-cerise.png)
- [Les trois coiffures à 390 px](controle-raccords-mobile.png)
- [Nova recolorée en vert et turquoise](controle-raccords-nova.png)
- [Les trois PNG isolés sur trois fonds](controle-raccords-fonds.png)
- [Prompts ImageGen des raccords](reprises/raccords-prompts.json)

### Finitions de Velvet et Nova

Le sommet de Velvet suit le crâne de plus près et sa queue de cheval conserve ses pixels d’origine. Le détourage de Nova enlève les deux petites mèches flottantes à l’intérieur des boucles, au niveau des épaules.

- [Velvet et Nova avec le haut Cerise bleu](controle-finitions-cerise.png)
- [Essayage à 390 px](controle-finitions-mobile.png)
- [Nova en brun et bleu, comme sur la capture](controle-finitions-nova.png)
- [Les PNG isolés sur trois fonds](controle-finitions-fonds.png)

### Contrôles de la première version

- [PNG isolés sur blanc, noir et vert](controle-fonds.png)
- [Gilet Prune fumée en couleur d’origine](controle-prune.png)
- [Pull ample en lilas](controle-oversize-lilas.png)
- [Col roulé en ivoire](controle-col-ivoire.png)
- [Veste et cheveux anthracite à 390 px](controle-mobile.png)
- [Essai de Nova avec le nuancier de la boutique](controle-boutique.png)
