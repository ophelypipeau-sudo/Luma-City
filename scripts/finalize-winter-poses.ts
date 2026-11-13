import {readFileSync,writeFileSync,copyFileSync,existsSync} from 'node:fs';
import {Resvg} from '@resvg/resvg-js';
import {pngPixels} from '../apps/server/src/atelier-images';
import {rgbaPng} from './lib/png-rgba';
const ROOT='public/assets/avatar/winter-v1',GEN='C:/Users/vosma/.codex/generated_images/01a1bc58-ff5f-7601-ba39-06797aeaee0d/';
const sources:Record<string,string>={
 'ivory-heart':'638aff0d-12d4-46d7-84c1-9b8c4b764f8b','ivory-hip':'496b8e31-c524-405a-9f64-640a2be2d2d0','ribbon-heart':'4bccaec5-d42b-41aa-bc8c-a72fd539c8fd','ribbon-hip':'468c8ca7-0c5a-4291-8844-c06dde352155','pink-heart':'67432171-c875-4794-aa0b-ea8d0bc3bf84','pink-hip':'a8b5c10d-de03-439f-ac4b-fcb05caa2592','snow-hip':'d1586d2d-6e24-4af6-b0d9-083cd9cbcb9b',
};
function save(name:string,p:Uint8Array){
 writeFileSync(`${ROOT}/${name}.png`,rgbaPng(887,1774,p));const main=new Uint8Array(p.length),detail=new Uint8Array(p.length);
 for(let y=1;y<1773;y++)for(let x=1;x<886;x++){
  const k=y*887+x,i=k*4,[r,g,b,a]=p.subarray(i,i+4);if(!a)continue;
  const edge=[-1,1,-887,887].some(d=>p[(k+d)*4+3]<40);
  if(edge&&((r>200&&g<65&&(b<70||b>180))||(r>150&&g>150&&b<60))){p[i+3]=0;continue;}
  if(name==='ribbon-skirt'){
   const ink=Math.max(r,g,b)<23&&[-2,2].every(d=>Math.max(...p.subarray((k+d)*4,(k+d)*4+3))>Math.max(r,g,b)+8);
   if(edge||ink)continue;
  }else if(Math.max(r,g,b)<60)continue;
  let zone=1;
  if(name.startsWith('pink')){
   if(x>429&&x<454&&y>440&&y<680)zone=0;
   else if(r>g*1.06&&b>g*.98)zone=2;
  }
  if(name.startsWith('snow')){
   const lower=name.endsWith('hip')?478+8*(1-Math.min(1,Math.abs(x-443)/220)):480+30*(1-Math.min(1,Math.abs(x-443)/220));
   if(y<lower)zone=Math.max(r,g,b)<170?0:2;
  }
  if(zone)(zone===1?main:detail).set([255,255,255,255],i);
 }
 writeFileSync(`${ROOT}/${name}.png`,rgbaPng(887,1774,p));writeFileSync(`${ROOT}/${name}-mask.png`,rgbaPng(887,1774,main));
 if(name.startsWith('pink')||name.startsWith('snow'))writeFileSync(`${ROOT}/${name}-detail-mask.png`,rgbaPng(887,1774,detail));
}
for(const [name,id]of Object.entries(sources)){
 const generatedFile=`${GEN}exec-${id}.png`,file=existsSync(generatedFile)?generatedFile:`${ROOT}/sources/${name}-clean.png`,s=pngPixels(readFileSync(file));if(s.width!==887||s.height!==1774)throw new Error(`Unregistered clean drawing: ${name}`);
 if(file!==`${ROOT}/sources/${name}-clean.png`)copyFileSync(file,`${ROOT}/sources/${name}-clean.png`);save(name,s.pixels);
}
// The registered snow-heart source already retained all opaque folds. Remove only
// disconnected reference waistband ink below its actual finished hem, not fabric.
const snow=pngPixels(readFileSync(`${ROOT}/snow-heart.png`));for(let y=707;y<1774;y++)for(let x=0;x<887;x++)snow.pixels[(y*887+x)*4+3]=0;save('snow-heart',snow.pixels);
const generatedSkirt=`${GEN}exec-caa7e70a-0603-42ba-8e3e-553d2fbb3792.png`,skirtFile=existsSync(generatedSkirt)?generatedSkirt:`${ROOT}/sources/ribbon-skirt-complete.png`;if(skirtFile!==`${ROOT}/sources/ribbon-skirt-complete.png`)copyFileSync(skirtFile,`${ROOT}/sources/ribbon-skirt-complete.png`);
const skirt=pngPixels(readFileSync(skirtFile));let y0=skirt.height,y1=0;
for(let y=0;y<skirt.height;y++)for(let x=0;x<skirt.width;x++)if(skirt.pixels[(y*skirt.width+x)*4+3]>180){y0=Math.min(y0,y);y1=Math.max(y1,y);}
function rowWidth(y:number){let a=skirt.width,b=0;for(let x=0;x<skirt.width;x++)if(skirt.pixels[(y*skirt.width+x)*4+3]>180){a=Math.min(a,x);b=Math.max(b,x);}return b-a+1;}
const waist=306/rowWidth(y0+30),hem=540/Math.max(...Array.from({length:40},(_,i)=>rowWidth(y1-i)));
let bands='';const dy=310/(y1-y0);
for(let y=y0;y<=y1;y+=2){const t=(y-y0)/(y1-y0),sx=waist+(hem-waist)*t,tx=(887-skirt.width*sx)/2;bands+=`<svg x="${tx}" y="${700+(y-y0)*dy-.35}" width="${skirt.width*sx}" height="${2*dy+.7}" viewBox="0 ${y-.35/dy} ${skirt.width} ${2+.7/dy}" preserveAspectRatio="none"><use href="#s"/></svg>`;}
const registered=new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><defs><image id="s" width="${skirt.width}" height="${skirt.height}" href="data:image/png;base64,${readFileSync(skirtFile).toString('base64')}"/></defs>${bands}</svg>`).render().asPng();
save('ribbon-skirt',pngPixels(registered).pixels);
writeFileSync(`${ROOT}/sources/clean-poses.json`,JSON.stringify({sources,skirt:{source:'exec-caa7e70a-0603-42ba-8e3e-553d2fbb3792.png',waistWidth:306,hemWidth:540,waistY:700,hemY:1010},snowHeart:'Registered original, no oversized/halo extraction used'},null,2));
console.log('Complete opaque posed garments and reconstructed full skirt waistband saved.');
// The isolated denim source has disconnected sleeve fragments beside its waist.
// Keep the connected skirt (including its attached decorations), never crop its volume.
const denim=pngPixels(readFileSync(`${ROOT}/pink-skirt.png`)),seen=new Uint8Array(887*1774);
let largest:number[]=[];
for(let k=0;k<seen.length;k++){
 if(seen[k]||denim.pixels[k*4+3]<20)continue;
 const q=[k];seen[k]=1;
 for(let n=0;n<q.length;n++)for(const d of [-1,1,-887,887]){
  const a=q[n]+d;if(a>=0&&a<seen.length&&!seen[a]&&denim.pixels[a*4+3]>=20){seen[a]=1;q.push(a);}
 }
 if(q.length>largest.length)largest=q;
}
const keep=new Set(largest);
for(const name of ['pink-skirt','pink-skirt-mask','pink-skirt-detail-mask']){
 const s=pngPixels(readFileSync(`${ROOT}/${name}.png`));
 for(let k=0;k<seen.length;k++)if(!keep.has(k))s.pixels[k*4+3]=0;
 writeFileSync(`${ROOT}/${name}.png`,rgbaPng(887,1774,s.pixels));
}
