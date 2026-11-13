# Fourrure rattachée au pantalon

Correction demandée : la bordure fourrure appartient aux ourlets du pantalon, et non aux chaussures. `scripts/split-leopard-fur.ts` transfère la couche existante vers le pantalon, sans modifier le mannequin. Les sources v1 sont conservées.

La vignette du pantalon inclut la fourrure, qui reste portée lorsque les chaussures sont retirées ou remplacées. Le masque de couleur principal reste celui du tissu ; la zone secondaire « Fourrure » possède son masque propre. Les chaussures sont renommées « Plateformes à boucles » et passent derrière le pantalon. Leur partie en cuir cachée par la fourrure est complétée dans `leather-upper.svg`, sur les repères des chevilles et des semelles, pour pouvoir être portée seule.

Identifiants et prix conservés pour les équipements déjà sélectionnés. Le nom historique de l’identifiant des chaussures contient encore « fur » afin de préserver cette compatibilité. Les assets actifs sont dans `public/assets/avatar/leopard-v2/`. Le haut et les variantes de sous-vêtements restent inchangés en v1.
