import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { nativeRgba } from "../../../scripts/lib/png-native";
import { avatarFaceSchema, wornOutfitSchema } from "../../../packages/contracts/src/index";
const read = (path: string) => nativeRgba(readFileSync(path)).pixels;
const base = read("public/assets/avatar/fashion-v2/body-user.png");
const target = read("docs/kawaii-iris/controle-technique/base-neutre-technique.png");
for (const name of ["brows", "nose", "eyes", "lips"]) {
  const patch = read(`public/assets/avatar/kawaii-c/${name}-skin.png`);
  for (let i = 0; i < patch.length; i += 4)
    if (patch[i + 3]) base.set(patch.subarray(i, i + 3), i);
}
assert.deepEqual(base, target);
const classic = {eyes:"green", nose:"original", lips:"rose", skin:"light"};
const face = {eyes:"#7854be", eyeModel:"prisme", brows:"kawaii", browColor:"#815a47", nose:"confettis", lips:"sorbet", lipColor:"#94424f", skin:"deep"};
assert.deepEqual(avatarFaceSchema.parse(classic), classic);
assert.deepEqual(wornOutfitSchema.parse({ top:null,bottom:null,shoes:null,face }).face,face);
assert.equal(avatarFaceSchema.safeParse({...face,lipColor:"red"}).success,false);
console.log("Base recomposée identique, anciens profils et sauvegarde Kawaii vérifiés");
