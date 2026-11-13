> Mise à jour : le dressing teste maintenant les trois vêtements adaptés depuis la planche fournie. Les anciens vêtements restent en compatibilité. Voir [import-test-v1/README.md](import-test-v1/README.md). Collection est vide ; Top achats affiche les pièces disponibles.

# Apparence de la boutique — rose poudré

Référence : capture fournie par l’utilisateur, `codex-clipboard-1281ca35-2bb0-47a8-badd-fdc6812e639f.png`.
Seule la présentation de `LayeredDressing` change. Base unique, vêtements séparés,
masques et identifiants sont conservés.

- `apps/web/src/shop/LayeredDressing.tsx` : onglets Collection / Top achats,
  catégories Tout / Hauts / Bas / Chaussures, grille de vraies pièces, pagination,
  cabine translucide, comparaison avec la base et remise de la tenue complète.
- `apps/web/src/shop/layered-dressing.css` : décor, palette claire, cartes et cabine
  arrondies ; disposition adaptée à 390 × 844. Styles limités à ce dressing.
- `public/assets/boutique-blush-v1.png` : décor original généré avec l’outil intégré
  imagegen, sans avatar, interface ni texte. Prompt exact dans le fichier voisin
  `boutique-blush-v1-prompt.txt`. L’original généré reste conservé dans Codex.

La Collection affiche les trois pièces disponibles. Top achats présente une
sélection éditoriale du caraco et de la jupe ; aucun classement de ventes réelles
n’est revendiqué. Les catégories filtrent les fiches existantes ; une sélection
vide indique comment retrouver les pièces. La pagination se débloquera au-delà
de six articles. Aucun faux produit ou achat n’a été ajouté.

Les collections historiques restent accessibles par le lien en bas à gauche.
Les perruques et accessoires historiques ne sont pas migrés vers la nouvelle base.

Contrôles : compilation TypeScript/Vite ; filtres et essayage dans le jeu ; cabine
sur petit écran via la fixture mobile. Captures dans `screenshots/boutique-blush/`.
