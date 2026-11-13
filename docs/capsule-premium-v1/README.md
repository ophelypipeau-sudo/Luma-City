# Capsule premium · validation visuelle

[Ouvrir la planche détaillée](planche.html) · [Vue d’ensemble](planche.png) · [Briefs ImageGen](briefs.md)

La planche montre neuf modèles numérotés, chacun de face puis main sur la hanche. Les diptyques PNG se consultent à leur taille d’origine dans `visuels/`. Ces images présentent des essayages, pas des calques de dressing : elles ne sont ni détourées ni calibrées au pixel sur le canevas natif 887 × 1774. La pose mains en cœur ne fait pas partie de la capsule.

Le contrôle des créations précédentes a relevé le Nocturne noir à décolleté carré déjà en boutique. Velvet occupe la place 01. Son velours à manche unique le distingue de la veste zippée McBling et du drapé sans manches de Champagne. Minuit est un haut à col montant et lacets latéraux ; il est distinct de Minuit polaire. Le [premier essai d’Ambre](essais/07-ambre-polo-v1.png) ressemblait trop au polo Pistache. La proposition retenue pour la planche a une encolure ronde à côtes rayonnantes, sans col ni boutons.

| Nº | Proposition | Matière prévue pour la palette | À isoler ou préserver | Statut |
| --- | --- | --- | --- | --- |
| 01 | Velvet · Soft glam / Y2K luxe | Velours, manche et buste | Attache champagne | Dessin validé |
| 02 | Venus · Y2K glamour | Satin et bretelles | Deux coulisseaux argentés | Dessin validé |
| 03 | Éclat · Luxe contemporain | Satin et surpiqûres ton sur ton | Trois clous dorés | Dessin validé |
| 04 | Minuit · Mode alternative | Jacquard et volume du motif | Lacets et œillets | Dessin validé |
| 05 | Rosalie · Romantique moderne | Maille côtelée, revers et manches | Relief de la rosette | Dessin validé |
| 06 | Nova · Y2K futuriste | Tissu irisé, empiècements assemblés | Pont chromé, ouverture | Dessin validé |
| 07 | Ambre · Casual premium | Maille et côtes autour de l’encolure | Relief des côtes et des ourlets | Dessin validé |
| 08 | Séraphine · Glamour soirée | Satin grenat et drapé diagonal | Broderie perlée | Dessin validé |
| 10 | Alba · Minimalisme luxe | Crêpe, col construit et buste | Grain et coutures, aucun métal apparent | Dessin validé |

Pour chacune des deux poses, les [calques d’atelier](calques/index.json) comprennent un PNG transparent, un masque du tissu et un masque des détails protégés. Le manifeste relie chaque dessin source au patron et à l’empreinte du corps canonique. Les manches pliées proviennent des diptyques validés. Le panneau du torse reste entier sous la main native.

Avec Vite, ouvrir `/tests/fixtures/premium-capsule.html` pour essayer les deux poses et la palette d’atelier. Voir [les neuf hauts](controles/original.png), [les retouches en gros plan](controles/contours.png) et [les poignets en ivoire](controles/poignets-ivoire.png). Le détourage nettoie la couleur du fond aux bords sans toucher aux détails protégés. Les plaques `atelier-face.png` et `atelier-hanche.png` corrigent les traces de raccord aux épaules. Le jeu utilise ces composites avec les hauts de la capsule ; les calques des hauts et les sources du mannequin restent indépendants.

Reproduction : `npm exec -- tsx scripts/prepare-premium-capsule.ts`, puis `npm exec -- tsx scripts/preview-premium-capsule.ts`.

La [comparaison des contours](controles/nettete-contours.png) montre quatre détails à la même échelle. Le nettoyage cible les traces de fond et conserve l’opacité du bord, les coutures et les reflets irisés ; les repères de manche sont interpolés entre les lignes de mesure.

La nouvelle Séraphine présente un col souple, un drapé diagonal et une petite broderie perlée. [Comparaison des deux dessins sur Iris](controles/seraphine-v2-iris.png) · [Premier dessin](essais/08-seraphine-v1.png).

Les neuf articles sont disponibles dans la boutique. Le catalogue utilise les copies à l’identique des calques approuvés dans `public/assets/avatar/capsule-premium-v1`. La pose mains en cœur n’est pas activée pour ces hauts. Le contrôle des rendus du jeu se trouve dans `/tests/fixtures/pose-wardrobe.html` : [boutique](controles/boutique.jpg), [poses originales](controles/boutique-poses-original.png), [recoloration claire](controles/boutique-poses-clair.png).
