import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { createApp } from "../apps/server/src/app.ts";
import { openDatabase } from "../apps/server/src/db.ts";
import { puzzleCatalog } from "../apps/server/src/puzzle-catalog.ts";
import {
  PUZZLE_LEVELS, puzzleFits, puzzleGeometry, puzzleGrid, puzzleOrder, puzzlePhotoUrl, puzzleSlot,
  type PuzzleConfig, type PuzzleLevel, type PuzzleRound,
} from "../packages/domain/src/puzzle.ts";

const levels = Object.keys(PUZZLE_LEVELS) as PuzzleLevel[];

test("Les photos du catalogue sont présentes et compatibles avec les trois grilles", async () => {
  assert.equal(new Set(puzzleCatalog.map(({ id }) => id)).size, puzzleCatalog.length);
  assert.ok(puzzleCatalog.some(({ active }) => active));
  for (const photo of puzzleCatalog) {
    const bytes = await readFile(new URL(`../public${puzzlePhotoUrl(photo)}`, import.meta.url));
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
    assert.ok(photo.width > 0 && photo.height > 0);
    for (const level of levels) {
      const config = { photo, level, seed: 21903 };
      assert.equal(puzzleGeometry(config).pieces.length, PUZZLE_LEVELS[level].count);
      assert.deepEqual(puzzleOrder(config).sort((a, b) => a - b),
        Array.from({ length: PUZZLE_LEVELS[level].count }, (_, i) => i));
    }
  }
});

test("Les contours s’emboîtent sur une photo verticale, horizontale et carrée", () => {
  for (const [width, height] of [[600, 900], [1000, 650], [750, 750]]) {
    for (const level of levels) {
      const config: PuzzleConfig = { photo: { id: "test", name: "Test", width, height }, level, seed: 10487 };
      const { columns, rows } = puzzleGrid(config);
      assert.equal(columns * rows, PUZZLE_LEVELS[level].count);
      assert.equal(columns > rows, width >= height);
      const geometry = puzzleGeometry(config);
      assert.equal(geometry.width * columns, width);
      assert.equal(geometry.height * rows, height);
      assert.deepEqual(geometry, puzzleGeometry(config));
      assert.notDeepEqual(puzzleOrder(config), puzzleOrder({ ...config, seed: 87104 }));
      for (const piece of geometry.pieces) {
        const [top, right, bottom, left] = piece.sides;
        const column = piece.slot % columns, row = Math.floor(piece.slot / columns);
        assert.equal(top === undefined, row === 0);
        assert.equal(left === undefined, column === 0);
        assert.equal(right === undefined, column === columns - 1);
        assert.equal(bottom === undefined, row === rows - 1);
        if (right) assert.deepEqual(right, geometry.pieces[piece.slot + 1].sides[3]!
          .slice().reverse().map((curve) => curve.slice().reverse()));
        if (bottom) assert.deepEqual(bottom, geometry.pieces[piece.slot + columns].sides[0]!
          .slice().reverse().map((curve) => curve.slice().reverse()));
        assert.ok(puzzleFits(config, piece.slot, puzzleSlot(config, piece.slot)));
        assert.ok(!puzzleFits(config, piece.slot, puzzleSlot(config, (piece.slot + 1) % geometry.pieces.length)));
      }
    }
  }
});

test("L’API sauvegarde, isole et crédite chaque partie une seule fois dans la roue existante", async () => {
  const db = await openDatabase("memory://");
  const app = await createApp(db);
  const send = async (path: string, cookie?: string, body?: object) => {
    const response = await app.inject({
      method: body ? "POST" : "GET",
      url: `/api/${path}`,
      headers: { origin: "http://127.0.0.1:5173", ...(cookie ? { cookie } : {}) },
      payload: body,
    });
    return { status: response.statusCode, data: response.json(), cookie: response.cookies[0]?.value };
  };
  async function enter(account: string, character: string) {
    const auth = await send("login", undefined, { account });
    assert.equal(auth.status, 200);
    const cookie = `session=${auth.cookie}`;
    const activation = await send("activate", cookie, { character });
    assert.equal(activation.status, 200);
    return {
      request: (action: string, body = {}) => send(`arcade/puzzle/${action}`, cookie,
        { generation: activation.data.generation, ...body }),
      tickets: async () => (await send("state", cookie)).data.rewardWheel.tickets as number,
      spin: () => send("wheel/spin", cookie, { generation: activation.data.generation, id: randomUUID() }),
    };
  }
  try {
    const iris = await enter("aurore", "iris");
    const june = await enter("sacha", "june");
    const base = await iris.tickets();
    const juneBase = await june.tickets();
    assert.equal((await send("arcade/puzzle/start", undefined, { generation: 1, level: "easy" })).status, 401);
    assert.equal((await iris.request("start", { level: "invalid" })).status, 400);
    assert.equal((await iris.request("start", { level: "easy", generation: -1 })).status, 400);
    assert.equal((await iris.request("resume")).data.round, null);
    let previousPhoto = "", balance = base, previousId = "";
    for (const level of [...levels, "hard"] as const) {
      const result = await iris.request("start", { level });
      assert.equal(result.status, 200);
      const round: PuzzleRound = result.data.round;
      assert.notEqual(round.id, previousId);
      assert.notEqual(round.config.photo.id, previousPhoto);
      previousPhoto = round.config.photo.id;
      previousId = round.id;
      const order = puzzleOrder(round.config);
      const { count, turns } = PUZZLE_LEVELS[level];
      assert.equal(new Set(round.tokens).size, count);
      const move = (index: number) => ({
        id: round.id, token: round.tokens[index], ...puzzleSlot(round.config, order[index]),
      });
      const first = move(0);
      assert.equal((await june.request("place", first)).status, 400);
      assert.equal((await iris.request("place", { ...first, token: randomUUID() })).status, 400);
      assert.equal((await iris.request("place", { ...first, ...puzzleSlot(round.config, order[1]) })).status, 400);
      assert.equal((await iris.request("place", { id: round.id, completed: true, count })).status, 400);
      assert.equal((await iris.request("place", first)).status, 200);
      assert.deepEqual((await iris.request("place", first)).data.round.placed, [order[0]]);
      assert.deepEqual((await iris.request("resume")).data.round.placed, [order[0]]);
      for (let index = 1; index < count - 1; index++) {
        const placed = await iris.request("place", move(index));
        assert.equal(placed.status, 200);
        assert.equal(placed.data.round.reward, 0);
      }
      assert.equal(await iris.tickets(), balance);
      const final = move(count - 1);
      balance += turns;
      for (const reply of await Promise.all([iris.request("place", final), iris.request("place", final)])) {
        assert.equal(reply.status, 200);
        assert.equal(reply.data.round.placed.length, count);
        assert.equal(reply.data.round.reward, turns);
        assert.equal(reply.data.wheel.tickets, balance);
      }
      const resumed = await iris.request("resume");
      assert.equal(resumed.data.round.reward, turns);
      assert.equal(resumed.data.wheel.tickets, balance);
      assert.equal(await iris.tickets(), balance);
      await iris.request("close", { id: round.id });
      assert.equal((await iris.request("resume")).data.round, null);
      assert.equal((await iris.request("place", final)).data.wheel.tickets, balance);
    }
    assert.equal(await june.tickets(), juneBase);
    const spin = await iris.spin();
    assert.equal(spin.status, 200);
    assert.equal(spin.data.wheel.tickets, balance - 1);
    const { data: { round } } = await iris.request("start", { level: "easy" });
    await iris.request("close", { id: round.id });
    assert.equal((await iris.request("place", {
      id: round.id, token: round.tokens[0], ...puzzleSlot(round.config, puzzleOrder(round.config)[0]),
    })).status, 400);
    assert.equal(await iris.tickets(), balance - 1);
  } finally {
    await app.close();
    await db.close();
  }
});
