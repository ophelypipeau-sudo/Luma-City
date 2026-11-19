# Recette complète des maisons — 19 novembre 2026

La recette couvre le parcours de décoration, les achats en environnement isolé,
les visites, le chat et les accès. Les contrôles ont été réalisés dans le navigateur
sur ordinateur, à 320 × 740 et 390 × 844, puis au format tablette 768 × 1024.
Les petits écrans sont des tailles de navigateur simulées ; le glisser a été
exercé avec les Pointer Events, sans appareil iOS ou Android physique.

## Problèmes corrigés

1. **Historique de chat après blocage.** Un message d’un auteur bloqué pouvait
   réapparaître quand cet auteur se déconnectait. Le test de régression échouait
   avec un message visible au lieu de zéro. Le filtrage consulte maintenant les
   blocages qui concernent les destinataires présents, même si l’auteur est absent.
2. **Inventaire reçu en direct ou à la reconnexion.** Un exemplaire acheté dans
   une autre session puis placé pouvait manquer au rendu du propriétaire. Une
   reconnexion à révision de décor identique ne rafraîchissait pas non plus les
   exemplaires rangés. Les instantanés indiquent désormais si l’inventaire est
   complet ; le client réconcilie les nouvelles instances et conserve les éléments
   privés lors d’une diffusion publique.
3. **Sauvegarde dont la confirmation manque.** La nouvelle révision reçue par
   WebSocket pouvait empêcher de rejouer la commande de sauvegarde sans réponse.
   « Vérifier la sauvegarde » réutilise maintenant sa clé, même dans ce cas. La
   vérification est réservée au même brouillon et à la même révision de départ :
   un nouveau brouillon ne contourne pas le contrôle des conflits.
4. **Attente réseau et réponses obsolètes.** Les demandes des maisons ont un délai
   de douze secondes et distinguent refus explicite et confirmation inconnue.
   Une réponse de lecture ancienne ne remplace plus un réglage d’accès récent.
   Un achat explicitement refusé n’est plus affiché comme restant à confirmer.
5. **Arrivées trop proches.** À deux joueurs, l’animal d’un visiteur pouvait être
   masqué par l’autre avatar. L’arrivée cherche d’abord 140 unités de séparation,
   puis 90 et 40 si la pièce est dense. La taille des avatars et des animaux est
   inchangée. Les trajets restent libres de se croiser.

## Parcours contrôlés dans l’interface

| Domaine | Scénarios exécutés | Résultat |
| --- | --- | --- |
| Décoration sur ordinateur | Mur, parquet, coordonnées d’un meuble, annulation puis réouverture du brouillon | Annulation sans changement enregistré ; réglages confirmés conservés |
| Sauvegarde en panne | Refus 503 avant traitement ; réponse 504 substituée après succès serveur ; renvoi de la même commande | Brouillon conservé, reprise possible, confirmation obtenue |
| Achats | Achat d’une plante à 200 pièces avec confirmation perdue, fermeture du panneau et récupération du reçu | Un seul exemplaire ajouté ; un seul débit, de 8 800 à 8 600 pièces |
| Inventaire | Filtres, placement, rangement et réutilisation du même exemplaire | Aucun rachat lors du placement ou rangement |
| Visites | Deux comptes, animaux équipés, arrivée, déplacement au clic et comparaison des coordonnées finales | Mêmes positions dans les deux vues ; animaux visibles |
| Chat | Message depuis l’ordinateur puis depuis le petit écran | Réception dans la même salle et indicateur de nouveau message |
| Accès | Public, amis uniquement, privé sans invitation | Entrées autorisées ou refusées selon le mode ; refus sans intrusion dans la maison |
| Invitations | Émission, réception, acceptation, entrée et révocation | Admission après acceptation ; retrait si la révocation supprime le droit d’entrée |
| Exclusion | Expulsion confirmée, nouvelle tentative d’entrée, autorisation du retour | Visiteur retiré, réentrée refusée tant que l’exclusion persiste |
| Réponse d’accès retardée | Lecture de l’ancien mode retenue vingt secondes, changement vers Privée entre-temps | Le réglage Privée reste affiché après la réponse ancienne |
| Redémarrage serveur | Arrêt et relance du processus de recette, reconnexion des deux comptes | 8 600 pièces, 11 exemplaires et décor conservés ; visites de nouveau possibles |
| Mobile 390 px | Achat d’un tableau à 180 pièces, placement, glisser de X=780 à X=745,2, sauvegarde, rangement d’une plante, chat, invitation et expulsion | Commandes utilisables, états et changements synchronisés |
| Écran étroit 320 px | Inventaire et filtre Rangés | Pas de débordement horizontal de la page ni du panneau |
| Tablette 768 px | Visite avec les deux personnages et leurs animaux | Proportions conservées et aucun débordement horizontal |
| Rechargement final | Fermeture de la session mobile et réouverture sur ordinateur | 8 420 pièces, 12 exemplaires, 1 rangé, 2 tableaux placés |

Les scénarios API/WebSocket automatisés complètent ces parcours : fonds
insuffisants, prix falsifiés, achats simultanés, rollback SQL, révision conflictuelle,
placement d’un exemplaire étranger, capacité simultanée, propriétaire absent,
reconnexion, expiration d’invitation sans commande du visiteur, amitié en attente,
blocage bilatéral et exclusion après redémarrage.

## Reproduire la recette et les pannes

Lancer `npx tsx scripts/housing-review.ts --qa`, puis utiliser Iris sur
`http://127.0.0.1:5176/` et June sur `http://localhost:5176/`.
La base est `.cache/housing-review-qa`, distincte des données habituelles et des
recettes précédentes. Elle ne lit pas `DATABASE_URL`. Les offres sont des prix de
démonstration réservés à cette instance locale.

Le plugin Vite `scripts/housing-qa-proxy.ts` est monté uniquement avec `--qa` :

- `POST /__qa/fault`, en-tête `X-Luma-QA: 1`, arme une panne sur le prochain POST
  `save`, `buy` ou `access` des maisons.
- `kind: "reject"` produit une indisponibilité avant traitement.
- `kind: "drop"` laisse le serveur terminer, puis remplace sa confirmation par
  une réponse 504. Cela évite le renvoi transparent que certains navigateurs
  effectuent lors d’une simple fermeture de socket.
- `kind: "delay"` retient la réponse, avec `delayMs` borné à vingt secondes.
- `GET /__qa/status`, avec le même en-tête, permet de vérifier si la réponse est
  en attente et si le serveur l’a traitée.

Ces commandes n’existent pas sur le serveur de jeu et ne sont pas publiées par
la compilation du client. Le plugin ne transfère les demandes que vers l’API de
boucle locale, sur le port 3002.

## Vérifications et preuves

**58 tests ciblés réussis, zéro échec ou test ignoré.** Les dix tests de visites et
de navigation ont été rejoués après la correction des arrivées : tous réussis.
TypeScript et la compilation Vite ont réussi. La suite générale des vêtements
n’a pas été rejouée ; aucun dessin ou asset de personnage n’a été modifié.
Commandes, durées et logs figurent dans `verification-recette-complete.txt`.

Captures conservées dans [recette/](recette/) :

- [Sauvegarde à vérifier](recette/sauvegarde-reprise.jpg)
- [Achat repris sans second débit](recette/achat-repris.jpg)
- [Arrivée espacée et animaux visibles](recette/arrivee-corrigee.jpg)
- [Inventaire après rechargement](recette/inventaire-apres-rechargement.jpg)
- [Achat mobile](recette/mobile-confirmation-achat.jpg)
- [Décoration mobile](recette/mobile-decoration.jpg)
- [Exclusion mobile](recette/mobile-expulsion.jpg)
- [Inventaire à 320 px](recette/320-inventaire.jpg)
- [Visite sur tablette](recette/tablette-visite.jpg)
- [Visite mobile finale](recette/mobile-visite-finale.jpg)

L’aperçu final garde la maison d’Iris en mode Amis uniquement, June autorisée,
avec une plante rangée et les autres exemplaires placés. Aucun meuble n’est publié
en boutique, aucun prix public n’est activé et aucun déploiement n’est effectué.
