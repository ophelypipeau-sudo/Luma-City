# Capsule ajustée v1 : legging et 4 hauts

Pièces moulantes découpées dans le mannequin canonique (`body-user.png`, patron
`iris-canonical-pattern-v1`) : elles suivent la silhouette au pixel près, gardent
ses ombres, et couvrent toujours les sous-vêtements.

| Pièce | Identifiant | Prix |
|---|---|---|
| Legging Studio | `fashion.legging-studio` | 700 |
| Brassière Studio | `fashion.fitted-brassiere` | 550 |
| Débardeur côtelé | `fashion.fitted-debardeur` | 450 |
| Tee ajusté | `fashion.fitted-tee` | 500 |
| Seconde peau | `fashion.fitted-seconde-peau` | 650 |

Le legging s'inspire d'un legging de sport noir fourni en référence ; aucun texte
ni logo de marque n'est reproduit.

## Régénérer et contrôler

```bash
npm run garment:fitted
npm run garment:sheet -- docs/capsule-ajustes-v1/planche-controle.png fashion.fitted-brassiere fashion.fitted-debardeur fashion.fitted-tee fashion.fitted-seconde-peau fashion.legging-studio
```

- `scripts/lib/second-skin.ts` : découpe, ombrage, contour des découpes, couverture
  des sous-vêtements, masques et ton de matière.
- `scripts/prepare-fitted-tops.ts` : une entrée par haut (forme, couleur, détails).
- `scripts/preview-looks.tsx` : une seule planche, couleur d'origine puis teinte.

Pose de face uniquement ; les poses « main sur la hanche » et « mains en cœur » sont
déclarées indisponibles, comme pour les autres pièces de la boutique.
