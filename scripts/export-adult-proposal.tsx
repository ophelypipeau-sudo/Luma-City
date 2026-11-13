import React from 'react';
import {readFileSync,writeFileSync} from 'node:fs';
import {renderToStaticMarkup} from 'react-dom/server';
import {Resvg} from '@resvg/resvg-js';
const sources=['public/assets/avatar/body/base.png','docs/proposals/adult-base-v1/body-proposal.png'];
const figures=sources.map(path=>{
 const bytes=readFileSync(path), w=bytes.readUInt32BE(16),h=bytes.readUInt32BE(20),url='data:image/png;base64,'+bytes.toString('base64');
 const px=new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><image href="${url}" width="${w}" height="${h}"/></svg>`).render().pixels;
 let top=0,bottom=h-1;
 const occupied=(y:number)=>{let n=0;for(let x=0;x<w;x++)if(px[(y*w+x)*4+3]>210)n++;return n>20;};
 while(top<h&&!occupied(top))top++;while(bottom>top&&!occupied(bottom))bottom--;
 const scale=780/(bottom-top);return {path,url,w,h,top,bottom,scale};
});
const svg=renderToStaticMarkup(<svg xmlns="http://www.w3.org/2000/svg" width="1160" height="1060"><rect width="1160" height="1060" fill="#f3e9e3"/><defs><filter id="alpha" colorInterpolationFilters="sRGB"><feComponentTransfer><feFuncA type="table" tableValues="0 0 0 .6 1"/></feComponentTransfer></filter></defs><g fontFamily="Arial" fill="#5e444d"><text x="35" y="39" fontSize="12" letterSpacing="3">DIRECTION ARTISTIQUE · PROPOSITION 01</text><text x="35" y="79" fontSize="28" fontWeight="bold">Une allure plus adulte, toujours en 2D</text>{figures.map((f,i)=><g key={f.path}><rect x={20+i*570} y="108" width="550" height="870" rx="22" fill={i===0?'#e6d5ce':'#e0d4db'}/><text x={295+i*570} y="141" fontSize="18" textAnchor="middle">{i===0?'Mannequin actuel':'Proposition plus adulte'}</text><image href={f.url} x={295+i*570-f.w*f.scale/2} y={171-f.top*f.scale} width={f.w*f.scale} height={f.h*f.scale} filter="url(#alpha)"/><path d={`M${170+i*570} 955h250`} stroke="#b49ca4" strokeDasharray="3 5"/></g>)}<text x="580" y="1013" fontSize="17" textAnchor="middle">Tête plus proportionnée · Regard plus mesuré · Buste plus long</text><text x="580" y="1040" fontSize="12" textAnchor="middle" fill="#947983">Comparaison à hauteur égale · Proposition non intégrée au jeu</text></g></svg>);
writeFileSync('docs/proposals/adult-base-v1/comparison.svg',svg);
writeFileSync('docs/proposals/adult-base-v1/comparison.png',new Resvg(svg).render().asPng());
writeFileSync('docs/proposals/adult-base-v1/display-registration.json',JSON.stringify(figures.map(({url,...rest})=>rest),null,2));
