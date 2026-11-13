# Pull Charbon et short Cendre — coupe + matière 2D

L’image de référence est utilisée uniquement comme inspiration. Aucun pixel de cette image n’est détouré ou utilisé dans les vêtements. Le corps canonique et ses mains restent indépendants et inchangés. Les autres vêtements sont conservés.

## Structure

- `packages/domain/src/textile-pattern.ts` : contours du pull court ample et du short, repères du cou, de la taille et des poignets, coutures, poches et plis. Les trois poses ont leurs contours de manches. Les repères viennent du patron canonique ; aucun redimensionnement d’une image de tenue.
- `packages/domain/src/textile-material.ts` : deux matières répétables, maille et sergé. Ces petites textures transparentes ne contiennent ni corps ni vêtement complet. Leurs exports SVG sont dans `public/assets/avatar/textile-pilot-v1/materials/`.
- `apps/web/src/avatar/TextileGarment.tsx` : applique la couleur de tissu, la matière répétable, les ombres, les plis, puis les coutures et la quincaillerie protégées. Les couleurs ne changent ni la coupe ni la géométrie des coutures. Les poignets ont un passage devant la peau.
- `apps/web/src/avatar/textile-catalog.ts` : deux pièces indépendantes, identifiants stables, prix provisoires, catégories et compatibilité avec les poses. Le catalogue, les vignettes, les essayages et les achats existants utilisent ce même rendu.
- `catalog.ts`, `LayeredDoll.tsx`, `RedrawnPoseDoll.tsx`, `pose-wardrobe.ts`, `materials.ts` : ajout du rendu textile vectoriel et du profil de pose procédural, sans remplacer le moteur ni les anciens articles.

Le procédé reste un rendu de jeu 2D : la matière est appliquée à une coupe, et les calques contrôlent les occlusions. Une texture seule ne crée ni coupe ni physique du tissu. Cette étape ne propose pas encore de simulation textile, de réglages corporels ni de compatibilité garantie avec un futur corps différent. Une nouvelle coupe nécessite toujours un dessin et un contrôle de ses repères ; elle peut réutiliser les matières existantes.

## Contrôles

`tests/fixtures/textile-pilot.html` compare le véritable personnage dans les trois poses. `tests/fixtures/fitting.html` possède le bouton « Pull Charbon et short Cendre ». Les captures du navigateur et les planches exportées sont conservées ici. L’export reproductible est `scripts/export-textile-pilot.tsx`.

`tests/textile-pilot.test.ts` vérifie l’absence de photo dans le dessin des pièces, la conservation des contours alpha et des coutures lors d’une recoloration, ainsi que les identifiants et couleurs dans les trois poses. Les tests existants contrôlent aussi le corps immuable et la chaîne d’achat. Ils ne remplacent pas la validation artistique.

## Volumes et finition

TextileDrapery.tsx ajoute des ombres diffuses sous le col, les emmanchures, les poches et les ourlets, des plis de compression propres aux manches de chaque pose, ainsi que des passants, brides et doubles surpiqûres. Les formes de coupe, les repères du corps et les couleurs de base sont conservés. Les ajouts sont découpés à l'intérieur des pièces et ne changent pas leur silhouette.

