import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { openDatabase } from "../apps/server/src/db";
import { createApp } from "../apps/server/src/app";
import { FINISH_OFFER_VERSION } from "../packages/domain/src/home-finishes";
import { HomeBackground } from "../apps/web/src/housing/HomeScene";

test("Les fenêtres sont retirées du catalogue et du décor ; anciens achats et placements restent conservés", async () => {
  const db = await openDatabase("memory://"), app = await createApp(db);
  async function call(path: string, cookie?: string, body?: object) {
    const r = await app.inject({ method: body ? "POST" : "GET", url: `/api/${path}`, payload: body,
      headers: { origin: "http://127.0.0.1:5173", ...(cookie ? {cookie} : {}) } });
    return { status: r.statusCode, data: r.json(), cookie: r.headers["set-cookie"]?.toString().split(";")[0] };
  }
  try {
    const login = await call("login",undefined,{account:"aurore"}), active=await call("activate",login.cookie,{character:"iris"});
    const post=(path:string,body:object={})=>call(`housing/${path}`,login.cookie,{generation:active.data.generation,...body});
    let home=(await post("load",{ownerId:"iris"})).data.home;
    const windows=[{id:randomUUID(),modelId:"arch-ivory",x:350,y:320}];
    const operationId=randomUUID();
    await db.query("UPDATE home_rooms SET windows=$1::jsonb WHERE id=$2",[JSON.stringify(windows),home.roomId]);
    await db.query("INSERT INTO home_finish_items(character_id,finish_id) VALUES ('iris','window:arch-ivory')");
    await db.query("INSERT INTO home_finish_purchases(paid_by,operation_id,character_id,finish_id,offer_version,price) VALUES ('aurore',$1,'iris','window:arch-ivory',$2,750)",[operationId,FINISH_OFFER_VERSION]);
    const catalog=(await post("finishes")).data;
    assert.ok(catalog.offers.every((o:any)=>o.kind!=="window"));
    assert.ok(catalog.offers.some((o:any)=>o.id==="wall:roses-blush"),"Les papiers peints restent en vente");
    assert.ok(catalog.owned.includes("window:arch-ivory"));assert.equal(catalog.balance,9250);
    assert.equal((await post("finishes/buy",{operationId:randomUUID(),finishId:"window:loft-black",offerVersion:FINISH_OFFER_VERSION,expectedPrice:800})).status,400);
    const replay=await post("finishes/buy",{operationId,finishId:"window:arch-ivory",offerVersion:FINISH_OFFER_VERSION,expectedPrice:750});
    assert.equal(replay.status,200);assert.equal(replay.data.charged,0);assert.equal(replay.data.balance,9250);
    home=(await post("load",{ownerId:"iris"})).data.home;assert.equal(home.decoration.windows,undefined);
    const saved=await post("save",{operationId:randomUUID(),expectedRevision:home.revision,decoration:{...home.decoration,wall:"rose",windows:[]}});
    assert.equal(saved.status,200);assert.equal(saved.data.home.decoration.windows,undefined);
    assert.deepEqual((await db.query("SELECT windows FROM home_rooms WHERE id=$1",[home.roomId])).rows[0].windows,windows);
    assert.equal((await db.query("SELECT COUNT(*)::integer AS count FROM home_finish_purchases")).rows[0].count,1);
  } finally {await app.close();await db.close();}
});

test("Le rendu conserve la fenêtre d'origine sans dessiner les anciens placements supplémentaires", () => {
  const html=renderToStaticMarkup(React.createElement("svg",null,React.createElement(HomeBackground,{wall:"ivory",floor:"oak",...{windows:[{id:randomUUID(),modelId:"arch-ivory",x:500,y:300}]}})));
  assert.ok(html.includes("room-empty.webp"));assert.ok(!html.includes("-opening"));
});
