> État actif : mannequin fourni par l’utilisateur, mains conservées à l’identique dans `public/assets/avatar/fashion-v2/body-user.png`. Tenue séparée cardigan-caraco / jean / bottines. Voir [fashion-doll-v2/README.md](fashion-doll-v2/README.md). Les sections suivantes conservent aussi les étapes historiques.

> Mise à jour : le dressing teste maintenant les trois vêtements adaptés depuis la planche fournie. Les anciens vêtements restent en compatibilité. Voir [import-test-v1/README.md](import-test-v1/README.md). Collection est vide ; Top achats affiche les pièces disponibles.

# Avatar à base unique — état actif

La boutique d’Iris ouvre maintenant directement le dressing à base unique.
Le sablier X approuvé est la seule base de ce nouveau rendu. Il n’y a aucun
sélecteur de morphologie, étirement du corps ni réglage corporel.
Les dessins existants ont été réutilisés, sans régénérer le corps.

## Analyse et changements fichier par fichier

| Fichier | Rôle et modification |
| --- | --- |
| `apps/web/src/cartoon/CartoonDoll.tsx` | Compositeur existant. Accepte désormais `layers` et délègue au nouveau rendu ; conserve les anciens adaptateurs. |
| `apps/web/src/cartoon/BodyCoverage.tsx` | Anciens masques conservés pour la compatibilité et les tests. Le nouveau rendu prend sa couverture directement dans chaque fiche de pièce. |
| `apps/web/src/cartoon/Wardrobe.tsx` | Catalogue de dessins historique conservé. Aucune dépendance du nouveau dressing envers ses variantes de personnages. |
| `apps/web/src/cartoon/GarmentDrawing.tsx` | Dessin du caraco, de la jupe et des bottes extrait sans redessin de `PilotGarment`. Reçoit uniquement une géométrie calibrée. |
| `apps/web/src/cartoon/PilotGarment.tsx` | Petit adaptateur de compatibilité vers le dessin partagé, pour les anciens contrôles et tests. |
| `apps/web/src/avatar/base.ts` | Un corps et son canevas : 887 × 1774 pixels, affichage logique 480 × 1024. |
| `apps/web/src/avatar/base-fit.ts` | Calibration fixe extraite du X validé. Aucune sélection de corps à l’exécution. |
| `apps/web/src/avatar/geometry.ts` | Contrat commun des contours, repères, chevilles et sol. |
| `apps/web/src/avatar/catalog.ts` | Fiches des trois pièces : ID stable, emplacement, dessin vectoriel ou image transparente, couverture, vignette, passage du corps au premier plan si nécessaire. |
| `apps/web/src/avatar/model.ts` | État `top`, `bottom`, `shoes`, et fonction `equipLayer` qui ne change qu’un emplacement. |
| `apps/web/src/avatar/LayeredDoll.tsx` | Corps masqué, passages arrière/avant des pièces et occlusions. Les vignettes réutilisent le même dessin sans corps. |
| `apps/web/src/shop/FittingAvatar.tsx` | Adaptateur SVG existant : accepte `layers`, avec description accessible de la base unique. |
| `apps/web/src/shop/LayeredDressing.tsx` | Cabine simple, pièces indépendantes, comparaison avec les sous-vêtements et remise de la tenue complète. Réutilise les styles existants de la cabine pilote. |
| `apps/web/src/shop/Shop.tsx` | Ouvre ce dressing par défaut pour Iris. Conserve son état pendant les allers-retours vers « Autres collections ». |
| `apps/web/src/Avatar.tsx` | Salles et portraits historiques inchangés ; ils continuent à utiliser leur tenue fixe via `CartoonDoll`. |
| `tests/fixtures/fitting.tsx`, `LayeredFitFixture.tsx` | La page de contrôle ouvre d’abord la base unique ; anciens contrôles encore accessibles. |
| `tests/avatar-layers.test.ts` | Emplacements indépendants, refus des IDs incompatibles, huit combinaisons, couverture réelle, pieds effacés, peau découverte préservée, vignettes sans corps, source inchangée. |

Les fichiers des six morphologies, leurs sources et tests sont conservés comme
travail historique. Ils ne pilotent plus la cabine active. Les autres personnages,
collections, perruques, accessoires et historique restent disponibles dans
l’ancienne boutique. Ce refactoring ne migre pas leurs pièces vers la nouvelle base.

## État et utilisation exacte

```tsx
import { useState } from "react";
import { FittingAvatar } from "../shop/FittingAvatar";
import { BARE_OUTFIT } from "../shop/catalog";
import { DEFAULT_LAYERS, equipLayer } from "./model";

function Example() {
  const [layers, setLayers] = useState(DEFAULT_LAYERS);
  return <>
    <FittingAvatar characterId="iris" outfit={BARE_OUTFIT} layers={layers} />
    <button onClick={() => setLayers(old => equipLayer(old, "top", null))}>
      Retirer le haut
    </button>
  </>;
}
```

L’état ne contient pas le corps : celui-ci est constant. `null` retire uniquement
la pièce du slot choisi. Les identifiants initiaux restent ceux du catalogue :
`camisole.ivory`, `pleated-skirt.denim`, `lace-boots.ivory`.
Le nouveau dressing contient pour l’instant ces trois pièces seulement.
L’essayage reste temporaire : quitter la boutique termine l’essai. Pas de nouvelle
persistance serveur, d’achat ni d’interface d’enregistrement des looks.

## Ordre et masques

1. Passages arrière des vêtements (revers des bottes actuellement).
2. Corps chauve en sous-vêtements opaques, masqué par les pièces équipées.
3. Bas puis sa région corporelle au premier plan, limitée à l’intersection
   calibrée avant-bras / jupe.
4. Chaussures avant.
5. Haut avant.

Retirer une pièce retire aussi sa couverture et restitue la base correspondante.
Le masque ne dépend pas de la transparence de la peinture. Les pieds d’origine
sont effacés sous les bottes, et les mains restent issues de l’illustration approuvée.
Toutes les couches partagent une unique transformation uniforme du canevas natif.
Les futurs passages `hairBack`, `hairFront`, `accessoryBack`, `accessoryFront`
pourront être insérés explicitement dans ce compositeur ; ils ne sont pas encore
implémentés ni alimentés avec des assets non calibrés.

## Ressources et ajout d’une pièce

Source active : `public/assets/avatar/body/base.png`, copie à l’identique du X validé.
Les trois vêtements sont des SVG indépendants générés par `GarmentDrawing.tsx` ;
ils ne contiennent ni peau ni personnage.

Structure prévue pour les prochains imports :

```text
public/assets/avatar/
  body/base.png
  clothes/<piece-id>/front.png  # ou .svg, transparent, canevas 887 × 1774
  clothes/<piece-id>/back.png   # uniquement si nécessaire
```

Pour importer une nouvelle coupe, ajouter une fiche dans `AVATAR_GARMENTS` :

```ts
{
  id: "tshirt.example",
  name: "T-shirt exemple",
  slot: "top",
  art: { kind: "image", front: "/assets/avatar/clothes/tshirt.example/front.png" },
  geometry: AVATAR_BASE.fit,
  crop: [280, 460, 325, 245], // ajuster à cette pièce
  coverage: ["... contour SVG calibré des zones couvertes ..."],
}
```

Cet exemple est un contrat d’import, pas un asset livré. Préparer le vrai fichier
et le vrai contour avant d’ajouter sa fiche. Le compositeur et les boutons de la
cabine n’ont pas à changer. Pour un nouveau dessin vectoriel, étendre le composant
de dessin ou ajouter un fichier SVG transparent.

Vérifier épaules, encolure, taille, poignets, genoux, chevilles et sol. Ne pas
confondre canevas commun et calibration correcte. Conserver les sources originales.

## Vérifications

46 tests réussis, dont les 43 tests existants. Compilation TypeScript/Vite réussie.
Contrôle visuel du jeu sur le port 3001 et de la cabine à 390 × 844.
Retrait indépendant du haut et des chaussures, jupe conservée ; retour depuis les
anciennes collections conservant ces choix. Contrôle du corps découpé dans
`tests/fixtures/fitting.html` avec Vite.

Captures : `screenshots/avatar-layers/` (`boutique.jpg`, `jupe-seule.jpg`,
`masques.jpg`, `mobile.jpg`). Les tests techniques ne valent pas validation artistique.
