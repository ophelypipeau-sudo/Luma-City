> État actif : dressing à base unique (X approuvé), avec emplacements indépendants top/bottom/shoes. Le choix des six morphologies est suspendu. Voir `avatar-layers.md`. Les sections suivantes décrivent aussi le travail historique conservé.

# Apparence indépendante — première étape

Cette étape part du projet actuel, sans réimport du ZIP. Elle conserve le moteur
cartoon v6, ses assets, ses masques corporels et ses passages avant/arrière.

## État réellement disponible

`apps/web/src/cartoon/appearance.ts` définit une apparence sérialisable :

- `identity.characterId` : identité du personnage.
- `body` : sélection corporelle indépendante.
- `equipped` : identifiants stables des hauts, bas, chaussures, perruques et
  accessoires. Les accessoires sont des pièces distinctes, pas un masque de bits.
- `looks` : instantanés des pièces d'une tenue, sans copie du corps ni de l'identité.
- `schemaVersion` : version du contrat de données, distincte de la version artistique.

La boutique utilise maintenant cette structure en mémoire. Ses contrôles et le
moteur v6 passent par un adaptateur de compatibilité. L'historique conserve ses
anciens identifiants et son comportement. Les essayages restent temporaires.

Les fonctions `saveLook` et `applyLook` sont testées, mais il n'existe encore ni
interface pour enregistrer un look personnel, ni stockage de ces looks. L'onglet
Tenues contient toujours les trois ensembles prédéfinis. Les portraits et les
salles gardent encore leur tenue fixe. Aucun stockage utilisateur n'est migré ou effacé.

## Identité des pièces

`catalog.ts` ajoute `pieceId` à chaque entrée. L'ancien `id`, contenant le
personnage, reste un alias pour les cartes et l'historique existants.

Exemple : `pleated-skirt.ivory` correspond à la variante 1 chez Iris et à la
variante 0 chez June. Il s'agit de la même pièce, pas du même numéro de variante.
Changer la morphologie ne transforme donc jamais la jupe ivoire en jupe denim.
Une coupe différente possède une autre identité : camisole et cardigan, bottes
à lacets et bottes à boucles ne sont pas confondus.

## Morphologies et disponibilité graphique

`model.ts` déclare X, A, O, H, V et 8 comme sélections possibles au niveau des
données. Les corps actuels gardent les profils explicites `v6-feminine` et
`v6-masculine` : aucune morphologie ne leur a été attribuée arbitrairement.

`changeMorphology` ne change que `body` et conserve l'identité, les pièces et les
looks. Il n'effectue aucune déformation et ne présume pas qu'une coupe existe.

Les six corps ont été validés. Une tenue pilote complète est calibrée et sélectionnable dans la boutique d’Iris. Elle utilise le même contrat AvatarAppearance et les mêmes identifiants stables. Le rendu historique reste un adaptateur distinct, et toute pièce non calibrée est refusée sans suppression ni substitution.

L'étape graphique devra fournir des profils et des coupes utilisant les mêmes
repères dans `CartoonDoll`, `BodyCoverage`, `geometry` et `Wardrobe`. Le visage,
la carnation et l'identité devront rester indépendants du profil corporel. Les
six morphologies ne doivent pas être simulées en étirant tout le PNG existant.

## Références réellement accessibles

Les deux images locales rouvertes pendant l'analyse sont la poupée blonde
(`codex-clipboard-10276a72-219e-4244-bbbd-8b363e9c0a9d.png`) et le personnage
chauve MovieStarPlanet (`codex-clipboard-9a8797d9-60c4-4ec2-9cf0-ecbc7436e757.png`).
Les assets v6 et captures actuelles sont dans le projet. Les six nouvelles illustrations ont depuis été validées par l’utilisateur et sont conservées dans proposals/morphologies-illustrated-v2/. Aucun fichier
manquant n'a été présenté comme une référence observée.

## Vérification

- `tests/appearance.test.ts` : 12 tests, dont les combinaisons de pièces v6 sur
  les quatre personnages, les six morphologies dans les deux sens, la conservation
  des looks, les identifiants partagés, les coupes absentes et l'absence de mutation.
- Chaque personnage est vérifié sur 1 024 combinaisons de vêtements, perruques et
  accessoires, avec aller-retour entre la nouvelle structure et le rendu v6.
- Suite complète actuelle : 43 tests réussis. Compilation TypeScript/Vite réussie.
- Contrôle dans la boutique : essayage de trois pièces, combinaison des trois
  accessoires, historique, retrait et comparaison. Capture :
  `screenshots/boutique-appearance-etape1.jpg`.

## Proposition visuelle suivante

Une première planche des six corps est disponible dans `proposals/morphologies-v1/`.
Elle réutilise la même identité Iris et de nouveaux contours SVG indépendants.
Elle attend la validation explicite des corps avant adaptation de la tenue pilote.
Les six coupes du dressing ne sont pas encore disponibles dans le moteur actif.

## Pilote intégré

Le module MorphologyPilot utilise les six corps approuvés et trois pièces calibrées. Le contrat ne change pas : identity, body, equipped et looks restent séparés. Le changement de morphologie conserve la même référence des équipements et des looks ; retirer une pièce puis changer de corps la garde retirée. L’adaptateur legacy continue de refuser les profils de morphologie, qui passent par MorphologyDoll. Les pièces non calibrées ne sont jamais remplacées automatiquement.

Le pilote est un essai distinct dans la boutique ; son ouverture préserve l’essayage et l’historique principaux. Il ne constitue pas encore la sauvegarde d’une apparence portée dans les salles ou les portraits. Ces derniers utilisent toujours leur tenue fixe. L’interface de looks enregistrés reste séparée comme demandé.
