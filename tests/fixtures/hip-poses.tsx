import React from 'react';
import {createRoot} from 'react-dom/client';
import {Portrait} from '../../apps/web/src/Avatar';
import {DEFAULT_LAYERS} from '../../apps/web/src/avatar/model';
import {LEOPARD_LAYERS} from '../../apps/web/src/avatar/leopard';
import {BURGUNDY_LAYERS} from '../../apps/web/src/avatar/burgundy';
import {ROSE_LAYERS} from '../../apps/web/src/avatar/rose';
const looks=[
 {name:'Léopard · sans manches',layers:{...LEOPARD_LAYERS,colors:{[LEOPARD_LAYERS.bottom!]:'#ffcce6'},detailColors:{[LEOPARD_LAYERS.bottom!]:'#ffffff'}}},
 {name:'Pull bordeaux · manches',layers:{...BURGUNDY_LAYERS,belt:LEOPARD_LAYERS.belt}},
 {name:'Cardigan bleu · caraco rose',layers:{...DEFAULT_LAYERS,belt:LEOPARD_LAYERS.belt,colors:{[DEFAULT_LAYERS.top!]:'#80c0ff'},detailColors:{[DEFAULT_LAYERS.top!]:'#ffcce6'}}},
 {name:'Caraco · cargo Dragon',layers:{...ROSE_LAYERS,belt:LEOPARD_LAYERS.belt}},
];
createRoot(document.getElementById('root')!).render(<main style={{padding:16,fontFamily:'sans-serif'}}><h1>Pose conservée avec chaque tenue</h1><p>Même main approuvée ; manches, couleurs et ceinture indépendantes.</p><div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(180px,1fr))',gap:12}}>{looks.map(look=><section key={look.name} style={{background:'#ffffff0c',borderRadius:12,padding:10}}><h2 style={{fontSize:15}}>{look.name}</h2><div style={{height:560}}><Portrait id="iris" layers={look.layers} fullBody pose="hand-on-hip" /></div></section>)}</div></main>);

