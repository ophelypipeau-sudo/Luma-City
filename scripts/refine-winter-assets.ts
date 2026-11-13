import {readFileSync,writeFileSync} from 'node:fs';
import {pngPixels} from '../apps/server/src/atelier-images';
import {rgbaPng} from './lib/png-rgba';
const root='public/assets/avatar/winter-v1';
for(const kind of ['pink','snow','ivory','ribbon']){
 const {pixels:p}=pngPixels(readFileSync(`${root}/${kind}-hair.png`));
 const back=Uint8Array.from(p),front=Uint8Array.from(p),main=new Uint8Array(p.length),detail=new Uint8Array(p.length);
 for(let y=0;y<1774;y++)for(let x=0;x<887;x++){
  const i=(y*887+x)*4,[r,g,b,a]=p.subarray(i,i+4);if(y<290)back[i+3]=0;else front[i+3]=0;
  if(!a)continue;
  const decor=(kind==='pink'&&y<135&&((x>333&&x<395)||(x>500&&x<558)))||(kind==='ribbon'&&y<174&&y>40&&x>270&&x<625);
  if(decor&&g>b*1.2&&r>g*1.05&&r+g+b>450)continue;
  (decor&&b>g*.98&&r>g*1.05&&r+g+b>250?detail:main).set([255,255,255,255],i);
 }
 writeFileSync(`${root}/${kind}-hair-back.png`,rgbaPng(887,1774,back));writeFileSync(`${root}/${kind}-hair-front.png`,rgbaPng(887,1774,front));writeFileSync(`${root}/${kind}-hair-mask.png`,rgbaPng(887,1774,main));
 if(kind==='pink'||kind==='ribbon')writeFileSync(`${root}/${kind}-hair-detail-mask.png`,rgbaPng(887,1774,detail));
 for(const pose of ['hip','heart']){
  const name=`${kind}-${pose}`,s=pngPixels(readFileSync(`${root}/${name}.png`)),m=pngPixels(readFileSync(`${root}/${name}-mask.png`));
  for(let y=680;y<1000;y++)for(let x=240;x<650;x++){
   const i=(y*887+x)*4;if(s.pixels[i]<s.pixels[i+2]*.9){s.pixels[i+3]=0;m.pixels[i+3]=0;}
  }
  writeFileSync(`${root}/${name}.png`,rgbaPng(887,1774,s.pixels));writeFileSync(`${root}/${name}-mask.png`,rgbaPng(887,1774,m.pixels));
 }
}
// Structural zipper, stitching and metal are protected from material dye.
for(const name of ['pink-jacket','pink-hip','pink-heart','pink-skirt','pink-bag','snow-bag','ivory-bag','ivory-handbag']){
 const s=pngPixels(readFileSync(`${root}/${name}.png`)),mask=pngPixels(readFileSync(`${root}/${name}-mask.png`));
 for(let y=2;y<1772;y++)for(let x=2;x<885;x++){
  const k=y*887+x,i=k*4;if(!mask.pixels[i+3])continue;
  const [r,g,b]=s.pixels.subarray(i,i+3),light=Math.max(r,g,b);
  const zip=name.startsWith('pink-')&&['pink-jacket','pink-hip','pink-heart'].includes(name)&&x>429&&x<453&&y>440&&y<680;
  const skirtSeam=name==='pink-skirt'&&((y>897&&y<918)||(x>434&&x<447&&y>765&&y<870));
  const stitched=name.includes('bag')&&light<215&&[-2,2,-1774,1774].filter(d=>Math.max(...s.pixels.subarray((k+d)*4,(k+d)*4+3))>light+22).length>=2;
  if(zip||skirtSeam||stitched)mask.pixels[i+3]=0;
 }
 writeFileSync(`${root}/${name}-mask.png`,rgbaPng(887,1774,mask.pixels));
}
console.log('Independent hair passes, clean posed garments and protected structural stitching updated.');
