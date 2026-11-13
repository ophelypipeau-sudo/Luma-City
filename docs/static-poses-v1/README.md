# Choix de pose et retrait des épaules au repos

Le bouton « Pose » est placé au-dessus du personnage, à gauche. Il ouvre les trois poses fixes existantes : face, main sur la hanche, mains en cœur. Le choix est enregistré localement par compte et personnage avec `character-static-poses-v1`, indépendamment du dressing et des achats. Les valeurs inconnues/endommagées sont ignorées. La cabine ne reçoit jamais ce choix et conserve son rendu de face. Aucune respiration n'est activée.

Fichiers : `avatar/CharacterPose.tsx` (bouton, panneau, sélection et sauvegarde), `avatar/static-poses.ts` (identifiants et lecture validée), `main.tsx` (portrait de gauche) et `game-shell.css` (position du petit bouton et du panneau).

Correction du cœur : dans `HeartHandsDoll.tsx`, l'ancien masque progressif conservant les épaules au repos est remplacé par une découpe opaque des deux anciennes régions de bras/épaules. Le passage qui redessinait les épaules originales du pull est supprimé. Une seule paire d'épaules est affichée, issue de la pose, avec les avant-bras devant le torse et les mains devant les poignets. Les corps et assets sources restent inchangés ; pas de nouveau dessin du visage ou du corps.

Validation : build TypeScript/Vite ; sept tests ciblés réussis, dont effacement complet des anciens sommets d'épaules, conservation du visage/torse/jambes, indépendance des préférences par personnage et des vêtements. Dans le navigateur : trois poses sélectionnées, fermeture du panneau après choix, hanche conservée après rechargement, retour au cœur et cabine frontale. Captures dans ce dossier.
