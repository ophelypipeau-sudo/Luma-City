# Registre des décisions

Les décisions D01 à D04 ont été validées dans la conversation le 8 novembre 2026.
Les autres questions restent ouvertes. Le cahier des charges reste
la source des règles validées. Valider une pile technique ne valide pas l'économie,
les prix, l'apparence finale ou toutes les fonctionnalités futures.

## Nécessaires pour commencer P0

| ID | Question | Proposition | Effet |
| --- | --- | --- | --- |
| D01 | Quelle pile de développement ? | TypeScript, React/Vite, serveur Node/Fastify/WebSocket et PostgreSQL ; rendu SVG initial. | Permet de créer le dépôt applicatif et ses migrations. |
| D02 | Quel périmètre initial ? | P0 local : deux comptes de test à deux personnages, salle, déplacements et messages privés persistants. | Valide une vraie base multijoueur avant l'économie. |
| D03 | Que faire d'une seconde activation du même compte ? | La nouvelle activation remplace l'ancienne ; l'ancien onglet affiche un état inactif et ne peut plus agir. | Garantit un personnage actif, y compris entre plusieurs onglets. |
| D04 | Peut-on démarrer sans les fiches visuelles ? | Utiliser des silhouettes et un décor originaux provisoires, explicitement remplaçables. | Permet le test technique ; ne valide aucune direction artistique finale. |

Le parcours de création des personnages finaux n'est pas tranché par les comptes
précréés. Pour les blocages P0, proposition complémentaire à confirmer avant
généralisation au jeu final, réalisée comme comportement provisoire dans P0 :
interdiction des nouveaux messages dans les deux sens entre les
deux personnages concernés ; pas d'effacement des messages existants. La portée
au compte entier reste ouverte.

## À décider à l'étape concernée

| Étape | Décisions encore ouvertes |
| --- | --- |
| Identité visuelle | Nom, références, proportions des avatars, assets originaux, expressions et animations. |
| Comptes publics | Création des deux personnages, modifications/suppression, inscription, contrôle d'âge, récupération, politique multiappareil. |
| Modération | Filtres, sanctions, traitement humain, rôles, délais, conservation et accès aux signalements ; portée du blocage. |
| Profils | Poids/formats des images, fournisseur de modération, nom des messages de profil, confidentialité détaillée. |
| Relations | Accord mutuel et retrait des meilleurs amis et relations amoureuses. |
| Notifications | Liste finale des pastilles et conservation ; aucun historique global validé. |
| Catalogue | Articles initiaux, palettes prédéfinies, organisation et production des assets. |
| Économie | Nom de la monnaie, prix, courbe XP, commissions, XP des looks, contrôles antiabus et autoachat des looks. |
| VIP et diamants | Portée compte/personnage, quantité de diamants du pack, distribution et achat séparé, prix finaux, bonus et compagnon éventuel. |
| Cadeaux | Limite quotidienne éventuelle, blocage, inventaire plein. |
| Échanges | Double confirmation, état après déconnexion et fréquence ; maintien strict d'un objet contre un objet. |
| Logements | Liste des pièces, niveaux de déblocage, placement, stockage et configurations. |
| Films | Outil, limites de scènes/durée/publication et catégorie « mieux notés ». |
| Arcade | Premier jeu, déclinaisons solo/bot/multijoueur et barème des récompenses. |
| Classements | Agrégation des deux personnages pour le niveau, roues Top 3/Top 10 et cumul. |
| Récompenses | Barèmes de missions, remise à zéro quotidienne et tables de roue. |
| Exploitation | Hébergeur, région, budget, charge attendue, sauvegardes et objectifs de disponibilité. |
| Lancement | Vérifications juridiques, protection des données, règles communautaires et paiements. |

## Ordre de validation recommandé

Après D01 à D04 validées, régler les décisions de sécurité nécessaires aux fonctions
de P0 pendant leur conception. Avant toute inscription publique, arrêter le
parcours de compte et le dispositif de modération. Avant un achat ou un transfert,
valider les règles économiques et les contrôles serveur correspondants.

Les fonctionnalités dépendant d'une valeur indéfinie restent désactivées plutôt
que de recevoir un barème présenté comme acquis.
