import {readFileSync,writeFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {Resvg} from '@resvg/resvg-js';
import {pngPixels} from '../apps/server/src/atelier-images';
import {rgbaPng} from './lib/png-rgba';
const out='public/assets/avatar/poses/hand-on-hip-v3';mkdirSync(out,{recursive:true});
const [bare,sleeve]=process.argv.slice(2);if(!bare||!sleeve)throw new Error('Expected bare arm and burgundy sleeve source paths');
function register(source:string,name:string,rect:number[]){
 copyFileSync(source,`${out}/source-${name}.png`);
 const {width:w,height:h,pixels:p}=pngPixels(readFileSync(source));
 let x0=w,y0=h,x1=0,y1=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(p[(y*w+x)*4+3]>100){x0=Math.min(x,x0);y0=Math.min(y,y0);x1=Math.max(x,x1);y1=Math.max(y,y1);}
 const [x,y,width,height]=rect;
 const png=new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="${x0} ${y0} ${x1-x0+1} ${y1-y0+1}" preserveAspectRatio="none"><image width="${w}" height="${h}" href="data:image/png;base64,${readFileSync(source).toString('base64')}"/></svg></svg>`).render().asPng();
 writeFileSync(`${out}/${name}.png`,png);
 return pngPixels(png).pixels;
}
register(bare,'bare-arm',[538,341,235,372]);
const cloth=register(sleeve,'burgundy-sleeve',[557,391,222,322]);
const mask=new Uint8Array(cloth.length);
const seams=new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><path d="M619 682 Q643 683 662 704" fill="none" stroke="white" stroke-width="2.5"/></svg>`).render().pixels;
for(let i=0;i<mask.length;i+=4)if(cloth[i+3]>240&&seams[i+3]<80)mask.set([255,255,255,255],i);
writeFileSync(`${out}/burgundy-sleeve-mask.png`,rgbaPng(887,1774,mask));
