import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import WebSocket from "ws";
import { openDatabase } from "../apps/server/src/db";
import { createApp } from "../apps/server/src/app";
import { constrainWindow, validateWindows, WINDOW_SIZES } from "../packages/domain/src/home-windows";
import { homeDecorationSchema } from "../packages/contracts/src/housing";
import { FINISH_OFFER_VERSION } from "../packages/domain/src/home-finishes";

test("Les quatre modèles de fenêtre restent dans le mur, avec identifiants uniques et six placements maximum", () => {
  for (const modelId of Object.keys(WINDOW_SIZES) as (keyof typeof WINDOW_SIZES)[]) {
    const bounded = constrainWindow({ id: randomUUID(), modelId, x: -100, y: 900 });
    assert.ok(bounded.x >= WINDOW_SIZES[modelId].width / 2); assert.ok(bounded.y <= 408);
    validateWindows([bounded]); assert.throws(() => validateWindows([bounded, bounded]));
    assert.throws(() => validateWindows([{ ...bounded, x: 0 }]));
  }
  assert.equal(homeDecorationSchema.safeParse({ wall: "ivory", floor: "oak", placements: [], windows: Array.from({length:7},()=>({id:randomUUID(),modelId:"round-oak",x:500,y:300})) }).success, false);
});

test("Plusieurs fenêtres d'un modèle acheté se déplacent, se sauvegardent, se diffusent et persistent sans double débit", async () => {
  const directory = await mkdtemp(join(tmpdir(), "luma-windows-"));
  let db = await openDatabase(directory), app = await createApp(db);
  const origin = "http://127.0.0.1:5173";
  async function call(path: string, cookie?: string, body?: object) {
    const r = await app.inject({ method: body ? "POST" : "GET", url: `/api/${path}`, payload: body, headers: { origin, ...(cookie ? {cookie} : {}) } });
    return { status: r.statusCode, data: r.json(), cookie: r.headers["set-cookie"]?.toString().split(";")[0] };
  }
  async function enter(account: string, character: string) {
    const login = await call("login",undefined,{account}), active = await call("activate",login.cookie,{character});
    return { cookie: login.cookie!, generation: active.data.generation, post: (path:string,body:object={})=>call(path,login.cookie,{generation:active.data.generation,...body}) };
  }
  let ws: WebSocket | undefined;
  let saved: any;
  try {
    await app.listen({host:"127.0.0.1",port:0});
    const iris=await enter("aurore","iris"), june=await enter("sacha","june");
    const initial=(await iris.post("housing/load",{ownerId:"iris"})).data.home;
    const windows=[{id:randomUUID(),modelId:"arch-ivory",x:350,y:300},{id:randomUUID(),modelId:"arch-ivory",x:720,y:350}];
    const save=(home:any, decoration:object)=>iris.post("housing/save",{operationId:randomUUID(),expectedRevision:home.revision,decoration});
    assert.equal((await save(initial,{...initial.decoration,windows})).status,400);
    const command={operationId:randomUUID(),finishId:"window:arch-ivory",offerVersion:FINISH_OFFER_VERSION,expectedPrice:750};
    assert.equal((await iris.post("housing/finishes/buy",command)).data.charged,750);
    assert.equal((await iris.post("housing/finishes/buy",command)).data.charged,0);
    const events:any[]=[]; const address=app.server.address() as {port:number};
    ws=new WebSocket(`ws://127.0.0.1:${address.port}/ws`,{headers:{origin,cookie:june.cookie}});
    ws.on("message",raw=>events.push(JSON.parse(raw.toString())));
    async function wait(type:string,predicate:(e:any)=>boolean=()=>true) {
      const until=Date.now()+10000;
      while(Date.now()<until) { const event=events.find(e=>e.type===type&&predicate(e));if(event)return event;await new Promise(r=>setTimeout(r,15)); }
      throw new Error(`Missing ${type}`);
    }
    await wait("welcome");ws.send(JSON.stringify({type:"join-room",roomId:"home:iris",generation:june.generation}));await wait("home-layout");events.length=0;
    const response=await save(initial,{...initial.decoration,windows}); assert.equal(response.status,200); saved=response.data.home;
    const broadcast=await wait("home-layout",e=>e.home.decoration.windows?.length===2);
    assert.deepEqual(broadcast.home.decoration.windows,windows);assert.equal(broadcast.home.ownedFinishes,undefined);
    assert.equal((await save(saved,{...saved.decoration,windows:[windows[0],windows[0]]})).status,400);
    assert.equal((await save(saved,{...saved.decoration,windows:[{...windows[0],x:0}]})).status,400);
    const {windows:_legacy,...legacy}=saved.decoration;
    saved=(await save(saved,legacy)).data.home; assert.deepEqual(saved.decoration.windows,windows,"Un ancien client ne supprime pas les fenêtres");
    const moved=await save(saved,{...saved.decoration,windows:[{...windows[0],x:420,y:320},windows[1]]});assert.equal(moved.status,200);saved=moved.data.home;
    assert.equal((await june.post("housing/finishes")).data.owned.includes("window:arch-ivory"),false);
    assert.equal((await call("state",iris.cookie)).data.wardrobe.balance,9250);
  } finally { ws?.terminate();await app.close();await db.close(); }
  db=await openDatabase(directory);app=await createApp(db);
  try {
    const iris=await enter("aurore","iris"), loaded=(await iris.post("housing/load",{ownerId:"iris"})).data.home;
    assert.deepEqual(loaded.decoration.windows,saved.decoration.windows);
    assert.equal((await call("state",iris.cookie)).data.wardrobe.balance,9250);
    const cleared=await iris.post("housing/save",{operationId:randomUUID(),expectedRevision:loaded.revision,decoration:{...loaded.decoration,windows:[]}});
    assert.equal(cleared.status,200);assert.equal(cleared.data.home.decoration.windows,undefined);
  } finally {await app.close();await db.close();}
});
