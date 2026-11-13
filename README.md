> Nouveau dressing : avec Iris, ouvrir Boutique. Une base unique approuvée et trois vêtements indépendants. Guide et code : [docs/avatar-layers.md](docs/avatar-layers.md).

# Jeu social 2D — prototype P0

Prototype local jouable réalisé après validation de l'architecture et du périmètre
le 8 novembre 2026. « un petit monde » est un libellé de travail et le jardin un
décor provisoire : le nom du jeu et son identité finale restent ouverts.

## Lancer

Prérequis : Node.js 22.12+ ou Node.js 24 et npm. Depuis ce dossier :

```powershell
npm ci
npm run dev
```

Ouvrir **http://127.0.0.1:5173/**. Choisir le compte Aurore puis Iris ou Milo.
Pour jouer à deux, ouvrir une fenêtre privée avec le compte Sacha puis June ou Noa.
On peut aussi utiliser **http://localhost:5173/** pour une seconde session
indépendante dans le même navigateur (cookies distincts par hôte).

Un seul personnage par compte est actif : une nouvelle activation remplace
l'ancienne session de jeu. Deux comptes différents peuvent se retrouver dans la salle.

## Fonctionnalités réalisées

- Interface de jeu plein écran : fond coloré étoilé sur tout l'écran, carte agrandie,
  avatar en trois quarts à gauche et boutons illustrés en haut. Les panneaux sociaux
  s'ouvrent en superposition, avec le même habillage.
- Affichage de monnaie, diamants et barre d'XP en haut à gauche. Les valeurs restent
  « — » : aucun solde, gain ou barème économique n'est inventé dans P0.
- Pastilles Boutique, Ma maison, Salle de chat et Animalerie, avec infobulles au
  survol, au clavier et au toucher. La carte intègre l'animalerie à la place de la
  pâtisserie. La salle de chat et la boutique sont accessibles ; maison et animalerie
  restent des emplacements à venir.
- Boutique avec vêtements isolés à gauche et poupée cartoon de face à droite :
  nouvelle base chauve en sous-vêtements, perruques et vêtements indépendants. Catégories, collections,
  recherche, retrait de pièces, tenues complètes et comparaison avant/après.
- Historique d'essayage en fenêtre récapitulative avec retrait individuel, réessai
  et effacement ; achats désactivés sans prix définis.
- Champ de fond personnalisé HEX marqué VIP, verrouillé pour les comptes de
  démonstration ; aucun statut VIP ni achat n'est simulé.
- Jardin SVG original, avatars illustrés provisoires, déplacement au clic et aux flèches.
- Présence et positions diffusées en WebSocket ; reconnexion automatique après
  coupure réseau et resynchronisation de la salle.
- Deux personnages par compte de démonstration, autorisation et génération de
  session contrôlées côté serveur.
- Messages privés texte/Unicode persistants, y compris hors ligne, avec renvoi
  idempotent et pastille de non-lus indépendante et silencieuse.
- Consultation d'une conversation visible et au premier plan pour la marquer lue.
- Blocage entre personnages, déblocage et signalement enregistré côté serveur.
- Quatre couleurs d'interface indépendantes du personnage, enregistrées localement.
- Mise en page adaptative, accès clavier et gestion du focus des dialogues.

Les conversations restent propres à chaque personnage. Pas de suppression ou
masquage des messages par l'interface. Le blocage bilatéral est un comportement
provisoire du P0, à confirmer avant généralisation.

## Base de données

Sans configuration, **PGlite**, moteur PostgreSQL embarqué côté serveur, enregistre
les données dans `.data/postgres/`. Aucun Docker requis. Les messages, blocages,
reçus de lecture et signalements survivent aux redémarrages. Les sessions de
connexion sont en mémoire : il faut se reconnecter après redémarrage du serveur.

Pour utiliser un service PostgreSQL séparé :

```powershell
docker compose up -d
$env:DATABASE_URL = 'postgres://prototype:prototype@127.0.0.1:5432/social'
npm run dev
```

Le pilote `pg` exécute alors les mêmes requêtes et transactions. L'adaptateur réseau
est fourni ; la recette sur ce poste utilise PGlite, car Docker/PostgreSQL ne sont
pas installés. Les bases PGlite et PostgreSQL séparé ne sont pas synchronisées.
Au démarrage, chaque fichier de `db/migrations/` est appliqué une seule fois, dans
l'ordre des noms, et enregistré dans la table `schema_migrations`. Pour faire évoluer
le schéma, ajouter un nouveau fichier numéroté plutôt que modifier un fichier existant.
Les comptes de démonstration sont créés uniquement hors mode public.

## Vérifier et servir la version construite

Avec Neon Auth activé sur la branche liée, `neon deploy` ajoute
`NEON_AUTH_BASE_URL` et `NEON_AUTH_JWKS_URL` à l’environnement local.
Le formulaire utilise alors l’adresse e-mail pour la connexion et le pseudo
pour la création du personnage. Pour tester ce parcours en local, ouvrir
**http://localhost:5173/**. Le serveur contrôle le jeton Neon avant de créer
une session de jeu. Les fichiers `.env` et `.env.local` sont ignorés par Git.

```powershell
npm test
npm run build
# Après arrêt du serveur de développement :
npm start
```

`npm run build` lance la vérification des poses, le typage, **toute la suite de
tests**, puis Vite : un déploiement Railway échoue si un test échoue
(`npm run build:fast` saute les tests en local). `npm test` passe par
`scripts/run-tests.mjs`, qui retire les réglages de déploiement (`DATABASE_URL`,
`APP_ORIGIN`, `PORT`, variables Railway et Neon…) : sur Railway, ils désignent la
production et les tests ne doivent jamais les voir.

`npm start` sert le client construit et l'API sur **http://127.0.0.1:3001/**.
Les serveurs restent liés à l'adresse de boucle locale. Les ports 5173 et 3001
doivent être libres. Le serveur accepte aussi `PORT`, `APP_ORIGIN` et `LOG_LEVEL`
(voir `.env.example`) ; `.env` puis `.env.local` sont chargés automatiquement.

## Production (Railway)

Le service Railway « Luma city » déploie la branche `main` de ce dépôt
(`npm run build` puis `npm start`). Sur Railway (`RAILWAY_ENVIRONMENT_ID` présent),
le serveur exige `APP_ORIGIN` en HTTPS, `DATABASE_URL` (Neon) et les deux variables
Neon Auth ; il écoute alors sur `0.0.0.0` et refuse tout autre hôte.

- Connexion par e-mail Neon Auth uniquement : les comptes de démonstration sont
  refusés et ne sont pas créés ; ceux d'une ancienne base sont masqués.
- Solde, achats, garde-robe et cadeaux sont calculés et vérifiés par le serveur
  (table `wardrobe_items`). Un joueur ne peut porter ou offrir qu'une pièce possédée.
  Les achats faits avant cette version, restés dans le navigateur, sont importés
  une fois à la connexion et repayés au prix du catalogue.
- Journaux JSON dans la console Railway : erreurs serveur, requêtes refusées et
  requêtes lentes. Les erreurs internes ne sont jamais renvoyées au joueur.
- Présence, salles et sessions de jeu restent en mémoire : garder **une seule
  instance**. Un redéploiement déconnecte les joueurs, qui sont reconnectés par
  leur session Neon.
- L'atelier d'import écrit sur le disque local, effacé à chaque déploiement :
  il n'est utilisable qu'en local.

## Architecture du dépôt

```text
apps/web/src/           Interface React, avatars et scène SVG
apps/server/src/        API Fastify, sessions, WebSocket et accès à la base
packages/contracts/    Schémas réseau et types partagés
packages/domain/       Règles indépendantes du rendu
db/migrations/         Schéma PostgreSQL
tests/                 Recette automatisée API, réseau et persistance
docs/                  Cadrage, décisions, feuille de route et vérification
```

## Périmètre et limites

Comptes précréés sans mot de passe : **démonstration sur ce poste uniquement**.
Hors mode public, le serveur refuse les adresses distantes, les hôtes non locaux et
les origines non autorisées. Ne pas exposer ce mode via un proxy ou un tunnel public.

P0 utilise une instance serveur, une salle et une autorité de présence en mémoire.
Avant plusieurs instances, coordonner présence, admission et invalidations.
Les commandes d'un même compte sont traitées dans l'ordre ; des comptes différents
ne s'attendent plus. Les conversations renvoient les 200 derniers messages
(`?before=<id>` pour les précédents) et la liste de contacts est limitée aux
200 personnages les plus pertinents (relations, conversations, présents, XP). Le déplacement autorise tout le sol de la
salle, sans collisions avec les meubles décoratifs.

Les signalements sont conservés en base, sans tableau de traitement ni équipe
humaine active. Aucun filtre automatique complet ni paiement réel n'est activé :
la monnaie du jeu se gagne (roue, ticket à gratter, quêtes) et se dépense en
boutique, avec un solde tenu par le serveur. L'âge 16+
indique la cible, sans vérification d'âge dans ce P0.

Le décor du jardin est du SVG écrit pour le projet. La carte et les quatre avatars
illustrés en trois quarts sont générés pour le projet et intégrés depuis
`public/assets/`. Les références utilisateur ont guidé l'ambiance et la composition,
sans réutiliser l'interface, la carte ou les personnages d'un autre jeu.
La carte présente un décor ; seul le jardin est accessible dans ce prototype.
Voir [la provenance et les prompts des visuels](docs/visual-assets.md).
La [révision animalerie et pastilles](docs/map-markers.md) documente la retouche
locale de la carte et le contrôle VIP.
Les polices DM Sans et Outfit sont livrées localement via Fontsource et leurs
licences restent dans les paquets ; les icônes viennent de Lucide. Aucun service
externe n'est nécessaire au fonctionnement une fois les dépendances installées.

## Documents

- [Recette et vérifications](docs/verification.md)
- [Boutique, périmètre et prompts des vêtements](docs/shop.md)
- [Base d'avatar et vêtements isolés, nouveaux prompts](docs/paper-doll.md)
- [Architecture proposée et cible](docs/architecture.md)
- [Périmètre P0](docs/prototype.md)
- [Décisions validées et questions restantes](docs/decisions.md)
- [Feuille de route](docs/roadmap.md)
- [Traçabilité du cahier des charges](docs/requirements.md)

Source : `C:/Users/vosma/Downloads/cahier_des_charges_jeu_social_codex.txt`.
Aucune fiche d'inspiration ni base d'avatar n'était fournie dans le dépôt. Les
visuels actuels servent uniquement à la recette technique et pourront être remplacés.

- [Direction artistique cartoon v6 et premiers éléments du dressing](docs/cartoon-v6.md)

## Apparence et morphologies — socle de données

La boutique utilise des pièces à identifiants stables, séparées de l’identité et
du choix corporel. La conservation des pièces et des looks lors d’un changement
de morphologie est testée au niveau des données. Les six corps graphiques ne sont
pas encore calibrés ni sélectionnables ; les essayages restent temporaires.
Voir [le périmètre exact et les adaptateurs](docs/appearance-model.md).

## Tenue pilote — six morphologies

Avec Iris : Boutique → Tenue pilote · 6 morphologies. Le haut, la jupe et les bottes ont six coupes calibrées sur les corps validés ; les pièces peuvent être retirées et la morphologie changée en conservant leurs identifiants. Le bouton Voir le corps compare avec la base en sous-vêtements opaques.

Cet essai est temporaire et distinct de la boutique principale, dont l’historique et les autres vêtements sont conservés. Le pilote couvre trois pièces sur Iris ; l’ensemble de la garde-robe et l’enregistrement des looks restent des étapes ultérieures. Détails : [rendu, calibration et vérifications](docs/proposals/pilot-v6/README.md).
