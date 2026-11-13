# Éclipse rose — finition de face

Les poses sont suspendues à la demande de l’utilisateur. `CharacterPose` affiche désormais la pose de face, sans bouton de sélection, même si une ancienne préférence était enregistrée. Ces anciennes préférences et les dessins historiques sont conservés. Aucun nouveau dessin posé n’est produit.

Le corps, ses mains, les identifiants d’articles, les achats, les coupes de vêtements et les zones de recoloration sont conservés. La coiffure reçoit une ligne d’implantation retouchée et davantage de mèches fines, ainsi que des reflets moins uniformes. Les bijoux ont des reflets métalliques dégradés. `PunkFinish.tsx` ajoute le grain de tissu, des plis, des ombres aux emmanchures et aux ourlets, des surpiqûres et le relief des plis de la jupe ; les bottes reçoivent des plis de cheville et des reflets plus diffus. Ces finitions restent à l’intérieur des contours existants.

Le rendu reste une illustration de jeu 2D stylisée ; la qualité graphique doit être jugée sur le personnage réel, pas sur la réussite des tests. `scripts/export-punk-front.tsx` produit une seule vue de face, en pied et agrandie. La photo originale reste une inspiration, sans détourages ni génération d’image externe.

Le bouton Éclipse rose complète de `tests/fixtures/fitting.html` permet de contrôler la cabine frontale. Les captures de navigateur sont conservées ici. `tests/punk-front.test.ts` vérifie que la pose enregistrée auparavant ne réactive pas les poses dans le jeu.

## Ressources de recoloration

`npx tsx scripts/export-punk-materials.tsx` exporte les ressources depuis les dessins vectoriels de la capsule, dans le repère natif 887 × 1774. Le [manifeste](../../public/assets/avatar/punk-materials-v1/manifest.json) liste le PNG d’origine, les masques de contribution des teintes et le calque de finitions pour chaque pièce. La coiffure conserve ses deux passages. Le tissu, les carreaux et les motifs utilisent les masques des teintes prévues sur la pièce. Les coutures, les reflets et le métal fixe restent dans le dessin des finitions.

Pour un rendu PNG portable, décoder en sRGB prémultiplié et additionner les contributions des teintes indiquées dans le manifeste au calque de finitions. L’alpha final est celui du PNG de référence. En jeu, les mêmes dessins vectoriels appliquent directement les nouvelles couleurs de matière. Les anciens sprites PNG compatibles utilisent leurs masques de matière calibrés. Un PNG aplati qui arrive sans masque doit être préparé et contrôlé avant d’activer sa recoloration.
