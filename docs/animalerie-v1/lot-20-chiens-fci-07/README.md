# Chiens FCI — lot 07

Dix nouvelles races, vingt illustrations natives, exactement deux variantes actives par nouvelle race.

| Race | Variantes | Standard FCI |
| --- | --- | --- |
| Chien courant de montagne du Monténégro | Noir à feu clair ; Noir à feu roux | [279](https://www.fci.be/Nomenclature/Standards/279g06-en.pdf) |
| Chien courant de Schiller | Noir à feu doré ; Noir à feu roux | [131](https://www.fci.be/Nomenclature/Standards/131g06-en.pdf) |
| Chien courant de Transylvanie | Noir et feu ; Noir et feu à plastron blanc | [241](https://www.fci.be/Nomenclature/Standards/241g06-en.pdf) |
| Chien courant des Apennins | Fauve ; Gris lièvre | [375](https://www.fci.be/Nomenclature/Standards/375g06-en.pdf) |
| Chien courant des Tatras | Noir et feu ; Rouge cerf | [377](https://www.fci.be/Nomenclature/Standards/377g06-en.pdf) |
| Chien courant du Småland | Noir et feu ; Marron et feu | [129](https://www.fci.be/Nomenclature/Standards/129g06-en.pdf) |
| Chien courant espagnol | Blanc et citron ; Blanc et orange roux | [204](https://www.fci.be/Nomenclature/Standards/204g06-en.pdf) |
| Chien courant finlandais | Tricolore ; Tricolore à collier blanc | [51](https://www.fci.be/Nomenclature/Standards/051g06-en.pdf) |
| Chien courant grec | Noir et feu ; Noir et feu à petit plastron | [214](https://www.fci.be/Nomenclature/Standards/214g06-en.pdf) |
| Chien courant italien à poil dur | Fauve ; Noir et feu | [198](https://www.fci.be/Nomenclature/Standards/198g06-en.pdf) |

Création avec l'outil intégré `image_gen`, un appel par illustration. Les prompts complets et les chemins des sources sont conservés dans `prompts.json`. Les PNG natifs sont copiés dans `public/assets/companions/` sans déformation ni recoloration. Les dimensions et les limites du sujet sont mesurées sur les pixels d'alpha supérieur ou égal à 16 pour le catalogue commun à la boutique, à la collection et aux salons multijoueurs.

Les standards FCI du tableau ont été consultés pour choisir les couleurs et la silhouette. Les chiens à robe restreinte gardent leur palette : Monténégro et Schiller ont deux nuances de feu ; Transylvanie et Grèce ont une variante avec petit plastron blanc ; le Finlandais reste tricolore avec deux répartitions du blanc. Le Småland propose noir et feu ou marron et feu ; les Tatras noir et feu ou rouge cerf.

Après ce lot : 152 races canines illustrées sur les 364 références FCI enregistrées dans le projet, soit 212 races encore absentes. En complément, 51 races canines plus anciennes ne possèdent encore qu'un seul pelage actif. Ce lot ne modifie pas ces anciennes variantes.

Les planches `controle-fonds-1.png`, `controle-fonds-2.png` et `controle-fonds.png` reprennent les PNG du jeu sur fonds clair, sombre et coloré.

Validation : vingt silhouettes complètes sans contact avec les bords du canevas ; fonds transparents ; revue visuelle des deux variantes de chaque race sur les trois fonds. Les quatre tests de l'animalerie passent, dont le contrôle des 443 PNG et l'adoption multijoueur. TypeScript valide l'intégration avec `npx tsc --noEmit`.

Reproduction depuis la racine sous Windows :

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File docs/animalerie-v1/lot-20-chiens-fci-07/prepare.ps1
node scripts/run-tests.mjs tests/companions.test.ts
npx tsc --noEmit
```
