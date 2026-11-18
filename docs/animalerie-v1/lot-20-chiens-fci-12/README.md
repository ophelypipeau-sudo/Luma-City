# Chiens FCI — lot 12

Dix nouvelles races et vingt illustrations natives, avec exactement deux variantes actives par nouvelle race.

| Race | Variantes | Standard FCI |
| --- | --- | --- |
| Chien de perdrix de Drente | Marron et blanc ; Marron et blanc truité | [224](https://www.fci.be/Nomenclature/Standards/224g07-en.pdf) |
| Chien nu du Pérou | Ardoise ; Cuivre | [310](https://www.fci.be/Nomenclature/Standards/310g05-en.pdf) |
| Chien thaïlandais à crête dorsale | Bleu ; Rouge à masque noir | [338](https://www.fci.be/Nomenclature/Standards/338g05-en.pdf) |
| Chien-loup de Saarloos | Gris loup ; Brun de forêt | [311](https://www.fci.be/Nomenclature/Standards/311g01-en.pdf) |
| Cimarrón uruguayen | Bringé ; Fauve à masque noir | [353](https://www.fci.be/Nomenclature/Standards/353g02-en.pdf) |
| Cirneco de l’Etna | Fauve ; Fauve et blanc | [199](https://www.fci.be/Nomenclature/Standards/199g05-en.pdf) |
| Clumber Spaniel | Blanc et citron ; Blanc et orange | [109](https://www.fci.be/Nomenclature/Standards/109g08-en.pdf) |
| Colley à poil court | Zibeline et blanc ; Tricolore | [296](https://www.fci.be/Nomenclature/Standards/296g01-en.pdf) |
| Colley barbu | Ardoise et blanc ; Marron et blanc | [271](https://www.fci.be/Nomenclature/Standards/271g01-en.pdf) |
| Coton de Tuléar | Blanc ; Blanc à oreilles grisées | [283](https://www.fci.be/Nomenclature/Standards/283g09-en.pdf) |

Création avec l’outil intégré `image_gen`, un appel par illustration. Les prompts complets et les chemins des sources sont conservés dans [prompts.json](prompts.json). Les vingt PNG natifs sont copiés dans [public/assets/companions/](../../../public/assets/companions/), sans déformation ni recoloration par programme.

Les standards FCI du tableau ont été consultés pour choisir les silhouettes et les palettes. Le chien de Drente reste blanc avec marques brunes dans les deux variantes, avec un truitage plus marqué sur la seconde. Le chien nu du Pérou représente la variété moyenne sans poil : ardoise et cuivre décrivent la peau. Les Saarloos gris et brun gardent leur masque clair et une pigmentation du nez adaptée à la robe. Les Clumbers restent à corps blanc, avec des marques citron ou orange sur la tête.

Le Coton de Tuléar conserve une robe blanche dans les deux variantes. La seconde porte uniquement de légères nuances gris pâle sur les oreilles, conformément au standard ; il ne s’agit pas d’une robe grise intégrale. Les deux variantes privilégient la texture cotonneuse et le visage dégagé.

Les dimensions et limites de silhouette sont mesurées sur les pixels d’alpha supérieur ou égal à 16. Ces repères servent au catalogue commun à la boutique, à la collection et aux salons multijoueurs.

Contrôle visuel : les vingt illustrations ont été revues sur fonds clair, sombre et coloré dans [la première planche](controle-fonds-1.png) et [la seconde planche](controle-fonds-2.png). Les silhouettes sont entières, les bords du canevas restent libres et les contours sont propres. La [planche complète](controle-fonds.png) regroupe les dix paires en taille de vignette.

Après ce lot : **222 races canines illustrées sur les 364 références FCI du projet**, soit 142 races encore absentes. Le catalogue complet contient 308 races et 583 pelages. Les anciennes races à un seul pelage restent à compléter séparément.

Validation : les quatre tests de l’animalerie passent, dont le contrôle des 583 PNG RGBA uniques et le parcours adoption/multijoueur. La vérification TypeScript avec `npx tsc --noEmit` réussit également.

Reproduction depuis la racine sous Windows :

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File docs/animalerie-v1/lot-20-chiens-fci-12/prepare.ps1
node scripts/run-tests.mjs tests/companions.test.ts
npx tsc --noEmit
```
