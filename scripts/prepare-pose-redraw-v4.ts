import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {Resvg} from '@resvg/resvg-js';
import {pngPixels} from '../apps/server/src/atelier-images';
import {rgbaPng} from './lib/png-rgba';
const dir='public/assets/avatar/poses/redraw-v4';mkdirSync(dir,{recursive:true});
const generated='C:/Users/vosma/.codex/generated_images/01a1bc58-ff5f-7601-ba39-06797aeaee0d/';
const inputs:Record<string,string>={
 'heart-body':'exec-22f54033-115f-42cf-b4cc-565dcbcee812.png',
 'hip-body':'exec-53a73145-c322-42f7-8b3b-9204e3487f67.png',
 'heart-arms':'exec-76f55cb5-ca56-40f8-8351-44ae57b282f3.png',
 'hip-arm':'exec-b04e7c97-e5a8-4b24-a6b7-3c1809de18b8.png',
 'heart-burgundy':'exec-1da6e361-5d83-491b-aaa9-14b812e1c2d7.png',
 'hip-burgundy':'exec-5414042b-c0d5-4223-8298-c1676525022a.png',
 'heart-lilac':'exec-23d42e15-240b-4639-b160-7ed413291d3b.png',
 'hip-lilac':'exec-e10eca1e-8913-4d6b-a3ee-43e03b78c922.png',
};
for(const [name,file]of Object.entries(inputs)){
 if(existsSync(generated+file))copyFileSync(generated+file,`${dir}/${name}-source.png`);
 const source=readFileSync(`${dir}/${name}-source.png`),{width,height}=pngPixels(source);
 if(width!==887||height!==1774)throw new Error(`Unexpected registration ${name}: ${width}x${height}`);
 if(name.endsWith('body'))continue;
 if(name.endsWith('arms')||name.endsWith('arm')){writeFileSync(`${dir}/${name}.png`,source);continue;}
 const {pixels:p}=pngPixels(source),cloth=new Uint8Array(p.length),main=new Uint8Array(p.length),detail=new Uint8Array(p.length);
 const lilac=name.endsWith('lilac');
 // Extract painted materials from the generated, already-registered clothed source.
 // Skin, jeans, jewelry and the reference face are never copied into a garment.
 const labels=new Uint8Array(887*1774);
 const endY=name.startsWith('hip')?900:(lilac?672:770);
 for(let y=lilac?290:375;y<endY;y++)for(let x=80;x<810;x++){
  const k=y*887+x,i=k*4,[r,g,b,a]=p.subarray(i,i+4);if(a<20)continue;
  if(lilac){
   if(b>g*1.015&&r>g*1.01&&b>r*.82)labels[k]=1;
   else if(r>115&&g>110&&b>85&&r/g<1.16&&g/b<1.3)labels[k]=2;
  }else if(r<180&&r>g*1.28&&r>b*.95&&b>g*1.1)labels[k]=1;
 }
 // Include dark ink adjoining material, but never grow into tan skin or the background.
 for(let y=291;y<endY;y++)for(let x=81;x<809;x++){
  const k=y*887+x,i=k*4;let label=labels[k];
  if(!label&&p[i+3]>20&&Math.max(p[i],p[i+1],p[i+2])<100){
   label=labels[k-1]||labels[k+1]||labels[k-887]||labels[k+887];
  }
  if(!label)continue;cloth.set(p.subarray(i,i+4),i);
  if(labels[k]&&p[i+3]>240)(label===1?main:detail).set([255,255,255,255],i);
 }
 writeFileSync(`${dir}/${name}.png`,rgbaPng(887,1774,cloth));
 writeFileSync(`${dir}/${name}-mask.png`,rgbaPng(887,1774,main));
 if(lilac)writeFileSync(`${dir}/${name}-detail-mask.png`,rgbaPng(887,1774,detail));
}
function clipped(name:string,source:string,path:string){
 const data=readFileSync(`${dir}/${source}.png`).toString('base64');
 writeFileSync(`${dir}/${name}.png`,new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><defs><clipPath id="c"><path d="${path}"/></clipPath></defs><image width="887" height="1774" href="data:image/png;base64,${data}" clip-path="url(#c)"/></svg>`).render().asPng());
}
clipped('hip-hand','hip-arm','M485 650H565L634 676 641 714 601 748 551 775H485Z');
clipped('heart-hands','heart-arms','M312 437L362 350H522L574 437 554 472H330Z');
console.log('Registered redraw v4 sources, body parts and independently recolorable clothing saved.');
