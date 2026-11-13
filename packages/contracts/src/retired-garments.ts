const numbered = (prefix: string, count: number) =>
  Array.from({ length: count }, (_, i) => prefix + String(i + 1).padStart(2, "0"));

/** Items permanently removed from the game catalogue. */
export const retiredGarments: ReadonlySet<string> = new Set([
  ...numbered("fashion.ville-short-", 10),
  ...numbered("fashion.ville-skirt-", 10),
  ...[1, 2, 7, 8, 9, 10].map((n) => "fashion.ville-accessory-" + String(n).padStart(2, "0")),
  ...numbered("fashion.capsule-short-", 10),
  ...numbered("fashion.capsule-skirt-", 10),
  ...["sienne", "nuage", "rubis", "nacre", "ebene", "moka"].map((id) => "fashion.hair-" + id),
  "fashion.hair-v3-10-couronne",
  "fashion.premium-nova",
  ...["rose-poudre", "sport-prune", "cerises", "nuit-etoilee", "pistache", "peche", "espresso", "rayures", "bleu-ciel", "framboise"].map((id) => "fashion.tee-" + id),
  ...["haut", "short", "guetres", "escarpins"].map((id) => "fashion.minuit-polaire-" + id),
  ...["polo", "skirt", "tie", "belt", "choker", "hoops", "waves", "fishnets", "boots"].map((id) => "fashion.textile-punk-" + id),
  ...[
    "pink-jacket", "pink-skirt", "pink-pumps", "pink-warmers", "pink-hair", "pink-earrings", "pink-bag",
    "snow-top", "snow-shorts", "snow-pumps", "snow-warmers", "snow-hair", "snow-hat", "star-pearls", "pearl-studs", "snow-belt", "snow-bag",
    "ivory-dress", "ivory-boots", "ivory-hair", "ivory-beret", "pearl-drops", "ivory-handbag",
    "ribbon-camisole", "ribbon-cardigan", "ribbon-skirt", "ribbon-stockings", "ribbon-loafers", "ribbon-hair", "teardrop-pearls",
  ].map((id) => "fashion.winter-" + id),
  ...[
    "textile-cropped-knit", "textile-tailored-shorts", "leopard-ruched-halter", "medallion-flare-cargo",
    "fur-buckle-platforms", "medallion-belt", "burgundy-fold-sweater", "midnight-pleated-skirt",
    "midnight-loafers-socks", "cardigan-lilac", "jeans-indigo", "boots-ivory", "rose-bow-camisole",
    "rose-dragon-cargo", "white-platform-sneakers",
  ].map((id) => "fashion." + id),
]);
