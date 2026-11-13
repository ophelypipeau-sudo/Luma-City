> État actif : mannequin fourni par l’utilisateur, mains conservées à l’identique dans `public/assets/avatar/fashion-v2/body-user.png`. Tenue séparée cardigan-caraco / jean / bottines. Voir [fashion-doll-v2/README.md](fashion-doll-v2/README.md). Les sections suivantes conservent aussi les étapes historiques.

> État actif : dressing à base unique (X approuvé), avec emplacements indépendants top/bottom/shoes. Le choix des six morphologies est suspendu. Voir `avatar-layers.md`. Les sections suivantes décrivent aussi le travail historique conservé.

> État actuel : les six corps illustrés ont été validés par l’utilisateur et une tenue pilote est disponible pour Iris. Voir proposals/pilot-v6/README.md. Le document ci-dessous décrit aussi le rendu historique conservé.

# Direction artistique v6 — poupée cartoon

Référence principale : l’image de poupée fournie par l’utilisateur le 9 novembre 2026 (`codex-clipboard-10276a72-219e-4244-bbbd-8b363e9c0a9d.png`) et ses consignes explicites. La nouvelle demande remplace les anciennes proportions semi-réalistes et la pose en trois quarts. Le rendu actif est frontal : tête plus grande, grands yeux expressifs, contours nets, ombrages doux et couleurs lumineuses.

## Ce qui est intégré

- Quatre nouvelles bases adultes chauves en sous-vêtements opaques : Iris, Milo, June, Noa.
- Quatre coiffures séparées, avec passages arrière / avant et dégagement du visage.
- Hauts, bas et chaussures dessinés dans ce nouveau repère, avec trois couleurs par pièce.
- Bijoux, lunettes et sac sur trois sous-emplacements indépendants : ils se combinent.
- Un composant `CartoonDoll` partagé entre cabine, portraits, colonne de gauche et personnages dans la salle.
- Des vignettes sans corps utilisant le même dessin que la pièce portée.

## Assets enregistrés

- `public/assets/cartoon-base-v6.png` : nouvel atlas de corps, 1717 × 916 pixels réels.
- `public/assets/cartoon-hair-v6.png` : nouvel atlas de perruques, même taille réelle.
- `apps/web/src/cartoon/model.ts` : canevas logique 1920 × 1024, quatre cellules de 480 × 1024, repères féminins et masculins.
- `apps/web/src/cartoon/Wardrobe.tsx` : dessins de vêtements et accessoires, sans texture semi-réaliste v5.
- `apps/web/src/cartoon/CartoonDoll.tsx` : composition des calques.
- `docs/avatar-cartoon-v6.svg` et `docs/screenshots/avatar-cartoon-v6-planche.png` : planche autonome, exportée depuis le vrai composant, images intégrées.

Les PNG générés ont conservé le même rapport de dimensions et les quatre cellules. Ils sont affichés ensemble sur le canevas logique : le corps et la perruque ne sont pas recentrés à partir de leur boîte de détourage. Les sources de génération sont conservées dans le dossier Codex et copiées dans le projet sous ces noms versionnés.

## Ordre des calques

Revers arrière des chaussures → cheveux arrière → corps découpé par les silhouettes des pièces équipées → bas → chaussures avant → haut → cheveux avant avec visage dégagé → anses du sac → mains soumises au même masque corporel → bijoux, lunettes et poche du sac. Un même repère est conservé lors de tout changement de tenue. Les chaussures masquent uniquement les pieds couverts ; retirer une pièce restitue la base.

La frange ne recouvre pas les yeux. Les lunettes choisies sont un accessoire distinct, porté volontairement devant le visage. Les pompons et clips décoratifs font partie des coiffures correspondantes et disparaissent avec elles.

Les accessoires utilisent trois bits dans `Outfit.accessories` : bijoux, lunettes, sac. Le catalogue ajoute ou retire un sous-emplacement ; Réessayer l’ajoute sans basculer son état ; retirer une ligne de l’historique conserve les autres accessoires. Les vêtements et la coiffure gardent leurs emplacements indépendants.

## Règles pour les futurs imports

1. Utiliser cette base et cette direction cartoon, avec la pose frontale fixe.
2. Garder le canevas logique complet de 480 × 1024, même si la pièce n’occupe qu’une petite zone.
3. Ajuster chaque pièce aux repères du modèle concerné, notamment les épaules masculines, placées plus haut que celles du modèle féminin.
4. Conserver le visage visible, les raccords aux poignets et aux chevilles, ainsi que la ligne du sol.
5. Préparer les parties avant et arrière avant l’intégration. Ne pas détourer une tenue contenant des morceaux du corps.
6. Décliner les couleurs sur le même contour ; toute nouvelle coupe nécessite son propre contour adapté.
7. Vérifier chaque variante dans la cabine, sur les quatre personnages compatibles et à 390 × 844.

Exporter les guides avec `npx tsx scripts/export-cartoon-guides.tsx` et la planche avec `npx tsx scripts/export-cartoon-board.tsx`. Les guides sont enregistrés dans `.data/cartoon-guides/`, avec un SVG et un PNG transparent par pièce et personnage. Les variantes v5 sont archivées dans `docs/archive/render-v5/` et ne sont plus actives.

## Génération de la nouvelle base

Skill imagegen, outil intégré `image_gen`, sans CLI. L’image jointe est une référence de direction artistique ; aucune base semi-réaliste antérieure n’a servi de cible.

```text
Create a BRAND NEW production character BASE ATLAS for a 2D cartoon fashion-doll dress-up game. The attached image is the PRIMARY ART DIRECTION: stylized fashion doll, large expressive almond eyes, clean thin outlines, detailed cute face, plump stylized lips, softly shaded bright colors, smooth cartoon skin, elongated stylized legs. Intentionally CARTOON, NOT semi-realistic, NOT rendered 3D, NOT photographic, NOT muscular realistic anatomy. All four characters are ADULTS age 25+. Exact transparent canvas 1920x1024 with FOUR equal 480x1024 columns, each adult centered at local x240, all in exactly the SAME neutral FRONT-FACING full-body standing pose, relaxed arms slightly separated, fingers gently open, straight legs with a small natural gap and feet on identical y990 baseline. No bent-knee runway pose and no three-quarter torso. New doll proportions: enlarged head roughly 180px wide and 190px tall, scalp around y60, chin around y250, neck y250-290, shoulder line y300, torso chest y340-390, narrow waist y455, hips y535, crotch y600, knees y755, ankles y935, soles y990. Adult fashion-doll proportions around five heads tall, appealing larger head, long stylized legs. Female shoulders around local x150 and330, waist x185..295, hips x155..325, hands near local x110 and370 at y580. Keep all four full figures completely inside their own columns. ALL FOUR COMPLETELY BALD, no scalp hair, no stubble, no jewelry or earrings, no makeup accessories, no shoes. Female adults in columns1 and3 wear simple modest OPAQUE lavender strapless bandeau bras (top around y355, lower edge around y395) and full-coverage high-waist opaque lavender briefs. Male adults in columns2 and4 wear opaque lavender mid-thigh boxer briefs; no exaggerated muscles. NO NUDITY or sheer underwear. Column1: adult woman warm honey tan skin, large expressive green almond eyes, long curled eyelashes, softly arched dark eyebrows, small stylized nose, glossy rose lips, subtle freckles. Column2: adult man medium peach-tan skin, large warm brown eyes, friendly stylized eyebrows, no beard. Column3: adult woman light peach skin, large hazel eyes, freckles and coral lips, same female silhouette and pose as column1. Column4: adult man deep warm brown skin, expressive amber-brown eyes, same male silhouette and pose as column2. Consistent detailed cartoon fashion-game style across all four. Soft two-tone shading, clear linework, no pore texture, no painterly realism. Transparent background, no floor, no shadow, no grid, no text. This fixed bald underwear base will receive independently drawn hair, clothes and accessories later.
```

## Génération des coiffures

Skill imagegen, outil intégré `image_gen`, sans CLI. Cible de placement : le nouvel atlas de corps. Référence de coiffure et de style : l’image principale de l’utilisateur.

```text
Create a TRANSPARENT HAIR-ONLY SPRITE ATLAS registered to IMAGE 1, the supplied new bald 2D CARTOON adult fashion-doll body atlas. IMAGE 2 is the PRIMARY HAIRSTYLE AND ART-STYLE REFERENCE, not a layout reference. Use the exact canvas and head positions from image1 (1717x916 actual pixels, four equal columns), each hair piece must fit directly over its own bald head with NO head resizing, repositioning or change of facing angle. All heads face straight FRONT. Four separate wig silhouettes only, with transparent face openings and NO humans or bodies. Column1: long bright buttery blonde center-part hair, smooth cartoon ribbon-shaped locks, two small high half-up buns decorated with fluffy white pom-poms like image2, two front face-framing strands, hair falls along both sides to hip level around image y570 (normalized y637). Crown should cover the head at its existing scalp y35 and temple sides, eyes at image y125 must stay completely visible through a transparent face opening. Column2: short tousled warm dark brown hair, rounded stylish cartoon tufts, frontal hairstyle fits its original head around x640,y30; transparent under fringe, short sides around ears, never cover eyes. Column3: long auburn wavy center-part hair, soft cartoon waves, little pearl clips, hair to hips, fits exact bald female head in column3 with same face opening as column1. Column4: short deep dark brown curly textured cartoon hair, rounded curly top, fits original bald head in column4, no hair in eye area. Match crisp fine outlines, softly shaded luminous colors, smooth flat/cartoon fashion-game rendering, NOT realistic hair photography, NOT semi-realistic painting, NOT 3D, no flyaway photoreal hair texture. Keep the hair silhouettes around the ORIGINAL head contours, not generic floating wig thumbnails. REMOVE ALL faces, eyes, skin, ears, necks, bodies, underwear, hands, legs, feet and background. No skin-colored pixels, no mannequin, no jewelry below the ears, no labels. Face openings and all background truly transparent. The wigs remain in their original quarter-column positions and heights to overlay image1 as functional dress-up assets.
```

