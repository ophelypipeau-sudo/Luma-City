# Mannequin utilisateur et tenue de mode

52 tests réussis, compilation réussie. Le corps et les mains du fichier fourni sont conservés octet pour octet. Trois vêtements indépendants, masques de manches/pieds/sous-vêtements et ourlets devant les bottines vérifiés. Contrôle réel en cabine et à 390 × 844. Sources et preuves : fashion-doll-v2/README.md.

# Dressing à base unique

46 tests réussis, compilation réussie. Huit combinaisons d’équipement contrôlées par rendu de pixels, corps approuvé inchangé, contrôle visuel en boutique et à 390 × 844. Voir avatar-layers.md et screenshots/avatar-layers/.

# Tenue pilote sur les six corps validés

43 tests réussis ; compilation réussie. Les 8 tests du pilote ont été rejoués après le dernier ajustement des semelles. Contrôle visuel des six coupes et des masques, puis de chaque morphologie à 390 × 844. Pièces retirées conservées lors d’un changement de corps ; retour à la boutique conservant l’essayage et son historique. Les tests techniques ne constituent pas une validation artistique.

Sources, mesures, rendu et captures : proposals/pilot-v6/README.md. Capture finale : proposals/pilot-v6/boutique-tenue-pilote.jpg. Toutes les copies des six corps approuvés ont été vérifiées par SHA-256.

# Révision graphique du sablier X — proposition 02

La planche v1 des six corps a été refusée visuellement. Le travail technique reste conservé. Nouvelle illustration complète d’une seule base X et comparaison avec la référence : `proposals/hourglass-v2/README.md`. Aucun vêtement ni corps de production remplacé ; validation du dessin attendue avant les cinq autres corps et la tenue pilote. Aucun test technique utilisé comme validation artistique.

# Proposition comparative des six corps

35 tests réussis, compilation réussie. Sources natives et exports : `proposals/morphologies-v1/README.md`. Six corps indépendants en sous-vêtements opaques, même identité/pose/échelle. Le rendu de production et la garde-robe sont conservés ; adaptation de la tenue pilote après validation des corps.

# Apparence indépendante — étape 1

27 tests réussis et compilation réussie. La nouvelle structure est utilisée par la boutique, via les adaptateurs v6. Contrats, compatibilité et limites : `appearance-model.md`. Les six morphologies ne disposent pas encore de corps/coupes calibrés ; pas de sélecteur incomplet exposé. Capture de non-régression : `screenshots/boutique-appearance-etape1.jpg`.

# Correction de l’habillage 2D — masques corporels

- Contours partagés entre vêtements et découpe du corps ; haut, bas et chaussures indépendants.
- Peau masquée sous le torse, les jupes/pantalons et les chaussures ; cou, mains et jambes découvertes conservés. Le passage mains respecte aussi les manches.
- Passages arrière/avant des chaussures et perruques ; anses du sac derrière les doigts.
- `npm test` : 15 tests réussis, dont 5 tests de transparence effective du corps, sans vêtement opaque pour le cacher. `npm run build` réussi.
- Contrôle visuel des 4 personnages × 3 collections dans `tests/fixtures/fitting.html`. Retrait complet puis rhabillage dans la cabine à 390 × 844.
- Captures : `screenshots/habillage-masques-quatre-personnages.jpg`, `screenshots/habillage-masques-mobile.jpg`, `screenshots/boutique-habillage-masques.jpg`.

# Vérification de P0

Recette réalisée le 8 novembre 2026 : compilation et 8 tests automatisés réussis,
audit npm sans vulnérabilité signalée. Navigateur intégré Chromium vérifié à
1239 pixels de large et à 390 pixels via le cadre `tests/fixtures/mobile.html`.
Deux sessions indépendantes (127.0.0.1 et localhost) ont affiché les deux joueurs ;
un déplacement clavier de 30 unités SVG a été observé dans l'autre session.
Un message envoyé à June hors ligne a été retrouvé à sa connexion, avec une
pastille avant consultation et zéro non-lu après lecture.

Captures : [jardin](screenshots/jardin.jpg) et [mobile](screenshots/mobile.jpg).

Refonte visuelle suivant les références utilisateur : panneau personnage à gauche,
quatre avatars illustrés en trois quarts, carte du quartier et navigation en haut.
Compilation et 8 tests réussis après intégration. Vérification navigateur du passage
de la carte au jardin, du changement Iris/Milo et de l'affichage à 390 pixels.
Captures actualisées : [interface](screenshots/interface-v2.jpg) et
[mobile](screenshots/interface-v2-mobile.jpg). Provenance : `visual-assets.md`.

Nouvelle révision demandée : habillage de jeu sur tout l'écran, sans panneaux blancs,
carte agrandie, personnage à gauche, commandes et affichages monétaires en haut.
Compilation vérifiée et contrôles navigateur sur ordinateur et cadre mobile 390 px.
Ouverture/fermeture du panneau Messages vérifiée. Les non-lus ne sont pas acquittés
si le panneau est fermé. Soldes et XP affichés « — » en l'absence d'économie validée.
Captures : [plein écran](screenshots/interface-v3-fullscreen.jpg) et
[mobile](screenshots/interface-v3-mobile.jpg).

Révision des pastilles : compilation TypeScript/Vite vérifiée, infobulles Boutique
et Animalerie constatées dans le navigateur. À 390 px, l'accès à l'animalerie par
défilement de carte et l'infobulle maintenue dans les limites visibles ont été
vérifiés. Le champ HEX est bien désactivé pour les comptes de démonstration.
Capture : [carte avec pastilles](screenshots/interface-v4-markers.jpg).

Boutique : compilation vérifiée. Recette navigateur effectuée sur Iris et Milo :
ouverture depuis la pastille, sélection indépendante du haut, du bas et des
chaussures, tenue complète, comparaison avant/après et recherche sans résultat.
Le filtre Douceur lilas affiche trois articles. Top achats et historique affichent
un état vide. Les essayages se réinitialisent lors d'un changement de personnage.
À 390 px, le catalogue reste à gauche et l'avatar à droite, avec historique compact
en bas. Le bouton Achat est désactivé, aucun prix ou achat réel n'étant configuré.
Les vêtements de June et Noa sont préparés ; aucun contrôle visuel complet de leurs
combinaisons n'est revendiqué dans cette recette.
Capture : [boutique](screenshots/boutique-v1.jpg). Détails : `shop.md`.

Révision calques et récapitulatif : compilation réussie. Le catalogue affiche des
PNG de vêtements isolés, la cabine une base en sous-vêtements et des calques
distincts. Sur Iris : retrait complet, réhabillage haut/bas/chaussures, fenêtre à
trois articles, retrait individuel et effacement vérifiés. Sur Milo : contrôle du
rendu habillé et des recouvrements des mains et pieds. À 390 px : ouverture de la
fenêtre, effacement et retour du focus au bouton de fermeture vérifiés ; Échap
ferme le récapitulatif sans quitter la boutique. Acheter et Tout acheter restent
désactivés. Les contrôles complets de June et Noa restent à effectuer avant élargissement.
Captures : [vêtements isolés](screenshots/boutique-v2-vetements.jpg) et
[récapitulatif](screenshots/boutique-v2-recapitulatif.jpg). Assets et prompts :
`paper-doll.md`.

## Vérification automatique

`npm test` utilise le moteur PostgreSQL embarqué et de vraies connexions WebSocket
sur un port local temporaire. Les données sont isolées de `.data/postgres`.

- Refus d'activation du personnage d'un autre compte et des accès non authentifiés.
- Refus d'origines étrangères et de connexions non locales.
- Message hors ligne, duplication de commande empêchée et conflit d'identifiant refusé.
- Non-lus et reçus de lecture limités au destinataire réel.
- Diffusion des positions entre deux clients, refus des coordonnées hors limites.
- Déconnexion et reconnexion sans doublon de présence.
- Blocage dans les deux sens, conversations antérieures conservées.
- Signalement en base, cadence limitée et absence d'accès public aux signalements.
- Activations concurrentes, une session active et rejet des anciennes générations.
- Seize clients concurrents : quinze admis et un refusé, aucun instantané à seize.
- Fermeture et réouverture d'une base sur disque : message et non-lus conservés.

`npm run build` vérifie TypeScript et produit le client Vite. `npm audit` vérifie
les dépendances installées. Le fichier lock conserve les versions utilisées.

## Recette manuelle à deux sessions

1. Lancer `npm run dev`, ouvrir `http://127.0.0.1:5173/` et choisir Aurore/Iris.
2. Ouvrir `http://localhost:5173/` ou une fenêtre privée et choisir Sacha/June.
3. Vérifier le compteur 2/15, déplacer les avatars et observer les deux vues.
4. Depuis Iris, écrire à June. Depuis June, vérifier la pastille avant consultation,
   ouvrir la conversation, constater le message et la disparition de la pastille.
5. Fermer la seconde fenêtre, envoyer un autre message et reconnecter June.
6. Changer Iris en Milo ; constater l'absence des conversations propres à Iris.
7. Ouvrir le même compte ailleurs et activer son personnage : l'ancienne vue doit
   devenir inactive et proposer un nouveau choix.
8. Vérifier le thème, le parcours clavier, le blocage/déblocage et le formulaire de
   signalement avec des données de test uniquement.
9. Réduire la largeur : le panneau social passe sous le jardin sans débordement.
10. Redémarrer le serveur : se reconnecter et vérifier les messages conservés.

## Limites de la recette

Le pilote PostgreSQL réseau est fourni, mais la vérification de base sur ce poste
utilise PGlite. Aucun test de charge de production, audit de sécurité exhaustif,
test Safari/Firefox ni validation juridique n'est revendiqué. Le mécanisme de
présence expire une connexion sans réponse au heartbeat en environ 30 à 40 secondes.
# Révision : calage et perruques amovibles

- Compilation TypeScript et build Vite validés (`npm run build`).
- Contrôle visuel des quatre silhouettes et des trois collections via
  `tests/fixtures/fitting.html`, dont les ouvertures de chaussures et les coiffures
  courtes qui laissent désormais les yeux visibles.
- Base chauve en sous-vêtements, retrait/remise de la perruque indépendamment
  des vêtements, et ajout de la perruque à l’historique vérifiés dans la cabine.
- Catégorie Perruques et cabine vérifiées à 390 × 844 via la fixture mobile.
- Captures : `screenshots/bases-chauves-v3.jpg`,
  `screenshots/boutique-sans-perruque-v3.jpg`.
- Les réglages concernent les assets actuels. Les futurs imports doivent suivre
  `avatar-asset-guide.md` ; ce n’est pas un système de recalage automatique.

# Révision v4 : vêtements liés à la silhouette

Le retour utilisateur sur la tenue caraco rosé / jupe ivoire / bottes rosées
montrait encore des coiffes de bottes vides et des vêtements sans déformation.
La révision remplace le calage rigide d’Iris par des maillages mesurés sur le corps,
avec genou, mollet, cheville et semelle indépendants. Les revers de bottes d’Iris
et June ont des passages arrière/avant, sans trou ovale au-dessus de la jambe.
Les bretelles sont liées aux épaules et l’intérieur du caraco ne dépasse plus
sous le bras. Les sneakers masculines gardent leur empeigne complète.

- `npm run build` : TypeScript et build Vite réussis.
- `npm test` : 11 tests réussis, dont les trois nouveaux contrôles du maillage
  (conservation des repères, continuité des diagonales, géométrie invalide).
- Contrôle des quatre silhouettes et des trois collections dans la fixture.
- Cabine à 390 × 844 : mélange de pièces, retrait du haut et des chaussures,
  retour des dessous et des pieds nus contrôlés visuellement.
- Captures : `screenshots/calage-lilas-v4.jpg`, `screenshots/calage-mobile-v4.jpg`,
  `screenshots/boutique-calage-v4.jpg`.
- Sources PNG conservées ; correction native SVG, sans génération de nouveaux
  corps indépendants. Repères et règles actualisés dans `avatar-asset-guide.md`.

# Révision v5 : reprise graphique après référence vidéo

La vidéo fournie (22,6 s) a été examinée localement à plusieurs moments. Le rendu
de vêtements a été remplacé sur les quatre silhouettes : contours dessinés dans
le repère du corps, nouvelles matières peintes depuis ce guide, ombres de contact
limitées à la peau et mains replacées devant les manches. `FittedGarment` est la
source commune des cartes, de l’historique et de l’essayage. Les anciens PNG de
vêtements et les déformations v4 ne sont plus utilisés pour le rendu actif.

- `npm run build` : réussi, TypeScript puis Vite.
- `npm test` : les 8 tests backend actifs réussissent. Les tests du maillage v4
  sont archivés avec ce code ; ils ne valident pas le nouveau dessin.
- Contrôle des quatre silhouettes, variantes de couleurs et inspection d’Iris
  agrandie dans la fixture de dessin, avec et sans perruque.
- Mélange caraco rosé / jupe ivoire / bottes rosées dans la boutique réelle.
- Historique : mêmes pièces isolées que celles portées, sans fragment de corps.
- Mobile 390 × 844 : mélange de pièces, puis Tout retirer ; les dessous, les pieds
  nus et le crâne chauve reviennent. Le débordement d’une perruque voisine dans sa
  vignette a été corrigé avec une fenêtre de découpe par personnage.
- Captures : `screenshots/vetements-v5-quatre-personnages.jpg`,
  `screenshots/vetements-v5-mobile.jpg`, `screenshots/boutique-v5-rendu.jpg`.
- Source, méthode, atlas final et prompt : `render-v5.md`.

# Révision v6 : nouvelle base cartoon et dressing frontal

La demande du 9 novembre remplace la base graphique, et non uniquement les couleurs
des vêtements. Les nouveaux corps et coiffures ont été créés depuis la référence
principale de poupée 2D. Les anciennes images semi-réalistes ne sont plus utilisées
dans le rendu actif, y compris dans les portraits et la colonne de gauche.

- Nouvelle base de face : tête plus grande, grands yeux, dessous opaques et crâne chauve.
- Même `CartoonDoll` dans la cabine, les portraits, le rail et les personnages de salle.
- Trois collections inspectées sur les quatre personnages dans la fixture.
- Raccords revus aux épaules masculines, aux hanches et aux poignets ; les yeux
  restent visibles avec la coiffure. Les lunettes sont un accessoire volontaire.
- Bijoux, lunettes et sac combinés dans la boutique réelle. Retirer les lunettes
  de l’historique conserve les bijoux, le sac et les vêtements.
- Mobile 390 × 844 : accessoires combinés puis Tout retirer ; retour de la base
  chauve, des dessous et des pieds nus. Navigation de catégories accessible par
  glissement et au clavier ; barre native blanche supprimée.
- `npm run build` : TypeScript et Vite réussis. `npm test` : 10 tests réussis,
  dont deux scénarios d’indépendance et de réessai des accessoires.
- Planche réelle exportée du composant : `screenshots/avatar-cartoon-v6-planche.png`.
- Captures : `screenshots/cartoon-v6-quatre-personnages.jpg`,
  `screenshots/cartoon-v6-mobile.jpg`, `screenshots/boutique-cartoon-v6.jpg`.
- Sources, repères, calques, scripts de guide et prompts : `cartoon-v6.md`.

