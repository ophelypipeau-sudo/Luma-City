# Feuille de route proposée

Les étapes sont ordonnées par dépendances. Aucune date ni estimation budgétaire
n'est engagée avant validation du périmètre, des références et des moyens.

| Étape | Résultat attendu | Condition de passage |
| --- | --- | --- |
| 0 — Cadrage actuel | Architecture, P0, traçabilité et décisions ouvertes. | D01 à D04 validées ; références reçues ou visuels provisoires autorisés. |
| 1 — P0 local | Salle réelle, deux personnages par compte, déplacements et messages persistants. | Critères P01 à P15 applicables vérifiés ; politiques de session et blocage confirmées. |
| 2 — Identité et socle social | Avatars assemblables, inscription, profils, amis, likes, confidentialité, messagerie enrichie et outils de modération. | Données isolées par personnage, modération opérationnelle, import d'image en quarantaine si activé. |
| 3 — Garde-robe et progression | Catalogue, essayage à droite/articles à gauche, achats classiques, inventaire, looks illimités, livre d'XP et missions. | Économie validée ; achats et récupération d'XP atomiques et idempotents. |
| 4 — Logements et transferts | Maison/appartement, décors sauvegardés, cadeaux identifiés et échanges un contre un à partir du niveau 10. | Déblocages et confirmations validés ; tests concurrents de propriété et restrictions VIP. |
| 5 — Créations et activités | Premier arcade original, puis éditeur de films, publication, étoiles et commentaires. | Limites de création et récompenses définies ; signalements des contenus et contrôles antiabus. |
| 6 — VIP et classements | VIP permanent à achat unique, packs et diamants selon décisions, classements permanents et roues. | Prestataire de paiement, règles de portée et barèmes validés ; transactions vérifiées en environnement de test. |
| 7 — Préparation du lancement | Deux ou trois salles maximum, performance, exploitation, accessibilité et protections pour le public visé. | Sauvegarde restaurée en test, sécurité vérifiée, obligations applicables examinées et modération humaine organisée. |

Les avantages VIP peuvent être testés avant l'étape 6 par des habilitations de test
identifiées, sans vente ni assimilation à un achat. Les opérations VIP restent
désactivées si la portée des habilitations n'est pas décidée.

## Vérifications prioritaires après P0

- Inventaire et monnaie : aucun achat ou transfert ne peut produire un solde
  négatif, dupliquer un objet ou retirer un objet à un autre propriétaire.
- Looks : vente d'un look public hors pack, récompense à chaque achat, aucun
  diamant généré pour le créateur ; taux provenant de la configuration validée.
- Livre d'XP : accumulation distincte de la progression et récupération atomique,
  sans historique d'XP récupérée ajouté à l'interface.
- VIP : réception et port interdits aux non-VIP ; achat unique permanent et non
  abonnement. Les prix du cahier restent des estimations.
- Cadeaux : retrait effectif depuis l'inventaire ou livraison directe depuis la
  boutique, sans passage par l'inventaire de l'expéditeur dans le second cas.
- Notifications : compteurs distincts, acquittés par consultation, aucun son.
- Messages : persistance hors ligne et absence de suppression/masquage par le joueur.
- Réseau : reconnexion, commandes rejouées et activations concurrentes.

## Après le lancement seulement si retenu

Application, collections renouvelées, packs additionnels, raretés et événements
ponctuels. Les concours communautaires et classements de scores d'arcade ne font
pas partie du périmètre validé. Aucune photo ou vidéo communautaire au lancement.
