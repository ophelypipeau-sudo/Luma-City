import {readFileSync,writeFileSync} from 'node:fs';
import {pngPixels} from '../apps/server/src/atelier-images';
import {rgbaPng} from './lib/png-rgba';
const root='public/assets/avatar/winter-v1';
// Use fabric regions, not the pink cast of the white jacket's soft shadows.
for(const name of ['pink-jacket','pink-hip','pink-heart']){
 const s=pngPixels(readFileSync(`${root}/${name}.png`)),main=pngPixels(readFileSync(`${root}/${name}-mask.png`)).pixels,detail=pngPixels(readFileSync(`${root}/${name}-detail-mask.png`)).pixels;
 for(let k=0;k<887*1774;k++){
  const i=k*4;if(!main[i+3]&&!detail[i+3])continue;
  const x=k%887,y=Math.floor(k/887),[r,g,b]=s.pixels.subarray(i,i+3);
  const collar=y<445;
  const star=y>445&&y<545&&x>325&&x<555;
  const cuff=name==='pink-jacket'?y>730:name==='pink-hip'?(y>730||(x>590&&y>610&&y<740)):false;
  const pink=(collar||cuff)?r-g>7&&b-g>3:star&&r-g>25&&b-g>15;
  main.set(pink?[0,0,0,0]:[255,255,255,255],i);
  detail.set(pink?[255,255,255,255]:[0,0,0,0],i);
 }
 writeFileSync(`${root}/${name}-mask.png`,rgbaPng(887,1774,main));
 writeFileSync(`${root}/${name}-detail-mask.png`,rgbaPng(887,1774,detail));
}
