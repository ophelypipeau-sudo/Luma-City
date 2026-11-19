import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';

const entries = JSON.parse(readFileSync(new URL('prompts.json',import.meta.url),'utf8').replace(/^\uFEFF/,''));
assert.equal(entries.length,80);
const groups = Map.groupBy(entries,e=>e.breedId);
assert.equal(groups.size,40);
for(const pair of groups.values()) {
  assert.equal(pair.length,2);
  assert.notEqual(pair[0].coat,pair[1].coat);
  for(const e of pair) {
    assert.ok(e.canvas?.length===2 && e.bounds?.length===4,e.id);
    assert.ok(e.bounds[0]>0 && e.bounds[1]>0 && e.bounds[2]<e.canvas[0] && e.bounds[3]<e.canvas[1],e.id);
  }
}
const domain = 'packages/domain/src/companions.ts';
let source = readFileSync(domain,'utf8');
assert.ok(!source.includes('"pinscher-autrichien":'), 'Lot déjà intégré');
const breeds = [...groups.values()].map(([e])=>'  '+JSON.stringify(e.breedId)+': '+JSON.stringify({name:e.name,species:'Chien',standard:e.standard,cover:e.id,price:e.price,heightRatio:e.heightRatio})+',').join('\n');
source = source.replace('} as const;',breeds+'\n} as const;');
const variants = entries.map(({id,breedId,coat,canvas,bounds})=>'  '+JSON.stringify({id,breedId,coat,canvas,bounds})+',').join('\n');
source = source.replace(/\r?\n];\r?\n\r?\nexport const COMPANION_CATALOG/, '\n'+variants+'\n];\n\nexport const COMPANION_CATALOG');
assert.ok(source.includes('"id":"terrier-soyeux-bleu-argent-feu"'), 'Variantes non insérées');
writeFileSync(domain,source);
const test = 'tests/companions.test.ts';
let tests = readFileSync(test,'utf8').replaceAll('743','823').replace('length, 388','length, 428').replace('length, 302','length, 342');
tests = tests.replace('const twoCoats = new Set<CompanionBreedId>([','const twoCoats = new Set<CompanionBreedId>([\n    '+[...groups.keys()].map(id=>JSON.stringify(id)).join(', ')+',');
writeFileSync(test,tests);
const table = [...groups.values()].map(([a,b])=>`| ${a.name} | ${a.coat} ; ${b.coat} | [${a.standard}](${a.standardUrl}) |`).join('\n');
writeFileSync(new URL('README.md',import.meta.url),`# Chiens FCI — lot 15

Quarante nouvelles races, avec exactement deux pelages actifs par race : 80 illustrations originales.

| Race | Deux variantes | Standard FCI |
| --- | --- | --- |
${table}

Création avec l’outil intégré \`image_gen\`, un appel par illustration. Les prompts, sources natives et dimensions mesurées sont conservés dans [prompts.json](prompts.json). Les PNG RGBA sont copiés dans [public/assets/companions/](../../../public/assets/companions/), sans recoloration ni déformation par programme.

Les races à robe restreinte conservent deux nuances ou répartitions de marques : Schipperke noir, Spitz japonais et Tchouvatch blancs, Sussex Spaniel foie doré, Setter Gordon et Terrier anglais d’agrément noirs et feu, Porcelaine blanc et orange. Les standards FCI liés ci-dessus servent de référence.

Contrôles sur fonds clair, sombre et vert : huit planches \`controle-fonds-1.png\` à \`controle-fonds-8.png\` et [planche complète](controle-fonds.png). Les limites des silhouettes sont mesurées à partir d’un alpha ≥ 16 ; les canevas natifs et les marges sont conservés pour la boutique, la collection et les salons multijoueurs.

Après ce lot : **342 races canines illustrées sur 364 références**, soit **22 races encore absentes**. Catalogue complet : **428 races et 823 pelages**.

Reproduction depuis la racine :

\`\`\`powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File docs/animalerie-v1/lot-80-chiens-fci-15/prepare.ps1
node scripts/run-tests.mjs tests/companions.test.ts
npx tsc --noEmit
\`\`\`
`);
console.log('40 races et 80 pelages intégrés au catalogue et aux contrôles.');

