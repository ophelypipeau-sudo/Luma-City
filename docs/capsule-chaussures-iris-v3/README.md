# Capsule chaussures d’Iris — boutique locale

[Planche des dix paires](planche.png) · [Essais de superposition](compatibilite.png) · [Détourage sur trois fonds](detourage.png) · [Contrôle des couleurs](couleurs.png)

Les illustrations ont été créées avec ImageGen, avec le patron frontal d’Iris pour le placement et [Prune fumée](../../public/assets/avatar/prune-fumee-v1/source.png) pour la lumière, la finesse des coutures et le rendu des matières. Chaque paire a été exportée sur un calque transparent de 887 × 1774, avec son masque de couverture et le lien vers l’empreinte du corps. Les [sources](sources) et les [prompts](prompts.txt) sont conservés. Les dix paires sont essayables dans **Boutique → Chaussures** et coûtent 900 pièces chacune dans le catalogue local.

## Les dix paires

| Modèle | Coupe et différence avec le catalogue | Zones de teinture |
| --- | --- | --- |
| Vénus | Escarpin en satin prune, bout pointu, bride diagonale et petit passant champagne. La bride et le décolleté asymétrique distinguent la paire de Virgule. La vue frontale privilégie l’empeigne et laisse la ligne du talon discrète. | Satin et bride assortis. Passant et semelle protégés. |
| Pixel | Basket Y2K en mesh pétrole et cuir bleu froid, bout large et plateforme à deux niveaux. Le volume horizontal la distingue de Rafale, dessinée comme une running. | Mesh principal et cage en cuir séparés. Lacets, liserés réfléchissants et semelle protégés. |
| Nox | Bottine noire à bout ciselé, petit talon apparent aux côtés, coupe ajustée et zip latéral. Plus habillée que la Chelsea Silex et la bottine Étrier. | Cuir principal. Zip, rivets et semelle protégés. |
| Alta | Botte bordeaux en cuir lisse, tige ajustée sous le genou et ligne de couture verticale. | Cuir principal. Bord de semelle et ombres du revers préservés. |
| Cherry | Babies vernies rouge cerise à deux brides et plateforme lie-de-vin. Agrafe reste plus basse, avec une seule bride et un talon bloc. | Verni et brides assortis. Boucles et plateforme protégées. |
| Sirocco | Botte western mi-mollet en cuir cognac, soufflet échancré et surpiqûres en éventail. Sa tige et ses coutures la distinguent de Dune. | Cuir principal. Surpiqûres crème et bord de semelle protégés. |
| Astrid | Sandale de soirée ouverte, satin nuit croisé, bracelet fin et petit ornement champagne. Les orteils visibles sont ceux du mannequin. | Satin des brides. Ornement, boucles et semelle protégés. |
| Orbit | [Basket basse redessinée](sources/08-orbit-ivoire.png), cuir ivoire, empiècements indigo et bout légèrement carré à double surpiqûre. Son profil fin, sa semelle graphite et ses lacets droits s’inspirent des chaussures de pilotage. | Cuir ivoire et empiècements indigo séparés. Lacets, languette argentée et semelle graphite protégés. |
| Vega | Cuissarde en daim prune charbon, hauteur au-dessus du genou, coupe structurée à la cuisse et au mollet. | Daim principal. Bord de semelle protégé, relief du daim conservé. |
| Éther | Plateforme à dessus irisé, brides croisées et base chromée. Elle se lit de face par les pans larges de ses brides et les facettes du socle. | Dessus irisé et brides. Chrome et arêtes métalliques protégés. |

## Inspirations

Le [rapport été Pinterest](https://newsroom.pinterest.com/news/summer-trend-report-2026/) documente les baskets hybrides et les chaussures fines inspirées des sports mécaniques. La [tendance Y3K de Pinterest](https://newsroom.pinterest.com/news/summer-trends-report-2024/?filters=creators) a guidé les accents futuristes de Pixel et d’Éther. Le [rapport de tendances Pinterest](https://newsroom-archive.pinterest.com/pt-br/style-report-tendencias-globais-de-estilo-e-beleza) référence les cuissardes et les bottes western. Les épingles individuelles étaient peu accessibles. Les références complémentaires pour les matières et les finitions sont les [bottines à zip et ferrure de Tory Burch](https://www.toryburch.com/en-us/shoes/ankle-boots/pierced-ankle-boot-65mm/174895.html), les [bottes Duerto d’Isabel Marant](https://us.isabelmarant.com/products/bo0003ffd4a16s01bk-duerto-boots-black?variant=54121533243711) et le [guide des talons sculpturaux de Harrods](https://www.harrods.com/en-gb/c/stories/women/amina-muaddi-style-guide).

## Essayage

La planche de superposition montre les jambes nues, le pantalon long Dalle devant les tiges, le Fuseau sous les tiges, le short Pixel, la minijupe Pixel Rose et la robe Solstice. Le pantalon Dalle masque volontairement une partie de la chaussure. Pour porter des tiges par-dessus un pantalon ample, il faudra un masque d’occultation adapté à son volume. Le passage du Fuseau sous les bottes est contrôlé séparément.

Le nuancier propose une teinte principale sur chaque paire et un réglage séparé pour les empiècements de Pixel et d’Orbit. La planche de couleurs montre aussi les semelles et les finitions protégées.

`npx tsx docs/capsule-chaussures-iris-v3/preparer.ts` régénère les calques et les masques de chaque modèle. `npx tsx docs/capsule-chaussures-iris-v3/planches.ts` régénère les vues de contrôle. Sous Vite, ouvrir `tests/fixtures/fitting.html?chaussures=nues`. Les variantes sont `pantalon`, `rentre`, `short`, `jupe` et `robe`.
