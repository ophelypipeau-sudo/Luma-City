# Mains en cœur — pose v2

Révision après la nouvelle inspiration fournie par l'utilisateur : ouverture du cœur plus large et arrondie, mains plus basses devant la poitrine, poignets moins serrés, coudes relâchés et abaissés. La référence anime sert uniquement au geste ; le mannequin, son visage et le style du jeu sont conservés.

Trois sources imagegen distinctes sont conservées dans `public/assets/avatar/poses/heart-hands-v2/` : bras/mains, manches lilas et manches bordeaux. La version précédente est conservée dans `heart-hands-v1`. `scripts/prepare-heart-pose.ts` produit les calques natifs 887 × 1774 et les masques de matière ; il accepte un chemin de version en argument pour reproduire une version antérieure.

Les points d'attache des épaules restent identiques. `HeartHandsDoll.tsx` utilise le nouveau jeu de calques et un passage de mains adapté. Avec le cardigan, seuls les tissus sont dessinés sur les bras, puis les mains devant les poignets : aucun bras nu superposé ne dépasse des manches. Pour le pull à épaules dénudées, seule la peau des épaules et des mains reste visible. Les coutures, couleurs choisies et détails du torse continuent d'utiliser le système existant.

La pose est fixe, sans respiration. La cabine reste de face. Aucun vêtement, achat ou tenue utilisateur n'a été remplacé pour tester cette pose.

Vérifications : compilation TypeScript/Vite ; trois tests ciblés réussis (pose statique/cabine frontale, absence de déformation des bras expérimentaux, rendu natif conservant visage/torse/jambes et effaçant les anciennes mains). Contrôle visuel via `tests/fixtures/fitting.html` avec les quatre hauts, les deux variantes à manches, le cardigan recoloré et la pose réelle à la taille de la colonne du jeu. Captures conservées dans ce dossier. Les tests techniques ne constituent pas une validation artistique de cette nouvelle proposition.
