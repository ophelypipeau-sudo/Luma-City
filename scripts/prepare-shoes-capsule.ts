import { removeWhiteMatte } from "./lib/asset-edges";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../apps/server/src/atelier-images";
import { DOLL_PATTERN } from "../packages/domain/src/avatar-pattern";
import { rgbaPng } from "./lib/png-rgba";
import { buildShoeMaterial } from "./lib/shoe-material-regions";

const [W, H] = DOLL_PATTERN.canvas;
const body = readFileSync("public/assets/avatar/fashion-v2/body-user.png");
if (createHash("sha256").update(body).digest("hex") !== DOLL_PATTERN.bodySha256)
  throw new Error("Repère des pieds incorrect.");
const canonical = pngPixels(body).pixels;
const root = "public/assets/avatar/capsule-chaussures-v1";
const v1 = "docs/capsule-chaussures-v1/sources/";
const v2 = "docs/capsule-chaussures-v2/retouches/";
// The paintings are uniformly registered to the native mannequin. The last
// coordinates mark the collar and the fully closed toe, respectively.
const pieces = [
  ["piste", "Piste", v1 + "01-piste.png", 650, "#76a5b5", 12, 1577, 1658],
  ["rafale", "Rafale", v1 + "02-rafale.png", 750, "#a5a0a1", 20, 1543, 1635],
  ["releve", "Relevé", v1 + "03-releve.png", 650, "#cc8c7e", 12, 1575, 1663],
  ["campus", "Campus", v1 + "04-campus.png", 700, "#435040", 12, 1555, 1645],
  ["silex", "Silex", v1 + "05-silex.png", 850, "#252529", 7, 1541, 1533],
  ["dune", "Dune", v2 + "06-dune.png", 850, "#90796b", 6, 1513, 1533],
  ["etrier", "Étrier", v2 + "07-etrier.png", 900, "#4c4731", 2, 1518, 1536],
  ["virgule", "Virgule", v1 + "08-virgule.png", 750, "#731b32", 9, 1577, 1693],
  ["opaline", "Opaline", v1 + "09-opaline.png", 750, "#e6c8a1", 12, 1575, 1678],
  ["agrafe", "Agrafe", v1 + "10-agrafe.png", 800, "#262528", 9, 1594, 1684],
] as const;
const clamp = (x: number) => Math.max(0, Math.min(1, x));
mkdirSync(root, { recursive: true });
const manifest = pieces.map(([id, name, file, price, base, offset, collar, closedToe]) => {
  const bytes = readFileSync(file);
  const h = bytes.readUInt32BE(20), w = bytes.readUInt32BE(16);
  const s = H/h, dw = w*s;
  const p = new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><image x="${(W-dw)/2}" width="${dw}" height="${H}" href="data:image/png;base64,${bytes.toString("base64")}"/></svg>`).render().pixels;
  const art = new Uint8Array(p.length), coverage = new Uint8Array(p.length);
  const candidate = new Uint8Array(W*H), selected = new Uint8Array(W*H);
  const queue = new Uint32Array(W*H);
  const boot = id === "silex" || id === "dune" || id === "etrier";
  const closed = boot || id === "piste" || id === "rafale" || id === "campus";
  for (let y=collar; y<1753-offset; y++) {
    for(let x=257;x<629;x++) {
      if (x>410 && x<472) continue;
      const j=y*W+x, i=j*4, bg=(y*W+225)*4;
      const [r,g,b]=p.subarray(i,i+3);
      const distance=Math.max(Math.abs(r-p[bg]),Math.abs(g-p[bg+1]),Math.abs(b-p[bg+2]));
      const skin=r>153 && r-g>42 && g-b>26;
      const strayAnkle = y<collar+28 && (
        (id==="piste" && r>b+7) ||
        (id==="rafale" && r>b+29) ||
        (id==="campus" && r>b+42 && Math.abs(x-(x<443?333:553))>25)
      );
      if ((!boot && skin) ||
        strayAnkle ||
        (id==="dune" && y<1537 && r<g+9) ||
        (id==="etrier" && y<1537 && g<b+6)) continue;
      candidate[j]=Math.round(255*clamp((distance-21)/30));
    }
  }
  // Keep the two connected shoes; stray trouser slit edges are not part of them.
  for (const center of [333, 553]) {
    let head=0, tail=0;
    const visit=(at:number)=>{
      if (selected[at] || candidate[at]<5) return;
      selected[at]=1;queue[tail++]=at;
    };
    visit((Math.min(closedToe+20,1706))*W+center);
    while (head<tail) {
      const at=queue[head++];
      visit(at-1);visit(at+1);visit(at-W);visit(at+W);
    }
    if (tail<2600) throw new Error("Chaussure incomplète : "+id);
  }
  // Light cream leather and laces may have the same RGB values as the set.
  // Restore enclosed paint without filling the intentional openings of flats.
  const exterior = new Uint8Array(W*H);
  let head=0, tail=0;
  const visitOutside=(j:number)=>{
    if (exterior[j] || selected[j]) return;
    exterior[j]=1;queue[tail++]=j;
  };
  visitOutside(0);
  while(head<tail){
    const j=queue[head++], x=j%W;
    if(x>0)visitOutside(j-1);if(x<W-1)visitOutside(j+1);
    if(j>=W)visitOutside(j-W);if(j<W*(H-1))visitOutside(j+W);
  }
  let x0=W, y0=H, x1=0, y1=0;
  for(let y=collar;y<1753-offset;y++) for(let x=257;x<629;x++) {
    const j=y*W+x, src=j*4, dst=((y+offset)*W+x)*4;
    const enclosed=!exterior[j] && (closed || y>=closedToe);
    const edge=exterior[j-1] || exterior[j+1] || exterior[j-W] || exterior[j+W];
    const a=enclosed && !edge ? 255 : candidate[j];
    if (a && (selected[j] || enclosed)) {
      // Recover the paint colour of antialiased pixels against the old grey
      // backdrop so they do not leave a pale fringe in the shop.
      const bg=(y*W+225)*4;
      const opacity = a/255;
      const clean = (c:number) => a >= 250 ? p[src+c] :
        Math.round(255*clamp((p[src+c]-(1-opacity)*p[bg+c])/(255*Math.max(.5,opacity))));
      art.set([clean(0),clean(1),clean(2),a],dst);
      x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y+offset);y1=Math.max(y1,y+offset);
    }
  }
  // Extend the shaft under a cropped trouser. For Silex the source cut starts
  // below the painted trouser hem, so only clean leather enters the extension.
  const collarOverlap = id === "silex" ? 34 : 12;
  if (boot) for (let x=x0;x<=x1;x++) {
    let y=collar+offset;
    while (y<collar+offset+27 && art[(y*W+x)*4+3]<200) y++;
    if (y>=collar+offset+27 || art[((y+11)*W+x)*4+3]<200) continue;
    for (let step=1;step<=collarOverlap;step++) {
      const to=((y-step)*W+x)*4, from=((y+Math.min(10,step))*W+x)*4;
      if (art[to+3]) continue;
      art.set(art.subarray(from,from+4),to);
    }
    y0=Math.min(y0,y-collarOverlap);
  }
  // Remove only bare skin within the closed toe or boot shaft. Coverage ends
  // at the opening for pumps and sandals; their instep remains the live body.
  for(let y=closedToe+offset;y<H;y++) for(let x=258;x<629;x++) {
    const i=(y*W+x)*4;
    if (canonical[i+3]) coverage[i+3]=255;
  }
  const premultiplied=art.slice();
  for(let i=0;i<art.length;i+=4) for(let c=0;c<3;c++) premultiplied[i+c]=Math.round(art[i+c]*art[i+3]/255);
  const { tone, main, fixed } = buildShoeMaterial(id, premultiplied);
  if(y1<1700) throw new Error("Semelle incomplète : "+id);
  for(const [suffix,data] of [["",art],["-mask",main],["-protected",fixed],["-coverage",coverage]] as const)
    writeFileSync(`${root}/${id}${suffix}.png`,rgbaPng(W, H, suffix ? data : removeWhiteMatte(W, H, data).pixels));
  console.log(`${name}: ${x0},${y0} → ${x1},${y1}`);
  return { id, name, file, price, base, crop:[x0-7,y0-7,x1-x0+15,y1-y0+15], tone };
});
writeFileSync(root+"/index.json",JSON.stringify({pattern:DOLL_PATTERN.id,bodySha256:DOLL_PATTERN.bodySha256,pieces:manifest},null,2)+"\n");
