# Fenêtres réservées aux futurs meubles — 20 novembre 2026

Cette version remplace la fonctionnalité de fenêtres supplémentaires décrite
dans PAPIERS-PEINTS-FENETRES.md. Décorer conserve Murs, Sols et Mes meubles ;
l'onglet Fenêtres, l'ajout, le déplacement et le rendu des fenêtres supplémentaires
sont retirés. La fenêtre d'origine du décor reste intacte. Tous les papiers peints
et motifs sont conservés.

Le catalogue actif et le serveur refusent les nouveaux achats de fenêtres.
Les modèles et dessins restent en réserve pour l'intégration aux meubles.
Les anciens achats, droits et reçus restent conservés, avec vérification
idempotente des anciennes commandes incertaines, sans nouveau débit.

Les placements historiques restent archivés dans la colonne windows. Ils ne
sont plus exposés dans les instantanés de maison ni modifiés par la sauvegarde
active. Aucun effacement en base et aucune migration ne sont nécessaires.
Les anciens brouillons non confirmés contenant seulement des fenêtres sont
écartés ; leurs autres modifications restent récupérables. Les opérations dont
la confirmation reste incertaine gardent leur contenu exact pour vérification.

Validation : types, catalogue sans fenêtres, achat refusé, reçus historiques,
propriété conservée, absence de rendu, archivage intact après sauvegarde,
brouillons anciens et maintien des papiers peints. Contrôle navigateur local :
Murs/Sols/Mes meubles uniquement, papiers peints à roses présents.
Capture : `.cache/retired-windows-proof/decoration-sans-fenetres.png`.

Aucun personnage ou vêtement modifié ; aucun meuble mis en vente.
