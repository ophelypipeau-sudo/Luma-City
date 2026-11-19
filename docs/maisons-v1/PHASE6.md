# Phase 6 — accès, invitations et expulsion

Le propriétaire dispose de **Ma maison → Accès & invitations**. Les contrôles sont
vérifiés sur le serveur, aussi bien pour le chargement du décor que pour l’entrée
WebSocket. Le décor, l’inventaire et les personnages ne changent pas quand on
modifie les accès.

## Règles d’accès

- **Publique** : les joueurs autorisés par les règles générales du jeu.
- **Amis uniquement** : les amis confirmés, sans blocage dans aucun des deux sens.
  Une demande d’amitié en attente ne donne aucun accès.
- **Privée** : le propriétaire et ses amis confirmés disposant d’une invitation
  acceptée, non révoquée et non expirée.

Les maisons existantes restent publiques par défaut pour conserver leur comportement
antérieur. Les invitations ne contournent ni le blocage, ni les exclusions, ni la
capacité de la pièce. Le propriétaire conserve l’accès à sa propre maison.
Une maison peut recevoir des visiteurs autorisés même lorsque son propriétaire
est absent.

Le choix est persistant, avec une révision distincte de celle de la décoration.
Une modification sur une ancienne révision est refusée plutôt que d’écraser un
choix plus récent. Rejouer la demande du mode déjà actif est sans effet supplémentaire.

## Invitations nominatives

Le propriétaire choisit un ami confirmé dans le panneau. L’invitation est adressée
à son personnage, sans lien partagé ni jeton transférable. Elle dure **une heure
à partir de son émission**, y compris après acceptation. L’interface affiche
l’heure de fin.

Le bouton **Invitations de maison** est accessible depuis le quartier et les salles.
Il indique les invitations en attente. Le destinataire peut **Accepter et visiter**
ou **Décliner** ; une invitation acceptée conserve un bouton **Visiter** jusqu’à
son expiration. Le propriétaire peut la **Révoquer**. Une invitation refusée,
révoquée ou expirée ne peut pas être réactivée par un ancien accusé ou une nouvelle
acceptation : il faut en émettre une nouvelle.

Les invitations sont persistantes. Une clé de commande protège l’émission contre
un renvoi après perte de réponse ; la même commande ne prolonge pas sa durée.
Une seule invitation en attente ou acceptée reste active par paire de personnages.
Un ami bloqué ou exclu ne peut pas recevoir ni accepter d’invitation.
Le blocage révoque les invitations existantes dans les deux sens, sans les restaurer
automatiquement lors du déblocage.

La boîte et le panneau propriétaire actualisent leurs listes sur les événements
de rafraîchissement existants et toutes les quinze secondes lorsqu’ils sont montés.
Les listes utilisent les relations d’amitié existantes et des requêtes groupées.

## Retrait d’accès et expulsion

Un changement de mode ou une révocation retire immédiatement les visiteurs qui
ne satisfont plus les règles. En maison publique, révoquer une invitation ne retire
pas le droit d’entrée public : pour empêcher le retour, utiliser l’expulsion ou
un mode plus restrictif.

Le propriétaire sélectionne **Expulser**, puis confirme. Le visiteur et son animal
quittent la présence de la maison ; son trajet est arrêté, le client revient au
quartier et reçoit une explication. La connexion reste utilisable pour le jeu.
Ses anciennes invitations sont révoquées. Une exclusion persistante empêche de
rentrer à nouveau, même par identifiant direct, après reconnexion ou redémarrage.

**Autoriser le retour** retire cette exclusion, sans ressusciter les anciennes
invitations. Le visiteur doit toujours satisfaire le mode courant ; une maison
privée nécessite donc une nouvelle invitation acceptée. Un visiteur ne peut pas
expulser le propriétaire ou agir sur la maison d’un autre personnage.

Les admissions et les mutations d’accès partagent la file existante de la maison.
Les commandes de déplacement et de chat revérifient l’autorisation. Un contrôle
serveur toutes les dix secondes retire aussi les visiteurs devenus inéligibles
sans envoyer de commande, notamment lors de l’expiration d’une invitation.
Le blocage applique le retrait après sa transaction, avant la réponse de l’API.

## Données et routes

Migration additive `029_home_access.sql` : mode et révision sur `homes`,
`home_invitations` et `home_exclusions`. Les identifiants de propriétaire des
actions sont déduits du personnage actif, jamais fournis librement par le client.
Les schémas stricts exigent la session et la génération actives.

- `POST /api/housing/access` : réglages de sa propre maison.
- `POST /api/housing/access/update` : mode, invitation, révocation, expulsion ou retour.
- `POST /api/housing/invitations` : invitations valides du destinataire actif.
- `POST /api/housing/invitations/respond` : réponse à une invitation qui lui est adressée.

Les routes de chargement et d’admission appliquent la même politique, y compris
pour un identifiant direct. Les réglages ne donnent aucun droit de décoration
aux invités, et aucun droit sur leurs vêtements ou animaux.

## Recette

Lancer `npx tsx scripts/housing-review.ts --access`. La base isolée est
`.cache/housing-review-v6`, sans utilisation de `DATABASE_URL` ni des autres bases
de recette. Ouvrir Iris sur `http://127.0.0.1:5176/` et June sur
`http://localhost:5176/` pour séparer leurs cookies. Leur amitié et leurs animaux
sont préparés. Les offres d’achat restent fermées dans cette recette.

La vérification couvre les trois modes, les accès HTTP/WebSocket, les demandes
d’amitié en attente, les invitations nominatives, l’expiration, la révocation,
l’expulsion persistante, le retour explicite et le blocage. Les tests des phases
précédentes vérifient encore les achats, le solde, le décor, les trajets et le chat.
Les résultats sont consignés dans `verification-phase6.txt`.

Captures : [invitation reçue](phase6-invitation.jpg),
[maison privée](phase6-acces-prive.jpg),
[confirmation d’expulsion](phase6-expulsion-confirmation.jpg),
[visiteur retiré](phase6-visiteur-expulse.jpg),
[accès sur mobile](phase6-mobile-acces.jpg),
[invitation sur mobile](phase6-mobile-invitation.jpg).

Aucun corps, visage, vêtement ou asset de personnage n’est modifié pour cette
phase. Aucun meuble n’est publié en boutique et aucun déploiement n’est effectué.
