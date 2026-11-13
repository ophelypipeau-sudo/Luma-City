import React from 'react';
import {createRoot} from 'react-dom/client';
import {FASHION_BASE} from '../../apps/web/src/avatar/base';
import {LayeredDoll} from '../../apps/web/src/avatar/LayeredDoll';
import {LEOPARD_LAYERS} from '../../apps/web/src/avatar/leopard';
import {avatarCatalogSnapshot} from '../../apps/web/src/avatar/catalog';
const bottoms=avatarCatalogSnapshot().filter(p=>p.slot==='bottom');
createRoot(document.getElementById('root')!).render(<main style={{fontFamily:'sans-serif',padding:16}}><h1>Ceinture indépendante · tous les bas de la boutique</h1><p>Même corps, même ceinture, repères d’attache adaptés au bas. Dernière case : pantalon sans ceinture.</p><div style={{display:'grid',gridTemplateColumns:'repeat(5,minmax(170px,1fr))',gap:8}}>{[...bottoms,{...bottoms.find(p=>p.id===LEOPARD_LAYERS.bottom)!,id:'without-belt',name:'Cargo sans ceinture'}].map(p=><section key={p.id} style={{background:'#ffffff0d',padding:8,borderRadius:12}}><h2 style={{fontSize:15,height:36}}>{p.name}</h2><svg viewBox="0 0 480 1024" width="100%" role="img" aria-label={p.name}><LayeredDoll bodyBase={FASHION_BASE} layers={{...LEOPARD_LAYERS,bottom:p.id==='without-belt'?LEOPARD_LAYERS.bottom:p.id,belt:p.id==='without-belt'?null:LEOPARD_LAYERS.belt}}/></svg></section>)}</div></main>);
