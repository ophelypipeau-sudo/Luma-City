import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { nativeRgba } from "../../../scripts/lib/png-native";
import { rgbaPng } from "../../../scripts/lib/png-rgba";
import { Resvg } from "@resvg/resvg-js";
const design = "docs/kawaii-iris/finition-c";
const output = "public/assets/avatar/kawaii-c";
const original = nativeRgba(readFileSync("public/assets/avatar/fashion-v2/body-user.png"));
const target = nativeRgba(readFileSync("docs/kawaii-iris/controle-technique/base-neutre-technique.png"));
const {width,height,pixels}=original;
const ids = ["brows","eyes","nose","lips"] as const;
const patches = ids.map(()=>new Uint8Array(pixels.length));
for(let y=0;y<height;y++)for(let x=0;x<width;x++){
 const i=(y*width+x)*4;
 if(pixels[i+3]!==target.pixels[i+3])throw new Error("Alpha Iris différent");
 if(pixels[i+3]<250||pixels.subarray(i,i+3).every((v,c)=>v===target.pixels[i+c]))continue;
 const inner=Math.min(x,width-1-x);
 const browLine=150+Math.max(0,inner-387)*.28;
 const slot=y<browLine?0:y<=196?1:y<=229?2:3;
 patches[slot].set(target.pixels.subarray(i,i+3),i);
 patches[slot][i+3]=255;
}
for(const [i,id] of ids.entries())writeFileSync(`${output}/${id}-skin.png`,rgbaPng(width,height,patches[i]));
for(const [file,name] of [["prisme-violet-finition","eyes"],["masque-iris","eyes-color"],["confettis-finition","nose"]]){
 copyFileSync(`${design}/${file}.png`,`${output}/${name}.png`);
}
for(const [file,name,part] of [["sourcils-finition","brows","brows"],["masque-sourcils","brows-color","brows"],["sorbet-brillant-finition","lips","lips"],["masque-levres","lips-color","lips"]]){
 const img=`<image width="${width}" height="${height}" href="data:image/png;base64,${readFileSync(`${design}/${file}.png`).toString("base64")}"/>`;
 const art=part==="lips"?`<g transform="translate(0 -1)">${img}</g>`:
 [396.5,488.5].map((cx,i)=>`<svg x="${i*443}" width="${i?444:443}" height="${height}" viewBox="${i*443} 0 ${i?444:443} ${height}"><g transform="translate(0 3) rotate(${i?-1.5:1.5} ${cx} 141)">${img}</g></svg>`).join("");
 writeFileSync(`${output}/${name}.png`,new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${art}</svg>`).render().asPng());
}
