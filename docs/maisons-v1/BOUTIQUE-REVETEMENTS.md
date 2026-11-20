# Boutique de revêtements — 20 novembre 2026

La boutique propose trois rayons : Vêtements, Murs et Sols. Les meubles restent
hors vente. Les quatre murs et les trois parquets historiques restent inclus,
afin de préserver les décors et les possibilités déjà disponibles.

Nouveautés : Bleu nuit et Pêche veloutée (350 pièces), papiers peints Rayures
rosées et Rayures sauge (500 pièces), parquets Noyer chaleureux, Chêne blanchi et
Bois rosé (450 pièces). Les modèles et prix sont définis côté serveur dans
`packages/domain/src/home-finishes.ts`, avec une version d'offre commune.

Chaque achat débloque un modèle pour le personnage, réutilisable sans nouvel
achat. La confirmation précède le débit ; un reçu durable et une clé d'opération
permettent de vérifier une confirmation perdue sans payer deux fois. Les achats
entrent dans le calcul de la monnaie existante partagée avec vêtements, animaux
et meubles de recette. L'achat n'applique pas automatiquement le revêtement.

Dans Décorer, les sélecteurs proposent les revêtements inclus et achetés.
Le serveur vérifie la propriété avant sauvegarde. Les visiteurs voient le décor
appliqué, sans recevoir l'inventaire des revêtements du propriétaire.

Migration additive `030_home_finishes.sql`, testée sur une branche de production :
21 personnages inchangés, pièces existantes inchangées, achat et sauvegarde d'un
nouveau papier peint vérifiés. Tests d'intégration : double requête, nouveau
double achat, solde partagé, prix falsifié, offre périmée, fonds insuffisants,
rollback, inventaire privé et persistance après redémarrage. Recette navigateur
locale ordinateur et 390 × 844 : achat, confirmation mobile, application puis
réouverture du décor. La boutique de vêtements conserve ses composants.

Captures dans `.cache/home-finishes-proof/`. Aucun asset de personnage modifié.
