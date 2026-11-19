# Maisons Luma City — audit et proposition 01

19 novembre 2026. **Direction artistique, meubles et échelle d’Iris validés par l’utilisateur.**
La phase 1 ci-dessous conserve l’audit et la proposition d’origine.
L’implémentation de la phase 2 est décrite dans [PHASE2.md](PHASE2.md).
Le déplacement fluide avec obstacles et compagnon est décrit dans [PHASE3.md](PHASE3.md).
Les visites, les déplacements partagés et la discussion sont décrits dans [PHASE4.md](PHASE4.md).
Les achats en recette locale et l’inventaire sont décrits dans [PHASE5.md](PHASE5.md).
Les modes d’accès, les invitations et l’expulsion sont décrits dans [PHASE6.md](PHASE6.md).
La [recette complète ordinateur et mobile](RECETTE-COMPLETE.md) consigne les corrections, les scénarios et les captures.
Les meubles restent hors boutique. Les modifications déjà présentes dans le dépôt sont conservées.

## Direction artistique proposée : Prune & lumière

Salon illustré de face : velours prune fumée, bouclette ivoire, chêne clair,
laiton champagne et feuillage sauge. Lumière douce venant du haut à gauche,
matières détaillées, contours discrets, ombres de contact. Fenêtre cintrée et
moulures fines, avec un premier plan libre pour les personnages et les animaux.
Le vocabulaire de décoration libre est celui demandé ; les dessins sont originaux.

- `salon-concept-v1.png` : proposition d’ambiance par ImageGen, sans personnage.
- `meubles-planche-v1.png` : proposition des dix meubles, à valider ensemble.
- `salon-iris-v1.png` : aperçu avec le véritable composant `Avatar` du projet.
- `salon-iris-mobile-v1.png` : même composition à 390 pixels de large.
- `salon-iris-v1.svg` : composition autonome contenant les images du rendu.
- `prompts.json` : prompts complets et provenance des images.

Le salon généré est une **composition de présentation** : ses meubles sont encore
fusionnés dans l’image. Après validation, produire un fond vide et des meubles
transparents indépendants, avec les mêmes matières et le même éclairage.
La planche est un guide de dessin, pas une feuille de sprites à découper pour publication.
Les revêtements finaux devront séparer mur, sol, éclairage et architecture fixe.
La géométrie de la pièce restera identique entre les variantes de revêtement.

L’aperçu Iris emploie `Avatar.tsx` → `CartoonDoll` → `LayeredDoll`, la base active
et les calques existants, sans génération ni retouche du personnage. Tenue de
démonstration : `DEFAULT_LAYERS` et carré de départ `fashion.hair-v3-01-carre`.
Il ne prétend pas reproduire la tenue d’une session connectée. Dans le jeu, conserver
`Presence.outfit`, les calques locaux équipés et `Presence.companion`.
L’avatar est affiché à 1,6 fois sa taille actuelle de salon public pour l’accorder
à la hauteur du mobilier. Ce réglage concerne la composition de présentation,
sans modification du composant ; son échelle reste à valider avec la pièce.
Reproduire les aperçus avec `npx tsx docs/maisons-v1/render-preview.tsx`.
Ce sont des rendus statiques ; le petit format ne constitue pas une recette tactile.

La collection proposée comprend : 01 canapé, 02 fauteuil, 03 table basse,
04 tapis, 05 lampadaire, 06 plante, 07 bibliothèque, 08 miroir mural,
09 tableau, 10 meuble de rangement. Aucun prix ni article publié.

## Audit du code existant

Le code actuel est la source de cet audit. Plusieurs sections du README général
décrivent encore des étapes historiques et sous-estiment les fonctions présentes.

| Domaine | Existant vérifié | Réutilisation / manque |
| --- | --- | --- |
| Client | React 19, TypeScript, Vite 7 ; `apps/web/src/main.tsx` | Ajouter une vue maison dans la navigation actuelle. |
| Rendu | Scène SVG `Room.tsx`, `viewBox="0 0 1000 680"` ; images de décor | Garder le repère, composer des illustrations PNG/WebP indépendantes. |
| Avatars | `Avatar.tsx`, `cartoon/CartoonDoll.tsx`, `avatar/LayeredDoll.tsx`, `avatar/worn-outfits.ts` | Garder corps, visage, pose frontale et vêtements actuels ; déplacer le groupe entier. |
| Maisons | `homeRoom`, `homeOwner`, `RoomId` dans les contrats ; `chat-rooms.ts`, entrée depuis le profil dans `main.tsx` | Une maison sociale existe déjà par personnage, avec un décor CSS provisoire ; aucune décoration persistante. |
| Présence | Fastify 5 + `@fastify/websocket`, `presence`, `clients`, `room()` dans `apps/server/src/app.ts` | Un seul transport pour salons et maisons ; remplacement de connexion, départ et contrôle de session existants. |
| Déplacement | `move` et `join-room` dans les contrats ; clic SVG et flèches dans `Room.tsx` | Coordonnées réseau en pourcentage, limites serveur ; transition CSS de 160 ms. Pas de chemin ni de collision avec les meubles. |
| Chat | `RoomChat.tsx`, `RoomDrawer.tsx`, bulles de `Room.tsx`, `publishChat` serveur | Historique en mémoire de 40 messages, limite de 280 caractères, temporisation et filtrage des blocages. Pas de modération automatique complète. |
| Amis / modération | `FriendsPanel.tsx`, `profile_relations`, `blocks`, signalements et routes sociales | Utiliser les amitiés acceptées et le blocage bilatéral ; invitation de maison et expulsion à ajouter. |
| Persistance | `apps/server/src/db.ts`, migrations SQL versionnées | PostgreSQL avec `pg` si URL fournie, PGlite local sinon ; transactions communes. Aucun changement de fournisseur nécessaire. |
| Inventaire | `wardrobe_items` par personnage, `item_key`, `createWardrobe` | Réutiliser les conventions d’identité et les contrôles, mais pas transformer des meubles en vêtements. |
| Monnaie | `rewardWheel`, `wardrobe.balance`, `spent` et achats transactionnels | Solde partagé au niveau du compte, inventaire au niveau du personnage. Gains moins dépenses calculés par le serveur : aucun portefeuille à réinventer. |
| Animalerie | `companions.ts`, table `companions`, `OwnedCompanion`, `Presence.companion`, `RoomCompanion` | Animal équipé déjà affiché près de son propriétaire, pelage et nom conservés, diffusion lors du changement d’équipement. |
| Interface | `game-shell.css`, `quartier.css`, `RoomDrawer`, thèmes, DM Sans / Outfit, Lucide | Conserver l’habillage violet et les panneaux contextuels ; adapter le mode décoration au mobile. |
| Capacité | `ROOM_CAPACITY = 15` dans `packages/domain/src/rules.ts` | Valeur actuelle, pas une nouvelle limite validée pour les maisons ; rendre configurable par pièce et mesurer avant d’en fixer la valeur finale. |

Les maisons contrôlent actuellement l’existence du propriétaire et le blocage,
mais pas les niveaux public / amis / privé. La décoration, les exemplaires de
meubles, les invitations, les expulsions et leur persistance sont à développer.
Le chat et les présences restent en mémoire : l’architecture actuelle exige une
seule instance serveur, y compris après ajout des maisons.

## Architecture proposée

Conserver React + SVG + Fastify + les contrats partagés + la base actuelle.
Extraire seulement les fonctions maison nécessaires, sans refondre les salons.

### Organisation prévue

- `packages/contracts/src/housing.ts` : schémas Zod de sauvegarde, accès,
  invitations, catalogue, placements et événements réseau.
- `packages/domain/src/housing.ts` : géométrie, ancrages, validation des placements,
  profondeur et navigation 2D, sans dépendance au rendu.
- `apps/server/src/housing.ts` et `housing-routes.ts` : requêtes et routes,
  injectées avec les contrôles de session, transactions et notifications existants.
- `apps/web/src/housing/` : vue maison, panneau d’inventaire, revêtements et
  outils contextuels, en réutilisant les avatars, animaux et composants de chat.
- Une nouvelle migration numérotée après la dernière disponible **au moment
  de l’implémentation** ; ne pas modifier les migrations historiques.

### Entités à ajouter, sans dupliquer les données sociales

| Entité proposée | Champs et invariants principaux |
| --- | --- |
| `homes` | UUID, `owner_character_id` FK, nom, accès public / friends / private. V1 : un logement par personnage ; identité stable permettant une extension ultérieure. |
| `home_rooms` | UUID, `home_id`, type, dimensions logiques, revêtements, capacité configurable, accès ouvert / verrouillé, révision entière. Une seule pièce salon créée en V1. |
| Catalogue de meubles | Définition partagée versionnée : modèle, catégorie, image, taille logique, ancrage, placement wall / floor / rug / surface, empreinte, collision, surfaces compatibles, prix nullable et publication désactivée tant que non validée. |
| `furniture_items` | UUID d’exemplaire, personnage propriétaire, modèle, date d’acquisition. Plusieurs exemplaires d’un modèle possibles. |
| `furniture_placements` | `item_id` UNIQUE sur toutes les pièces, `room_id`, x/y, échelle autorisée, profondeur, retournement autorisé, surface parente optionnelle. Aucun placement signifie rangé, pas supprimé. |
| `furniture_purchases` | Reçu immuable : compte payeur, personnage, modèle, prix serveur figé, clé d’idempotence unique par compte, exemplaire attribué. |
| `home_invitations` | Maison / pièce, émetteur propriétaire, destinataire personnage ami, état, expiration, acceptation / refus ; portée et révocation explicites. |
| `home_room_exclusions` | Expulsion / exclusion du visiteur pour empêcher une rentrée immédiate par identifiant direct ; levée explicite possible. |

Ne pas créer de nouvelle table de présence, d’amis, de messages de salon,
de personnages, d’animaux ni de nouvelle monnaie. `home:<characterId>` reste
l’alias du salon principal : le serveur le résout vers la pièce persistante.
Les futurs identifiants de pièces seront des UUID résolus et autorisés côté
serveur. Étendre le schéma `RoomId` uniquement quand ces pièces seront ajoutées.

Le reçu d’achat doit entrer dans **le même calcul `spent`** que vêtements et
animaux. Une dépense reste enregistrée quand le meuble est rangé. Verrouiller
le compte avec `FOR UPDATE`, vérifier le solde et le catalogue côté serveur,
insérer reçu et exemplaire dans une transaction. Un nouvel essai avec la même
clé retourne le même reçu ; des paramètres différents avec cette clé sont refusés.
Deux achats de modèles identiques avec des clés distinctes créent deux exemplaires.
Prix non validé ou article non publié : achat impossible, sans prix de secours.

### Coordonnées, profondeur et déplacement

Conserver le canevas de scène 1000 × 680 et ses conversions réseau actuelles
`x * 10`, `y * 6.8`, avec un point d’ancrage aux pieds. Utiliser l’inverse de
`getScreenCTM()` pour la souris et les Pointer Events tactiles. Garder les
proportions de toute la scène sur mobile ; ne pas rogner une partie du sol.
Les visuels de ce dossier sont une proposition : les masques mur / sol et les
limites de déplacement seront calibrés sur le fond vide définitif.

Un modèle définit largeur, hauteur, ancrage, bande de placement et polygone
d’occupation. Pas d’étirement des textures ; échelle bornée par modèle.
Ordre de rendu : architecture et mur → objets muraux → sol et tapis →
meubles et personnages triés sur leur ancrage au sol → bulles et sélection.
Le réglage avant / arrière reste borné à sa bande ; il ne permet pas de passer
un tapis devant un personnage. Prévoir des calques avant / arrière pour les
meubles qui l’exigent, ainsi qu’un point de support pour de futurs petits objets.

Navigation : grille interne invisible et A* avec simplification du chemin,
obstacles gonflés par le rayon du personnage. Le serveur valide destination,
trajet, vitesse et départ courant ; le client ne fournit pas une téléportation.
Diffuser chemin confirmé, heure serveur, vitesse et révision du décor sur le
WebSocket existant. Interpoler le groupe avatar + animal ; aucun changement
de pose, visage ou vêtement. Une nouvelle destination repart de la position
courante. Fournir une position cohérente aux nouveaux arrivants en cours de trajet.
En mode décoration, les interactions de placement ne déclenchent aucun déplacement.

### Sauvegarde et concurrence

Sauvegarde explicite « Enregistrer » pour la V1 ; brouillon local et bouton
« Annuler ». Afficher « Modifications non enregistrées », puis « Enregistrement… »,
puis le succès uniquement après confirmation du serveur. Un échec conserve le
brouillon et présente une erreur réessayable. Signaler les modifications non
enregistrées avant de quitter ; une fermeture forcée ne garantit pas le brouillon.
Les modifications déjà confirmées restent persistantes.

Envoyer un instantané complet avec `expectedRevision` et une clé d’opération.
Dans une transaction : vérifier propriétaire actif, verrouiller la pièce et les
exemplaires concernés, vérifier propriété et unicité inter-pièces, limites,
revêtements autorisés, volume maximal et révision, puis remplacer les placements
et incrémenter la révision. Un conflit laisse le brouillon intact et propose
un rechargement explicite. Dimensionner la limite HTTP pour cet instantané borné :
la limite générale actuelle de 8192 octets ne doit pas tronquer un salon chargé.

Après commit seulement, notifier `home-layout` aux clients déjà présents sur le
WebSocket existant. Remplacer le décor d’une révision en une fois ; une reconnexion
recharge la dernière révision depuis le serveur. Si le placement bloque un joueur,
recalculer une position accessible et son trajet sous autorité serveur, sans
déconnexion. Séquencer admissions, changements d’accès, expulsions et mises à jour
de géométrie par pièce : les files actuelles par compte ne suffisent pas à elles seules
pour ces opérations concurrentes entre plusieurs comptes.

### Accès, invitations et protections

Une fonction commune `canEnterHome` doit servir pour lecture, entrée directe,
acceptation d’invitation et reconnexion. Priorité aux règles générales, blocages
et exclusions ; ensuite propriétaire, accès public, amitié acceptée ou invitation
explicitement valide. Un lien ou UUID ne constitue jamais une autorisation.
Proposition : invitation acceptée = exception nominative temporaire, y compris en
privé ; l’interface doit annoncer cette exception. Révoquer les invitations lors
d’une fermeture explicite sans exceptions. Une maison nouvellement créée commence
privée ; la transition des maisons existantes sera présentée avant migration.

« Inviter » utilise les amis existants et une notification typée sur le même
WebSocket, avec invitation persistante pour les absents ; aucune nouvelle liste
d’amis ni message privé automatique. Vérifier de nouveau accès et capacité à
l’acceptation. Expulser est réservé au propriétaire ; retirer le visiteur de la
présence, l’envoyer vers un salon disponible et contrôler les réentrées.
Un blocage ou durcissement d’accès réévalue aussi les visiteurs déjà présents.
Les autorisations d’achat sont celles du personnage acheteur ; elles n’accordent
jamais le droit de décorer la maison visitée.

## Déroulé après validation

1. **Décoration** : fond vide, masques mur / sol, premiers meubles indépendants,
   inventaire d’exemplaires, manipulation tactile, couches et sauvegarde confirmée.
2. **Navigation** : avatar existant, clic / toucher, obstacles, interpolation et
   animal équipé ; contrôles côté serveur.
3. **Visites** : réutilisation du transport, arrivée / départ, instantanés,
   apparence, animaux, chat et diffusion des révisions de décor.
4. **Achats** : catalogue et prix validés, reçus, solde partagé, idempotence.
5. **Finalisation** : interfaces d’accès, invitations, expulsions, recette mobile,
   performance et sécurité. Les contrôles d’autorisation sont intégrés dès les
   premières routes, même si leurs interfaces arrivent à cette étape.

Chaque phase doit être testable avant la suivante. Pas de publication de meubles
ni de déploiement à partir de ces propositions.

## Recette prévue et portée de la vérification

La phase 1 ne certifie pas un système de décoration fonctionnel. Les tests exécutés
ici portent sur la base existante ; leur résultat figure dans `verification.txt`.

| Domaine futur | Cas essentiels avant de déclarer la V1 fonctionnelle |
| --- | --- |
| Décoration | Ajouter, déplacer, ranger sans supprimer, réutiliser, mur / sol, couches, objet mural, reconnexion et redémarrage serveur ; même exemplaire refusé dans deux pièces. |
| Sauvegarde | Erreur réseau, accusé perdu et renvoi idempotent, double onglet et conflit de révision, propriétaire incorrect, instantané excessif, nouvelle révision visible aux visiteurs. |
| Déplacement | Destination accessible, hors limites et obstacle refusés, détour, arrêt exact, nouvelle destination en mouvement, arrivée d’un visiteur pendant le trajet, coordonnées après redimensionnement. |
| Multijoueur | Deux comptes et plusieurs visiteurs, vêtements et animaux visibles, arrivée / départ / reconnexion / coupure soudaine, chat et blocage, capacité sous admissions simultanées. |
| Accès | Public / amis / privé, amitié en attente refusée, identifiant direct, invitation expirée / refusée / révoquée, capacité atteinte, expulsion et réentrée, blocage pendant une visite. |
| Commerce | Fonds insuffisants, prix client ignoré, prix non validé refusé, débit et attribution atomiques, deux personnages partageant un solde, renvoi après délai réseau, exemplaires multiples et propriété. |
| Mobile | 390 px et tablette, toucher pour marcher, glisser au doigt avec capture du pointeur, annulation de geste, panneaux repliables, aucune navigation en mode décoration, pas de déformation. |

**Validation attendue :** ambiance Prune & lumière, niveau de détail des matières,
dessin des dix meubles, échelle et lisibilité d’Iris dans la pièce.
Cette validation porte sur les visuels de présentation avant production des
assets définitifs, conformément au cahier des charges fourni.
