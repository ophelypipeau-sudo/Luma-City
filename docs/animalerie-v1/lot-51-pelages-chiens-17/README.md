# Lot 17 — 51 deuxièmes pelages canins

Les 51 races de chiens qui n’avaient qu’un pelage actif disposent désormais d’une deuxième coloration. Les 364 races canines ont toutes au moins deux pelages. Le catalogue contient 450 races, toutes espèces confondues, et 918 variantes.

Chaque PNG a été édité individuellement avec image_gen à partir du visuel existant, en conservant sa pose, sa silhouette et son style. Les races à robe unique reçoivent une nuance de cette robe. Les couvertures existantes, les prix et les tailles de race sont conservés.

## Sources et intégration

- [Prompts, sources, dimensions et repères mesurés](prompts.json). Les sources natives sont copiées sans redimensionnement dans public/assets/companions/.
- plan.ts conserve les choix de robes ; collect.mjs collecte les générations ; prepare.ps1 mesure les contours et compose les planches ; integrate.mjs ajoute les variantes au catalogue.
- L’American Foxhound a reçu une seconde édition pour nettoyer un résidu alpha au bord du canevas.
- Aucune recoloration automatique des pixels ni déformation des silhouettes.

## Contrôles effectués

- Les 51 images ont été contrôlées visuellement sur fonds clair, sombre et vert : [planches 1](controle-fonds-1.png), [2](controle-fonds-2.png), [3](controle-fonds-3.png), [4](controle-fonds-4.png), [5](controle-fonds-5.png), [6](controle-fonds-6.png). Marges et transparence vérifiées par prepare.ps1.
- Animalerie réelle contrôlée dans la fixture tests/fixtures/companion-lot-17.html à 390 et 800 pixels : sélection de l’Akita américain et du Berger hollandais, deux pelages affichés avec leurs boutons d’achat. [Capture](animalerie-mobile-desktop.jpg).
- node scripts/run-tests.mjs tests/companions.test.ts : 4 tests réussis, dont les 918 PNG et l’adoption/multijoueur.
- npm run build:fast : TypeScript et compilation Vite réussis. Avertissements Vite existants sur la taille du bundle et les annotations Zod.

## Robes ajoutées

| Race | Pelage initial | Deuxième pelage | Référence |
| --- | --- | --- | --- |
| Bouvier bernois | Tricolore | Tricolore à feu acajou | [FCI 45](https://www.fci.be/Nomenclature/Standards/045g02-en.pdf) |
| Setter irlandais rouge | Rouge acajou | Rouge châtaigne | [FCI 120](https://www.fci.be/Nomenclature/Standards/120g07-en.pdf) |
| Terrier du Yorkshire | Bleu acier et feu | Bleu acier et feu doré | [FCI 86](https://www.fci.be/Nomenclature/Standards/086g03-en.pdf) |
| Samoyède | Blanc | Blanc et biscuit | [FCI 212](https://www.fci.be/Nomenclature/Standards/212g05-en.pdf) |
| Rottweiler | Noir et feu | Noir et feu acajou | [FCI 147](https://www.fci.be/Nomenclature/Standards/147g02-en.pdf) |
| Affenpinscher | Noir | Noir charbon | [FCI 186](https://www.fci.be/Nomenclature/Standards/186g02-en.pdf) |
| Airedale Terrier | Noir et feu | Grisonné et feu | [FCI 7](https://www.fci.be/Nomenclature/Standards/007g03-en.pdf) |
| Akita américain | Fauve à masque noir | Bringé et blanc | [FCI 344](https://www.fci.be/Nomenclature/Standards/344g05-en.pdf) |
| American Foxhound | Tricolore | Citron et blanc | [FCI 303](https://www.fci.be/Nomenclature/Standards/303g06-en.pdf) |
| American Staffordshire Terrier | Bringé et blanc | Fauve et blanc | [FCI 286](https://www.fci.be/Nomenclature/Standards/286g03-en.pdf) |
| Anglo-français de petite vénerie | Orange et blanc | Tricolore | [FCI 325](https://www.fci.be/Nomenclature/Standards/325g06-en.pdf) |
| Ariégeois | Noir et blanc marqué de feu | Noir et blanc à grandes plages | [FCI 20](https://www.fci.be/Nomenclature/Standards/020g06-en.pdf) |
| Azawakh | Fauve | Bringé | [FCI 307](https://www.fci.be/Nomenclature/Standards/307g10-en.pdf) |
| Bangkaew de Thaïlande | Fauve et blanc | Noir et blanc | [FCI 358](https://www.fci.be/Nomenclature/Standards/358g05-en.pdf) |
| Barbu tchèque | Rouan foncé | Marron | [FCI 245](https://www.fci.be/Nomenclature/Standards/245g07-en.pdf) |
| Barzoï | Blanc et fauve | Blanc et noir | [FCI 193](https://www.fci.be/Nomenclature/Standards/193g10-en.pdf) |
| Basset artésien normand | Tricolore | Fauve et blanc | [FCI 34](https://www.fci.be/Nomenclature/Standards/034g06-en.pdf) |
| Basset bleu de Gascogne | Bleu moucheté | Bleu à plages noires | [FCI 35](https://www.fci.be/Nomenclature/Standards/035g06-en.pdf) |
| Berger blanc suisse | Blanc | Blanc nacré | [FCI 347](https://www.fci.be/Nomenclature/Standards/347g01-en.pdf) |
| Basset de Westphalie | Tricolore | Tricolore à feu doré | [FCI 100](https://www.fci.be/Nomenclature/Standards/100g06-en.pdf) |
| Basset des Alpes | Rouge cerf | Noir et feu | [FCI 254](https://www.fci.be/Nomenclature/Standards/254g06-en.pdf) |
| Basset fauve de Bretagne | Fauve | Froment doré | [FCI 36](https://www.fci.be/Nomenclature/Standards/036g06-en.pdf) |
| Drever | Roux et blanc | Tricolore | [FCI 130](https://www.fci.be/Nomenclature/Standards/130g06-en.pdf) |
| Beagle-Harrier | Tricolore | Tricolore à feu clair | [FCI 290](https://www.fci.be/Nomenclature/Standards/290g06-en.pdf) |
| Berger bergamasque | Gris | Noir | [FCI 194](https://www.fci.be/Nomenclature/Standards/194g01-en.pdf) |
| Berger d’Asie centrale | Blanc et fauve | Blanc et noir | [FCI 335](https://www.fci.be/Nomenclature/Standards/335g02-en.pdf) |
| Berger de Beauce | Noir et feu | Arlequin | [FCI 44](https://www.fci.be/Nomenclature/Standards/044g01-en.pdf) |
| Berger de Bohême | Noir et feu | Noir et feu acajou | [FCI 364](https://www.fci.be/Nomenclature/Standards/364g01-en.pdf) |
| Tornjak | Noir et blanc | Fauve et blanc | [FCI 355](https://www.fci.be/Nomenclature/Standards/355g02-en.pdf) |
| Berger de Brie | Fauve | Noir | [FCI 113](https://www.fci.be/Nomenclature/Standards/113g01-en.pdf) |
| Berger de Picardie | Fauve charbonné | Bringé | [FCI 176](https://www.fci.be/Nomenclature/Standards/176g01-en.pdf) |
| Berger de Russie méridionale | Blanc | Gris clair | [FCI 326](https://www.fci.be/Nomenclature/Standards/326g01-en.pdf) |
| Berger des Abruzzes et de la Maremme | Blanc | Blanc ivoire | [FCI 201](https://www.fci.be/Nomenclature/Standards/201g01-en.pdf) |
| Berger du Caucase | Gris fauve à masque noir | Blanc et fauve | [FCI 328](https://www.fci.be/Nomenclature/Standards/328g02-en.pdf) |
| Berger du Karst | Gris fer | Gris fer foncé | [FCI 278](https://www.fci.be/Nomenclature/Standards/278g02-en.pdf) |
| Berger finnois de Laponie | Noir et feu | Marron et feu | [FCI 284](https://www.fci.be/Nomenclature/Standards/284g05-en.pdf) |
| Berger hollandais | Bringé doré | Bringé argenté | [FCI 223](https://www.fci.be/Nomenclature/Standards/223g01-en.pdf) |
| Berger miniature américain | Rouge merle | Noir tricolore | [FCI 367](https://www.fci.be/Nomenclature/Standards/367g01-en.pdf) |
| Berger polonais de plaine | Gris et blanc | Noir et blanc | [FCI 251](https://www.fci.be/Nomenclature/Standards/251g01-en.pdf) |
| Bichon à poil frisé | Blanc | Blanc nacré | [FCI 215](https://www.fci.be/Nomenclature/Standards/215g09-en.pdf) |
| Bichon bolonais | Blanc | Blanc neige | [FCI 196](https://www.fci.be/Nomenclature/Standards/196g09-en.pdf) |
| Bichon havanais | Fauve et blanc | Chocolat et blanc | [FCI 250](https://www.fci.be/Nomenclature/Standards/250g09-en.pdf) |
| Bichon maltais | Blanc | Blanc ivoire | [FCI 65](https://www.fci.be/Nomenclature/Standards/065g09-en.pdf) |
| Billy | Blanc et orange | Blanc et citron | [FCI 25](https://www.fci.be/Nomenclature/Standards/025g06-en.pdf) |
| Border Terrier | Grisonné et feu | Bleu et feu | [FCI 10](https://www.fci.be/Nomenclature/Standards/010g03-en.pdf) |
| Bouvier appenzellois | Havane marqué de feu et blanc | Noir marqué de feu et blanc | [FCI 46](https://www.fci.be/Nomenclature/Standards/046g02-en.pdf) |
| Bouvier australien courte queue | Rouge moucheté | Bleu moucheté | [FCI 351](https://www.fci.be/Nomenclature/Standards/351g01-en.pdf) |
| Bouvier de l’Entlebuch | Tricolore | Tricolore à feu acajou | [FCI 47](https://www.fci.be/Nomenclature/Standards/047g02-en.pdf) |
| Bouvier des Ardennes | Gris charbonné | Bringé fauve | [FCI 171](https://www.fci.be/Nomenclature/Standards/171g01-en.pdf) |
| Bouvier des Flandres | Gris bringé | Noir | [FCI 191](https://www.fci.be/Nomenclature/Standards/191g01-en.pdf) |
| Brachet allemand | Tricolore | Tricolore à feu roux | [FCI 299](https://www.fci.be/Nomenclature/Standards/299g06-en.pdf) |
