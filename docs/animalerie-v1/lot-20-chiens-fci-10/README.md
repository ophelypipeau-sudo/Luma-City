# Chiens FCI — lot 10

Dix nouvelles races et vingt illustrations natives, avec exactement deux pelages actifs par nouvelle race.

| Race | Pelages | Standard FCI |
| --- | --- | --- |
| Chien de Castro Laboreiro | Loup gris ; Montagne | [170](https://www.fci.be/Nomenclature/Standards/170g02-en.pdf) |
| Chien de ferme dano-suédois | Tricolore ; Fauve et blanc | [356](https://www.fci.be/Nomenclature/Standards/356g02-en.pdf) |
| Chien de garenne des Canaries | Rouge et blanc ; Orange et blanc | [329](https://www.fci.be/Nomenclature/Standards/329g05-en.pdf) |
| Chien de garenne portugais | Fauve ; Jaune et blanc | [94](https://www.fci.be/Nomenclature/Standards/094g05-en.pdf) |
| Chien de la Serra da Estrela | Fauve à masque noir ; Gris loup | [173](https://www.fci.be/Nomenclature/Standards/173g02-en.pdf) |
| Chien de Leonberg | Jaune lion ; Rouge brun | [145](https://www.fci.be/Nomenclature/Standards/145g02-en.pdf) |
| Chien de montagne de l’Atlas (Aïdi) | Fauve ; Noir et blanc | [247](https://www.fci.be/Nomenclature/Standards/247g02-en.pdf) |
| Chien de montagne des Pyrénées | Blanc ; Blanc et blaireau | [137](https://www.fci.be/Nomenclature/Standards/137g02-en.pdf) |
| Chien de recherche au sang de Hanovre | Rouge cerf ; Bringé | [213](https://www.fci.be/Nomenclature/Standards/213g06-en.pdf) |
| Chien de Rhodésie à crête dorsale | Froment clair ; Froment rouge | [146](https://www.fci.be/Nomenclature/Standards/146g06-en.pdf) |

Création avec l’outil intégré `image_gen`, un appel par illustration. Les prompts complets et les chemins des sources sont consignés dans `prompts.json`. Les PNG natifs du jeu sont conservés dans `public/assets/companions/`, sans déformation ni recoloration par programme.

Les standards FCI du tableau ont été consultés pour choisir les silhouettes et les palettes. Les deux pelages du Castro Laboreiro restent des robes loup/bringées ; les Leonbergs et les Estrelas conservent leur masque sombre. Le montagne des Pyrénées propose blanc ou blanc avec marques blaireau. Le Podengo portugais représente la variété moyenne à poil lisse dans ses deux pelages. Le chien de ferme tricolore possède de petites marques feu autour des yeux : le libellé du catalogue décrit le résultat final.

Les dimensions et limites de silhouette sont mesurées sur les pixels d’alpha supérieur ou égal à 16. Ces repères servent au catalogue commun à la boutique, à la collection et aux salons multijoueurs.

Contrôle visuel : les vingt illustrations ont été revues sur fonds clair, sombre et coloré dans `controle-fonds-1.png` et `controle-fonds-2.png`. Les silhouettes sont entières, les marges libres et les contours propres. Un halo semblait présent dans certains aperçus natifs ; la composition sur les trois fonds confirme qu’il correspond à des pixels transparents. Les quatre essais de retouche inutilisés sont référencés dans le manifeste ; les fichiers initiaux sont les versions retenues.

Après ce lot : **202 races canines illustrées sur 364 références FCI**, soit 162 races encore absentes. Le catalogue complet contient 288 races et 543 pelages. Les anciennes races à un seul pelage restent à compléter séparément.

Validation : les quatre tests de l’animalerie passent, dont le contrôle des 543 PNG RGBA uniques et le parcours adoption/multijoueur. La vérification TypeScript avec `npx tsc --noEmit` réussit également.

Reproduction depuis la racine sous Windows :

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File docs/animalerie-v1/lot-20-chiens-fci-10/prepare.ps1
node scripts/run-tests.mjs tests/companions.test.ts
npx tsc --noEmit
```
