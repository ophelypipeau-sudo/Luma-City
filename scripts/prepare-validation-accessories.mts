import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../apps/server/src/atelier-images.ts";
import { rgbaPng } from "./lib/png-rgba.ts";
import { measureFabricTone } from "../packages/domain/src/atelier-color.ts";

const output = "public/assets/avatar/capsule-ville-v2";
const folder = "docs/capsule-jupes-shorts-accessoires";
const source = readFileSync(folder + "/validation-accessoires-v2.png").toString("base64");

const pieces = [
  { name:"Épure", slot:"earrings", paths:"M184 80Q173 84 181 106Q188 116 195 104Q197 87 184 80Z M254 80Q265 82 263 101Q261 114 252 109Q247 102 250 88Z", scale:2.45, sx:220, sy:86, tx:444, ty:219, filter:"metal" },
  { name:"Averse", slot:"earrings", paths:"M181 76L187 76L191 97Q194 110 184 111Q175 111 178 98Z M250 77L257 77L261 98Q264 110 254 111Q246 110 248 99Z", scale:2.65, sx:219, sy:85, tx:444, ty:222, filter:"metal" },
  { name:"Orage", slot:"necklace", paths:"M181 126Q187 153 216 155Q245 154 250 127L255 130Q257 158 220 185Q191 182 176 138Z", scale:2.37, sx:216, sy:130, tx:444, ty:327, filter:"metal" },
  { name:"Braise", slot:"necklace", paths:"M186 130L193 136Q198 158 216 174Q230 159 235 136L242 132Q237 157 220 176Q228 183 219 192Q209 192 208 184L211 176Q192 158 186 130Z", scale:2.5, sx:216, sy:133, tx:444, ty:326, filter:"metal" },
  { name:"Féline", slot:"glasses", paths:"M174 52Q190 51 204 58Q213 56 220 57Q241 51 251 52L249 60Q244 76 229 76Q219 74 215 65L209 64Q201 78 190 75Q178 74 174 58Z", scale:2.45, sx:213, sy:61, tx:444, ty:170, filter:"frames" },
  { name:"Écaille ambrée", slot:"glasses", paths:"M180 48Q194 48 211 55Q226 49 254 47L257 55L251 60Q246 74 235 76Q222 76 216 62L211 61Q203 74 191 74Q182 73 178 56Z", scale:2.42, sx:217, sy:58, tx:444, ty:171, filter:"frames" },
  { name:"Cassis", slot:"bag", paths:"M195 273Q208 245 219 256Q246 243 257 278Q275 285 278 314L281 376Q228 387 167 378L168 321Q171 288 188 279Z", scale:1.40, sx:222, sy:255, tx:158, ty:934, filter:"bag" },
  { name:"Lune", slot:"bag", paths:"M159 132Q172 126 178 142Q188 177 185 220Q199 286 150 299Q124 304 117 287L120 276Q143 269 149 237Q164 200 160 160Z", scale:2.25, sx:170, sy:136, tx:335, ty:347, filter:"cream" },
  { name:"Ceinture Ligne", slot:"belt", paths:"M174 263Q212 274 260 263L270 283Q224 299 166 284Z", scale:2.74, sx:216, sy:275, tx:444, ty:701, filter:"belt" },
  { name:"Ceinture Tresse", slot:"belt", paths:"M174 261Q212 271 258 261L268 283Q226 294 165 281Z", scale:2.75, sx:216, sy:274, tx:444, ty:700, filter:"belt" },
];
const offsets = [0,397,793,1189,1586];
const [width,height] = [887,1774];
const manifest = pieces.map((piece,index)=>{
  const {scale,sx,sy,tx,ty} = piece;
  const xml = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><clipPath id="outline"><path d="${piece.paths}"/></clipPath></defs><g transform="translate(${tx-sx*scale} ${ty-sy*scale}) scale(${scale})" clip-path="url(#outline)"><image x="${-offsets[index%5]}" y="${index<5 ? 0 : -397}" width="1983" height="793" href="data:image/png;base64,${source}"/></g></svg>`;
  const image = Buffer.from(new Resvg(xml).render().asPng());
  const sourcePixels = pngPixels(image).pixels;
  const art = new Uint8Array(sourcePixels.length);
  const mask = new Uint8Array(art.length);
  let left=width,top=height,right=0,bottom=0;
  for(let y=0;y<height;y++) for(let x=0;x<width;x++){
    const p=(y*width+x)*4, alpha=sourcePixels[p+3];
    if (!alpha) continue;
    const [r,g,b]=Array.from(sourcePixels.subarray(p,p+3),v=>Math.round(v*255/alpha));
    const isSkin = r-g>38 && g-b>28 && r>123;
    const isBackdrop = r>72 && r<130 && g>53 && g<100 && b>58 && b<112 && b>=g && r-g<24;
    let keep = !isSkin && !isBackdrop;
    if(index===0) keep = (r > 112 && g > 76 && r-g < 85 && g-b > 19) && (!isSkin || r-g < 53);
    if(piece.filter==="metal" && index!==0) keep &&= (Math.min(r,g,b)>116 || (r>105 && r-g>9 && g-b>15) || (index===3 && r>g*1.7 && b>g));
    if(piece.filter==="frames") keep &&= r > g * 1.23 && r > 37 && r < 176 && (index === 4 ? b > g * .81 : g > b * 1.15);
    if(piece.filter==="cream") keep &&= (r>135 && g>113 && b>78 && r-g<50);
    if(!keep) continue;
    art.set([r,g,b,alpha],p);
    const fabric = piece.slot==="bag" || piece.slot==="belt" || piece.slot==="glasses";
    const hardware = (r>140 && r-g>12 && g-b>20) || (index===8 && r>112 && Math.max(r,g,b)-Math.min(r,g,b)<28);
    if(fabric && !hardware) mask.set([255,255,255,255],p);
    left=Math.min(left,x); right=Math.max(right,x); top=Math.min(top,y); bottom=Math.max(bottom,y);
  }
  const id="accessory-"+String(index+1).padStart(2,"0");
  if(right-left<20 || bottom-top<10) throw new Error("Calque incomplet : "+piece.name);
  writeFileSync(`${output}/${id}.png`,rgbaPng(width,height,art));
  const tone=measureFabricTone(sourcePixels,mask);
  if(tone) writeFileSync(`${output}/${id}-mask.png`,rgbaPng(width,height,mask));
  return {id,name:piece.name,slot:piece.slot,price:450,crop:[left-3,top-3,right-left+7,bottom-top+7],tone};
});
writeFileSync(output+"/accessories.json",JSON.stringify(manifest,null,2)+"\n");
