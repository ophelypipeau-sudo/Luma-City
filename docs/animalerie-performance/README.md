# Chargement des images de l’animalerie

Les 918 PNG de création totalisent 1 566 577 251 octets. Des dérivés WebP transparents de 320 et 640 pixels de large sont générés au build avec Sharp, qualité 84 et alpha 100. Le canevas et ses proportions sont conservés, sans recadrage ni modification du dessin. Les originaux restent versionnés.

Les 918 fichiers de 320 pixels totalisent 19 438 474 octets, soit 21 175 octets par pelage en moyenne et 98,8 % de données en moins. Ce chiffre compare les poids, pas un temps de chargement réseau mesuré. Le navigateur choisit la taille avec srcset et sizes. Les six premières couvertures et quatre premiers pelages sont chargés immédiatement ; seules les deux premières images reçoivent la priorité haute. Les autres restent en chargement différé.

Les dérivés ont un cache public de 24 heures et stale-while-revalidate de 7 jours. Le dossier v1 doit être incrémenté si la politique de génération change. Une modification de source est régénérée au prochain build. npm run assets:companions est exécuté avant dev, test et build. Les sorties sont ignorées par Git et incluses dans dist par Vite.

Contrôles : 1 836 dérivés décodés et vérifiés (WebP, transparence, dimensions/proportions), rendu HTML responsive et priorités, 4 tests catalogue/adoption réussis, TypeScript et Vite réussis. Réponse Fastify vérifiée : HTTP 200, image/webp, Cache-Control attendu. Fixture contrôlée à 390 et 800 pixels : six images chargées sur 450 cartes dans le panneau mobile à l’entrée ; pelages de l’Akita américain et du Berger hollandais affichés correctement après navigation. [Capture](mobile-desktop.jpg).
