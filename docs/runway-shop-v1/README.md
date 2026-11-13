# Boutique, couleurs et achats locaux

## Décor fourni par l'utilisateur

L'image `codex-clipboard-22ab158c-9b8d-4f86-8c4a-2c5a0b3262fe.png` est conservée sans retouche dans `public/assets/boutique-user-interior-v2.png`. Le flou de 5 px s'applique uniquement au pseudo-élément de fond, avec un voile léger pour la lisibilité. La cabine laisse voir ce même décor ; le personnage, les vêtements et les commandes restent nets. Compilation et contrôle visuel validés. Capture : `blurred-boutique.jpg`.

## Disposition simplifiée

Les retours visuels suivants retirent l'onglet « Mon dressing », le titre de cabine, sa réinitialisation, les raccourcis de couleurs sous le mannequin, le rappel de solde et le bouton « Porter cette tenue » placé sous le panier. Les catégories sont désormais dans le catalogue, au-dessus de la recherche. La cabine utilise toute sa hauteur disponible pour le personnage en pied et garde uniquement le panier. Les couleurs restent accessibles sur chaque article et dans le panier ; le solde reste dans la barre principale. L'inventaire et les achats enregistrés ne sont pas effacés. Captures : `simplified-layout.jpg` et `simplified-mobile.jpg`. Compilation et contrôle visuel bureau/mobile validés. Les sections suivantes documentent la mise en place initiale.

Référence observée : enregistrement fourni par l'utilisateur `20261110-1203-53.1711306.mp4`, durée 32,30 secondes. La vidéo montre une grille d'articles et leurs prix, une cabine persistante à droite, un panier superposé, une palette accessible depuis l'article ou sa ligne de panier, un achat individuel/groupé puis le panier vide et la tenue portée. Les images de référence sont analysées localement ; aucun élément de marque ou vêtement n'en est extrait pour les assets du jeu.

## Parcours livré

- Boutique violette/fuchsia avec prix sous les pièces, catégories en haut de cabine, recherche sans distinction d'accents, tri et pagination. Les treize pièces calibrées existantes restent disponibles.
- Favoris persistants et filtre « Masquer les miens ». Collection reste vide en attendant les packs nommés demandés auparavant.
- Palette non modale accessible sous chaque article, dans le panier ou sous le mannequin : matière principale/secondaire, table RGB de 273 cases, couleurs récentes, retour à l'original et roue/HEX VIP. Le traitement des matières, coutures protégées et masques corporels reste inchangé.
- Panier filtré sur les variantes non possédées, achat individuel, « Tout acheter », retrait individuel et « Tout effacer ». Un achat individuel conserve les autres essayages. Le prix est recalculé après changement de couleur.
- Reçu animé et panier vidé après achat groupé. La tenue portée à gauche garde la main sur la hanche ; la cabine reste frontale. Un achat individuel équipe uniquement l'article acheté, un achat groupé équipe l'ensemble essayé.
- Mon dressing conserve chaque variante de couleurs séparément. On peut essayer puis porter une variante possédée sans la payer une seconde fois.

## Monnaie de test et données

Solde initial autorisé : **10 000 pièces** par compte local. Les soldes sont partagés entre les personnages du même compte ; les dressings et équipements sont séparés par personnage. Un manque de monnaie bloque l'achat sans modifier le solde ni le dressing.

Une seule écriture `fashion-commerce-v1` dans localStorage conserve solde, inventaire et tenue portée pour l'achat. Ce stockage est local au navigateur, destiné au prototype : aucune transaction serveur ni monnaie réelle. Les tenues précédemment validées et la tenue de départ sont reprises comme pièces possédées pour préserver le travail existant. Les anciennes données `worn-outfits-v1` sont conservées.

La clé de variante associe l'identifiant de pièce et ses deux couleurs normalisées. Un choix explicite de la couleur d'origine équivaut à la variante originale. Les pièces retirées du catalogue ne sont pas présentées dans le dressing.

## Fichiers

- `apps/web/src/shop/LayeredDressing.tsx` : boutique, inventaire, panier, personnalisation et reçu.
- `apps/web/src/shop/runway-shop.css` : nouvelle présentation et adaptation mobile.
- `apps/web/src/shop/GarmentPalette.tsx` : nuancier compact et couleurs récentes.
- `apps/web/src/shop/commerce.ts` : transaction locale pure, prix, propriété des variantes et lecture des données.
- `apps/web/src/shop/Shop.tsx` : essai temporaire initialisé depuis la tenue portée sans réinitialisation lors d'un achat individuel.
- `apps/web/src/main.tsx` : solde affiché, persistance et tenue validée.

## Vérification

Douze tests ciblés réussis : `fashion-commerce.test.ts`, `material-colors.test.ts`, `worn-outfits.test.ts`, `rail-pose.test.ts`. Compilation de production validée. Contrôles visuels à 1101 × 884 et dans la fixture mobile 390 × 844.

Vérifications réalisées dans le navigateur : achat individuel du haut à 550 pièces, conservation du pantalon en attente à 850 pièces, achat du pantalon et passage du solde 10 000 → 9 450 → 8 600 ; conservation de son bleu et de sa fourrure rose ; rechargement et neuf variantes présentes dans le dressing ; port sans nouveau débit ; favoris/recherche ; roue et HEX désactivés sans VIP. Sur l'origine de test mobile : cardigan bleu/caraco rose acheté à 650 pièces, solde 9 350, animation et panier vide.

Captures : `palette.jpg`, `cart-before.jpg`, `purchased.jpg`, `dressing.jpg`, `mobile-palette.jpg`, `mobile-purchase.jpg`, `boutique.jpg`.
