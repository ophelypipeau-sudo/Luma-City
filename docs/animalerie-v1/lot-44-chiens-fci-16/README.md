# Chiens FCI — lot 16, fin du catalogue

22 nouvelles races, avec exactement deux pelages actifs par race : **44 illustrations originales** générées séparément avec l’outil intégré `image_gen`.

| Race | Deux pelages | Standard FCI |
| --- | --- | --- |
| Terrier brésilien | Tricolore noir ; Tricolore marron | [341](https://www.fci.be/Nomenclature/Standards/341g03-en.pdf) |
| Bedlington Terrier | Bleu ; Sable | [9](https://www.fci.be/Nomenclature/Standards/009g03-en.pdf) |
| Boston Terrier | Noir et blanc ; Bringé et blanc | [140](https://www.fci.be/Nomenclature/Standards/140g09-en.pdf) |
| Terrier de chasse allemand | Noir et feu ; Marron et feu | [103](https://www.fci.be/Nomenclature/Standards/103g03-en.pdf) |
| Manchester Terrier | Noir et feu acajou ; Noir et feu chaud | [71](https://www.fci.be/Nomenclature/Standards/071g03-en.pdf) |
| Parson Russell Terrier | Blanc et fauve ; Tricolore | [339](https://www.fci.be/Nomenclature/Standards/339g03-en.pdf) |
| Terrier écossais | Noir ; Froment | [73](https://www.fci.be/Nomenclature/Standards/073g03-en.pdf) |
| Terrier irlandais | Roux ; Froment rouge | [139](https://www.fci.be/Nomenclature/Standards/139g03-en.pdf) |
| Terrier irlandais à poil doux | Froment clair ; Froment doré | [40](https://www.fci.be/Nomenclature/Standards/040g03-en.pdf) |
| Glen of Imaal Terrier | Bleu bringé ; Froment | [302](https://www.fci.be/Nomenclature/Standards/302g03-en.pdf) |
| Terrier japonais | Tricolore à corps blanc ; Tricolore à tache noire | [259](https://www.fci.be/Nomenclature/Standards/259g03-en.pdf) |
| Kerry Blue Terrier | Bleu ardoise ; Bleu argent | [3](https://www.fci.be/Nomenclature/Standards/003g03-en.pdf) |
| Terrier noir russe | Noir ébène ; Noir grisonné | [327](https://www.fci.be/Nomenclature/Standards/327g02-en.pdf) |
| Terrier tchèque | Gris bleu ; Café clair | [246](https://www.fci.be/Nomenclature/Standards/246g03-en.pdf) |
| Terrier tibétain | Noir et blanc ; Doré | [209](https://www.fci.be/Nomenclature/Standards/209g09-en.pdf) |
| Tosa | Rouge ; Bringé | [260](https://www.fci.be/Nomenclature/Standards/260g02-en.pdf) |
| Vallhund suédois | Gris loup ; Roux loup | [14](https://www.fci.be/Nomenclature/Standards/014g05-en.pdf) |
| Volpino italien | Blanc ; Rouge cerf | [195](https://www.fci.be/Nomenclature/Standards/195g05-en.pdf) |
| Welsh Springer Spaniel | Rouge et blanc ; Rouge et blanc moucheté | [126](https://www.fci.be/Nomenclature/Standards/126g08-en.pdf) |
| Welsh Terrier | Noir et feu ; Grisonné et feu | [78](https://www.fci.be/Nomenclature/Standards/078g03-en.pdf) |
| West Highland White Terrier | Blanc neige ; Blanc nacré | [85](https://www.fci.be/Nomenclature/Standards/085g03-en.pdf) |
| Xoloitzcuintle | Ardoise ; Bronze | [234](https://www.fci.be/Nomenclature/Standards/234g05-en.pdf) |

Les prompts exacts, les références des standards, les chemins des sources natives, les dimensions et les limites mesurées sont conservés dans [prompts.json](prompts.json). Les PNG RGBA natifs sont enregistrés dans [public/assets/companions/](../../../public/assets/companions/), sans recoloration ni déformation par programme. Les 44 sources sont également référencées dans [sources-final.json](sources-final.json).

Les races à robe restreinte gardent leur palette : deux nuances de feu pour le Manchester, deux bleus pour le Kerry Blue, noir et noir légèrement grisonné pour le Terrier noir russe, deux nuances de blanc pour le Westie. Les Welsh Springer restent rouge et blanc avec une répartition et un mouchetage différents. Le Xoloitzcuintle représente la variété standard sans poil dans les deux variantes.

Contrôle visuel des 44 illustrations sur fonds clair, sombre et vert : cinq planches `controle-fonds-1.png` à `controle-fonds-5.png` et [planche complète](controle-fonds.png). Silhouettes entières, quatre pattes, oreilles et queues conservées, contours lisibles et marges transparentes. Les limites sont mesurées avec un alpha ≥ 16 sur chaque fichier natif.

Le composant réel `CompanionShop` a été ouvert avec Vite dans la [page de contrôle](../../../tests/fixtures/companion-lot-16.html), dans deux cadres de 390 et 800 pixels. Les deux pelages Boston sont visibles et les boutons d’achat accessibles dans la [capture mobile et ordinateur](controle-boutique-mobile-desktop.jpg).

Après ce lot : **364 races canines illustrées sur les 364 références FCI du projet ; aucune race absente**. Catalogue complet : **450 races et 867 pelages**. Les anciennes races à un seul pelage restent hors du périmètre de ce lot.

Validation : les quatre tests de l’animalerie passent, y compris les 867 PNG RGBA uniques, la couverture complète des références FCI et l’adoption multijoueur. TypeScript valide l’intégration.

Reproduction depuis la racine :

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File docs/animalerie-v1/lot-44-chiens-fci-16/prepare.ps1
node scripts/run-tests.mjs tests/companions.test.ts
npx tsc --noEmit
```

`integrate.mjs` documente l’insertion initiale du lot et refuse de l’ajouter une seconde fois.
