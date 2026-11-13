# Tee-shirt araignée — coupe corrigée v2

Retouche réalisée avec l’outil imagegen intégré, sans API du jeu. Sources : corps canonique inchangé et photo de tee-shirt du brouillon 083b872c-8a0c-497b-addb-51b04821a9ab. Le rouge, les manches noires, le motif araignée et la toile sont conservés. Épaules arrondies et descendantes, manches orientées sur les bras, poitrine modelée et taille cintrée.

Le résultat brut est conservé dans `generated-shirt.png`. Le PNG est recalé, sur le vêtement seulement, dans `registration.svg` et `scripts/fit-spider-tee-v2.ts` : enveloppe 415×350, origine (236,330), canevas 887×1774. Le corps, visage, mains, jean et chaussures n’ont pas été retouchés.

Assets consommables : `public/assets/avatar/imports/spider-tee-v2/front.png`, `mask1.png`, `mask2.png`. Deux masques indépendants : tissu rouge / noir et motif. Les couleurs de base correspondent à la matière corrigée ; les réglages de placement sont revenus à 1:1 pour éviter une seconde déformation.

Le calque remplace celui du même brouillon, qui reste À vérifier. Aucune publication automatique. L’image source, les anciens réglages et calques sont conservés dans `before/`. L’installateur est ponctuel et refuse les nouvelles révisions pour ne pas écraser les retouches futures.

Vérification : sous-vêtements couverts, visage/mains libres, pièce entière dans le canevas dans `checks.json`, contrôle visuel dans `tests/fixtures/fitting.html` et sur petit écran, compilation réussie. Une validation technique ne remplace pas le jugement sur la coupe.

Prompt de retouche : isoler le tee-shirt rouge et noir sur transparence, le redessiner en cartoon doux selon la base de corps fournie ; épaules arrondies non triangulaires, manches suivant la pose des bras, buste et taille ajustés, col rond couvrant les bretelles de sous-vêtement, ourlet près de la taille ; conserver araignée et toile, aucune peau, aucun personnage, aucun accessoire, aucun motif supplémentaire. Canevas de repérage 1:2 et repères d’épaules/encolure/aisselles/taille fournis ; en sortie, recalage sur le repère natif.
