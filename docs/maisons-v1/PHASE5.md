# Phase 5 — achats et inventaire de meubles

Le moteur d’achat utilise le solde serveur existant, partagé entre les personnages
d’un compte. Chaque achat attribue un exemplaire indépendant au personnage actif,
initialement rangé. Le placement et le rangement ne débitent aucune monnaie.

## Vente fermée, recette locale disponible

Les dix modèles restent `published: false` et `price: null`. Aucun meuble n’est
ajouté à la boutique publique. Aucun prix commercial n’est validé ou activé par
la migration. Le serveur normal expose un catalogue vide et refuse les nouveaux
achats de meubles, même si une offre d’essai est présente dans sa base.

Le seul mode d’achat disponible pour cette phase est l’option explicite de recette
`createApp(db, { housingCommercePreview: true })`, qui est ignorée en mode public.
Elle utilise des offres serveur distinctes, approuvées et activées dans la base
isolée. L’interface indique « Catalogue d’essai » et « prix de démonstration ».
Les prix définitifs et leur publication restent une étape ultérieure.

Lancer la recette avec `npx tsx scripts/housing-review.ts --commerce`, puis ouvrir
`http://127.0.0.1:5176/`. Le script utilise `.cache/housing-review-v5`, sans lire
`DATABASE_URL`, sans modifier la base habituelle ni les bases des phases 2 et 4.
Il prépare les comptes Iris et June, leurs animaux et dix offres de démonstration.
Leurs prix sont conservés uniquement dans ce script et cette base d’essai.

## Utilisation

Depuis **Ma maison → Mes meubles** :

- L’inventaire regroupe les exemplaires par modèle, avec recherche et filtres
  Tous / Rangés / Dans le salon / Autre pièce.
- Le catalogue montre les offres fournies par le serveur et le solde courant.
- Acheter ouvre une confirmation avec le nom, le prix et la quantité d’un exemplaire.
  Le bouton se bloque pendant la demande ; le reçu confirme l’attribution et le débit.
- « Placer mes meubles » ouvre le moteur de décoration existant. Chaque vignette
  possède un numéro d’exemplaire pour distinguer plusieurs meubles identiques.
- Le nouvel exemplaire peut être placé, enregistré, rangé et réutilisé sans rachat.

Après une erreur ou un délai de 12 secondes, le choix et sa clé de commande restent
réutilisables. La dernière commande est aussi conservée dans `sessionStorage` par
personnage, pour la reprendre après fermeture du panneau ou rechargement. Le bouton
« Vérifier le dernier achat » permet de récupérer sa confirmation même lorsque
l’offre a été retirée ou que le solde ne permettrait plus un nouvel achat.

## Transactions et monnaie

La migration additive `028_furniture_commerce.sql` crée les offres de recette et
les reçus persistants `furniture_purchases`, sans données commerciales initiales.
Un reçu contient le compte payeur, le personnage bénéficiaire, le modèle, la version
de l’offre, son prix serveur et l’identifiant unique de l’exemplaire attribué.

`POST /api/housing/catalog` et `POST /api/housing/buy` exigent une session et une
génération actives. Aucun identifiant de propriétaire ni solde client n’est accepté.
Le schéma d’achat est strict. Le prix attendu et la version servent à refuser une
offre devenue obsolète ; le serveur détermine le montant débité depuis sa base.
Les offres inconnues, désactivées ou non approuvées sont refusées.

L’achat prend le verrou de compte déjà utilisé par les vêtements et les animaux,
relit le solde, puis attribue l’exemplaire et écrit le reçu dans une seule transaction.
La somme des reçus de meubles entre dans le calcul de dépenses existant, avec les
vêtements et les animaux. Il n’y a ni portefeuille parallèle ni changement des gains.
Un échec après attribution annule aussi l’exemplaire et le débit. Une commande
identique rejouée retourne le même exemplaire et le solde actuel sans nouveau débit.
Réutiliser sa clé avec un autre personnage, modèle, prix ou version est refusé.

Les exemplaires rangés restent privés. Le visiteur voit les exemplaires placés,
et ne peut pas réutiliser un exemplaire appartenant à un autre personnage.
L’achat ne change pas le décor et ne place rien automatiquement devant les visiteurs.

## Validation

48 tests ciblés couvrent les achats, les autres dépenses du compte, les maisons,
les visites, les trajets et les contrôles d’accès. Les nouveaux scénarios incluent
le double clic, les exemplaires multiples, la reprise après redémarrage et retrait
d’offre, les fonds insuffisants, la concurrence, les prix falsifiés et le rollback.
TypeScript et la compilation du client sont contrôlés séparément.

Captures de recette : [achat confirmé](phase5-achat-confirme.jpg),
[inventaire](phase5-inventaire.jpg), [mobile](phase5-mobile-inventaire.jpg),
[confirmation mobile](phase5-mobile-confirmation.jpg).
Voir `verification-phase5.txt` pour les commandes et les résultats finaux.

Les dessins des personnages, leurs corps, leurs vêtements et leurs animaux sont
inchangés. Aucun meuble n’est publié et aucun déploiement n’est effectué.
