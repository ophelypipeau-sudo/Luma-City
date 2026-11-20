# Boutique directement dans la maison — 20 novembre 2026

La boutique générale retrouve son interface de vêtements. Les murs et sols
s'achètent uniquement dans la maison en ouvrant Décorer. Le panneau de droite
propose Murs, Sols et Mes meubles, avec les catégories de matières existantes.

Cliquer sur Essayer applique le modèle au brouillon affiché dans la vraie pièce,
avec les meubles, le personnage et l'animal existants. Aucun enregistrement,
diffusion aux visiteurs ou débit n'est effectué par l'essai. Annuler retrouve le
décor enregistré. Les essais non achetés sont identifiés et bloquent Enregistrer,
même si un seul des deux revêtements essayés a été acheté. Le serveur conserve
son contrôle de propriété avant sauvegarde.

L'achat confirmé dans le panneau débloque le modèle, actualise l'inventaire et
le solde affiché sans quitter la maison. Enregistrer applique ensuite le décor
aux visiteurs et le conserve en base. Les commandes d'achat incertaines gardent
leur identifiant pour vérification ; les lectures périmées sont ignorées pendant
une mutation. Une annulation du décor ne retire pas les revêtements déjà achetés.

Validation : types, tests de l'essai sans mutation du décor initial, garde sur
les deux surfaces, achats et sauvegardes. Recette navigateur locale ordinateur
et 390 × 844 : aperçu dans la pièce, solde intact pendant essai, annulation,
achat et confirmation sur place, sauvegarde/réouverture, inventaire de meubles
et retrait des rayons de décoration de la boutique générale.
Captures : `.cache/home-embedded-shop-proof/`.

Aucune migration, aucun prix ou achat existant modifié. Personnages et vêtements
inchangés. Meubles toujours hors vente.
