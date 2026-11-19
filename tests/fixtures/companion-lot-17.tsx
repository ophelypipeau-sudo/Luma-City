import React from 'react';
import { createRoot } from 'react-dom/client';
import { CompanionShop } from '../../apps/web/src/CompanionShop';
import '../../apps/web/src/companions.css';

const params = new URLSearchParams(location.search);
const noop = () => {};
function Preview() {
  if (params.has('panel')) return <CompanionShop collection={{items:[],equipped:null}} balance={10000}
    onBack={noop} onCollection={noop} equip={async()=>{}}
    buy={async(modelId,name)=>({id:'preview',modelId,name})} />;
  return <><h1>Lot 17 — animalerie sur ordinateur et mobile</h1>
    <div className="panels"><iframe title="Mobile 390 pixels" src="?panel=mobile" width="390" height="850" />
      <iframe title="Ordinateur 800 pixels" src="?panel=desktop" width="800" height="850" /></div></>;
}
const style=document.createElement('style');
style.textContent='*{box-sizing:border-box}html,body,#root{margin:0;height:100%;font-family:Arial,sans-serif}body{background:#eee7f0}h1{font-size:20px;padding:12px;margin:0}.panels{display:flex;gap:16px;padding:12px;align-items:start}iframe{border:0;border-radius:12px;flex-shrink:0}button{cursor:pointer;font:inherit;padding:8px;border-radius:8px;border:1px solid #c3a0c6}';
document.head.append(style);
createRoot(document.getElementById('root')!).render(<Preview />);
