# Galerie sur le côté et validation explicite

Le bouton Pose conserve sa position dans la colonne du personnage. La galerie s'ouvre désormais à droite de cette colonne, sans recouvrir le mannequin, avec une largeur limitée à l'espace restant dans la fenêtre.

Les vignettes sélectionnent un aperçu temporaire : le personnage de gauche adopte immédiatement la pose et le panneau reste ouvert. Le bouton « Enregistrer » confirme et mémorise le choix, puis referme le panneau. Fermer par la croix, Échap, le bouton Pose ou un clic extérieur annule l'aperçu et rétablit la pose enregistrée. En cas d'échec du stockage local, le panneau reste ouvert avec une erreur ; la préférence enregistrée n'est pas remplacée.

La tenue, ses couleurs, les achats et le mannequin frontal de la boutique ne sont pas modifiés. Le choix reste indépendant par compte/personnage.

Modifications : `apps/web/src/avatar/CharacterPose.tsx` (séparation aperçu/enregistrement), `apps/web/src/game-shell.css` (panneau latéral et bouton).

Validation : build TypeScript/Vite ; deux tests existants des préférences et des découpes réussis. Contrôle navigateur à 1254 × 884 : aperçu hanche avec galerie ouverte, fermeture sans sauvegarde rétablissant le cœur, enregistrement de la hanche conservé après rechargement, puis retour au cœur enregistré. Capture du panneau et du personnage visibles ensemble : `side-gallery.jpg`.
