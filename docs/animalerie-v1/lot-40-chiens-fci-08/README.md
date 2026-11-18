# Chiens FCI — lot 08

Vingt nouvelles races, quarante illustrations natives et exactement deux variantes actives par nouvelle race.

| Race | Variantes | Standard FCI |
| --- | --- | --- |
| Chien courant italien à poil ras | Fauve ; Noir et feu | [337](https://www.fci.be/Nomenclature/Standards/337g06-en.pdf) |
| Chien courant norvégien (Dunker) | Noir dilué, feu et blanc ; Bleu merle, feu et blanc | [203](https://www.fci.be/Nomenclature/Standards/203g06-en.pdf) |
| Chien courant polonais | Noir et feu ; Chocolat et feu | [354](https://www.fci.be/Nomenclature/Standards/354g06-en.pdf) |
| Chien courant serbe | Selle noire et feu doré ; Selle noire et feu roux | [150](https://www.fci.be/Nomenclature/Standards/150g06-en.pdf) |
| Chien courant slovaque | Noir à feu brun ; Noir à feu acajou | [244](https://www.fci.be/Nomenclature/Standards/244g06-en.pdf) |
| Chien courant suisse | Tricolore bernois ; Bleu lucernois | [59](https://www.fci.be/Nomenclature/Standards/059g06-en.pdf) |
| Chien courant tricolore serbe | Tricolore ; Tricolore à collier blanc | [229](https://www.fci.be/Nomenclature/Standards/229g06-en.pdf) |
| Chien d’arrêt allemand à poil dur | Rouan marron ; Rouan noir | [98](https://www.fci.be/Nomenclature/Standards/098g07-en.pdf) |
| Chien d’arrêt allemand à poil raide | Marron ; Rouan clair et marron | [232](https://www.fci.be/Nomenclature/Standards/232g07-en.pdf) |
| Chien d’arrêt danois ancestral | Blanc et marron ; Blanc et marron moucheté | [281](https://www.fci.be/Nomenclature/Standards/281g07-en.pdf) |
| Chien d’arrêt frison (Stabijhoun) | Noir et blanc ; Marron et blanc | [222](https://www.fci.be/Nomenclature/Standards/222g07-en.pdf) |
| Chien d’arrêt portugais | Jaune ; Jaune et blanc | [187](https://www.fci.be/Nomenclature/Standards/187g07-en.pdf) |
| Chien d’Artois | Tricolore à manteau ; Tricolore à grandes taches | [28](https://www.fci.be/Nomenclature/Standards/028g06-en.pdf) |
| Chien d’eau américain | Foie ; Chocolat foncé | [301](https://www.fci.be/Nomenclature/Standards/301g08-en.pdf) |
| Chien d’eau espagnol | Noir ; Marron et blanc | [336](https://www.fci.be/Nomenclature/Standards/336g08-en.pdf) |
| Chien d’eau frison (Wetterhoun) | Noir et blanc ; Marron et blanc | [221](https://www.fci.be/Nomenclature/Standards/221g08-en.pdf) |
| Chien d’eau irlandais | Foie puce ; Foie puce foncé | [124](https://www.fci.be/Nomenclature/Standards/124g08-en.pdf) |
| Chien d’eau portugais | Noir et blanc ; Marron | [37](https://www.fci.be/Nomenclature/Standards/037g08-en.pdf) |
| Chien d’élan norvégien gris | Gris clair ; Gris soutenu | [242](https://www.fci.be/Nomenclature/Standards/242g05-en.pdf) |
| Chien d’élan norvégien noir | Noir ; Noir à petit plastron | [268](https://www.fci.be/Nomenclature/Standards/268g05-en.pdf) |

Création avec l'outil intégré `image_gen`, un appel par illustration. Les prompts complets et les chemins des sources sont conservés dans `prompts.json`. Les PNG natifs sont copiés dans `public/assets/companions/` sans déformation ni recoloration. Les dimensions et les limites du sujet sont mesurées sur les pixels d'alpha supérieur ou égal à 16 pour le catalogue commun à la boutique, à la collection et aux salons multijoueurs.

Les standards FCI du tableau ont été consultés pour préparer les palettes et les silhouettes. Les robes restreintes conservent leurs couleurs : deux nuances de feu pour les courants serbe et slovaque, deux répartitions de blanc pour le tricolore serbe et l'Artois, deux nuances de foie puce pour le chien d'eau irlandais, deux gris pour l'élan norvégien gris et noir avec ou sans petit plastron pour l'élan norvégien noir. Les deux pelages du courant suisse représentent les variétés bernoise et lucernoise sous le même standard 59.

Après ce lot : 172 races canines illustrées sur les 364 références FCI enregistrées dans le projet ; 192 races encore absentes. Les 51 anciennes races n'ayant qu'un seul pelage actif restent à compléter séparément.

Les quatre planches `controle-fonds-1.png` à `controle-fonds-4.png`, ainsi que `controle-fonds.png`, reprennent les PNG du jeu sur fonds clair, sombre et coloré.

Validation : quarante silhouettes complètes avec bords de canevas libres et fonds transparents ; revue des vingt paires sur les trois fonds. La variante Artois à grandes taches a reçu une retouche de détourage avec `image_gen` ; son original et le prompt de correction restent référencés dans `prompts.json`. Les quatre tests de l'animalerie passent, dont le contrôle des 483 PNG et l'adoption multijoueur. TypeScript valide l'intégration avec `npx tsc --noEmit`.

Reproduction depuis la racine sous Windows :

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File docs/animalerie-v1/lot-40-chiens-fci-08/prepare.ps1
node scripts/run-tests.mjs tests/companions.test.ts
npx tsc --noEmit
```
