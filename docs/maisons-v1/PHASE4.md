# Phase 4 — visites multijoueurs

Les maisons réutilisent la présence, le WebSocket et le chat des salons. Le bouton
Maison dans la liste d’amis permet de rejoindre le salon d’un ami ; le retour au
quartier reste disponible. Le propriétaire n’a pas besoin d’être connecté.

## Présence et déplacements

- Chaque visiteur reçoit le décor courant à l’entrée et à la reconnexion, puis
  les nouvelles révisions enregistrées sans quitter la pièce.
- L’apparence et le compagnon équipé proviennent des données existantes. Les
  changements d’équipement et de nom d’animal sont diffusés aux personnes présentes.
- Les trajets de la phase 3 sont partagés : origine, points, vitesse et horaire
  serveur. Les deux navigateurs interpolent le même déplacement. L’animal suit
  le groupe de son propriétaire, avec le même rendu que dans la phase 3.
- L’arrivée cherche un emplacement libre des meubles et espacé des autres
  occupants. Les personnages peuvent ensuite se croiser pendant leurs trajets.
- Les départs, coupures et remplacements de socket utilisent le cycle de présence
  existant ; aucun deuxième registre de joueurs n’est créé pour les maisons.

## Capacité et autorisations

La migration `027_home_capacity.sql` ajoute une capacité par pièce. `NULL` reprend
la capacité actuelle des salons, soit 15 personnes, propriétaire compris. Une
valeur positive peut être configurée côté serveur en base ; la sauvegarde de
décoration ne permet pas au client de modifier cette valeur. La limite est affichée
dans la maison et dans la liste des personnes présentes.

Les admissions sont sérialisées par pièce : deux entrées simultanées ne peuvent
pas dépasser la capacité. Un refus conserve la salle précédente et affiche une
explication. Les routes HTTP et le WebSocket appliquent les mêmes contrôles :
propriétaire existant, restrictions générales du jeu et blocage bilatéral.

Seul le propriétaire peut décorer. Les visiteurs reçoivent les exemplaires placés,
sans l’inventaire privé du propriétaire. Les réglages public / amis / privé,
invitations et expulsions restent prévus pour la phase 6.

## Discussion

Le panneau Discussion reprend le composant de chat existant, les noms, les bulles
dans la pièce et le filtrage par blocage. Les échanges restent isolés par salle.
Le bouton signale les nouveaux messages lorsque le panneau est fermé ; le premier
historique reçu n’est pas compté comme un nouveau message.

Le chat conserve son historique éphémère de 40 messages, sa limite de 280 caractères
et son délai anti-envoi rapide de 600 ms. Le client peut renvoyer une commande dont
l’accusé a été perdu sans dupliquer son message. Les reçus en mémoire expirent
après cinq minutes et sont bornés à 2 000 entrées pour le serveur. Après dix secondes
sans confirmation, le formulaire propose de réessayer en conservant la commande.

## Recette reproductible

Lancer `npx tsx scripts/housing-review.ts --visits`, puis ouvrir :

- `http://127.0.0.1:5176/` : compte de démonstration Iris, avec Nuage.
- `http://localhost:5176/` : compte de démonstration June, avec Plume.

Les deux noms d’hôte séparent les cookies. Le script prépare leur amitié et leurs
animaux dans `.cache/housing-review-v4`, sans utiliser `DATABASE_URL` ni la base
habituelle. Les alias de boucle locale ne sont autorisés qu’en mode local.

Captures contrôlées à deux sessions :

- [Visite et chat](phase4-visite-chat.jpg)
- [Visite à 390 px](phase4-mobile-visite.jpg)
- [Discussion à 390 px](phase4-mobile-chat.jpg)

Les tests `tests/home-visits.test.ts` couvrent trois comptes, les admissions
simultanées, les équipements, les trajets, le chat, les départs, le propriétaire
absent, la reconnexion avec un décor récent et les refus d’accès ou de modification.
Les résultats finaux figurent dans `verification-phase4.txt`.

Aucun corps, visage, vêtement ou asset d’avatar n’a été changé pour cette phase.
Les dix meubles restent non publiés, sans prix et sans entrée dans la boutique.
