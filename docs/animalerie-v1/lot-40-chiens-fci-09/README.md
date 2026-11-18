# Chiens FCI — lot 09

Vingt nouvelles races, quarante illustrations natives et exactement deux variantes actives par nouvelle race.

| Race | Variantes | Standard FCI |
| --- | --- | --- |
| Chien d’élan suédois (Jämthund) | Gris clair ; Gris foncé | [42](https://www.fci.be/Nomenclature/Standards/042g05-en.pdf) |
| Chien d’ours de Carélie | Noir et blanc ; Noir et blanc à collier | [48](https://www.fci.be/Nomenclature/Standards/048g05-en.pdf) |
| Chien d’oysel allemand | Marron ; Rouan marron | [104](https://www.fci.be/Nomenclature/Standards/104g08-en.pdf) |
| Chien de Bali (Kintamani) | Blanc à oreilles biscuit ; Fauve à masque noir | [362](https://www.fci.be/Nomenclature/Standards/362g05-en.pdf) |
| Berger anglais ancestral (Bobtail) | Gris et blanc ; Bleu et blanc | [16](https://www.fci.be/Nomenclature/Standards/016g01-en.pdf) |
| Berger catalan | Fauve ; Gris | [87](https://www.fci.be/Nomenclature/Standards/087g01-en.pdf) |
| Berger de la Serra de Aires | Fauve ; Noir et feu | [93](https://www.fci.be/Nomenclature/Standards/093g01-en.pdf) |
| Berger de Majorque | Noir de jais ; Noir à petite cravate | [321](https://www.fci.be/Nomenclature/Standards/321g01-fr.pdf) |
| Berger des Pyrénées à face rase | Fauve ; Bleu merle | [138](https://www.fci.be/Nomenclature/Standards/138g01-en.pdf) |
| Berger des Pyrénées à poil long | Fauve ; Gris | [141](https://www.fci.be/Nomenclature/Standards/141g01-en.pdf) |
| Berger islandais | Roux et blanc ; Chocolat, feu et blanc | [289](https://www.fci.be/Nomenclature/Standards/289g05-en.pdf) |
| Berger Kangal | Fauve sable ; Sable loup | [331](https://www.fci.be/Nomenclature/Standards/331g02-en.pdf) |
| Berger macédonien Karaman | Noir ; Noir et feu | [378](https://www.fci.be/Nomenclature/Standards/378g02-en.pdf) |
| Berger polonais des Tatras | Blanc neige ; Blanc perle | [252](https://www.fci.be/Nomenclature/Standards/252g01-en.pdf) |
| Berger roumain Corb | Noir corbeau ; Noir à plastron blanc | [373](https://www.fci.be/Nomenclature/Standards/373g02-en.pdf) |
| Berger roumain de Bucovine | Blanc et noir ; Blanc et gris | [357](https://www.fci.be/Nomenclature/Standards/357g02-en.pdf) |
| Berger roumain de Mioritza | Blanc à taches grises ; Gris uni | [349](https://www.fci.be/Nomenclature/Standards/349g01-en.pdf) |
| Berger roumain des Carpathes | Gris loup clair ; Gris loup foncé | [350](https://www.fci.be/Nomenclature/Standards/350g01-en.pdf) |
| Berger de Charplanina | Gris fer ; Gris foncé | [41](https://www.fci.be/Nomenclature/Standards/041g02-en.pdf) |
| Chien de Canaan | Sable ; Noir et blanc | [273](https://www.fci.be/Nomenclature/Standards/273g05-en.pdf) |

Création avec l'outil intégré `image_gen`, un appel par illustration initiale. Les prompts complets, les éventuelles retouches et les chemins des sources sont conservés dans `prompts.json`. Les PNG natifs sont copiés dans `public/assets/companions/` sans déformation ni recoloration par programme. Les dimensions et les limites du sujet sont mesurées sur les pixels d'alpha supérieur ou égal à 16 pour le catalogue commun à la boutique, à la collection et aux salons multijoueurs.

Les standards FCI du tableau ont été consultés pour préparer les palettes et silhouettes. Les races aux couleurs restreintes gardent leur palette : deux gris pour le Jämthund, les Carpathes et la Charplanina ; deux répartitions du blanc pour la Carélie ; noir avec ou sans petite marque blanche pour Majorque et le Corb. Le Berger polonais des Tatras reste uniformément blanc dans ses deux variantes : neige et perle sont des rendus artistiques du blanc avec des ombres différentes, sans tache crème ni robe inventée. Ce ne sont pas deux couleurs biologiques distinctes.

Après ce lot : 192 races canines illustrées sur les 364 références FCI enregistrées dans le projet ; 172 races encore absentes. Les 51 anciennes races n'ayant qu'un seul pelage actif restent à compléter séparément.

Les quatre planches `controle-fonds-1.png` à `controle-fonds-4.png`, ainsi que `controle-fonds.png`, reprennent les PNG du jeu sur fonds clair, sombre et coloré.

Validation du lot : les quarante illustrations ont été contrôlées sur les trois fonds, avec silhouettes entières et marges libres. Le halo résiduel du Kintamani blanc a été supprimé avec une retouche imagegen ; la source initiale et le prompt de correction restent consignés dans le manifeste. Les quatre tests de l'animalerie passent, dont la vérification des 523 PNG RGBA du catalogue et le parcours adoption/multijoueur. `npx tsc --noEmit` réussit également.

Reproduction depuis la racine sous Windows :

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File docs/animalerie-v1/lot-40-chiens-fci-09/prepare.ps1
node scripts/run-tests.mjs tests/companions.test.ts
npx tsc --noEmit
```
