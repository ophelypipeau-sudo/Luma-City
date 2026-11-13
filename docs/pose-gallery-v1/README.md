# Galerie visuelle des poses

Le bouton Pose reste exactement à sa position dans la colonne du personnage. Son panneau remplace la liste par une grille à deux colonnes : cadre turquoise, vignettes violettes, nom sous chaque aperçu, contour doré pour la pose portée, fermeture rouge et navigation par pages de quatre poses. Les trois poses existantes sont proposées ; aucune quatrième pose fictive n'est ajoutée. Les flèches sont désactivées lorsqu'une seule page est disponible.

Chaque vignette réutilise `Portrait` avec le personnage et les vêtements réellement portés, y compris les couleurs et la ceinture. Choisir une vignette applique la pose, enregistre le choix avec le mécanisme existant et referme le panneau. La position du bouton, les pièces équipées et le mannequin frontal de la boutique sont conservés.

Fichiers modifiés : `apps/web/src/avatar/CharacterPose.tsx`, styles du panneau dans `apps/web/src/game-shell.css`. Aucun asset corporel ou vêtement n'est modifié.

Validation : compilation TypeScript/Vite réussie ; contrôle visuel à 1254 × 884 dans le jeu, sélection de la hanche depuis sa vignette et retour au cœur, fermeture du panneau après choix. Capture : `gallery.jpg`.
