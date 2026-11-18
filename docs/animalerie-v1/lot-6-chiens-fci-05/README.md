# Chiens FCI — lot 05

Trois nouvelles races, deux pelages par race, intégrées au catalogue commun de l'animalerie :

| Race | Pelages | Standard |
| --- | --- | --- |
| Bulldog campeiro | Fauve et blanc ; bringé et blanc | 374 |
| Bulldog continental | Fauve et blanc ; bringé | 369 |
| Cairn Terrier | Froment ; gris bringé | 4 |

Illustrations originales produites avec l'outil intégré `image_gen`. Les prompts exacts, les chemins des sources générées, les dimensions et les limites alpha sont conservés dans `prompts.json`. Les six PNG natifs, sans transformation ni recoloration, sont conservés dans `public/assets/companions/` et servent directement de sources au jeu.

Le catalogue fournit les proportions, les prix et les dimensions à la boutique, à la collection et aux salons multijoueurs. Chaque race possède exactement deux variantes actives. Les variantes existantes restent inchangées.

`controle-fonds.png` présente les six variantes sur fond clair, sombre et coloré, à petite échelle. Contrôle effectué : silhouettes complètes, pattes et queues visibles, transparence réelle sans halo visible sur ces fonds. Les limites sont mesurées sur les pixels d'alpha supérieur ou égal à 16.

Pour reproduire le contrôle depuis la racine sous Windows :

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File docs/animalerie-v1/lot-6-chiens-fci-05/prepare.ps1
node scripts/run-tests.mjs tests/companions.test.ts
```

Références : [nomenclature FCI](https://www.fci.be/fr/nomenclature/), [Bulldog continental et robes illustrées](https://www.fci.be/Nomenclature/Education/369g02-PRE-en.pdf), [Cairn Terrier](https://www.fci.be/fr/nomenclature/CAIRN-TERRIER-4.html).
