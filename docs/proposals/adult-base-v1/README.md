# Proposition d’une base 2D plus adulte

Statut : proposition visuelle à valider. Aucune base active, tenue, calibration
ou fonctionnalité du jeu n’a été remplacée.

Demande : conserver un personnage en 2D, réduire l’apparence enfantine et créer
une identité propre au projet de jeu social de mode.

- `body-proposal.png` : illustration générée avec l’outil intégré imagegen,
  953 × 1651 pixels, transparente, base chauve en sous-vêtements opaques.
- `comparison.png` et `.svg` : mannequin actuel à gauche, proposition à droite.
  Hauteur visible identique, cadrage commun ; chaque image reçoit uniquement une
  mise à l’échelle uniforme pour la comparaison. Aucun corps n’est étiré.
- `prompt.txt` : prompt exact de génération.
- `display-registration.json` : dimensions et repères d’affichage mesurés.
- `provenance.json` : fichiers et empreintes, notamment celle de la base active.

Seule référence transmise au générateur : la base actuelle du projet
`public/assets/avatar/body/base.png`, pour sa pose et sa palette. Aucun visuel
de MovieStarPlanet ni vêtement Pinterest n’a servi de référence à cette génération.
Cela ne constitue pas une certification d’absence de similitude ou de droits tiers.

Direction proposée : tête plus proportionnée, yeux moins grands, visage ovale
plus affirmé et buste plus long. Illustration 2D avec ombres douces, pose frontale.
La position des bras et des mains diffère légèrement ; il faudra calibrer les
vêtements sur les repères de la nouvelle base si cette direction est validée.
Le fichier n’est pas présenté comme un remplacement directement compatible avec
les vêtements actuels. La sortie du générateur n’a pas conservé les dimensions
demandées ; son canevas de production sera préparé après validation du dessin.

Reproduire la planche : `npx tsx scripts/export-adult-proposal.tsx`.
Cette étape n’a pas nécessité de modification du code de production ni de tests
de l’application. Une réussite technique ne vaut pas validation artistique.

## Repères de propriété intellectuelle — France

Le projet doit développer ses propres personnages, interfaces, décors, textes,
nom et logo. Une ressemblance de genre ne permet pas de conclure à elle seule
qu’un projet est licite ou illicite. L’INPI distingue les idées de leur expression
concrète : https://www.inpi.fr/ressources/propriete-intellectuelle/droit-dauteur

Un nouveau nom doit faire l’objet de vérifications de disponibilité et de
similitude : https://www.inpi.fr/ressources/propriete-intellectuelle/rechercher-une-marque-base-marques

Les vêtements adaptés depuis Pinterest dans les essais précédents n’ont pas fait
l’objet d’une vérification de leurs licences. Détourage et adaptation ne remplacent
pas l’autorisation du titulaire quand elle est requise ; l’article L122-4 vise aussi
les adaptations et transformations :
https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278911

Ces repères ne constituent pas une validation juridique du jeu ni une garantie
contre un litige. Un examen du projet final et de ses sources sera nécessaire
avant de conclure sur ses risques juridiques.
