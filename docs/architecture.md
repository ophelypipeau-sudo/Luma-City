# Architecture validée pour P0 et cible d'évolution

Pile P0 validée le 8 novembre 2026 et implémentée. Adaptation locale : PGlite
persistant en l'absence de service PostgreSQL, avec pilote `pg` activé par
`DATABASE_URL`. Les composants ultérieurs restent des propositions, sans engagement
d'hébergement. L'organisation concrète actuelle est décrite dans le README.

## Objectif

Tester tôt la difficulté principale : plusieurs comptes interagissent en temps
réel, avec exactement un personnage actif par compte et des données propres à
chaque personnage. Éviter une interface remplie de fonctions simulées avant
d'avoir prouvé cette base.

## Pile candidate

| Partie | Proposition | Raison et limite |
| --- | --- | --- |
| Client | TypeScript, React et Vite | Interface, accessibilité et itération rapide ; pas de besoin SEO pour le jeu connecté. |
| Scène 2D | SVG dans P0, moteur Canvas tel que PixiJS à réévaluer ensuite | Une salle à 15 avatars permet de commencer simplement ; le choix final dépendra des assets et animations. |
| API et temps réel | Node.js, Fastify et WebSocket | Une application serveur unique pour les règles et les connexions ; les messages réseau sont validés côté serveur. |
| Données | PostgreSQL | Transactions pour l'activité des personnages, les messages, puis les inventaires et transferts. |
| Contrats | Schémas partagés, par exemple Zod | Même format d'événements entre serveur et client ; validation serveur obligatoire. |
| Tests | Tests unitaires du domaine, intégration PostgreSQL, parcours navigateur | Vérifier les invariants, puis les interactions entre deux sessions. |
| Développement | Workspace npm et PostgreSQL local via Docker Compose | Une procédure reproductible ; Docker doit être disponible ou remplacé par une base de développement. |

Ces bibliothèques sont des candidates, sans versions arrêtées. Avant installation,
vérifier leur documentation officielle, leur compatibilité, leurs licences et les
versions maintenues. Aucune performance de production n'est présumée mesurée.

## Structure cible

```text
apps/
  web/src/
    app/                 navigation et session
    features/            personnage, salle, messagerie
    scene/               rendu 2D et commandes de déplacement
    ui/                  composants et thème accessible
  server/src/
    http/                routes et sessions
    realtime/            connexions et diffusion des événements
    application/         orchestration des cas d'usage
    infrastructure/      PostgreSQL, stockage et services externes
packages/
  domain/src/            règles métier sans dépendance au rendu
  contracts/src/         schémas des commandes et réponses
  config/src/            configuration de conception validée ou désactivée
  assets/                créations originales, licences et provenance
db/
  migrations/
  seeds/                 comptes et objets de démonstration uniquement
tests/
  integration/
  e2e/
docs/
```

Cette structure est une cible ; les répertoires vides ne sont pas créés avant
l'implémentation. Le domaine ne dépend ni de React, ni de WebSocket, ni des images.

## Flux de jeu

1. L'API établit une session de compte. Le navigateur reçoit un cookie de session
   HttpOnly, Secure en production et avec une politique SameSite adaptée.
2. Le compte choisit l'un de ses deux personnages. Le serveur vérifie la propriété.
3. Le serveur active le personnage dans une transaction et attribue une génération
   de session de jeu. Toute commande porte cette génération.
4. Une connexion temps réel authentifiée entre dans une salle après contrôle de
   capacité. Le serveur renvoie un instantané puis les événements suivants.
5. Le client envoie des intentions, jamais un solde, un niveau ou une récompense
   faisant autorité. Le serveur valide, applique et diffuse le résultat.
6. En cas de coupure, la reconnexion récupère un nouvel instantané. Les données
   durables viennent de PostgreSQL ; la présence éphémère ne sert pas de sauvegarde.

## Un seul personnage actif par compte

Une ligne `account_play_session` unique par compte porte le personnage actif et
une génération. L'activation verrouille cette ligne et incrémente sa génération.
Les commandes d'une ancienne génération sont rejetées, même si une ancienne
connexion n'a pas encore reçu son événement d'invalidation.

Le changement de personnage retire l'ancien de sa salle avant d'insérer le nouveau.
Une proposition de politique de remplacement de session figure en D03. Le temps
d'expiration de présence après coupure sera configurable et testé ; ce n'est pas
une règle métier déjà validée.

## Modèle de données minimal

| Entité | Contenu et invariant |
| --- | --- |
| Account | Identifiant et informations d'authentification ; pas de solde partagé implicite. |
| Character | Compte propriétaire, emplacement 1 ou 2, pseudo et état propre. Unicité compte/emplacement. |
| AccountPlaySession | Une ligne par compte, personnage actif, génération et expiration. |
| CharacterProgress | XP et niveau propres ; aucun barème définitif dans P0. |
| Room | Capacité de 15 maximum ; thème provisoire, une seule salle technique pour P0. |
| DirectMessage | Expéditeur, destinataire, contenu autorisé, date et identifiant unique de commande. |
| ConversationReadState | Dernier message consulté par destinataire ; calcul du nombre de non-lus. |
| CharacterBlock | Personnage à l'origine du blocage et personnage bloqué. |
| Report | Auteur, cible, motif et référence du contenu signalé ; accès réservé à la modération. |

Les deux emplacements de personnage seront créés ensemble dans une transaction
une fois le parcours de création décidé. P0 peut utiliser des comptes de test
précréés, sans transformer cette facilité en règle d'inscription finale.

Pour la suite : inventaire par instance d'objet, écritures économiques traçables,
looks référant des articles, films et scènes, logements et configurations. Les
transactions vérifieront la propriété et les restrictions VIP avant tout transfert.
La portée VIP et diamants reste indécise : aucun rattachement définitif au compte
ou au personnage n'est proposé dans le schéma P0.

## Commandes temps réel envisagées

| Commande | Vérifications serveur | Réponse ou événement |
| --- | --- | --- |
| `character.activate` | Propriété et génération | Activation et invalidation de l'ancienne session. |
| `room.join` | Personnage actif et capacité | Instantané de salle ou refus explicite. |
| `avatar.move` | Génération, bornes et cadence | Position acceptée et diffusée aux participants. |
| `message.send` | Blocage, format, taille et cadence | Message durable puis accusé de réception. |
| `message.read` | Destinataire et message existant | Compteur mis à jour après consultation. |
| `player.block` | Cible valide et absence d'auto-blocage | Refus des nouveaux messages selon la politique à valider. |
| `player.report` | Référence valide, motif et cadence | Signalement enregistré et confirmation privée. |

Un identifiant de commande stable empêche qu'une reconnexion crée deux messages
identiques. Les réponses ne divulguent pas les messages d'autres conversations.
Les transferts d'objets futurs nécessiteront également idempotence et transactions.

## Configuration des règles

Séparer les constantes validées (deux personnages, quinze occupants maximum,
échanges à partir du niveau 10) des valeurs encore ouvertes. Une valeur inconnue
doit rester absente et désactiver l'action dépendante ; elle ne reçoit pas un prix
ou un taux arbitraire. Les paramètres de démonstration éventuels seront isolés,
étiquetés et exclus de la configuration de production.

## Hébergement et évolution

Pour P0 : environnement local et une instance serveur. Proposition ultérieure :
hébergement managé en région UE avec PostgreSQL, TLS et sauvegardes restaurables.
Le prestataire et les coûts restent à comparer et à valider. Aucun déploiement
public n'est nécessaire pour cette première recette.

Avant plusieurs instances, ajouter une coordination de présence, de capacité et
d'invalidation interserveurs, par exemple via Redis ; ne pas compter sur la seule
mémoire d'un processus. Chaque salle doit avoir une autorité unique ou un mécanisme
d'admission atomique pour garantir les 15 places.

Les images importées nécessiteront un stockage objet, une quarantaine et une vraie
modération avant exposition. Sans prestataire et procédure choisis, l'import reste
désactivé. Les paiements suivent la même logique : aucun faux achat fonctionnel.

## Sécurité à intégrer au développement

Contrôler l'origine des connexions WebSocket, l'accès à chaque ressource, les
formats entrants et les cadences. Afficher le texte comme du texte, sans HTML
utilisateur. Ne pas journaliser mots de passe ou sessions. Prévoir migrations,
sauvegardes, secrets hors dépôt et accès distinct pour la modération.

Ces mesures techniques ne constituent pas une validation juridique. Avant une
ouverture au public, faire vérifier les obligations applicables, la conservation
des données et le dispositif de modération, notamment pour les 16–17 ans.
