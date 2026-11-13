# Deuxième correction des raccords

Les gros plans de l’utilisateur ont montré deux défauts réels après l’import :
le dos du col était peint devant le cou et la ceinture conservait une largeur
adaptée aux hanches au lieu de suivre la taille.

- `RegisteredGarmentImage.tsx` sépare la région arrière du col et celle du rebord
  de ceinture. Elles sont rendues derrière le corps ; seul le passage avant
  participe à son masque. La peau du cou n’est ni effacée ni repeinte.
- `catalog.ts` calibre séparément la largeur du bord supérieur, la ceinture,
  la transition vers les hanches et les jambes du jogging. La largeur à la taille
  commence à 0,8 puis rejoint progressivement 1,04 aux hanches. Les jambes gardent
  leur largeur précédente. Ces nombres s’appliquent au tissu source, pas au corps.
- L’interpolation est évaluée par lignes de 2 pixels source uniquement dans les
  transitions de largeur, avec un léger recouvrement de rasterisation. Cela évite
  les angles et la déformation du cordon observés avec une interpolation triangulaire
  trop grossière. Le même calcul sert au vêtement porté, à sa vignette et au masque.

Les PNG de vêtements et la base corporelle restent inchangés. Il s’agit d’une
correction de profondeur et de calibration, sans nouvelle génération d’image.

50 tests réussis et compilation réussie. Deux régressions sont contrôlées en pixels :
le cou reste intact sous le passage arrière du col, et la ceinture avant reste
dans les limites calibrées de la taille. L’absence de sous-vêtements visibles et
la conservation des mains et orteils restent testées pour les deux hauts.

Inspection dans la cabine, dans `tests/fixtures/fitting.html` (jogging sans haut)
et sur écran 390 × 844. Le dessin reste soumis au jugement visuel de l’utilisateur.

Gros plans du composant réel : `raccords-r2.png`, produits par
`npx tsx scripts/export-import-details.tsx`. Les images `native-*-r2.png` sont des
exports de contrôle de l’avatar complet, pas de nouveaux corps ni des sprites portés.
Captures de navigateur : `controle-taille-r2.jpg`, `mobile-r2.jpg`, `boutique-r2.jpg`.
