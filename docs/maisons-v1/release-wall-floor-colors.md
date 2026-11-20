# Publication des murs et sols personnalisables

La décoration propose dix dessins de sols et dix motifs de papiers peints, en plus des peintures et des briques existantes. Les variantes de couleur sont regroupées ; les achats et identifiants historiques restent valides.

Chaque article dispose d'une fiche avec un grand aperçu. Les papiers peints conservent leurs moulures ; les sols utilisent des matières réalistes. Les teintes du fond, des motifs, du bois et des veines se sauvegardent avec la maison et sont transmises aux visiteurs. Les peintures unies, dont Sauge, sont également personnalisables. Les commandes sont accessibles sur mobile, avec palettes et saisie de code couleur.

Les poubelles masquent les modèles du catalogue sans supprimer les achats ou les meubles posés. La restauration reste disponible dans « Articles masqués ». Ce choix est conservé dans le navigateur, pour chaque personnage.

Les migrations 033 à 035 ajoutent les deux palettes JSONB et étendent les identifiants acceptés. Elles ont été vérifiées sur une branche isolée issue de la production : les neuf nouveaux articles s'achètent et s'enregistrent, Sauge et Chêne clair acceptent leurs teintes et les données existantes restent identiques après migration.

La publication ne modifie aucun personnage, vêtement, asset d'avatar, moteur de rendu des personnages ou règle de vente des meubles. Le garde-fou du serveur qui interdit la vente des meubles en production reste inchangé.

Validation : build Vite, TypeScript, contrôle des poses, suite complète de tests et vérification des aperçus après leur génération. Les sources des nouvelles textures et leurs prompts sont conservés dans les dossiers wallpapers-realistic-v1, floors-realistic-v1 et expanded-materials-v1.
