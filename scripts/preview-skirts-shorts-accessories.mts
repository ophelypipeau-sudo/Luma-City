import fs from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { pngPixels } from "../apps/server/src/atelier-images.ts";
import { rgbaPng } from "./lib/png-rgba.ts";
import { DOLL_PATTERN, torsoBounds } from "../packages/domain/src/avatar-pattern.ts";
const dir="docs/capsule-jupes-shorts-accessoires";
const url=b=>"data:image/png;base64,"+b.toString("base64");
const asset=p=>url(fs.readFileSync("public/assets/avatar/"+p));
const body=asset("leopard-v1/underwear-strapless.png");
const pants=asset("prune-fumee-v1/pantalon.png");
const names={
 jupes:["Denim indigo","Plissée noire","Satin ivoire","Portefeuille bordeaux","Cargo olive","Crayon à rayures","Volants rose poudré","Cuir chocolat","Plis marine","Lin sauge"],
 shorts:["Denim à revers","Tailleur anthracite","Lin noué","Cargo olive","Cuir bordeaux","Boxer satin","Velours côtelé","Ourlet festonné","Bermuda à rayures","Bermuda utilitaire"],
 accessoires:["Créoles dorées","Perles pendantes","Chaînes argentées","Pendentif grenat","Lunettes œil-de-chat","Lunettes écaille","Sac bordeaux","Sac crème","Ceinture noire","Ceinture tressée"]
};
const image=(href,x,y,width,height)=>'<image href="'+href+'" x="'+x+'" y="'+y+'" width="'+width+'" height="'+height+'" preserveAspectRatio="none"/>';
const svg=(w,h,inner)=>'<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'">'+inner+'</svg>';
const render=(file,xml)=>fs.writeFileSync(dir+"/"+file,new Resvg(xml).render().asPng());
fs.mkdirSync(dir+"/calques",{recursive:true});
for(const category of Object.keys(names)){
 const {width,height,pixels}=pngPixels(fs.readFileSync(dir+"/"+category+".png"));
 const tiles=[];
 for(let i=0;i<10;i++){
  const col=i%5,row=Math.floor(i/5);
  const x0=Math.floor(col*width/5),x1=Math.floor((col+1)*width/5)-(category==="accessoires"&&i===3?14:0);
  const y0=Math.floor(row*height/2),y1=Math.floor((row+1)*height/2);
  let l=x1,r=x0,t=y1,b=y0;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
   if(pixels[(y*width+x)*4+3]<150)continue;
   l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);
  }
  l=Math.max(x0,l-2);r=Math.min(x1-1,r+2);t=Math.max(y0,t-2);b=Math.min(y1-1,b+2);
  const w=r-l+1,h=b-t+1, cut=new Uint8Array(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const p=((t+y)*width+l+x)*4,q=(y*w+x)*4;
   if(pixels[p+3]>=24)cut.set(pixels.subarray(p,p+4),q);
  }
  let art,box;
  if(category==="accessoires"&&(i===4||i===5)){
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const p=(y*w+x)*4, local=x/w;
    const dx=(local-(local<.5?.254:.746))/.187,dy=(y/h-.55)/.37;
    const lens=Math.max(0,Math.min(1,(1-dx*dx-dy*dy)*5));
    if(Math.min(cut[p],cut[p+1],cut[p+2])>100)cut[p+3]=Math.round(cut[p+3]*(1-.9*lens));
   }
  }
  const urlCut=url(rgbaPng(w,h,cut));
  if(category==="accessoires"){
   if(i<2){
    art="";
    for(let side=0;side<2;side++){
     const half=Math.floor(w/2),part=new Uint8Array(half*h*4);
     for(let y=0;y<h;y++)part.set(cut.subarray((y*w+side*(w-half))*4,(y*w+side*(w-half)+half)*4),y*half*4);
     art+=image(url(rgbaPng(half,h,part)),[337,528][side],214,24,24*h/half);
    }
   } else {
    const [x,y,targetW]=[[354,252,179],[391,298,104],[348,147,190],[348,147,190],[117,886,144],[505,345,152],[305,676,278],[305,676,278]][i-2];
    art=image(urlCut,x,y,targetW,targetW*h/w);
    if(i===2) art='<defs><clipPath id="collier"><path d="M0 353H385L405 332H481L500 353H887V1774H0Z"/></clipPath></defs><g clip-path="url(#collier)">'+art+'</g>';
   }
   box=i===6?"75 565 730 610":i>=8?"208 460 472 460":"216 -5 455 480";
  }else{
   const y=DOLL_PATTERN.waistY-12;
   const [left,right]=torsoBounds(y,5);
   const sampleY=Math.round(h*.09);
   const waistband=Array.from({length:w},(_,x)=>x).filter(x=>cut[(sampleY*w+x)*4+3]>=150);
   const bandWidth=waistband.at(-1)-waistband[0]+1;
   const scale=(right-left+18)/bandWidth*(category==="jupes"&&[2,5,7].includes(i)?1.09:category==="shorts"&&i===2?1.06:1);
   const center=(left+right)/2;
   art=image(urlCut,center-(waistband[0]+waistband.at(-1))*scale/2,y-sampleY*scale,w*scale,h*scale);
   box=category==="jupes"?"168 485 550 1050":"180 480 525 755";
  }
  const id=category+"-"+String(i+1).padStart(2,"0");
  render("calques/"+id,svg(887,1774,art));
  const model=image(body,0,0,887,1774)+(category==="accessoires"?image(pants,0,0,887,1774):"")+art;
  const fit='<svg width="250" height="360" viewBox="'+box+'">'+model+'</svg>';
  tiles.push('<g transform="translate('+(col*266+8)+' '+(row*405+8)+')"><rect width="250" height="360" rx="10" fill="#51405a"/>'+fit+'<text x="125" y="384" text-anchor="middle" font-family="Segoe UI" font-size="16" fill="#fff4fa">'+(i+1)+' · '+names[category][i]+'</text></g>');
 }
 render(category+"-sur-iris.png",svg(1330,810,'<rect width="100%" height="100%" fill="#251c2e"/>'+tiles.join("")));
}

