# Capsule chaussures — boutique

[Planche des dix paires](planche.html) · [Contrôle sur Iris](controle.jpg) · [Boutique](boutique.jpg)

Dune et Étrier remplacent Cavalcade et Encrier. Ligne ivoire reste un essai écarté. Les huit autres dessins validés sont conservés. Les sources des remplacements et les consignes restent dans ce dossier.

Les calques sont centrés uniformément sur le repère frontal 887 × 1774 à partir des essayages. Les chaussures, la peau et les pantalons restent indépendants. Les bottines passent sous les ourlets ; les masques de matière préservent semelles, lacets, pièces contrastées et ferrures. Les deux poses archivées ne sont pas proposées.

Réexport des calques : `npx tsx scripts/prepare-shoes-capsule.ts`. Contrôle visuel avec Fuseau, Dalle et en vignette : `tests/fixtures/shoes-capsule.html`.

Le contrôle des 11 paires en boutique a séparé la totalité des dessus (y compris les bouts de Campus, Opaline et Agrafe) des semelles, lacets et ferrures. Seuls les masques de la capsule ont été mis à jour ; les escarpins espresso ont été vérifiés et conservés tels quels.

[Comparatif en ambre](controle-teintes.png) · [Comparatif en bleu foncé](controle-teinte-foncee.png) · [Campus dans le nuancier de la boutique](campus-recolore.jpg).

Réexport des masques seuls : `npx tsx scripts/refresh-shoe-materials.ts`. Comparatif : `npx tsx scripts/preview-shoe-dyes.ts`.
