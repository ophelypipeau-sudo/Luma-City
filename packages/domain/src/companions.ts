const spitzCanvas = [1312, 1199] as const;

export const COMPANION_BREEDS = {
  spitz: { name: "Spitz nain", species: "Chien", cover: "01-mochi", price: 1200, heightRatio: .21 },
  golden: { name: "Golden Retriever", species: "Chien", cover: "02-cookie", price: 1800, heightRatio: .44 },
  husky: { name: "Husky sibérien", species: "Chien", cover: "03-oslo", price: 1950, heightRatio: .42 },
  poodle: { name: "Caniche toy", species: "Chien", cover: "04-teddy", price: 1100, heightRatio: .24 },
  bulldog: { name: "Bouledogue français", species: "Chien", cover: "05-rio", price: 1400, heightRatio: .29 },
  ragdoll: { name: "Ragdoll", species: "Chat", cover: "06-luna", price: 1550, heightRatio: .28 },
  "black-shorthair": { name: "Chat à poil court", species: "Chat", cover: "07-salem", price: 950, heightRatio: .25 },
  british: { name: "British Shorthair", species: "Chat", cover: "08-nala", price: 1300, heightRatio: .24 },
  "maine-coon": { name: "Maine Coon", species: "Chat", cover: "09-moka", price: 2050, heightRatio: .33 },
  "ginger-tabby": { name: "Chat tigré à poil court", species: "Chat", cover: "10-biscotte", price: 850, heightRatio: .24 },
  "belier-nain": { name: "Lapin bélier nain", species: "Lapin", cover: "belier-nain-roux", price: 700, heightRatio: .16 },
  "hamster-syrien": { name: "Hamster syrien", species: "Hamster", cover: "hamster-syrien-dore", price: 450, heightRatio: .085 },
  "siamois": { name: "Siamois", species: "Chat", cover: "siamois-seal-point", price: 1450, heightRatio: .27 },
  "persan": { name: "Persan", species: "Chat", cover: "persan-blanc", price: 1700, heightRatio: .25 },
  "corgi": { name: "Welsh Corgi Pembroke", species: "Chien", cover: "corgi-roux-blanc", price: 1600, heightRatio: .26 },
  "teckel": { name: "Teckel à poil ras", species: "Chien", cover: "teckel-roux", price: 1350, heightRatio: .23 },
} as const;

export type CompanionBreedId = keyof typeof COMPANION_BREEDS;
type CompanionVariant = {
  id: string;
  breedId: CompanionBreedId;
  coat: string;
  active?: boolean;
  canvas: readonly [number, number];
  bounds: readonly [number, number, number, number];
  ground?: number;
};

// The existing IDs are purchase identifiers, including Mochi for the original orange coat.
const variants: readonly CompanionVariant[] = [
  { id: "01-mochi", breedId: "spitz", coat: "Roux orangé", canvas: spitzCanvas, bounds: [158, 20, 1154, 1159] },
  { id: "02-cookie", breedId: "golden", coat: "Doré", canvas: [1217, 1293], bounds: [177, 20, 1109, 1187] },
  { id: "03-oslo", breedId: "husky", coat: "Gris et blanc", canvas: [1186, 1326], bounds: [172, 8, 1052, 1249] },
  { id: "04-teddy", breedId: "poodle", coat: "Abricot", canvas: [1536, 1024], bounds: [325, 25, 1152, 998] },
  { id: "05-rio", breedId: "bulldog", coat: "Fauve à masque sombre", canvas: [1227, 1282], bounds: [236, 23, 1000, 1210] },
  { id: "06-luna", breedId: "ragdoll", coat: "Blue point", canvas: [1175, 1338], bounds: [46, 16, 1102, 1315], ground: 1240 },
  { id: "07-salem", breedId: "black-shorthair", coat: "Noir", canvas: [1203, 1307], bounds: [233, 20, 1047, 1286], ground: 1175 },
  { id: "08-nala", breedId: "british", coat: "Gris bleuté", canvas: [1230, 1278], bounds: [173, 47, 1096, 1226] },
  { id: "09-moka", breedId: "maine-coon", coat: "Brun tigré", canvas: [1200, 1310], bounds: [89, 15, 1170, 1265] },
  { id: "10-biscotte", breedId: "ginger-tabby", coat: "Roux tigré", canvas: [1536, 1024], bounds: [272, 16, 1348, 977] },
  { id: "spitz-creme", breedId: "spitz", coat: "Crème", canvas: spitzCanvas, bounds: [156, 20, 1158, 1159] },
  { id: "spitz-blanc", breedId: "spitz", coat: "Blanc", canvas: spitzCanvas, bounds: [150, 18, 1160, 1159] },
  { id: "spitz-noir", breedId: "spitz", coat: "Noir", canvas: spitzCanvas, bounds: [154, 19, 1160, 1163] },
  { id: "spitz-chocolat", breedId: "spitz", coat: "Chocolat", canvas: spitzCanvas, bounds: [154, 20, 1162, 1161] },
  { id: "spitz-sable", breedId: "spitz", coat: "Sable", canvas: spitzCanvas, bounds: [146, 20, 1161, 1162] },
  { id: "spitz-noir-et-blanc", breedId: "spitz", coat: "Noir et blanc", canvas: spitzCanvas, bounds: [151, 19, 1159, 1161] },
  { id: "golden-dore-clair", breedId: "golden", coat: "Doré clair", canvas: [1216, 1293], bounds: [177, 17, 1117, 1188] },
  { id: "golden-dore-fonce", breedId: "golden", coat: "Doré foncé", canvas: [1216, 1293], bounds: [176, 19, 1109, 1187] },
  { id: "husky-noir-blanc", breedId: "husky", coat: "Noir et blanc", canvas: [1186, 1326], bounds: [171, 7, 1066, 1251] },
  { id: "husky-cuivre-blanc", breedId: "husky", coat: "Cuivre et blanc", canvas: [1186, 1326], bounds: [173, 3, 1062, 1251] },
  { id: "husky-blanc", breedId: "husky", coat: "Blanc", canvas: [1186, 1326], bounds: [172, 7, 1057, 1250] },
  { id: "husky-agouti", breedId: "husky", coat: "Agouti et blanc", canvas: [1186, 1326], bounds: [171, 8, 1057, 1251] },
  { id: "husky-sable-blanc", breedId: "husky", coat: "Sable et blanc", canvas: [1186, 1327], bounds: [173, 6, 1062, 1252] },
  { id: "poodle-noir", breedId: "poodle", coat: "Noir", canvas: [1536, 1024], bounds: [318, 14, 1158, 1001] },
  { id: "poodle-blanc", breedId: "poodle", coat: "Blanc", canvas: [1536, 1024], bounds: [325, 23, 1153, 998] },
  { id: "poodle-brun", breedId: "poodle", coat: "Brun chocolat", canvas: [1536, 1024], bounds: [323, 24, 1154, 999] },
  { id: "poodle-rouge", breedId: "poodle", coat: "Rouge", canvas: [1536, 1024], bounds: [326, 25, 1153, 999] },
  { id: "poodle-argent", breedId: "poodle", coat: "Argenté", canvas: [1536, 1024], bounds: [326, 25, 1153, 999] },
  { id: "bulldog-bringe", breedId: "bulldog", coat: "Bringé", canvas: [1227, 1282], bounds: [235, 23, 1000, 1212] },
  { id: "bulldog-caille", breedId: "bulldog", coat: "Caille bringé", canvas: [1227, 1282], bounds: [234, 18, 1004, 1212] },
  { id: "bulldog-fauve-blanc", breedId: "bulldog", coat: "Fauve et blanc", canvas: [1227, 1282], bounds: [235, 23, 999, 1211] },
  { id: "bulldog-creme", breedId: "bulldog", coat: "Crème", canvas: [1227, 1282], bounds: [236, 21, 1004, 1213] },
  { id: "bulldog-blanc", breedId: "bulldog", coat: "Blanc", canvas: [1227, 1282], bounds: [236, 21, 1010, 1212] },
  { id: "ragdoll-seal-point", breedId: "ragdoll", coat: "Seal point", canvas: [1176, 1338], bounds: [40, 17, 1105, 1319], ground: 1242 },
  { id: "ragdoll-blue-mitted", breedId: "ragdoll", coat: "Blue mitted", canvas: [1176, 1338], bounds: [41, 16, 1105, 1317], ground: 1241 },
  { id: "ragdoll-seal-bicolore", breedId: "ragdoll", coat: "Seal bicolore", canvas: [1176, 1338], bounds: [46, 17, 1110, 1318], ground: 1242 },
  { id: "ragdoll-red-point", breedId: "ragdoll", coat: "Red point", canvas: [1176, 1338], bounds: [39, 17, 1104, 1318], ground: 1242 },
  { id: "ragdoll-blue-lynx", breedId: "ragdoll", coat: "Blue lynx point", canvas: [1176, 1338], bounds: [43, 17, 1101, 1315], ground: 1242 },
  { id: "british-blanc", breedId: "british", coat: "Blanc", canvas: [1230, 1278], bounds: [168, 42, 1100, 1229] },
  { id: "british-lilas", breedId: "british", coat: "Lilas", canvas: [1230, 1278], bounds: [170, 46, 1102, 1228] },
  { id: "british-silver-tabby", breedId: "british", coat: "Silver tabby", canvas: [1230, 1278], bounds: [173, 43, 1102, 1228] },
  { id: "british-chocolat", breedId: "british", coat: "Chocolat", canvas: [1230, 1278], bounds: [171, 44, 1100, 1229] },
  { id: "british-creme", breedId: "british", coat: "Crème", canvas: [1230, 1278], bounds: [172, 45, 1096, 1226] },
  { id: "maine-coon-silver-tabby", breedId: "maine-coon", coat: "Silver tabby", canvas: [1200, 1310], bounds: [86, 10, 1173, 1269] },
  { id: "maine-coon-roux-tabby", breedId: "maine-coon", coat: "Roux tigré", canvas: [1200, 1310], bounds: [81, 7, 1178, 1265] },
  { id: "maine-coon-black-smoke", breedId: "maine-coon", coat: "Black smoke", canvas: [1200, 1310], bounds: [87, 10, 1178, 1269] },
  { id: "maine-coon-noir-blanc", breedId: "maine-coon", coat: "Noir et blanc", canvas: [1200, 1310], bounds: [87, 16, 1174, 1269] },
  { id: "maine-coon-ecaille-blanc", breedId: "maine-coon", coat: "Écaille et blanc", canvas: [1200, 1310], bounds: [85, 10, 1181, 1267] },
  { id: "black-shorthair-noir-blanc", breedId: "black-shorthair", coat: "Noir et blanc", canvas: [1203, 1308], bounds: [220, 17, 1053, 1290], ground: 1178 },
  { id: "black-shorthair-brun-tigre", breedId: "black-shorthair", coat: "Brun tigré", canvas: [1203, 1308], bounds: [188, 17, 1025, 1288], ground: 1179 },
  { id: "black-shorthair-tricolore", breedId: "black-shorthair", coat: "Tricolore", canvas: [1203, 1308], bounds: [220, 16, 1046, 1289], ground: 1177 },
  { id: "black-shorthair-blanc", breedId: "black-shorthair", coat: "Blanc", canvas: [1203, 1308], bounds: [219, 16, 1049, 1291], ground: 1176 },
  { id: "black-shorthair-bleu-uni", breedId: "black-shorthair", coat: "Gris bleuté uni", canvas: [1203, 1308], bounds: [224, 17, 1053, 1289], ground: 1178 },
  { id: "ginger-tabby-argent-classique", breedId: "ginger-tabby", coat: "Argenté marbré", canvas: [1536, 1024], bounds: [273, 17, 1348, 978] },
  { id: "ginger-tabby-gris-rayures", breedId: "ginger-tabby", coat: "Gris bleuté rayé", canvas: [1536, 1024], bounds: [266, 15, 1364, 978] },
  { id: "ginger-tabby-brun-rayures", breedId: "ginger-tabby", coat: "Brun rayé", canvas: [1536, 1024], bounds: [267, 9, 1350, 979] },
  { id: "ginger-tabby-creme-rayures", breedId: "ginger-tabby", coat: "Crème rayé", canvas: [1536, 1024], bounds: [268, 15, 1358, 980] },
  { id: "ginger-tabby-roux-blanc", breedId: "ginger-tabby", coat: "Roux tigré et blanc", canvas: [1536, 1024], bounds: [270, 17, 1350, 977] },
  { id: "belier-nain-roux", breedId: "belier-nain", coat: "Roux", canvas: [1254, 1254], bounds: [182, 77, 1085, 1183] },
  { id: "belier-nain-noir", breedId: "belier-nain", coat: "Noir", canvas: [1254, 1254], bounds: [170, 94, 1109, 1151] },
  { id: "belier-nain-chocolat-blanc", breedId: "belier-nain", coat: "Chocolat et blanc", canvas: [1254, 1254], bounds: [151, 78, 1100, 1181] },
  { id: "hamster-syrien-dore", breedId: "hamster-syrien", coat: "Doré", canvas: [1254, 1254], bounds: [9, 125, 1197, 1104] },
  { id: "hamster-syrien-creme", breedId: "hamster-syrien", coat: "Crème", canvas: [1254, 1254], bounds: [47, 148, 1173, 1109] },
  { id: "hamster-syrien-noir", breedId: "hamster-syrien", coat: "Noir", canvas: [1254, 1254], bounds: [19, 154, 1205, 1118] },
  { id: "siamois-seal-point", breedId: "siamois", coat: "Seal point", canvas: [1254, 1254], bounds: [269, 17, 999, 1232], ground: 1179 },
  { id: "siamois-blue-point", breedId: "siamois", coat: "Blue point", canvas: [1254, 1254], bounds: [267, 15, 987, 1235], ground: 1165 },
  { id: "siamois-chocolate-point", breedId: "siamois", coat: "Chocolate point", canvas: [1254, 1254], bounds: [263, 12, 1074, 1237], ground: 1165 },
  { id: "persan-blanc", breedId: "persan", coat: "Blanc", canvas: [1254, 1254], bounds: [92, 51, 1163, 1222], ground: 1196 },
  { id: "persan-bleu", breedId: "persan", coat: "Bleu", canvas: [1254, 1254], bounds: [92, 49, 1184, 1230], ground: 1197 },
  { id: "persan-noir", breedId: "persan", coat: "Noir", canvas: [1254, 1254], bounds: [96, 47, 1169, 1225], ground: 1199 },
  { id: "corgi-roux-blanc", breedId: "corgi", coat: "Roux et blanc", canvas: [1254, 1254], bounds: [124, 58, 1161, 1138] },
  { id: "corgi-tricolore", breedId: "corgi", coat: "Tricolore", canvas: [1254, 1254], bounds: [83, 37, 1193, 1177] },
  { id: "corgi-sable-blanc", breedId: "corgi", coat: "Sable et blanc", canvas: [1254, 1254], bounds: [128, 72, 1142, 1125] },
  { id: "teckel-roux", breedId: "teckel", coat: "Roux", canvas: [1254, 1254], bounds: [37, 151, 1213, 1082] },
  { id: "teckel-noir-feu", breedId: "teckel", coat: "Noir et feu", canvas: [1254, 1254], bounds: [42, 145, 1201, 1100] },
  { id: "teckel-chocolat-feu", breedId: "teckel", coat: "Chocolat et feu", canvas: [1254, 1254], bounds: [27, 126, 1229, 1113] },
];

export const COMPANION_CATALOG = variants.map((variant) => {
  const { name, species, price, heightRatio } = COMPANION_BREEDS[variant.breedId];
  return { ...variant, active: variant.active ?? true, breed: name, species, price, heightRatio };
});
type CompanionModel = (typeof COMPANION_CATALOG)[number];
export const companionVariants = (breedId: CompanionBreedId) =>
  COMPANION_CATALOG.filter((variant) => variant.breedId === breedId && variant.active);
export const companionModel = (id: string) => COMPANION_CATALOG.find((model) => model.id === id);
export const companionImage = (id: string) => `/assets/companions/${id}.png`;

/** Artwork coordinates from the left of its visible silhouette and from paw level. */
export function companionGeometry(model: CompanionModel, avatarHeight: number, maxWidth = Infinity) {
  const [left, top, right, bottom] = model.bounds;
  const ground = model.ground ?? bottom;
  const scale = Math.min(avatarHeight * model.heightRatio / (ground - top), maxWidth / (right - left));
  return {
    x: -left * scale, y: -ground * scale,
    width: model.canvas[0] * scale, height: model.canvas[1] * scale,
    visibleWidth: (right - left) * scale,
  };
}
