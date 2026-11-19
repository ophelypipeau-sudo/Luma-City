# Phase 2 — salon personnalisable et sauvegarde

La direction artistique Prune & lumière, les dix meubles et l’échelle d’Iris ont
été validés par l’utilisateur. Cette phase ajoute le moteur de décoration au
salon existant, sans publication de meubles en boutique ni déploiement.

## Utilisation

Depuis la carte, **Ma maison** ouvre le salon du personnage actif. L’entrée
depuis un profil reste disponible. Le propriétaire choisit **Décorer** :

- Sélectionner un meuble dans la pièce ou l’inventaire, puis le déplacer avec
  la souris ou les Pointer Events tactiles. Le pointeur est capturé pendant le
  glissement ; une annulation de geste restaure la position de départ.
- Affiner X / Y dans les champs, ou utiliser les flèches sur un meuble au focus
  (Maj + flèche pour dix unités). Les ancrages restent dans leur zone mur / sol.
- Utiliser **Devant / Derrière** dans la bande du meuble. Tapis et objets muraux
  conservent leurs propres bandes ; les meubles au sol et avatars sont intercalés.
- **Ranger** retire seulement le placement. **Rangé · Placer** réutilise le même
  exemplaire ; il n’est jamais racheté ni dupliqué.
- Choisir quatre teintes de mur et trois teintes de parquet. Les textures,
  ombres, géométrie et ouverture sur la ville sont conservées.
- **Enregistrer** remplace la décoration sur le serveur dans une transaction.
  **Annuler** abandonne le brouillon et affiche la dernière décoration confirmée.

Le panneau d’inventaire se réduit après sélection et reste ouvrable. La scène
réserve la place nécessaire aux outils. Sur mobile, le grand portrait latéral
est masqué dans les maisons pour laisser la pièce et les commandes accessibles.
La discussion se replie ; le chat et les présences utilisent les composants existants.

Chaque personnage reçoit une fois une collection de départ de dix exemplaires,
déjà disposés dans le salon. Cette attribution est transactionnelle et protégée
par `starter_granted`, sans débit de monnaie. Le catalogue possède `price: null`
et `published: false` ; aucune route d’achat de meubles n’est ajoutée.

## Assets indépendants

Les sources ImageGen sont conservées dans `public/assets/housing/prune-v1/` :
fond vide, canapé, fauteuil, table, tapis frontal, lampadaire, plante,
bibliothèque, miroir, tableau et buffet. `rug.png` conserve le premier essai
de tapis ; le catalogue utilise `rug-front.png`, dont la perspective a été
corrigée par ImageGen sans déformer sa texture.

Les PNG n’ont pas été rognés ni étirés. `manifest.json` contient dimensions
natives et limites alpha ; le rendu utilise ces limites dans un `viewBox` et
conserve les proportions. Le canevas logique commun est de 1000 × 680,
avec ancrage au sol ou au mur. Le même composant affiche le meuble et sa vignette.

Les WebP d’affichage et leurs petites vignettes sont des encodages dérivés,
avec conservation des PNG sources. Les onze images principales passent de
18 547 814 octets à 1 699 042 octets, soit **90,8 % de réduction** avant transport.
Les fichiers et prompts de génération sont documentés dans
`assets-provenance-v1.json` et `rug-front-provenance.json`.

Reproduire les dérivés :

```powershell
npx tsx scripts/inspect-housing-assets.ts
npx tsx scripts/prepare-housing-previews.ts
```

## Persistance et autorisations

Migration additive `026_housing.sql` : `homes`, `home_rooms`, `furniture_items`,
`furniture_placements`, `home_save_operations`. Aucun changement des anciennes
migrations, des vêtements ou des bases d’avatar. Les salons publics continuent
d’utiliser leur rendu habituel. Seul le groupe de l’avatar en maison est mis à
l’échelle validée de 1,6 ; le dessin du personnage reste inchangé.

- `POST /api/housing/load` : session et génération actives, propriétaire existant,
  mêmes restrictions de visibilité générale et blocages que les visites existantes.
  Les visiteurs reçoivent uniquement les exemplaires placés dans ce salon.
- `POST /api/housing/save` : maison déduite du personnage actif, sans identifiant
  de propriétaire fourni par le client. Schéma strict, maximum 100 placements,
  limites de taille HTTP, valeurs finies et revêtements autorisés.
- Vérification de propriété, modèles, coordonnées, unicité des exemplaires,
  affectation éventuelle dans une autre pièce et révision de départ.
- Verrouillage de la maison, pièce et inventaire dans une transaction. Un échec
  conserve l’état antérieur ; deux sauvegardes concurrentes sur une révision
  identique ne peuvent pas écraser silencieusement leurs changements.
- Clé d’opération pour rejouer une sauvegarde après perte de l’accusé de réception.
  La même clé avec un contenu différent est refusée. Le client garde la clé
  tant que la tentative et le brouillon restent identiques.
- « Décoration enregistrée » apparaît seulement après réponse positive du serveur.
  Un échec conserve le brouillon. Un conflit permet de le consulter, puis de
  recharger explicitement en l’abandonnant. Une fermeture avec brouillon modifié
  demande au navigateur son avertissement de départ ; seuls les changements
  confirmés sont garantis après fermeture forcée.
- Après commit, l’événement `home-layout` est diffusé aux personnes déjà dans
  la maison via le WebSocket existant. Une révision remplace les placements ;
  l’inventaire rangé du propriétaire n’est jamais inclus dans cette diffusion.

La structure autorise plusieurs pièces, avec une seule affectation globale par
exemplaire. L’interface V1 expose uniquement le salon.

## Vérifications réalisées

`npm run build` a réussi : contrôle des poses, TypeScript, **171 tests réussis,
0 échec**, puis compilation Vite. Les tests spécifiques aux maisons couvrent les
sources transparentes, le catalogue hors boutique, les bandes de placement,
le rangement et réemploi, les murs / sols, les doublons, les exemplaires étrangers,
les affectations inter-pièces, les révisions concurrentes, l’idempotence, les accès
bloqués, le redémarrage PGlite et la diffusion réelle à deux clients WebSocket.

Après les derniers ajustements d’affichage WebP et d’accessibilité : relance du
typage, des quatre tests maisons et de Vite (résultats dans `verification-phase2.txt`).

Recette navigateur sur une base locale séparée `.cache/housing-review` :
glisser-déposer du canapé, changement mur / parquet, accusé serveur, rechargement,
coordonnées conservées à 390 × 844, rangement et réemploi du même canapé,
réglage avant / arrière et enregistrement. Contrôle des dix contours sur trois fonds.
Les gestes ont été pilotés dans le navigateur ; un test sur appareil tactile
physique reste à prévoir dans la recette finale.

Captures : `phase2-salon-enregistre.jpg`, `phase2-mobile-enregistre.jpg`,
`phase2-contours-trois-fonds.jpg` et `phase2-decoration-mobile.jpg`.

Lancer la recette isolée, sans lire `DATABASE_URL` ni la base habituelle :

```powershell
npx tsx scripts/housing-review.ts
```

Ouvrir `http://127.0.0.1:5176/`, puis Comptes de démonstration → Iris → Ma maison.
Le serveur de recette utilise le port 3002. La page de contrôle des contours est
`/tests/fixtures/housing-assets.html`, disponible avec Vite.

## Suite du développement

État historique de fin de phase 2 : les déplacements et obstacles décrits
ci-dessous sont désormais implémentés dans [PHASE3.md](PHASE3.md).

Cette phase ne remplace pas le déplacement existant par un trajet avec obstacles.
Navigation validée côté serveur, collisions, repositionnement après modification
du décor, invitations, accès public / amis / privé et expulsion restent les phases
suivantes. La confidentialité conserve pour l’instant les règles de visite
préexistantes ; le blocage bilatéral s’applique aussi au chargement de décoration.
Les achats restent absents jusqu’à validation des prix et de leur intégration.
L’autorité de présence reste celle du serveur unique déjà utilisé par le projet.
