import { readFileSync, writeFileSync, existsSync, copyFileSync, readdirSync } from 'node:fs';
const root=new URL('../../../',import.meta.url);
const folder=new URL('./',import.meta.url);
const json=p=>JSON.parse(readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const entries=json(new URL('prompts.json',folder));
const sources=readdirSync(folder).filter(f=>/^source-\d+\.json$/.test(f)).map(f=>json(new URL(f,folder)));
for(const entry of entries){
  const source=sources.find(s=>s.id===entry.id);
  if(!source) continue;
  entry.sourceImage=source.sourceImage;
  const target=new URL(entry.fichier,root);
  if(existsSync(target) && !readFileSync(target).equals(readFileSync(entry.sourceImage))) throw new Error('Refusing to overwrite '+entry.id);
  if(!existsSync(target)) copyFileSync(entry.sourceImage,target);
  const png=readFileSync(target);
  entry.canvas=[png.readUInt32BE(16),png.readUInt32BE(20)];
}
const asian=entries.find(e=>e.breedId==='berger-asie-centrale');
asian.standardUrl=asian.standardUrl.replace('g01','g02');
writeFileSync(new URL('prompts.json',folder),JSON.stringify(entries,null,2));
console.log(`${sources.length}/${entries.length} native PNGs saved in workspace`);
