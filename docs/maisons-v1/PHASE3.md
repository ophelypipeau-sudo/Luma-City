# Phase 3 — déplacement au clic et compagnon

Le salon utilise maintenant des trajets calculés par le serveur et interpolés
dans le navigateur. Cliquer ou toucher une zone libre fait glisser le personnage
vers cette destination, en contournant les meubles qui bloquent le passage.
Les flèches restent disponibles. Le personnage conserve sa pose frontale statique.

## Comportement

- La destination doit appartenir au sol accessible et être libre. Une destination
  occupée est refusée avec « Cet emplacement est inaccessible. Choisis une zone
  libre au sol. » Un clic invalide n’interrompt pas un trajet valide déjà en cours.
- Un nouveau clic pendant un déplacement repart de la position courante calculée
  par le serveur. Le personnage ne se téléporte pas à l’ancienne destination et
  sa vitesse ne dépend pas du nombre de clics.
- Le personnage s’arrête à la destination exacte. La superposition avec les meubles,
  les bulles et l’animal est recalculée pendant le trajet.
- Entrer en mode Décoration arrête le déplacement. Sélectionner ou déplacer un
  meuble ne fait pas marcher le personnage. Le brouillon de décoration n’altère
  pas la géométrie publique avant sa sauvegarde.
- Après une sauvegarde, les personnes déjà présentes restent connectées. Le serveur
  recalcule les trajets avec les nouveaux obstacles. Si une destination est devenue
  occupée, le trajet s’arrête ; si un meuble couvre la position actuelle, le serveur
  replace le personnage sur un point libre proche.
- Une décoration qui ne laisse aucun point de sol navigable est refusée avant commit.

## Animal équipé

Le compagnon provient des données d’équipement existantes (`Presence.companion` et
collection équipée locale). Son identifiant de modèle, son pelage et son nom restent
ceux de l’animalerie. Il apparaît avec le propriétaire, suit la même translation
et reste à proximité des pieds. Le même rendu fonctionne pour les visiteurs.

La taille d’affichage utilise les proportions existantes de la race, adaptées à
l’échelle validée de l’avatar en maison. Le décalage près du bord droit est continu,
pour éviter un basculement brutal d’un côté à l’autre. Les WebP existants de
l’animalerie sont réutilisés. Il n’y a ni animation squelettique ni déplacement
autonome ni pathfinding séparé pour l’animal ; il partage le groupe de son propriétaire.

Les corps, visages, vêtements et assets des avatars ne sont pas modifiés. Le groupe
garde l’échelle 1,6 déjà validée. Seule sa translation change. Le composant Avatar
est mémorisé pour ne pas recalculer ses calques à chaque image de déplacement.

## Navigation et synchronisation

- Repère commun : 1000 × 680. Sol accessible : x de 70 à 930, y de 438 à 634.
  Les positions historiques de présence restent en pourcentages ; les trajets
  utilisent explicitement les unités de la pièce.
- Obstacles : empreinte au sol des meubles `blocksMovement`, augmentée d’une
  marge de 18 unités horizontales et 12 verticales pour les pieds. Tableaux,
  miroirs et tapis ne bloquent pas la marche. L’ordre visuel avant / arrière ne
  permet pas de supprimer la collision d’un meuble.
- Grille invisible de 10 unités, A* avec voisins diagonaux. Chaque segment est
  contrôlé par intersection exacte avec les rectangles d’obstacles, y compris
  pendant le lissage ; aucune coupe de coin n’est autorisée.
- Vitesse serveur : 160 unités de pièce par seconde. Le serveur détermine le
  départ, le chemin et l’heure de départ. Un client ne fournit ni chemin ni vitesse.
- Les nouvelles commandes `home-move` et `home-stop` vérifient la session active,
  sa génération et la pièce courante. Les anciennes commandes `move` envoyées en
  maison passent aussi par la navigation : elles ne permettent pas de contourner
  les collisions ou de se téléporter.
- Le WebSocket existant transporte le descripteur du trajet dans `Presence.motion`
  et l’heure du serveur dans les instantanés `room`. Aucun second transport ni
  second système de présence n’est créé. Un nouvel arrivant reçoit également le
  trajet déjà en cours et une position échantillonnée cohérente.
- Le navigateur utilise `requestAnimationFrame` et la même fonction d’échantillonnage
  que le serveur. Il n’applique pas la transition CSS de 160 ms des salons publics
  par-dessus cette interpolation. Les salons publics conservent leur comportement.
- Le serveur confirme les arrivées ; son intervalle est nettoyé à l’arrêt. Les
  boucles d’animation sont annulées au démontage ou après arrivée. Une coupure et
  un changement de salle utilisent les nettoyages de présence existants.
- Déplacement, admission et sauvegarde d’une maison passent par la même file de
  pièce. Le remplacement de la géométrie et sa notification suivent le commit.
- Les conversions écran → scène utilisent l’inverse de `getScreenCTM()` ; le
  redimensionnement ne change ni les obstacles ni les coordonnées sauvegardées.
  Une tolérance de 0,0000001 unité évite les faux refus au bord après conversion
  en pourcentages (438 / 6,8 × 6,8 produit une petite erreur flottante).

## Fichiers principaux

- `packages/domain/src/home-navigation.ts` : grille, collisions, recherche, lissage
  et échantillonnage temporel partagés.
- `apps/server/src/home-navigation.ts` : trajets de la présence existante,
  admission sûre, arrêt et recalcul après changement de décoration.
- `apps/web/src/housing/useRoomMotion.ts` et `Room.tsx` : interpolation du groupe,
  profondeur dynamique et rendu du compagnon.
- `packages/contracts/src/housing.ts` et `index.ts` : types des trajets et commandes.

Aucune migration SQL ni dépendance supplémentaire. Les meubles restent hors boutique.

## Vérification

Tests automatisés : détour réel autour d’un canapé, segments ne coupant aucun
obstacle, arrêt exact, destination bloquée, bord et mur, passage totalement fermé,
diagonales, tapis et tableau non bloquants, changement de destination à vitesse
constante, arrêt explicite, conversion en pourcentages, remplacement du décor et
refus d’un ancien instantané de géométrie. Les tests WebSocket couvrent aussi le
trajet partagé, un troisième joueur arrivant en cours de route, le compagnon équipé,
les vêtements partagés, le refus d’une ancienne commande de téléportation,
le repositionnement après sauvegarde et le départ d’un visiteur.

Le test de rendu compare les images d’avatar avant, pendant et après le trajet :
les calques restent identiques et l’animal conserve son nom dans le même groupe.
Les résultats de compilation et de la suite complète sont dans `verification-phase3.txt`.

Recette navigateur sur `.cache/housing-review` : Iris avec le Spitz roux « Nuage »,
équipé par le parcours existant de l’animalerie sur le compte de démonstration local.
Déplacement au clic, refus d’un clic sur l’empreinte du canapé, détour devant la
table, arrivée, interruption en ouvrant Décorer et tap sur une zone libre à
390 × 844. Le passage en Décoration a immobilisé Iris à (334,964 ; 525,220) ;
le tap mobile suivant a abouti à (836,898 ; 616,738), avec Nuage toujours présent.
La capture `phase3-mobile-iris-nuage.jpg` conserve le résultat mobile.
Un essai sur un appareil tactile physique reste à prévoir lors de la recette finale.

Invitations, niveaux d’accès et expulsion restent les étapes suivantes. La présence
reste hébergée par l’instance serveur unique déjà utilisée par Luma City.
