import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {Resvg} from '@resvg/resvg-js';
import {pngPixels} from '../apps/server/src/atelier-images';
import {rgbaPng} from './lib/png-rgba';
const out='public/assets/avatar/leopard-v4';
mkdirSync(out,{recursive:true});
const pantsSource=process.argv[2],beltSource=process.argv[3];
if(!pantsSource||!beltSource)throw new Error('Provide generated pants and belt source paths');
copyFileSync(pantsSource,out+'/source-pants.png');
copyFileSync(beltSource,out+'/source-belt.png');
const W=887,H=1774;
const normalized=(path:string)=>new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><image href="data:image/png;base64,${readFileSync(path).toString('base64')}" width="${W}" height="${H}" preserveAspectRatio="none"/></svg>`).render().pixels;
const old=pngPixels(readFileSync('public/assets/avatar/leopard-v2/pants.png')).pixels;
const rebuilt=normalized(pantsSource),rawBelt=normalized(beltSource);
// The generated cutout can drift within its canvas. Register its actual opaque
// bounds to the original belt's waist/charm anchors, never to file dimensions.
let x0=W,y0=H,x1=0,y1=0;
for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(rawBelt[(y*W+x)*4+3]>80){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
const belt=new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><svg x="283" y="703" width="315" height="207" viewBox="${x0} ${y0} ${x1-x0+1} ${y1-y0+1}" preserveAspectRatio="none"><image href="data:image/png;base64,${rgbaPng(W,H,rawBelt).toString('base64')}" width="${W}" height="${H}"/></svg></svg>`).render().pixels;
const pants=new Uint8Array(old);
// Restrict generated reconstruction to the hidden waist. All leg seams, pockets,
// fur and lower contours remain the exact original pixels.
for(let y=0;y<920;y++)for(let x=0;x<W;x++){
 const i=(y*W+x)*4,t=y<890?1:(920-y)/30;
 // Raise the new waistband to the canonical low-rise underwear coverage anchor.
 // The adjustment tapers to zero before the unchanged legs and pockets.
 const sy=Math.min(H-1,Math.round(y+Math.min(50,Math.max(0,(920-y)*50/200))));
 const j=(sy*W+x)*4;
 for(let c=0;c<4;c++)pants[i+c]=Math.round(rebuilt[j+c]*t+old[i+c]*(1-t));
}
writeFileSync(out+'/pants.png',rgbaPng(W,H,pants));
writeFileSync(out+'/belt.png',rgbaPng(W,H,belt));
const fur=pngPixels(readFileSync('public/assets/avatar/leopard-v2/fur-mask.png')).pixels;
const main=new Uint8Array(pants.length);
for(let i=0;i<main.length;i+=4)main.set([255,255,255,fur[i+3]?0:pants[i+3]],i);
writeFileSync(out+'/pants-mask.png',rgbaPng(W,H,main));
console.log('Separated belt and reconstructed waist; source canvas '+W+' x '+H);
