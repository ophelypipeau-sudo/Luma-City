# Collection étendue — dix sols et dix papiers peints

Création : imagegen intégré (mode built-in), neuf nouvelles textures indépendantes. Sources PNG dans `sources/`. WebP 1024 × 1024, qualité 87.

Sols ajoutés : parquet tressé, Versailles, terrazzo, tomettes hexagonales et marbre. Fichiers `public/assets/housing/floors-realistic-v1/{basketweave,versailles,terrazzo,hexagon,marble}.webp`.

Papiers peints ajoutés : magnolias, damas, lin et éventails Art déco. Fichiers `public/assets/housing/wallpapers-realistic-v1/{magnolia,damask,linen,fans}.webp`.

Le catalogue regroupe les variantes de couleur : dix familles de sols et dix motifs de papiers peints, en plus des peintures et briques. Les nouveaux modèles restent recolorables, avec aperçu en grand, achats dans la maison et masquage réversible. Migration additive 035 ; anciens IDs et achats conservés. Aucun personnage ou vêtement modifié ; aucun meuble publié en boutique.

Validation : TypeScript et 22 tests ciblés (achat, sauvegarde, persistance, visites et regroupement).

## Prompts exacts

### basketweave

Use case: photorealistic-natural. Asset type: seamless square floor albedo material tile. Full bleed flat orthographic straight-down scan of the material only. Strict MONOCHROME GRAYSCALE, rich natural midtones with sharp fine realistic details, intended for duotone recoloring in a 2D interior game. Real premium material, not vector, not cartoon, not plastic. Uniform diffuse lighting, no directional shadows or spotlight, no perspective, no room or furniture, no objects, no text, no watermark or border. True seamless repeat: edges meet exactly on both axes, pattern and grain continue across boundaries. Brief: real premium oak parquet in a precise basketweave layout, repeating interlocking squares composed of three short parallel narrow wood staves in alternating directions, detailed fine lengthwise grain following each stave, a few restrained tiny knots, subtle stave variation and micro-bevelled seams, satin-matte oiled finish.

### versailles

Use case: photorealistic-natural. Asset type: seamless square floor albedo material tile. Full bleed flat orthographic straight-down scan of the material only. Strict MONOCHROME GRAYSCALE, rich natural midtones with sharp fine realistic details, intended for duotone recoloring in a 2D interior game. Real premium material, not vector, not cartoon, not plastic. Uniform diffuse lighting, no directional shadows or spotlight, no perspective, no room or furniture, no objects, no text, no watermark or border. True seamless repeat: edges meet exactly on both axes, pattern and grain continue across boundaries. Brief: authentic French Versailles parquet, repeating square timber panels with a diagonal interlaced lattice of solid oak staves inside each panel and a fine straight border frame, finely detailed natural longitudinal wood grain, tiny joints, slightly varying staves, sophisticated satin-matte oiled surface.

### terrazzo

Use case: photorealistic-natural. Asset type: seamless square floor albedo material tile. Full bleed flat orthographic straight-down scan of the material only. Strict MONOCHROME GRAYSCALE, rich natural midtones with sharp fine realistic details, intended for duotone recoloring in a 2D interior game. Real premium material, not vector, not cartoon, not plastic. Uniform diffuse lighting, no directional shadows or spotlight, no perspective, no room or furniture, no objects, no text, no watermark or border. True seamless repeat: edges meet exactly on both axes, pattern and grain continue across boundaries. Brief: premium fine terrazzo floor, irregular small and medium marble aggregate chips embedded naturally in a smooth mineral binder, irregular angular aggregate shapes, subtle pores and finely honed surface, sophisticated restrained mineral variation, continuous terrazzo slab with no tile grid.

### hexagon

Use case: photorealistic-natural. Asset type: seamless square floor albedo material tile. Full bleed flat orthographic straight-down scan of the material only. Strict MONOCHROME GRAYSCALE, rich natural midtones with sharp fine realistic details, intended for duotone recoloring in a 2D interior game. Real premium material, not vector, not cartoon, not plastic. Uniform diffuse lighting, no directional shadows or spotlight, no perspective, no room or furniture, no objects, no text, no watermark or border. True seamless repeat: edges meet exactly on both axes, pattern and grain continue across boundaries. Brief: premium hexagonal ceramic floor tiles, an exact dense honeycomb tessellation of medium regular hexagons, very thin fine grout joints, gently cloudy handcrafted matte glaze and delicate natural variation between tiles, tiny believable surface details.

### marble

Use case: photorealistic-natural. Asset type: seamless square floor albedo material tile. Full bleed flat orthographic straight-down scan of the material only. Strict MONOCHROME GRAYSCALE, rich natural midtones with sharp fine realistic details, intended for duotone recoloring in a 2D interior game. Real premium material, not vector, not cartoon, not plastic. Uniform diffuse lighting, no directional shadows or spotlight, no perspective, no room or furniture, no objects, no text, no watermark or border. True seamless repeat: edges meet exactly on both axes, pattern and grain continue across boundaries. Brief: luxurious large-format honed white marble flooring, long irregular charcoal mineral veins with realistic fine branching and cloudy translucency deep in pale marble, very narrow joints between large rectangular slabs, sophisticated natural stone, varied organic vein thickness and no repeated artificial zigzags.

### magnolia

Use case: photorealistic-natural. Asset type: seamless square wallpaper material tile. Full bleed flat orthographic straight-on scan of the material only. Strict MONOCHROME GRAYSCALE, rich natural midtones with sharp fine realistic details, intended for duotone recoloring in a 2D interior game. Real premium material, not vector, not cartoon, not plastic. Uniform diffuse lighting, no directional shadows or spotlight, no perspective, no room or furniture, no objects, no text, no watermark or border. True seamless repeat: edges meet exactly on both axes, pattern and grain continue across boundaries. Brief: premium botanical magnolia wallpaper printed on matte nonwoven paper, elegant realistic magnolia branches with broad gently curled petals, delicately shaded buds, leathery veined leaves, airy refined composition, medium sized botanical flowers, tactile paper fibers, naturalistic painted print.

### damask

Use case: photorealistic-natural. Asset type: seamless square wallpaper material tile. Full bleed flat orthographic straight-on scan of the material only. Strict MONOCHROME GRAYSCALE, rich natural midtones with sharp fine realistic details, intended for duotone recoloring in a 2D interior game. Real premium material, not vector, not cartoon, not plastic. Uniform diffuse lighting, no directional shadows or spotlight, no perspective, no room or furniture, no objects, no text, no watermark or border. True seamless repeat: edges meet exactly on both axes, pattern and grain continue across boundaries. Brief: premium traditional damask wallpaper woven on matte silk-like paper, balanced repeating symmetrical acanthus and palmette medallions in an elegant French design, delicate textile thread detail and gently embossed botanical scrollwork, intricate sophisticated engraving, soft tonal relief, no shiny plastic.

### linen

Use case: photorealistic-natural. Asset type: seamless square wallpaper material tile. Full bleed flat orthographic straight-on scan of the material only. Strict MONOCHROME GRAYSCALE, rich natural midtones with sharp fine realistic details, intended for duotone recoloring in a 2D interior game. Real premium material, not vector, not cartoon, not plastic. Uniform diffuse lighting, no directional shadows or spotlight, no perspective, no room or furniture, no objects, no text, no watermark or border. True seamless repeat: edges meet exactly on both axes, pattern and grain continue across boundaries. Brief: premium natural linen textured wallpaper, a beautiful finely woven flax fabric scan, clear subtle intersecting warp and weft threads, organic linen slubs, restrained natural fiber irregularity, even plain textile with no printed flowers, refined tactile matte finish, nuanced thread-level detail.

### fans

Use case: photorealistic-natural. Asset type: seamless square wallpaper material tile. Full bleed flat orthographic straight-on scan of the material only. Strict MONOCHROME GRAYSCALE, rich natural midtones with sharp fine realistic details, intended for duotone recoloring in a 2D interior game. Real premium material, not vector, not cartoon, not plastic. Uniform diffuse lighting, no directional shadows or spotlight, no perspective, no room or furniture, no objects, no text, no watermark or border. True seamless repeat: edges meet exactly on both axes, pattern and grain continue across boundaries. Brief: premium elegant Art Deco fan wallpaper, interlocking scalloped fan-shaped botanical ginkgo leaves with fine radial engraved veins, restrained raised-ink edge detail on matte nonwoven paper, sophisticated architectural repeating geometry, fine paper fibers and delicately shaded ink, no childish icons.
