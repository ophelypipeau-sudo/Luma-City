# Traçabilité — cahier des charges v1.0

Cette matrice indique la couverture prévue, sans confondre proposition et fonction
déjà développée. Cette matrice décrit le plan initial ; P0 a depuis été réalisé
après validation. Consulter le README et `verification.md` pour l'état effectif.

| Section source | Règles conservées | Couverture proposée |
| --- | --- | --- |
| 1–2 — Vision | Jeu social 2D navigateur, identité originale, 16+, inclusif, même accueil et couleur libre ; nom ouvert. | P0 technique puis identité en étape 2 ; références manquantes. |
| 3 — Comptes | Deux personnages, données propres, un actif, changement sans déconnexion. | Invariant principal de P0 ; création finale et portée VIP/diamants ouvertes. |
| 4 — Avatars | Cheveux, visages, expressions, vêtements, chaussures, accessoires ; créations autorisées et originales. | Silhouettes provisoires P0, assemblage étape 2 ; animations à définir. |
| 5 — Logements | Maison jusqu'à 4 pièces à noms fixes ; appartement 1 pièce, jusqu'à 8 VIP, noms modifiables ; configurations et invitations. | Étape 4 ; aucun niveau exact de pièce déduit de l'exemple du niveau 10. |
| 6 — Profils | Informations et tenue, photo modérée, public/privé, blocage, amis illimités, 3 meilleurs amis, une relation par personnage. | Blocage P0 puis étape 2 ; règles relationnelles ouvertes. |
| 6 — Personnalisation | Une seule décoration ; fonds standards/VIP et couleur libre des fonds VIP ; likes pour la popularité. | Étape 2 ; nom des messages de profil non imposé. |
| 6 — Pseudo | Changement gratuit tous les 3 mois en classique et chaque semaine en VIP. | Étape 2 ; calcul calendaire et portée VIP à préciser avant mise en œuvre. |
| 7 — Messages | Texte, GIF, emojis, stickers ; pas de photos/vidéos, suppression ni masquage ; livraison hors ligne. | Texte et persistance P0, enrichissements étape 2. |
| 7 — Notifications | Pastilles chiffrées distinctes, consultation pour retrait, sans son ni historique global validé. | Messagerie P0, autres compteurs avec leurs fonctions. |
| 7 et 20 — Modération | Blocage, signalement, revue humaine, modération automatique des images et sécurité intégrée. | Socle P0 ; dispositif complet avant ouverture publique. |
| 8 — Salles | 2 ou 3 maximum au lancement, 15 occupants, danse/assise/animations, pas de salle arcade dédiée. | Une salle technique P0 ; offre de lancement étape 7 après choix des thèmes. |
| 9 — Films | Personnages, décors, expressions, dialogues, animations, publication, étoiles sur 5 et commentaires. | Étape 5 ; catégories récentes/populaires/vues, « mieux notés » à confirmer. |
| 10 — Arcade | Accès par petite icône, solo/bot/multijoueur, monnaie et XP ; pas de classement de scores. | Étape 5 ; premier jeu à choisir, mécaniques génériques et réalisation originale. |
| 11 — Progression | Fame = XP, barre visible, progression accessible, vêtements dès niveau 1. | Étape 3 ; courbe et gains configurables après validation. |
| 11 — Livre et missions | Livre d'XP récupérable au choix sans historique demandé ; 7 connexions consécutives puis choix XP/monnaie ; missions quotidiennes et hebdomadaires. | Étape 3 ; barèmes ouverts. |
| 12 — Économie | Monnaie classique au nom ouvert, diamants liés au VIP ; ventes de créations en monnaie et XP seulement. | Étapes 3 et 6 ; aucune valeur économique définitive inventée. |
| 13 — Boutique | Catégories par icônes, articles à gauche, avatar à droite, essayage ; palettes classiques et HEX VIP. | Étape 3 ; pas de restriction de niveau pour les vêtements. |
| 13–14 — Looks | Sauvegardes illimitées, public/privé et cadenas ; achat groupé hors pack, rémunération à chaque vente. | Étape 3 ; pas d'achat individuel d'article de pack via un look. |
| 15 — Échanges | Niveau 10, un objet contre un objet, tout joueur ; objets cadeaux/diamants échangeables, VIP entre VIP, refus et désactivation. | Étape 4 ; acceptation et déconnexion à définir. |
| 16 — Cadeaux | Depuis inventaire avec retrait ou boutique avec envoi direct ; expéditeur visible, message facultatif, pastille ; VIP aux deux extrémités. | Étape 4 ; aucune limite quotidienne arbitraire. |
| 17 — Classements | Permanents : niveau, likes, richesse ; une roue classique ou trois VIP/jour, bonus Top à préciser. | Étape 6 ; agrégation des personnages et cumul ouverts. |
| 18 — VIP | Permanent, achat unique ; badge, pseudo coloré, changements hebdomadaires, HEX, pièces, roues, bonus et exclusivités. | Étape 6 ; 3,60 € et 2,90 € estimatifs, compagnon non confirmé. |
| 19 — Événements | Ponctuels, quêtes/récompenses au cas par cas ; pas de concours communautaires. | Après socle ; aucun événement arbitrairement annoncé. |
| 20–21 — Conception | Règles séparées du visuel, architecture évolutive, valeurs ouvertes configurables, protection des données et sécurité. | Architecture proposée et vérifications à chaque étape. |
| 22 — Choix ouverts | Ne pas transformer une inconnue en décision acquise. | Registre `decisions.md` ; actions dépendantes désactivées jusqu'à validation. |
| 23 — Première étape | Lire, analyser les références disponibles, proposer architecture, structure, décisions, prototype et feuille de route. | Dossier livré ; analyse des fiches reportée car elles ne sont pas fournies. |
