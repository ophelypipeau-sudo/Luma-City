import fs from "node:fs";
import {Resvg} from "@resvg/resvg-js";
const root="public/assets/avatar/", dir=root+"capsule-ville-v2/", docs="docs/capsule-jupes-shorts-accessoires/";
const assets=JSON.parse(fs.readFileSync(dir+"index.json","utf8")).pieces;
const accessories=JSON.parse(fs.readFileSync(dir+"accessories.json","utf8"));
const image=(file)=>'<image width="887" height="1774" href="data:image/png;base64,'+fs.readFileSync(file).toString("base64")+'"/>';
for(const [key,pieces] of [["short",assets.filter(p=>p.id.startsWith("short"))],["skirt",assets.filter(p=>p.id.startsWith("skirt"))],["accessoires",accessories]]){
 const cells=pieces.map((p,i)=>{
 const access=key==="accessoires";
 const view=access?(i<6?"210 0 467 485":"20 300 847 870"):"120 510 647 1140";
 return '<g transform="translate('+((i%5)*238)+' '+(Math.floor(i/5)*342)+')"><rect width="235" height="336" fill="'+["#43334b","#d4bdbd","#3a696b"][i%3]+'"/><svg width="235" height="315" viewBox="'+view+'">'+image(root+"leopard-v1/underwear-low-rise.png")+(access?image(root+"prune-fumee-v1/pantalon.png"):"")+image(dir+p.id+".png")+'</svg><text x="12" y="330" fill="white" font-size="13">'+p.name+'</text></g>';
 });
 fs.writeFileSync(docs+"controle-ville-"+key+".png",new Resvg('<svg xmlns="http://www.w3.org/2000/svg" width="1190" height="684">'+cells.join("")+'</svg>').render().asPng());
}
