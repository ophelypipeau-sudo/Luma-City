# Carte et pastilles — révision du 8 novembre 2026

- Boutique : sur les vitrines de vêtements à gauche.
- Ma maison : sur la maison en haut à gauche, à l'emplacement indiqué.
- Salle de chat : sur l'entrée de la verrière ; son clic ouvre la salle multijoueur existante.
- Animalerie : remplace visuellement la pâtisserie en bas à gauche.

Les ronds affichent une infobulle au survol, au focus clavier et au toucher. Les
lieux encore non réalisés affichent « Bientôt disponible » sans simuler un achat
ou un logement. La carte se déplace horizontalement au toucher sur petit écran ;
les pastilles suivent les coordonnées de l'illustration.

Le champ HEX sous la palette est marqué VIP et verrouillé pour les comptes de
P0. Aucun compte n'a reçu arbitrairement le statut VIP. Le contrôle valide un
code #RRGGBB et est prévu pour une capacité renvoyée par le serveur ; celle-ci
n'est pas activée dans ce prototype. Cela ne tranche pas la portée future du VIP
au compte ou au personnage et ne crée ni paiement ni avantage permanent.

## Asset et provenance

Image intégrée : `public/assets/neighborhood-pet-shop-v2.png`.
Original conservé : `public/assets/neighborhood-v1.png`.
Retouche avec l'outil intégré image_gen, sans CLI. Le reste de la carte est conservé
visuellement ; l'édition générative peut modifier de petits détails du dessin.

## Prompt de retouche

```text
Edit target: the supplied original illustrated neighborhood map. Change ONLY the peach/pink pastry shop in the BOTTOM LEFT corner (the building with pastry display windows and pink striped awning). Convert this same small shop into a charming PET SHOP / animalerie in exactly the same building footprint and perspective. Replace the cakes and pastry displays inside its two visible windows with cozy tasteful pet shop displays: a small sleeping kitten on a cushion in one window, a friendly small puppy beside a pet bed in the other, a few pet toys, baskets and food bowls, and small hanging paw-print silhouettes instead of pastry decorations. Use a small elegant paw-print emblem over the door, NO TEXT or lettering. Preserve the shop's peach stucco architecture, arched windows, flowers and pastel pink striped awning, with subtle mint details identifying the pet shop. Preserve the existing outdoor tables and parasols and every other part of the map unchanged: fashion shop with dresses on upper left, townhouses at top left, conservatory center-right, fountain, canal, bridge, trees, sky, composition, palette, proportions, rendering style, and canvas size. This is a localized edit, not a redesign. No UI, no labels, no markers, no logos, no extra buildings.
```

