# Chiens FCI — lot 11

Dix nouvelles races et vingt illustrations natives, avec exactement deux pelages actifs par nouvelle race.

| Race | Pelages | Standard FCI |
| --- | --- | --- |
| Chien rouge de Bavière | Rouge cerf ; Fauve bringé | [217](https://www.fci.be/Nomenclature/Standards/217g06-en.pdf) |
| Chien de Saint-Hubert | Noir et feu ; Rouge | [84](https://www.fci.be/Nomenclature/Standards/084g06-en.pdf) |
| Chien de Taïwan | Noir ; Bringé | [348](https://www.fci.be/Nomenclature/Standards/348g05-en.pdf) |
| Chien du Groenland | Noir et blanc ; Roux et blanc | [274](https://www.fci.be/Nomenclature/Standards/274g05-en.pdf) |
| Chien du Pharaon | Feu clair ; Feu soutenu | [248](https://www.fci.be/Nomenclature/Standards/248g05-en.pdf) |
| Chien esquimau canadien | Gris et blanc ; Cannelle et blanc | [211](https://www.fci.be/Nomenclature/Standards/211g05-en.pdf) |
| Chien finnois de Laponie | Noir et feu ; Marron et feu | [189](https://www.fci.be/Nomenclature/Standards/189g05-en.pdf) |
| Chien-loup tchécoslovaque | Gris jaune ; Gris argent | [332](https://www.fci.be/Nomenclature/Standards/332g01-en.pdf) |
| Coonhound noir et feu | Noir et feu doré ; Noir et feu cuivré | [300](https://www.fci.be/Nomenclature/Standards/300g06-en.pdf) |
| Chien norvégien de macareux | Roux et blanc ; Fauve et blanc | [265](https://www.fci.be/Nomenclature/Standards/265g05-en.pdf) |

Création avec l’outil intégré `image_gen`, un appel par illustration. Les prompts complets et les chemins des sources sont conservés dans [prompts.json](prompts.json). Les vingt PNG natifs sont copiés dans [public/assets/companions/](../../../public/assets/companions/), sans déformation ni recoloration par programme.

Les standards FCI du tableau ont été consultés pour préparer les silhouettes et les palettes. Les deux robes du Pharaon restent feu, avec étoile blanche au poitrail et extrémité blanche de la queue. Les deux Coonhounds restent noirs et feu, avec deux nuances de feu : doré et cuivré. Les chiens-loups tchécoslovaques gardent leur masque clair dans les deux gris. Les Lundehunds conservent leurs marques blanches et leurs poils à pointe sombre.

Les dimensions et limites de silhouette sont mesurées sur les pixels d’alpha supérieur ou égal à 16. Ces repères servent au catalogue commun à la boutique, à la collection et aux salons multijoueurs.

Contrôle visuel : les vingt illustrations ont été revues sur fonds clair, sombre et coloré dans [la première planche](controle-fonds-1.png) et [la seconde planche](controle-fonds-2.png). Les silhouettes sont entières, les bords du canevas restent libres et les contours sont propres. La [planche complète](controle-fonds.png) regroupe les dix paires en taille de vignette.

Après ce lot : **212 races canines illustrées sur les 364 références FCI du projet**, soit 152 races encore absentes. Le catalogue complet contient 298 races et 563 pelages. Les anciennes races à un seul pelage restent à compléter séparément.

Validation : les quatre tests de l’animalerie passent, dont le contrôle des 563 PNG RGBA uniques et le parcours adoption/multijoueur. La vérification TypeScript avec `npx tsc --noEmit` réussit également.

Reproduction depuis la racine sous Windows :

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File docs/animalerie-v1/lot-20-chiens-fci-11/prepare.ps1
node scripts/run-tests.mjs tests/companions.test.ts
npx tsc --noEmit
```
