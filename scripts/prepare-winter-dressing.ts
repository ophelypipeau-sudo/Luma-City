import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync} from 'node:fs';
import {Resvg} from '@resvg/resvg-js';
import {pngPixels} from '../apps/server/src/atelier-images';
import {rgbaPng} from './lib/png-rgba';
const OUT='public/assets/avatar/winter-v1',GEN='C:/Users/vosma/.codex/generated_images/01a1bc58-ff5f-7601-ba39-06797aeaee0d/';
mkdirSync(`${OUT}/sources`,{recursive:true});
const sources:Record<string,string>={
 pink:'4b82eaab-57fb-4c83-82b7-00f5790b02cd',snow:'8ddec7cd-0b47-45b4-81f1-b71221f8dc06',ivory:'7cce2045-5bb7-4a56-a816-b0ade5ccf39c',ribbon:'235c1b03-3886-42be-93bf-6788b354540f',
 'pink-clothes':'6b1b3906-9493-439d-9478-98c833f33738','snow-clothes':'442622c0-ecdb-4f65-bef5-9620513e83a4','ivory-clothes':'9b1974af-1984-4b5e-9485-9c9116689973','ribbon-clothes':'4b938fe4-4c89-4d10-9966-9eb0dc9bf595',camisole:'7d87cedc-b584-4b88-9134-a55954411e86',
 'pink-heart':'722b46b8-627e-4984-be2e-8631a5ddcb02','pink-hip':'711cb370-819b-4e18-a5cb-69a87b719f39','snow-heart':'535e9849-b448-4bc1-9c91-a232c8ff09ab','snow-hip':'b56e5550-f8e8-4b6d-8323-b4b1564fd70b','ivory-heart':'f1a7d810-974f-4b9a-af5b-fd2d15ecc0ea','ivory-hip':'2802fc01-4a2a-465a-b62b-096042b33f2b','ribbon-heart':'d0ba8918-962e-4976-b770-5cb55ec0a15a','ribbon-hip':'6bf1386a-510a-4a0a-9bcf-59300e040068',
 'pink-hair':'90dcf39d-f0d8-4553-9bbc-a419c96d2764','snow-hair':'72b43930-f4a8-4069-8563-804ce316519d','ivory-hair':'2278b129-5eba-4441-8ba5-68223ccdcdbb','ribbon-hair':'3b2c2478-9039-407c-ba8a-14dcead77099',
 'pink-bag':'c8777e92-427c-413b-b4f8-dfd484252d58','snow-bag':'a08fa3f0-958f-4497-847f-a6e15daf1c2a','ivory-bag':'8f2e8870-7fbb-4199-97cd-db958462be35','ivory-grip':'cf8eaada-1ffb-4b18-9beb-18a1efce3049','snow-belt':'942b61e8-406b-4279-8574-a57058e42d84','ivory-handbag':'06209886-c1dc-475a-99a9-a402de85a973',
};
for(const [name,id]of Object.entries(sources))if(existsSync(`${GEN}exec-${id}.png`))copyFileSync(`${GEN}exec-${id}.png`,`${OUT}/sources/${name}.png`);
type Raster={width:number;height:number;pixels:Uint8Array};
type Pick=(x:number,y:number,r:number,g:number,b:number,a:number)=>boolean;
const cache=new Map<string,Raster>();
function load(name:string){if(!cache.has(name))cache.set(name,pngPixels(readFileSync(`${OUT}/sources/${name}.png`)));return cache.get(name)!;}
const rect=(x0:number,y0:number,x1:number,y1:number):Pick=>(x,y)=>x>=x0&&x<x1&&y>=y0&&y<y1;
function choose(name:string,keep:Pick,grow=0):Raster{
 const s=load(name),p=new Uint8Array(s.pixels.length),hit=new Uint8Array(s.width*s.height);
 for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++){
  const k=y*s.width+x,i=k*4,[r,g,b,a]=s.pixels.subarray(i,i+4);
  // Remove saturated extraction fringes at the alpha boundary, never interior decorations.
  if(a===0)continue;
  const fringe=(r>200&&g<65&&(b<70||b>180))||(r>150&&g>150&&b<60);
  const boundary= x<2||y<2||x>=s.width-2||y>=s.height-2||[-2,2,-2*s.width,2*s.width].some(d=>s.pixels[(k+d)*4+3]<80);
  if(fringe&&boundary)continue;
  if(keep(x,y,r,g,b,a))hit[k]=1;
 }
 if(grow){const initial=hit.slice();for(let y=grow;y<s.height-grow;y++)for(let x=grow;x<s.width-grow;x++){
  const k=y*s.width+x,i=k*4;if(hit[k]||s.pixels[i+3]<20||Math.max(...s.pixels.subarray(i,i+3))>105)continue;
  outer:for(let dy=-grow;dy<=grow;dy++)for(let dx=-grow;dx<=grow;dx++)if(initial[k+dy*s.width+dx]){hit[k]=1;break outer;}
 }}
 for(let k=0;k<hit.length;k++)if(hit[k])p.set(s.pixels.subarray(k*4,k*4+4),k*4);
 return {width:s.width,height:s.height,pixels:p};
}
function register(s:Raster,{sx=1,tx=0,sy=1,ty=0,anchors,offsetX}:{sx?:number;tx?:number;sy?:number;ty?:number;anchors?:number[][];offsetX?:(sourceY:number)=>number}={}){
 const data=rgbaPng(s.width,s.height,s.pixels).toString('base64');let content='';
 if(anchors){
  for(let n=0;n<anchors.length-1;n++){
   const [a,A]=anchors[n],[b,B]=anchors[n+1],rate=(B-A)/(b-a);
   for(let y=a;y<b;y+=2){const h=Math.min(2,b-y);content+=`<svg x="${offsetX?.(y)??tx}" y="${A+(y-a)*rate-.35}" width="${s.width*sx}" height="${h*rate+.7}" viewBox="0 ${y-.35/rate} ${s.width} ${h+.7/rate}" preserveAspectRatio="none" overflow="hidden"><use href="#s"/></svg>`;}
  }
 }else content=`<use href="#s" transform="translate(${tx} ${ty}) scale(${sx} ${sy})"/>`;
 const bytes=new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><defs><image id="s" width="${s.width}" height="${s.height}" href="data:image/png;base64,${data}"/></defs>${content}</svg>`).render().asPng();return pngPixels(bytes);
}
const saved:Record<string,Raster>={};
function save(name:string,s:Raster,zone?:(x:number,y:number,r:number,g:number,b:number)=>0|1|2){
 saved[name]=s;writeFileSync(`${OUT}/${name}.png`,rgbaPng(887,1774,s.pixels));
 const main=new Uint8Array(s.pixels.length),detail=new Uint8Array(s.pixels.length);
 for(let y=1;y<1773;y++)for(let x=1;x<886;x++){
  const k=y*887+x,i=k*4,[r,g,b,a]=s.pixels.subarray(i,i+4);if(!a)continue;
  // Preserve thin drawn contours and structural seams; broad painted shadows stay dyeable.
  const edge=[-1,1,-887,887].some(d=>s.pixels[(k+d)*4+3]<80);
  const thinInk=Math.max(r,g,b)<85&&[-2,2,-1774,1774].filter(d=>Math.max(...s.pixels.subarray((k+d)*4,(k+d)*4+3))>Math.max(r,g,b)+30).length>=2;
  const label=zone?zone(x,y,r,g,b):1;
  if(!label||edge||thinInk)continue;
  (label===2?detail:main).set([255,255,255,255],i);
 }
 writeFileSync(`${OUT}/${name}-mask.png`,rgbaPng(887,1774,main));
 if(detail.some(Boolean))writeFileSync(`${OUT}/${name}-detail-mask.png`,rgbaPng(887,1774,detail));
}
if(process.argv.includes('--handbag-only')){save('ivory-handbag',register(choose('ivory-handbag',()=>true)));process.exit(0);}
const pinkZone=(x:number,y:number,r:number,g:number,b:number):0|1|2=>r>g*1.08&&b>g*1.03?2:1;
const snowZone=(x:number,y:number,r:number,g:number,b:number):0|1|2=>y<490?(Math.max(r,g,b)<170?0:2):1;
save('pink-jacket',register(choose('pink-clothes',(x,y)=>y<880&&(y<665||x<252||x>632))),pinkZone);
save('pink-skirt',register(choose('pink-clothes',rect(245,680,635,930)),{ty:10}),pinkZone);
save('pink-warmers',register(choose('pink-clothes',rect(200,1160,680,1660))));
save('pink-pumps',register(choose('pink-clothes',rect(245,1654,640,1774))));
save('snow-top',register(choose('snow-clothes',(x,y)=>y>=380&&y<900&&(y<740||x<260||x>630)),{ty:-27}),snowZone);
save('snow-shorts',register(choose('snow-clothes',rect(250,745,635,895)),{sx:1.025,tx:-11,anchors:[[745,690],[900,900]]}));
save('snow-warmers',register(choose('snow-clothes',rect(240,1300,650,1637))));
save('snow-pumps',register(choose('snow-clothes',rect(245,1635,640,1774))));
save('ivory-dress',register(choose('ivory-clothes',rect(80,270,810,1000))));
save('ivory-boots',register(choose('ivory-clothes',rect(240,1190,650,1774))));
save('ribbon-cardigan',register(choose('ribbon-clothes',(x,y,r,g,b)=>y>300&&y<910&&r>g*1.08&&b>g*.88&&(r+g+b)/3>65,2),{ty:-30}));
save('ribbon-skirt',register(choose('ribbon-clothes',(x,y,r,g,b)=>x>215&&x<665&&y>640&&y<960&&r<g*1.15&&b<g*1.18&&(r+g+b)/3<110,1),{ty:55}));
save('ribbon-loafers',register(choose('ribbon-clothes',rect(245,1602,640,1774))));
save('ribbon-camisole',register(choose('camisole',()=>true),{anchors:[[0,0],[430,430],[800,735],[1774,1774]]}));

// Body-tight hosiery is registered row by row to the canonical legs, not painted skin.
const body=pngPixels(readFileSync('public/assets/avatar/fashion-v2/body-user.png'));
const stocking=register(choose('ribbon-clothes',rect(250,948,640,1640)),{anchors:[[948,1020],[1200,1150],[1640,1660]]});
function spans(p:Uint8Array,y:number){const result:number[][]=[];let start=-1;for(let x=250;x<=640;x++){
 const on=x<640&&p[(y*887+x)*4+3]>80;if(on&&start<0)start=x;else if(!on&&start>=0){if(x-start>12)result.push([start,x-1]);start=-1;}
}return result;}
const tights=new Uint8Array(body.pixels.length);
for(let y=1020;y<1660;y++){
 const dst=spans(body.pixels,y),src=spans(stocking.pixels,y);if(dst.length!==2||src.length!==2)continue;
 for(let n=0;n<2;n++){const [a,b]=dst[n],[c,d]=src[n];for(let x=a;x<=b;x++){
  const sample=Math.round(c+(x-a)/(b-a)*(d-c)),i=(y*887+x)*4,j=(y*887+sample)*4,lum=(stocking.pixels[j]+stocking.pixels[j+1]+stocking.pixels[j+2])/3;
  const alpha=y<1060?.9:Math.max(.48,Math.min(.83,1-(lum-30)/180));tights.set([33,30,35,Math.round(body.pixels[i+3]*alpha)],i);
 }}
}
save('ribbon-stockings',{width:887,height:1774,pixels:tights});

// Posed tops are extracted as complete opaque material layers, with no reference skin/jeans.
for(const kind of ['pink','snow','ivory','ribbon'])for(const pose of ['heart','hip']){
 const name=`${kind}-${pose}`,s=choose(name,(x,y,r,g,b)=>{
  if(y<(kind==='ivory'?275:kind==='pink'?265:320)||y>(kind==='ivory'?990:pose==='hip'?890:720))return false;
  const cloth=b>g*.89&&r/g<1.65&&r>=b*.9;
  return cloth&&(kind!=='ribbon'||r>g*1.08); // Outer cardigan excludes its independently equipped ivory camisole.
 },2);
 save(name,register(s),kind==='pink'?pinkZone:kind==='snow'?snowZone:undefined);
}

// Four wigs have their own skull, hairline and face-opening anchors. No body is stretched.
const hairFit:Record<string,{sx:number;sy:number;tx:number;ty:number}>={
 pink:{sx:.55,sy:.5,tx:181,ty:10},snow:{sx:.66,sy:.5,tx:128,ty:5},ivory:{sx:1,sy:.82,tx:0,ty:4},ribbon:{sx:1,sy:.8,tx:0,ty:4},
};
for(const kind of Object.keys(hairFit)){
 const s=register(choose(`${kind}-hair`,()=>true),hairFit[kind]);
 save(`${kind}-hair`,s,(x,y,r,g,b)=>r>g*1.25&&b>g*1.08&&r>120?2:1);
 const back=Uint8Array.from(s.pixels),front=Uint8Array.from(s.pixels);
 // Long lengths are behind shoulders; frontal bangs/temples remain above the face.
 for(let y=0;y<1774;y++)for(let x=0;x<887;x++){const i=(y*887+x)*4;if(y<290)back[i+3]=0;else front[i+3]=0;}
 writeFileSync(`${OUT}/${kind}-hair-back.png`,rgbaPng(887,1774,back));writeFileSync(`${OUT}/${kind}-hair-front.png`,rgbaPng(887,1774,front));
}

const neutral=(r:number,g:number,b:number)=>Math.abs(r-g)<30&&Math.abs(g-b)<32;
save('snow-hat',register(choose('snow',(x,y,r,g,b)=>x>250&&x<650&&y<210&&(r+g+b)>330&&neutral(r,g,b),2),{sx:.95,tx:22.175,sy:.8}));
save('ivory-beret',register(choose('ivory',(x,y,r,g,b)=>x>280&&x<620&&y<192&&(r+g+b)>380&&r-g<42&&g-b<38,2),{sx:.95,tx:22.175,sy:.9}));
save('pink-earrings',register(choose('pink',(x,y,r,g,b)=>((x>337&&x<385)||(x>503&&x<550))&&y>214&&y<270&&r>g*1.15&&b>g*1.1,2)),()=>1);
save('pearl-studs',register(choose('snow',(x,y,r,g,b)=>((x>350&&x<381)||(x>505&&x<531))&&y>230&&y<259&&neutral(r,g,b)&&r+g+b>300,2),{ty:-25}));
save('pearl-drops',register(choose('ivory',(x,y,r,g,b)=>((x>345&&x<385)||(x>500&&x<535))&&y>222&&y<275&&r+g+b>300&&Math.abs(r-g)<40&&g-b<40,2),{ty:-15}));
save('star-pearls',register(choose('snow',(x,y,r,g,b)=>x>380&&x<506&&y>323&&y<403&&neutral(r,g,b)&&r+g+b>300,2)));
save('teardrop-pearls',register(choose('ribbon',(x,y,r,g,b)=>x>376&&x<512&&y>342&&y<450&&neutral(r,g,b)&&r+g+b>300,2),{ty:-15}));
const belt=choose('snow-belt',()=>true);save('snow-belt',register(belt,{sx:.64,tx:138.54,sy:.6,ty:240}),(x,y,r,g,b)=>{
 // Buckle, star and metal rivets retain their original metallic detail.
 if((x>415&&x<490)||(x>300&&x<375))return 0;return Math.max(r,g,b)>145?1:0;
});

// Small side bags: body dimensions are preserved; only strap anchor length/position changes.
const bagFit:Record<string,number[]>={pink:[480,790,1000,.5,610,680],snow:[470,945,1140,.55,605,575],ivory:[440,900,1140,.5,725,725]};
for(const [kind,[top,bag,bottom,sx,topX,bodyX]]of Object.entries(bagFit)){
 const s=choose(`${kind}-bag`,()=>true),txBody=650-bodyX*sx,txTop=600-topX*sx;
 save(`${kind}-bag`,register(s,{sx,anchors:[[top,360],[bag,590],[bottom,710]],offsetX:y=>txTop+(txBody-txTop)*Math.max(0,Math.min(1,(y-top)/(bag-top)))}),kind==='pink'?pinkZone:(x,y,r,g,b)=>Math.max(r,g,b)>100?1:0);
}
save('ivory-handbag',register(choose('ivory-handbag',()=>true)));
const grip=register(choose('ivory-grip',(x,y,r,g,b)=>x>85&&x<195&&y>848&&y<963&&r>g*1.15&&g>b*1.15,2));
writeFileSync(`${OUT}/ivory-grip-hand.png`,rgbaPng(887,1774,grip.pixels));

// A shoe must occlude the original toes even beyond its toe box, but keep skin in open vamps.
for(const name of ['pink-pumps','snow-pumps','ivory-boots','ribbon-loafers']){
 const s=saved[name],exterior=new Uint8Array(887*1774),queue:number[]=[];
 for(let y=1620;y<1774;y++)for(const x of [240,650]){const k=y*887+x;if(s.pixels[k*4+3]<80){exterior[k]=1;queue.push(k);}}
 for(let x=240;x<=650;x++)for(const y of [1620,1773]){const k=y*887+x;if(!exterior[k]&&s.pixels[k*4+3]<80){exterior[k]=1;queue.push(k);}}
 for(let n=0;n<queue.length;n++){const k=queue[n],x=k%887,y=Math.floor(k/887);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy;if(xx<240||xx>650||yy<1620||yy>1773)continue;const j=yy*887+xx;if(!exterior[j]&&s.pixels[j*4+3]<80){exterior[j]=1;queue.push(j);}}}
 const mask=new Uint8Array(s.pixels.length);for(let y=1680;y<1774;y++)for(let x=240;x<651;x++){const k=y*887+x,i=k*4;const hole=!exterior[k]&&s.pixels[i+3]<80;if(!hole)mask.set([0,0,0,255],i);}
 writeFileSync(`${OUT}/${name}-coverage.png`,rgbaPng(887,1774,mask));
}
writeFileSync(`${OUT}/sources/manifest.json`,JSON.stringify({body:'fashion-user-hands-v2',canvas:[887,1774],sources,hairFit,bagFit,method:'Built-in imagegen; source-preserving extraction, native material masks and anatomical anchor registration'},null,2));
console.log(`${Object.keys(saved).length} material drawings and pose variants prepared on the canonical canvas.`);
