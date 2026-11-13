import { readFile, mkdir, copyFile } from "node:fs/promises";
import { resolve } from "node:path";
import { constants } from "node:fs";
import { AtelierStore } from "../apps/server/src/atelier-store";
const id = "083b872c-8a0c-497b-addb-51b04821a9ab";
const target = resolve(".data/atelier", id);
const backup = resolve("docs/atelier/spider-tee-v2/before");
const store = new AtelierStore(
  resolve(".data/atelier"),
  await readFile("public/assets/avatar/fashion-v2/body-user.png"),
);
const old = await store.get("aurore", id);
if (old.trashedAt || old.revision !== 5)
  throw new Error("Le brouillon a changé : vérifier avant installation.");
await mkdir(backup, { recursive: true });
for (const file of [
  "draft.json",
  "source.bin",
  "prepared-original.png",
  "front.png",
  "mask1.png",
  "mask2.png",
])
  await copyFile(resolve(target, file), resolve(backup, file), constants.COPYFILE_EXCL);
await store.update("aurore", id, old.revision, {
  ...old,
  placement: { x: 0, y: 0, scaleX: 1, scaleY: 1 },
  checks: [],
  mainColor: "#b52d37",
  detailColor: "#232125",
  hasDetail: true,
  detailLabel: "Tissu noir et motif",
});
const data = async (file: string) =>
  "data:image/png;base64," +
  (
    await readFile(`public/assets/avatar/imports/spider-tee-v2/${file}.png`)
  ).toString("base64");
await store.uploadPrepared("aurore", id, await data("front"), true);
await store.masks("aurore", id, await data("mask1"), await data("mask2"));
console.log({
  id,
  revision: (await store.get("aurore", id)).revision,
  report: await store.inspect("aurore", id),
});
