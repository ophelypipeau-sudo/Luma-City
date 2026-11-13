# Tenue bordeaux et noir — boutique directe

Référence utilisateur : `reference.png`. Trois recréations via imagegen intégré : pull bordeaux côtelé à large revers, jupe plissée noire, mocassins noirs avec chaussettes. Aucun passage par les brouillons de l’atelier, aucun appel à une API du jeu.

## Catalogue

Dans `apps/web/src/avatar/burgundy.ts` :
- `fashion.burgundy-fold-sweater` — 700 monnaies provisoires.
- `fashion.midnight-pleated-skirt` — 450.
- `fashion.midnight-loafers-socks` — 650, couleurs des chaussettes et des mocassins séparées.

Les trois pièces apparaissent avant les six précédentes. Les identifiants, tenues par défaut et fonctionnalités existants sont préservés. Collection reste vide. Le pull, la jupe et les chaussures se changent individuellement.

## Calques

Sources de génération conservées ici ; PNG natifs et masques dans `public/assets/avatar/burgundy-v1/`. `scripts/prepare-burgundy-outfit.ts` calibre uniquement les vêtements, sur 887×1774, par interpolation bilinéaire avec alpha. Les repères sont conservés dans `*-registration.json`. Aucun assemblage de bandes fractionnaires dans le jeu. Les manches sont élargies côté intérieur aux coudes pour couvrir les bras. Le corps et les mains ne sont pas retouchés. Même PNG pour la vignette et la cabine, aucune peau dans les assets.

Pull devant la jupe ; chaussures derrière les bas longs. Le corps garde ses dessous opaques, masqués seulement par les parties couvertes des habits. Aucun sac ni nouvelle coiffure ajouté.

## Vérifications

`checks.json` : torse couvert, visage et mains libres, 100 % des dessous du bas couverts et 100 % des pieds dans les mocassins. Le corps garde son SHA-256 canonique `8e3b61c5a45e5ddc9ee528530ced84eea3bd883a1a2e05914b81fd46e3b269e4`.

Contrôle visuel : `tests/fixtures/fitting.html`, bouton Tenue bordeaux complète ; boutique réelle ; écran 390×844. Captures `fitting.jpg`, `mobile.jpg`, `boutique.jpg`. Compilation et 11 tests ciblés existants réussis. Les tests techniques ne valident pas à eux seuls la qualité artistique.

## Consignes de génération

Trois appels séparés à imagegen intégré, corps canonique comme référence de pose/proportions et image fournie comme référence de style. Demande : pièce seule sur fond transparent, rendu 2D cartoon propre, ombres douces, aucun visage, aucune peau, aucun mannequin ni accessoire ajouté. Pull : côtes bordeaux, revers horizontal, taille cintrée, manches suivant les bras en A. Jupe : ceinture noire, plis larges, trapèze court adapté aux hanches. Chaussures : deux pieds de face au même sol, chaussettes côtelées et mocassins brillants à semelle épaisse, sans trous de jambe. Repères de canevas épaules, poitrine, taille, poignets, hanches, chevilles et sol donnés ; recalage effectif conservé dans le script.
