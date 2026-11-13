> Statut actuel : sablier puis cinq autres corps validés explicitement. La tenue pilote est dans ../pilot-v6/. Les mentions de validation en attente ci-dessous décrivent l'étape historique de création.

# Sablier X — illustration 02 validée

La planche des six corps v1 a été refusée par l'utilisateur. Les modèles de
morphologies, identifiants d'équipements, looks, masques et tests sont conservés.
Cette étape produit uniquement une nouvelle étude graphique du sablier X.
Aucun corps de production ni vêtement du jeu n'a été remplacé.

## Limite de la méthode précédente et méthode proposée

La v1 assemblait des parties raster de la base v6 avec une anatomie définie par
quelques contours SVG. Le corps était trop schématique pour retrouver les
volumes et les transitions de l'illustration de référence. La continuité du
visage, des épaules, des bras, du bassin et des chevilles n'était pas suffisamment
traitée. Les tests de masques et d'identité ne valident pas la qualité du dessin.

La proposition 02 est une illustration raster complète : l'anatomie, les mains,
les pieds, les contours et les ombres sont rendus ensemble. Ce n'est pas un
assemblage des anciens membres ni un étirement du PNG existant. Le visage
d'Iris est utilisé comme référence d'identité et la poupée fournie par
l'utilisateur comme référence de qualité cartoon. Une génération guidée par
référence ne garantit pas une copie pixel à pixel du visage : sa fidélité fait
partie de la validation visuelle, sans prétendre qu'un test technique la remplace.

Après validation de cette seule base, la méthode d'intégration prévue est de
conserver l'illustration indépendante, de relever ses contours et repères réels,
puis d'adapter les vêtements et les masques SVG à ces mesures. Aucun découpage
de membre ne doit créer de raccord visible. Ne pas déformer l'image pour la
forcer dans l'ancien canevas ; utiliser un placement uniforme puis recalibrer
les repères. Les identifiants des pièces restent ceux du modèle existant.

Les cinq autres corps, la tenue pilote et l'interface de sauvegarde des looks
ne sont pas réalisés dans cette étape et attendent les validations prévues.

## Livrables

- `comparaison-reference-sablier.png` / `.svg` : comparaison en grand, à gauche
  la référence cartoon fournie, à droite le nouveau sablier.
- `hourglass-illustration-v2.png` : illustration originale à fond transparent,
  887 × 1774, corps chauve en bandeau et culotte opaques lavande.
- `iris-v6-reference.png` : export fidèle de la base actuelle d'Iris, utilisé
  comme cible et référence de visage/pose, pas comme nouvelle proposition.
- `reference-style-fournie.png` : copie de l'image réellement accessible fournie
  par l'utilisateur (`codex-clipboard-10276a72-219e-4244-bbbd-8b363e9c0a9d.png`).
- `prompt.txt` : prompt complet utilisé pour l'illustration.

Mode : skill imagegen, outil intégré `image_gen`, édition avec deux références,
transparence demandée. Aucune CLI ni clé API utilisée. Source générée conservée :
`C:/Users/vosma/.codex/generated_images/01a1bc58-ff5f-7601-ba39-06797aeaee0d/exec-1ab78dc5-a719-475d-871a-e57891b16a9c.png`.

La comparaison est une mise en page de présentation avec conservation des
proportions ; les bitmaps sources restent inchangés. Son rendu utilise le même
filtre d'alpha de présentation que les exports v6 pour les pixels très peu opaques.

Scripts de reproduction de la présentation :

```
npx tsx scripts/export-iris-visual-reference.tsx
npx tsx scripts/export-hourglass-review.tsx
```

La comparaison a été inspectée en grand, notamment épaules/cou, taille/hanches,
mains et chevilles/pieds. Elle est proposée à l'appréciation de l'utilisateur,
pas déclarée validée. Aucun résultat de test technique n'est invoqué comme
validation artistique.
