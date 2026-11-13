import {readFileSync,writeFileSync} from 'node:fs';
import {Resvg} from '@resvg/resvg-js';
import {pngPixels} from '../apps/server/src/atelier-images';
import {rgbaPng} from './lib/png-rgba';
const root='public/assets/avatar/winter-v1',s=pngPixels(readFileSync(`${root}/snow-belt.png`));
const protect=new Resvg('<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><path d="M337 726L344 741 362 742 348 753 352 772 337 761 321 772 326 753 312 742 330 741Z" fill="white"/><rect x="410" y="721" width="65" height="78" rx="6" fill="white"/></svg>').render().pixels;
const seen=new Uint8Array(887*1774);
for(let y=700;y<808;y++)for(let x=260;x<630;x++){
 const k=y*887+x,i=k*4;if(seen[k]||s.pixels[i+3]<200||Math.max(...s.pixels.subarray(i,i+3))>125)continue;
 const q=[k];seen[k]=1;let x0=x,x1=x,y0=y,y1=y;
 for(let n=0;n<q.length;n++)for(const d of [-1,1,-887,887]){
  const j=q[n]+d,xx=j%887,yy=Math.floor(j/887);if(xx<260||xx>=630||yy<700||yy>=808||seen[j])continue;
  const off=j*4;if(s.pixels[off+3]>200&&Math.max(...s.pixels.subarray(off,off+3))<=125){seen[j]=1;q.push(j);x0=Math.min(xx,x0);x1=Math.max(xx,x1);y0=Math.min(yy,y0);y1=Math.max(yy,y1);}
 }
 const w=x1-x0+1,h=y1-y0+1;
 if(w>=2&&h>=2&&w<=11&&h<=11&&w/h>.5&&w/h<2)for(let yy=y0-2;yy<=y1+2;yy++)for(let xx=x0-2;xx<=x1+2;xx++)protect[(yy*887+xx)*4+3]=255;
}
const mask=new Uint8Array(s.pixels.length);for(let i=0;i<mask.length;i+=4)if(s.pixels[i+3]>0&&!protect[i+3]&&Math.max(...s.pixels.subarray(i,i+3))>125)mask.set([255,255,255,255],i);
writeFileSync(`${root}/snow-belt-mask.png`,rgbaPng(887,1774,mask));writeFileSync(`${root}/snow-belt-protected.png`,rgbaPng(887,1774,protect));
console.log('White belt leather dye separated from star, buckle, eyelets and structural ink.');
