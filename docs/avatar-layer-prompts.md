# Prompts — base chauve et perruques

Outil intégré image_gen, mode retouche avec transparence. Sources et résultats conservés.

## Base chauve v2

Source : `public/assets/avatar-base-underwear-v1.png`.
Résultat : `public/assets/avatar-base-bald-v2.png`.

```text
Edit the supplied 1774x887 transparent four ADULT (25+) paper-doll avatar base atlas. Remove ONLY scalp hair on all four adults, making all four completely BALD. Reconstruct natural scalp outlines in exact three-quarter angle and consistent skin shading, no stubble. Where long hair covered shoulders, neck, arms and back, reconstruct the underlying body cleanly. Absolutely keep each face identity, expression, eye position, facial proportions, earrings, neck jewelry, skin tone, body outline, exact pose, underwear, scale, per-column position, hands and feet unchanged. No nudity: women retain opaque sports bras and full-coverage briefs, men retain opaque boxer briefs. Identical canvas size, baseline and original character coordinates. Fully transparent background. No text, no hair, no wig, no new clothing. This will be the fixed reference body for precise garment registration, so DO NOT shift, resize, rotate or re-pose anything.
```

## Perruques isolées

Source : `public/assets/avatar-base-underwear-v1.png`.
Résultat : `public/assets/wigs-original-v1.png`.

```text
Edit the supplied transparent four-character adult avatar atlas into a WIGS-ONLY SPRITE ATLAS on the identical 1774x887 canvas. Keep ONLY the scalp hairstyles, in their exact original positions and sizes and facing angles, one original hairstyle in each of the four quarter-columns. Remove all humans, all faces, skin, heads, ears, earrings, necks, torsos, arms, hands, underwear, legs, feet, necklaces and shadows. Original long blonde half-up hair in column 1, original short wavy dark brown hair in column 2, original long auburn hair in column 3, original short dark textured curls in column 4. Preserve hair strands, shading, silhouette, pins and original hairstyle identity exactly. The entire face opening must be fully transparent with NO face or skin; all other background areas fully transparent. Do not put wigs on mannequins, do not rearrange or shift them; these are functional aligned overlays for the original bald avatar bases. No text, no grid, no body or clothing remains.
```

## Base chauve v3 — dessous sans bretelles

Source : `public/assets/avatar-base-bald-v2.png`.
Résultat actif : `public/assets/avatar-base-bald-v3.png`.

```text
Edit this exact transparent 1774x887 four-column atlas of four ADULT (25+) bald fashion paper dolls. Change ONLY the lavender bras worn by the two adult women in columns 1 and 3: replace sports bras with small opaque strapless lavender bandeau bras, fully covering breasts, snug across chest, upper edge around source y248 and lower edge y298, no shoulder straps whatsoever, no high neckline, no fabric on upper chest or shoulders. Reconstruct bare shoulder skin naturally where straps used to be. NO nudity, no sheer fabric: opaque modest strapless underwear and full coverage briefs. Keep ALL remaining pixels and coordinates unchanged: bald heads, exact faces, body shapes, poses, jewelry, arms, legs, hands, feet, briefs, and both male characters. DO NOT resize, move or re-pose characters. Same 1774x887 transparent canvas and four original quarter-column positions. Clean transparent background, no colored speckle artifacts around bodies, no text. Functional paper-doll registration asset.
```

