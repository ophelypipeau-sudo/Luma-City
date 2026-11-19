import './plan.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
const read = name=>JSON.parse(readFileSync(new URL(name,import.meta.url),'utf8').replace(/^\uFEFF/,''));
const entries=read('prompts.json');
const sources=read('sources.json');
const corrections=read('corrections.json');
for(const {i,sourceImage} of sources) {
  entries[i].sourceImage=sourceImage;
  const correction=corrections.find(c=>c.index===i);
  if(correction) {
    entries[i].initialSourceImage=correction.original;
    entries[i].initialSourceCopy=`docs/animalerie-v1/lot-80-chiens-fci-14/source-originale-${i}.png`;
    entries[i].correctionPrompt=correction.prompt;
  }
}
writeFileSync(new URL('prompts.json',import.meta.url),JSON.stringify(entries.filter(e=>e.sourceImage),null,2)+'\n');
console.log(`${sources.length}/80 illustrations reçues.`);
