# Dressing hiver — pièces séparées et poses fixes

État actif : une base canonique inchangée, 43 articles dont 30 nouveaux dans quatre tenues de contrôle. Les anciens systèmes de morphologies restent suspendus.

## Composition

`winter.ts` ajoute Étoile givrée, Neige & Perles, Ivoire doux et Ruban rose. Emplacements indépendants : top, bottom, shoes, outerwear, legwear, hair, headwear, necklace, earrings, belt, bag. Une robe occupe le haut et libère le bas. Les bijoux partagés ne sont pas dupliqués. Les petits nœuds et fleurs restent intégrés à leur coiffure ; béret et bonnet sont indépendants. Aucun ajout dans l’onglet Collection pour le moment.

Les perruques ont des passages arrière/avant complémentaires et utilisent les mêmes masques de couleur. Les bas et chaussures sont indépendants. Les chaussures disposent de masques corporels calibrés, sans pieds peints dans l’article.

Les sacs d’épaule restent petits, latéraux entre le torse et la taille. Le sac Matelassé ivoire utilise une main fermée séparée, avec les anses derrière les doigts. En pose mains en cœur, il passe à l’épaule et utilise son masque de couleur recalibré. Le sac ne change pas l’identité, la pose enregistrée ou les autres équipements.

## Poses

`RedrawnPoseDoll.tsx` remplace les anciennes épaules et bras par des dessins anatomiques dédiés, conservés dans `public/assets/avatar/poses/redraw-v4`. La base de face demeure inchangée dans la cabine. Les hauts à manches ont un dessin complet par pose et des masques de matière associés ; `replaceTop` est obligatoire. Le masque supprimant les bras au repos s’applique uniquement à la peau, jamais aux jupes, pantalons ou sacs. Les ouvertures utilisent la peau de la base, sans raccord de peau inventé.

Tout nouvel import doit posséder un profil validé pour les trois poses avant publication ; une image frontale ne suffit pas. Les identifiants et les couleurs restent identiques entre poses.

## Sources et méthode graphique

Mode : outil de dessin d’images intégré, édition à partir des références réellement fournies, sans clé OpenAI du projet. Les sources originales et dessins intermédiaires sont conservés dans `public/assets/avatar/winter-v1/sources` et `public/assets/avatar/poses/redraw-v4/*-source.png`. Les manifestes JSON relient les sources aux sorties.

Consignes de génération utilisées : garder strictement le visage, l’échelle et les proportions du mannequin 887 × 1774 ; redessiner les vêtements sur cette base en conservant leurs volumes, ombrages et détails ; produire les variantes de face, main sur la hanche et mains en cœur ; isoler ensuite les pièces sur fond transparent, sans peau ni fragments de mannequin. Coiffures en avant/arrière, petits ornements intégrés ; couvre-chefs et bijoux séparés. Pour les sacs : petit volume latéral, anse continue, main fermée indépendante si porté main. Les sources de vêtements incomplets ont été remplacées par des dessins isolés opaques ; les fragments de manches étrangers à la jupe ont été retirés par composantes connexes sans rogner la coupe.

Scripts reproductibles avec les sources locales conservées :

1. `npx tsx scripts/prepare-pose-redraw-v4.ts`
2. `npx tsx scripts/prepare-winter-dressing.ts`
3. `npx tsx scripts/refine-winter-assets.ts`
4. `npx tsx scripts/finalize-winter-poses.ts`
5. `npx tsx scripts/refine-winter-belt.ts`
6. `npx tsx scripts/refine-winter-pink-colors.ts`

Les scripts privilégient les sources générées disponibles et réutilisent les copies locales si le cache de génération n’existe plus. Aucune génération payante n’est lancée par ces scripts.

## Vérification

Planche `tests/fixtures/pose-wardrobe.html` : quatre nouvelles tenues et quatre anciennes, trois poses et variante de couleurs. Captures dans ce dossier. Contrôle de la boutique et du petit écran conservé également. Les tests couvrent les pièces indépendantes, la persistance des achats et couleurs, les passes de perruques, l’alpha des matières, la protection du métal, le porté du sac et l’absence de découpe des jupes par le masque des bras.

Le contrôle technique ne constitue pas une validation artistique : les captures permettent de juger les nouveaux dessins et de demander des retouches précises.
