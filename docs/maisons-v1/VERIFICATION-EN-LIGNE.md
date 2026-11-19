# Vérification des maisons — 19 novembre 2026

## Contrôles effectués

- Production `https://luma-city.fr` : service disponible, assets des maisons servis,
  routes privées refusées sans session, migrations 026–029 présentes.
- Lecture de la base de production : aucune offre de meubles ni aucun achat.
- Recette navigateur isolée du même code : ordinateur et viewport mobile
  390 × 844 ; ouverture de la maison, inventaire de dix exemplaires, changement
  des accès public/amis/privé, sauvegarde puis réouverture du décor.
- Retour au quartier avec modification non enregistrée : brouillon restauré.
  Annulation explicite : brouillon supprimé, sans réapparition à la réouverture.
- Tests serveur isolés : persistance après redémarrage, concurrence et conflits,
  inventaire privé, achats atomiques et idempotents en recette, achats publics
  interdits, visites et déplacements WebSocket, animaux, chat, capacité,
  invitations/expiration/révocation, expulsions et blocages.

Les captures de recette locale sont conservées dans
`.cache/houses-online-proof/` (inventaire et accès mobiles).

## Correctifs

- Conservation du brouillon dans la session du navigateur lors de la navigation.
  La révision initiale reste conservée pour empêcher l'écrasement d'une sauvegarde
  concurrente ; une commande de sauvegarde incertaine garde son identifiant.
- Annuler et abandonner le brouillon effacent explicitement cette récupération.
- La maison de la carte indique « Connexion requise » au joueur déconnecté,
  au lieu d'annoncer « Bientôt ».

## Limite de la vérification publique

Le navigateur public présente l'écran de connexion. Une connexion utilisateur a
été demandée ; les parcours privés de production ne sont pas déclarés validés.
La recette multijoueur publique nécessite également deux sessions autorisées.
Les tests isolés ne remplacent pas ces essais connectés dans le jeu en ligne.

Aucun dessin, vêtement ou asset de personnage modifié. Aucun meuble publié,
aucun prix activé et aucune offre ajoutée en production.
