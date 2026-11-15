import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Guestbook, noteDate, notesPerPage } from "../apps/web/src/Guestbook";
import type { Character, ProfileSocial } from "../packages/contracts/src/index";

const june = { id: "june", account_id: "sacha", name: "June", color: "#db9574", hair: "", slot: 1, xp: 0 } as Character;
const book = (props: Partial<React.ComponentProps<typeof Guestbook>>) => renderToStaticMarkup(
  React.createElement(Guestbook, {
    character: june,
    canWrite: true,
    load: () => new Promise<ProfileSocial>(() => {}),
    post: async () => ({}) as ProfileSocial,
    onWearGift: () => {},
    onBack: () => {},
    ...props,
  }),
);

test("notes say when they were written, in French", () => {
  const now = Date.parse("2026-11-15T12:00:00Z");
  const ago = (minutes: number) => new Date(now - minutes * 60_000).toISOString();
  assert.equal(noteDate(ago(0), now), "à l’instant");
  assert.equal(noteDate(ago(5), now), "il y a 5 min");
  assert.equal(noteDate(ago(150), now), "il y a 2 h");
  assert.equal(noteDate(ago(26 * 60), now), "hier");
  assert.equal(noteDate(ago(3 * 24 * 60), now), "il y a 3 j");
  assert.match(noteDate(ago(20 * 24 * 60), now), /oct\./);
  assert.equal(noteDate(null, now), "", "older notes have no date");
});

test("the right page holds as many notes as its height allows, at least two", () => {
  assert.equal(notesPerPage(360), 4);
  assert.equal(notesPerPage(120), 2);
  assert.equal(notesPerPage(520), 6);
});

test("a visitor writes on the right page; the owner also sees received gifts", () => {
  const visitor = book({ viewerId: "iris", onOpenProfile: () => {} });
  assert.match(visitor, /placeholder="Écrire un petit mot sur le profil de June…"/);
  assert.match(visitor, /Livre d’or de June/);
  assert.doesNotMatch(visitor, /Cadeaux/);
  assert.match(visitor, /Profil/);
  const owner = book({ viewerId: "june", canWrite: false });
  assert.doesNotMatch(owner, /Écrire un petit mot/);
  assert.match(owner, /Les mots laissés par les autres joueurs/);
  assert.match(owner, /Cadeaux/);
});
