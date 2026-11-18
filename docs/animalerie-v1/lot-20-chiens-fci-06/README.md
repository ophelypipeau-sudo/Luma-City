# Chiens FCI — lot 06

Dix nouvelles races et vingt illustrations natives, avec exactement deux pelages actifs par race.

| Race | Variantes | Standard FCI |
| --- | --- | --- |
| Chien à loutre | Froment ; Noir et feu | [294](https://www.fci.be/Nomenclature/Standards/294g06-en.pdf) |
| Berger croate | Noir ; Noir à petit plastron | [277](https://www.fci.be/Nomenclature/Standards/277g01-en.pdf) |
| Chien courant d’Estonie | Tricolore ; Citron et blanc | [366](https://www.fci.be/Nomenclature/Standards/366g06-en.pdf) |
| Chien courant d’Istrie à poil dur | Blanc et orange ; Blanc et orange clair | [152](https://www.fci.be/Nomenclature/Standards/152g06-en.pdf) |
| Chien courant d’Istrie à poil ras | Blanc et orange ; Blanc et orange clair | [151](https://www.fci.be/Nomenclature/Standards/151g06-en.pdf) |
| Chien courant de Bosnie (Barak) | Roux et blanc ; Gris terre et blanc | [155](https://www.fci.be/Nomenclature/Standards/155g06-en.pdf) |
| Chien courant de Halden | Tricolore ; Tricolore à panachure étendue | [267](https://www.fci.be/Nomenclature/Standards/267g06-en.pdf) |
| Chien courant de Hamilton | Tricolore à feu doré ; Tricolore à feu roux | [132](https://www.fci.be/Nomenclature/Standards/132g06-en.pdf) |
| Chien courant de Hygen | Rouge et blanc ; Noir, feu et blanc | [266](https://www.fci.be/Nomenclature/Standards/266g06-en.pdf) |
| Chien courant de la vallée de la Save | Froment roux et blanc ; Roux foncé et blanc | [154](https://www.fci.be/Nomenclature/Standards/154g06-en.pdf) |

Création avec l'outil intégré `image_gen`, un appel par illustration. Les prompts complets et les chemins des sources sont conservés dans `prompts.json`. Les PNG natifs sont copiés dans `public/assets/companions/` sans déformation ni recoloration. Les dimensions et les limites du sujet sont mesurées sur les pixels d'alpha supérieur ou égal à 16 pour le catalogue commun à la boutique, à la collection et aux salons multijoueurs.

Les deux variantes du Berger croate sont noires, avec ou sans petit plastron. Les races à robe limitée ont des nuances ou répartitions de marques différentes : les deux Istriens restent blanc et orange, Halden reste tricolore, Hamilton garde son manteau noir avec deux nuances de feu. Les sources FCI du tableau ont été consultées pour préparer ces variantes.

Contrôle visuel sur fond clair, sombre et coloré dans `controle-fonds.png`, également conservé en deux planches plus petites. Les images de contrôle reprennent les PNG réellement consommés par le jeu.

Validation : vingt silhouettes entières sans contact avec les bords du canevas ; fonds transparents ; contours et deux variantes revus sur les trois fonds. Les quatre tests de l'animalerie passent, y compris le contrôle des 423 PNG du catalogue et l'adoption multijoueur. TypeScript valide l'intégration avec `npx tsc --noEmit`.

Reproduction depuis la racine sous Windows :

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File docs/animalerie-v1/lot-20-chiens-fci-06/prepare.ps1
node scripts/run-tests.mjs tests/companions.test.ts
npx tsc --noEmit
```
