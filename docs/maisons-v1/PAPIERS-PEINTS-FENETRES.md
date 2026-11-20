# Nouveaux papiers peints et fenêtres multiples — 20 novembre 2026

Douze nouveaux revêtements : Bouquets de roses, Roses porcelaine, Marguerites
crème/lilas, Feuillage sauge, Jardin de nuit, Étoiles poudrées, Ciel de minuit,
Losanges dorés/menthe et Pois nacrés/roses. Les six dessins vectoriels sont
partagés entre aperçu et pièce, avec couleurs et éclairage cohérents.

Décorer propose un onglet Fenêtres : Arche ivoire (750 pièces), Atelier noir
(800), Hublot Chêne (700) et Baie Jardin (900). Un achat débloque le modèle,
réutilisable pour plusieurs placements. La fenêtre d'origine est conservée ;
jusqu'à six fenêtres supplémentaires sont autorisées. Chaque placement possède
son identifiant, sa position, une sélection, des champs X/Y, le déplacement au
clavier ou au pointeur et un bouton Retirer. Les fenêtres restent dans le mur,
derrière les meubles. Aucun obstacle supplémentaire n'est créé au sol.

Les fenêtres en essai suivent le même parcours que les murs : aperçu local sans
débit, confirmation d'achat, puis sauvegarde. Le serveur contrôle modèles,
propriété, bornes, identifiants uniques et nombre de placements. Les visiteurs
reçoivent les placements sauvegardés par le canal de décor existant. Un ancien
client qui omet le champ windows ne supprime pas les placements existants ; un
tableau vide explicite permet de tous les retirer.

Migration 032 : ajoute le tableau JSON des fenêtres, vide par défaut, et étend
les papiers peints autorisés. Testée sur une branche de production : empreintes
des personnages, des anciennes propriétés des pièces et des achats inchangées.
Achat de roses et d'un modèle de fenêtre, puis sauvegarde de deux fenêtres
vérifiés sur cette copie.

Tests : limites, identifiants, propriété, absence de double débit, deux fenêtres
du même modèle, déplacement, WebSocket visiteur, compatibilité ancien client,
suppression et persistance après redémarrage. Recette navigateur locale sur
ordinateur et 390 × 844 : motifs, achat unique, deux placements, déplacement,
essai/retrait d'un autre modèle sans débit, sauvegarde et réouverture.
Captures : `.cache/wallpapers-windows-proof/`.

Personnages et vêtements inchangés. Aucun meuble publié en boutique.
