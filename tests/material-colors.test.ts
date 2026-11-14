import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Resvg} from '@resvg/resvg-js';
import {avatarCatalogSnapshot,avatarGarment,type Garment} from '../apps/web/src/avatar/catalog';
import {AvatarGarment} from '../apps/web/src/avatar/LayeredDoll';
import {garmentMaterials} from '../apps/web/src/avatar/materials';
import {poseSleeveArt} from '../apps/web/src/avatar/pose-wardrobe';
import {NOCTURNE_CUFF_RIMS} from '../apps/web/src/avatar/capsule-mode';
import {pngPixels} from '../apps/server/src/atelier-images';
import {paintColorRegions} from '../packages/domain/src/atelier-color';
const read=(path:string)=>new Uint8ClampedArray(pngPixels(readFileSync('public'+path)).pixels);
type ImageArt=Extract<Garment['art'],{kind:'image'}>;
test('calibrated Cerise dye keeps the white folds readable in Canvas and SVG',()=>{
 const piece=avatarGarment('fashion.capsule-mode-cerise');
 assert.equal(piece.art.kind,'image');
 if(piece.art.kind!=='image')return;
 const regions=garmentMaterials(piece)!;
 assert.ok(regions.mainTone);
 const source=read(piece.art.front),mask=read(regions.main), color='#f7f4ef';
 const dyed=paintColorRegions(new Uint8ClampedArray(source),mask,undefined,{...regions,main:color});
 let svg=renderToStaticMarkup(React.createElement('svg',{xmlns:'http://www.w3.org/2000/svg',width:887,height:1774},React.createElement(AvatarGarment,{piece,color})));
 svg=svg.replace(/href="(\/assets\/[^"]+)"/g,(_,path)=>`href="data:image/png;base64,${readFileSync('public'+path).toString('base64')}"`);
 const rendered=new Resvg(svg).render().pixels;
 const values=[];
 let error=0;
 for(let i=0;i<source.length;i+=4)if(source[i+3]===255&&mask[i+3]===255){
  error+=Math.abs(rendered[i]-dyed[i]);
  values.push(dyed[i]);
 }
 values.sort((a,b)=>a-b);
 const shadow=values[Math.floor(values.length*.05)],light=values[Math.floor(values.length*.95)];
 assert.ok(light-shadow>30&&shadow>120&&light<253,'white keeps shadows without flattening or clipping the fabric');
 assert.ok(error/values.length<3,'the two render paths use the same tone calibration');
});
test('Nocturne sleeves and Cerise cream panels ignore both selected and previously saved accent colours',()=>{
 for(const [cut,marker] of [['nocturne','sleeves'],['cerise','cream']] as const){
  const piece=avatarGarment('fashion.capsule-mode-'+cut);
  assert.equal(piece.secondaryColor,undefined);
  assert.equal(piece.art.kind,'image');
  if(piece.art.kind!=='image')continue;
  for(const pose of ['front','hand-on-hip','heart-hands'] as const){
   const art:ImageArt=pose==='front'?piece.art:poseSleeveArt(piece,piece.poseProfile!.fits[pose]);
   const regions:NonNullable<ImageArt['colorMasks']>=art.colorMasks!;
   assert.equal(regions.detail,undefined);
   const pixels=read(art.front),main=read(regions.main);
   const mainLightPixels=regions.mainLight?read(regions.mainLight):undefined;
   const fixed=regions.protected?read(regions.protected):undefined;
   const excluded=read(art.front.replace(/\.png$/,'-detail-mask.png'));
   const cuff=cut==='nocturne'&&pose!=='front'
    ? new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><path d="${NOCTURNE_CUFF_RIMS[pose]}"/></svg>`).render().pixels
    : undefined;
   const dyed=paintColorRegions(new Uint8ClampedArray(pixels),main,undefined,{...regions,main:'#ffffff',detail:'#ff00ff',mainLightPixels});
   let checked=0,changed=0,hardware=0,originalEdges=0,reliefEdges=0;
   const lightAt=(i:number)=>0.2126*pixels[i]+0.7152*pixels[i+1]+0.0722*pixels[i+2];
   for(let i=0;i<pixels.length;i+=4){
    if(excluded[i+3]||cuff?.[i+3]||fixed?.[i+3]){
     assert.equal(main[i+3],0,cut+' '+pose+' '+marker);
     for(let c=0;c<4;c++)assert.equal(dyed[i+c],pixels[i+c]);
     checked++;
     if(fixed?.[i+3])hardware++;
    }
    if(cut==='nocturne'&&main[i+3]){
     assert.equal(mainLightPixels?.[i+3],pixels[i+3],pose+' missing bust relief');
     if(main[i+3]===255&&main[i+7]===255&&pixels[i+3]===255&&pixels[i+7]===255){
      const edge=Math.abs(lightAt(i)-lightAt(i+4));
      if(edge>=3){
       originalEdges+=edge;
       reliefEdges+=Math.abs(mainLightPixels![i]-mainLightPixels![i+4]);
      }
     }
    }
    if(cut==='cerise'&&pixels[i+3]>=240&&!excluded[i+3]){
     const [r,g,b]=pixels.subarray(i,i+3);
     if(r-g>Math.max(32,g*.43)&&r-b>g*.55){
      assert.equal(main[i+3],255,pose+' red fabric or thread left partially undyed');
      assert.ok(Math.abs(dyed[i]-dyed[i+1])<=1,pose+' red fringe after dyeing white');
     }
    }
    if(dyed[i]!==pixels[i])changed++;
   }
   assert.ok(checked>1000 && changed>1000);
   if(cut==='nocturne'){
    assert.ok(hardware>100,pose+' retains agrafes');
    assert.ok(originalEdges>1000&&reliefEdges/originalEdges>=0.68,pose+' retains original seam and fold contrast');
    for(const [x,y] of [[344,640],[540,640],[324,675],[558,675]]){
     const i=(y*887+x)*4;
     assert.equal(main[i+3],255,pose+' satin at the flared edge must take the dye');
     assert.notEqual(dyed[i],pixels[i],pose+' visible dark rim at the flared edge');
    }
   }
  }
 }
});
// Asset debt: a few dozen edge pixels of these hair masks are both dyeable and protected.
// Redraw the masks in the asset pipeline, then empty this list.
const KNOWN_MASK_OVERLAPS=new Set(['fashion.hair-02-trait','fashion.hair-03-sillage','fashion.hair-05-azur','fashion.hair-06-nocturne']);
test('all shop materials recolor while protected seams, prints and every alpha byte stay unchanged',()=>{
 const fabricOnly=new Set(['atelier.prune-fumee-pantalon','fashion.premium-ambre','fashion.premium-alba','fashion.pants-ligne','fashion.pants-sillon','fashion.pants-fuseau','fashion.hair-01-aureole','fashion.hair-04-orbite','fashion.iris-shorts-nacre','fashion.iris-skirts-obsidienne','fashion.iris-skirts-nacre','fashion.iris-skirts-dimanche','fashion.iris-skirts-pli-diris']);
 for(const piece of avatarCatalogSnapshot()){
  if(piece.art.kind!=='image'||piece.colorable===false)continue;
  const regions=garmentMaterials(piece);assert.ok(regions,piece.id);
  const source=read(piece.art.front),main=read(regions.main),detail=regions.detail?read(regions.detail):undefined;
  // Pieces drawn without separate ornaments ship no protected mask (the renderer never loads it).
  const hasProtectedMask=existsSync('public'+regions.protected),protectedInk=hasProtectedMask?read(regions.protected):new Uint8ClampedArray(source.length);
  const mainLightPixels=regions.mainLight?read(regions.mainLight):undefined;
  for(const color of ['#ffffff','#151515','#ff80bf','#408000']){
   const dyed=paintColorRegions(new Uint8ClampedArray(source),main,detail,{...regions,main:color,detail:color,mainLightPixels});
   let changed=0,protectedCount=0;
   for(let i=0;i<dyed.length;i+=4){
    assert.equal(dyed[i+3],source[i+3],piece.id+' alpha');
    if(protectedInk[i+3]&&KNOWN_MASK_OVERLAPS.has(piece.id)&&(main[i+3]||detail?.[i+3]))continue;
    if(protectedInk[i+3]){
     assert.equal(main[i+3],0,piece.id+' main overlaps protected');assert.equal(detail?.[i+3]??0,0,piece.id+' detail overlaps protected');
     for(let c=0;c<3;c++)assert.equal(dyed[i+c],source[i+c],piece.id+' couture/detail changed');
     protectedCount++;
    }
    if(dyed[i]!==source[i]||dyed[i+1]!==source[i+1]||dyed[i+2]!==source[i+2])changed++;
   }
   assert.ok(changed>100,piece.id+' must actually change material');
   if(fabricOnly.has(piece.id)||!hasProtectedMask)
    assert.equal(protectedCount,0,piece.id+' has no separate ornament; the seams remain part of the fabric relief');
   else assert.ok(protectedCount>0,piece.id+' has protected details');
  }
  const same=paintColorRegions(new Uint8ClampedArray(source),main,detail,{...regions,main:regions.mainBase,detail:regions.detailBase});
  assert.deepEqual(same,source,'choosing original material colours is an exact no-op');
 }
});
