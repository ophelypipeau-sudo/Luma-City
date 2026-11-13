# P0 — proposition de prototype jouable limité

Statut : périmètre validé le 8 novembre 2026 et P0 réalisé. La recette effective et
ses limites sont consignées dans `verification.md`. But : prouver une vraie boucle
sociale à deux comptes, sans simuler boutique, paiements ou communauté existante.

## Parcours de recette

1. Lancer la base, le serveur et le client avec une procédure documentée.
2. Ouvrir deux sessions navigateur indépendantes, chacune avec un compte de test
   et deux personnages de démonstration.
3. Choisir un personnage puis rejoindre une salle technique au décor original
   provisoire. Le compte choisit librement la couleur principale de son interface.
4. Déplacer son avatar avec le clavier ou en pointant une destination ; voir le
   déplacement de l'autre compte sans recharger la page.
5. Envoyer un message privé textuel. Le destinataire le consulte et son compteur
   de non-lus se met à jour sans son ni fenêtre intrusive.
6. Déconnecter le destinataire, lui envoyer un message, puis le reconnecter : le
   message l'attend et le compteur correspond aux messages réellement non lus.
7. Changer de personnage sans déconnecter le compte ; vérifier l'isolement des
   conversations et le retrait de l'ancien avatar de la salle.
8. Bloquer ou signaler un personnage avec confirmation discrète. Aucun historique
   global de notifications n'est introduit.

## Inclus

- Authentification de développement avec comptes précréés, limitée au local.
- Deux personnages par compte, sélection et autorité serveur sur le personnage actif.
- Une salle de test, capacité maximale 15 ; les 2 ou 3 salles du lancement restent
  une étape ultérieure. Ce prototype n'est pas présenté comme le lancement.
- Avatars 2D provisoires et distincts, sans reprise d'assets d'un autre jeu.
- Déplacement, présence et reconnexion avec resynchronisation.
- Messages privés texte uniquement dans P0, persistants et non supprimables depuis
  l'interface ; les GIF, emojis et stickers enrichis arrivent ultérieurement.
- Pastille de messagerie chiffrée, indépendante, silencieuse.
- Blocage minimal et enregistrement de signalements. Aucune prétention de
  modération automatique complète ou de service humain déjà opérationnel.
- Choix de couleur d'interface indépendant du personnage ; contraste lisible et
  repères autres que la couleur pour les états.

## Hors P0

Inscription publique, récupération de compte, import d'images, achats et VIP,
inventaire, récompenses, classement, échanges, cadeaux, logement, films et arcade.
Leur absence dans P0 ne retire aucune exigence du jeu final.

Pas de faux amis connectés, de réponse automatique présentée comme humaine, de
boutique qui ne livre rien ou de bouton de paiement simulant un achat réel.

## Critères d'acceptation

| ID | Vérification observable |
| --- | --- |
| P01 | Deux comptes distincts voient leurs déplacements respectifs dans la même salle. |
| P02 | Une commande d'un compte ne peut activer le personnage d'un autre compte. |
| P03 | Deux activations simultanées du même compte ne laissent jamais deux personnages actifs. |
| P04 | Une commande d'ancienne génération ne produit aucun mouvement ou message. |
| P05 | La seizième entrée est refusée ; deux demandes concurrentes pour la dernière place ne dépassent pas 15. |
| P06 | Un message hors ligne est visible après reconnexion et redémarrage serveur. |
| P07 | Réessayer la même commande après perte d'accusé ne crée qu'un message. |
| P08 | Une session tierce ne peut ni lire ni marquer comme lus les messages d'une autre conversation. |
| P09 | Consulter les nouveaux messages retire la pastille ; une simple ouverture sans affichage des messages ne les marque pas tous lus. |
| P10 | Un blocage interdit les nouveaux messages dans le périmètre validé ; les anciens restent consultables. |
| P11 | Un signalement persiste et n'est pas exposé aux autres joueurs. |
| P12 | Les caractères HTML dans un message s'affichent sans exécuter de code. |
| P13 | La déconnexion enlève la présence après le délai technique configuré ; la reconnexion n'ajoute pas de doublon. |
| P14 | Changer de personnage charge ses conversations propres et invalide l'ancienne session de jeu. |
| P15 | Le choix du thème reste utilisable au clavier et l'interface reste lisible sur petit écran. |

## Livraison attendue après validation

Sources, migrations, données de test identifiées, configuration exemple sans secret,
commande de lancement, tests des invariants et guide de recette à deux sessions.
La recette précisera les navigateurs et tailles d'écran réellement vérifiés.

Les limites de taille des messages, de cadence et de déconnexion sont des paramètres
techniques de démonstration à documenter ; elles ne remplacent pas les futures
règles de modération ou de conservation des données.
