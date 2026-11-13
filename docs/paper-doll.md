> Rendu actif remplacé par la poupée cartoon v6 : voir `cartoon-v6.md`. Cette page conserve les versions antérieures.

# Avatar de base, vêtements isolés et récapitulatif

**Rendu actif : révision v5 dans `render-v5.md`.** Les prompts v1 ci-dessous sont conservés comme historique. Les pièces actuelles utilisent des contours fixes et la nouvelle matière peinte.

Révision demandée le 8 novembre 2026. La cabine utilise une base adulte en
sous-vêtements opaques, puis les calques de vêtements transparents sélectionnés.
Les cartes du catalogue et les lignes du récapitulatif affichent les vêtements
seuls : aucune fenêtre de photo du corps n'est utilisée comme vignette.

## Fonctionnement

- Haut, bas, chaussures et perruque se retirent séparément ; le bouton de base retire les quatre.
- La tenue de départ peut être rétablie et comparée à l'essai.
- Historique et Panier d'essayage ouvrent le même récapitulatif flottant à lignes.
- Chaque ligne contient l'image seule, le nom, la catégorie, Réessayer et une croix.
- Une même pièce apparaît une seule fois ; l'essai le plus récent remonte en tête.
- Retirer une ligne retire aussi la pièce de la cabine si elle est actuellement portée.
- Tout effacer vide la liste et remet la base en sous-vêtements dans la cabine.
- Échap ferme la fenêtre sans quitter la boutique. Le focus reste dans le dialogue
  et revient au bouton d'ouverture.
- Les prix restent indéfinis. Acheter et Tout acheter sont désactivés, sans débit
  ni ajout à l'inventaire. Il s'agit d'un historique local d'essayage, pas d'achats
  prétendument réalisés ; il est réinitialisé en quittant la boutique.

## Assets historiques et base conservée

- `public/assets/avatar-base-bald-v3.png` : quatre bases adultes chauves en sous-vêtements sans bretelles.
- `public/assets/wigs-original-v1.png` : quatre coiffures isolées et amovibles.
- `public/assets/garments-original-v1.png` : vêtements de départ isolés.
- `public/assets/garments-lavender-v1.png` : vêtements lilas/ivoire isolés.
- `public/assets/garments-rose-v1.png` : vêtements rosés/minuit isolés.

Génération/retouche avec l'outil intégré image_gen, sans CLI. Source : les atlas
originaux conservés dans le dépôt. Chaque nouvel atlas mesure 1774 × 887.
L'affichage utilise les coordonnées de chaque pièce et un ordre de superposition
perruque arrière / base / bas / chaussures / haut / mains / perruque avant. Les silhouettes sont fixes, sans articulation.
Les petits ajustements d'occlusion restent propres à ces illustrations ; une
validation artistique plus fine sera nécessaire pour un catalogue de production.

## Prompt de la base

```text
Edit target: supplied transparent four-character atlas. Create a BASE BODY ATLAS for a neutral adult paper-doll clothing fitting UI. All FOUR characters are ADULTS aged 25 or older. Keep the EXACT same canvas 1774x887, four equal columns, exact same character scale, position, facing angle, face identity, hairstyle, hair color, skin tone, pose, arm and hand positions, jewelry. Remove ALL outer clothing, jackets, skirts, trousers, shirts, footwear AND shoulder bags and their straps. Replace clothing with simple modest opaque matching lilac-gray underwear: women wear a plain fully opaque sports bra and full-coverage high-waist briefs; men wear plain opaque mid-thigh boxer briefs. NO nudity, no sheer material, no sexual pose, no erotic styling. Reconstruct natural adult legs and bare feet where trousers/boots were, with feet planted on the identical original baseline and positions. Bodies must remain in original neutral THREE-QUARTER standing pose, not front-facing, exact original faces. Keep long hair in exactly original shape. Background fully transparent, no floor, no shadow, no text, no labels. This is a functional 2D dress-up base for layering clothing on top.
```

## Prompt des vêtements seuls

Appliqué séparément à chaque atlas de tenues d'origine, lilas/ivoire et rosé/minuit.

```text
Edit target: supplied four-character transparent clothing atlas. Produce a CLOTHING-ONLY OVERLAY ATLAS, on the EXACT same 1774x887 transparent canvas, preserving exact coordinates, scale, pose and outlines of the clothing on all four characters. REMOVE ALL HUMANS COMPLETELY: no faces, no heads, no hair, no skin, no torsos, no arms, no hands, no legs, no feet visible. Keep ONLY each person's outer clothing: their top/jacket and undershirt as ONE top garment, bottom skirt/trousers, and boots/sneakers. Remove jewelry, bags, chains that touch the body and bag straps. Each garment must be a clean standalone isolated illustrated piece with TRUE TRANSPARENCY inside neck openings and arm openings, between straps, and everywhere skin used to be. Empty sleeves are hollow cloth with NO ARMS, shoes empty with NO LEGS. Clothing stays in exact original wearing positions and THREE-QUARTER perspective so this PNG can be overlaid on a separate avatar body without repositioning. Do not arrange flat-lay or move garments to new rows. Reconstruct small garment portions previously obscured by hair/bags so clothing is complete, but preserve the original outer clothing silhouette and shape. Four equal-width character columns, each containing only that character's original top, bottom, shoes at original y coordinates. No person or mannequin, no text, no background, no grid, no floor, no new garments. Keep all original garment colors and materials exactly as in supplied image.
```


## Révision du calage et des perruques

Voir `avatar-asset-guide.md` pour les repères, les ouvertures, les corrections de bottes par jambe et les règles de vérification des futurs imports. Les prompts de retouche et les nouveaux fichiers sont décrits dans `avatar-layer-prompts.md`. La cabine garde désormais une base chauve : retirer la catégorie Perruques révèle le crâne, sans cheveux incrustés dans le corps.
