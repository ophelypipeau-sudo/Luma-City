import {readFileSync,writeFileSync} from 'node:fs';
import {pngPixels} from '../apps/server/src/atelier-images';
import {rgbaPng} from './lib/png-rgba';
import {Resvg} from '@resvg/resvg-js';
const path='public/assets/avatar/poses/hand-on-hip-lilac-v1/';
const {width:w,height:h,pixels:p}=pngPixels(readFileSync(path+'arm.png'));
const main=new Uint8Array(p.length);
// Calibrated cuff seam and exterior ink stay untouched. Ribbing and folds
// remain part of the material response rather than frozen lilac lines.
const seams=new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><path d="M620 679 Q637 684 658 708" stroke="white" stroke-width="3" fill="none"/></svg>`).render().pixels;
for(let i=0;i<p.length;i+=4){
 const [r,g,b,a]=p.subarray(i,i+4);
 if(a>240&&b>g*1.02&&r>g*1.02&&r+g+b>90&&seams[i+3]<50)main.set([255,255,255,255],i);
}
writeFileSync(path+'arm-material-mask.png',rgbaPng(w,h,main));
