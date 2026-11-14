# Capsule ajustée v1 : Legging Studio

Legging moulant découpé dans le mannequin canonique (`body-user.png`, patron
`iris-canonical-pattern-v1`) : il suit la silhouette au pixel près, garde ses
ombres et couvre toujours la culotte du mannequin.

| Pièce | Identifiant | Prix |
|---|---|---|
| Legging Studio | `fashion.legging-studio` | 700 |

Inspiré d'un legging de sport noir fourni en référence ; aucun texte ni logo de
marque n'est reproduit. Les quatre hauts ajustés d'abord proposés avec lui
(`fashion.fitted-*`) ont été retirés du jeu et figurent dans `retired-garments.ts`.

## Régénérer et contrôler

```bash
npm run garment:fitted
npm run garment:sheet -- docs/capsule-ajustes-v1/planche-controle.png fashion.legging-studio
```

- `scripts/prepare-legging.ts` : découpe, ombrage, ceinture et liseré.
- `scripts/preview-looks.tsx` : une seule planche, couleur d'origine puis teinte.
- `scripts/lib/second-skin.ts` : base commune pour de futures pièces moulantes
  (découpe, ombrage, contour des découpes, couverture des sous-vêtements, masques).

Pose de face uniquement ; les poses « main sur la hanche » et « mains en cœur » sont
déclarées indisponibles, comme pour les autres pièces de la boutique.
