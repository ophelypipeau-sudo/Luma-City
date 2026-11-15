import {readFileSync, writeFileSync} from "node:fs";
import {nativeRgba} from "../../scripts/lib/png-native";
import {rgbaPng} from "../../scripts/lib/png-rgba";

const folder = "docs/kawaii-glam";
const current = "public/assets/avatar/kawaii-c";
const official = readFileSync("public/assets/avatar/fashion-v2/body-user.png");
const {width,height,pixels} = nativeRgba(official);
const repaired = nativeRgba(readFileSync(folder+"/controle-base-neutre.png")).pixels;
const glamNames = ["sourcils-arche-cacao","nez-confettis-glam","yeux-prisme-glam","bouche-sorbet-glam"];
const glam = glamNames.map(name=>readFileSync(`${folder}/${name}.png`));
for(let i=3;i<pixels.length;i+=4) if(pixels[i]!==repaired[i])throw Error("Alpha de la base différent");
let outside=0;
for(const part of glam){
 const rgba=nativeRgba(part).pixels;
 for(let i=3;i<rgba.length;i+=4) if(rgba[i]>16 && pixels[i]<128)outside++;
}
if(outside)throw Error(`${outside} pixels de maquillage hors silhouette`);

const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const ease=(n:number)=>{const t=clamp(n);return t*t*(3-2*t);};
const at=(x:number,y:number)=>(y*width+x)*4;
const softNose=nativeRgba(glam[1]).pixels;
for(let y=185;y<=230;y++)for(let x=421;x<=466;x++){
 const i=at(x,y);
 const falloff=ease(1-Math.hypot((x-443)/20,(y-208)/20));
 const shine=ease((softNose[i+1]-111)/91);
 softNose[i+3]=Math.round(softNose[i+3]*(1-.42*falloff*shine));
}
const noseArt=rgbaPng(width,height,softNose);


const out="public/assets/avatar/kawaii-c";
for(const [output,source] of [["glam-eyes",glam[2]],["glam-brows",glam[0]],["glam-nose",noseArt],
 ["glam-eyes-color",readFileSync(folder+"/masque-iris.png")],["glam-brows-color",readFileSync(folder+"/masque-sourcils.png")]] as const)
 writeFileSync(`${out}/${output}.png`,source);
for(const part of ["eyes","brows","nose"]){
 const patch=new Uint8Array(pixels.length);
 for(let y=117;y<=280;y++)for(let x=346;x<=539;x++){
  const i=at(x,y);
  if(pixels[i+3]<250)continue;
  const local=Math.min(x,886-x);
  const split=146+Math.max(0,local-386)*.38;
  const eyeWeight=ease((y-split+1)/6);
  const zone=ease((y-117)/9)*ease((200-y)/8)*ease((local-352)/7)*ease((438-local)/8);
  const amount=part==="nose"?ease((1-Math.hypot((x-443)/25,(y-214)/20))*4):
    zone*(part==="eyes"?eyeWeight:1-eyeWeight);
  const alpha=Math.round(amount*255);
  if(!alpha)continue;
  patch.set(repaired.subarray(i,i+3),i);
  patch[i+3]=alpha;
 }
 writeFileSync(`${out}/glam-${part}-skin.png`,rgbaPng(width,height,patch));
}
