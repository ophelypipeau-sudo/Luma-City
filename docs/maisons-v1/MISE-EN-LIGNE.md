# Mise en ligne des maisons

Cette version intègre les maisons à partir du code publié `469ff99`, en conservant
les évolutions déjà en ligne : personnages, vêtements, animalerie, relations,
messages privés, gains et présence hors des salles.

Le bouton **Ma maison** du quartier ouvre le salon. **Décorer**, **Mes meubles**
et **Accès & invitations** permettent de tester la sauvegarde, l’inventaire et les
visites. Les boutons Maison des amis et des profils donnent accès aux visites.

Les dix exemplaires de départ sont attribués une seule fois, sans débit. Les
meubles restent hors boutique et sans prix public. Le catalogue normal est vide ;
le serveur public refuse les nouveaux achats même si l’option de recette est
fournie. Les routes de panne ne sont montées que par le script Vite `--qa` local,
jamais par `npm start`.

Les migrations additives `026` à `029` ont été vérifiées sur une branche Neon
temporaire issue de la production. Les 21 personnages de cette copie sont restés
identiques après migration, attribution d’une maison et sauvegarde d’un décor.
Aucune offre commerciale n’a été créée. Les avatars et leurs assets n’ont aucun
changement par rapport à la version publiée de référence.

Les contrôles locaux de l’intégration ont validé TypeScript, la compilation Vite
et 64 tests ciblés, dont les maisons, les visites, la monnaie, les achats, les amis,
le chat et les autorisations. Le déploiement Railway lance aussi la suite complète
avec `npm run build` avant de démarrer le nouveau serveur.
