# Recalibrage sur les mesures d’Iris

Les sources restent dans `../burgundy-outfit-v1/`. Les nouveaux calques et masques sont dans `public/assets/avatar/burgundy-v2/`. Les identifiants de boutique et les prix n’ont pas changé.

`scripts/fit-burgundy-to-body.ts` relève les sections réelles du corps puis adapte séparément les épaules, bras, torse, hanches, jambes et pieds. Corps immuable ; aucune couleur de peau repeinte. Le pull reçoit 4 pixels d’aisance au torse, 5 aux manches et 10 aux revers des poignets ; la jupe garde une aisance progressive pour les plis ; les chaussures conservent leurs semelles après la fin des pieds.

Mesures communes : `body-measurements.json`. Guide pour les prochaines références : `../body-fit-reference.md`. Les contrôles techniques et visuels sont complémentaires. Captures : `fitting.jpg`, `mobile.jpg` et `boutique.jpg`.
