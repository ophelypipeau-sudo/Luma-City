# Base de mesures pour les prochains vêtements

Le corps d’Iris est la référence immuable : `public/assets/avatar/fashion-v2/body-user.png`, canevas **887 × 1774**. Les mains, le visage, la pose et l’échelle ne changent pas pour adapter un vêtement.

Les dimensions relevées directement sur son alpha sont dans `burgundy-outfit-v2/body-measurements.json` : épaules, poitrine, aisselles, taille, hanches, poignets, genoux, mollets, chevilles et pieds, ainsi que les sections du contour ligne par ligne. Le fichier contient le SHA-256 du corps auquel elles correspondent.

Pour chaque nouvelle référence : recréer uniquement la pièce dans la pose du corps, puis calibrer encolure/épaules, poitrine/taille, bras/poignets, hanches, chevilles et sol sur ces mesures. L’aisance se définit par coupe, elle ne remplace pas le repérage. Un pull ajusté et une jupe évasée ne demandent pas le même écart au corps.

Séparer les contours des bras, du torse et des jambes. Ne jamais utiliser l’enveloppe de toute une ligne de l’image comme largeur des hanches : les mains peuvent se trouver sur cette même ligne. Préserver les semelles complètes au-delà des orteils. Ne pas rogner une chaussure à la dernière ligne opaque du pied nu.

La tenue bordeaux v2 sert d’exemple de calibrage sur les dimensions du corps ; les précédents dessins sont conservés. Aucun de ces calculs ne constitue une garantie d’ajustement artistique automatique pour une photo quelconque : l’essayage et l’inspection visuelle restent obligatoires.
