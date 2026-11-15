import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FriendsPanel } from "../apps/web/src/FriendsPanel";
import { friendsFor, vitrineGrid } from "../apps/web/src/friends-list";
import { demoFriends, demoOnlineIds } from "./fixtures/friends-demo";

const names = (list: { name: string }[]) => list.map((c) => c.name);

test("friends are listed online first, then unread messages, then by name, without blocked players", () => {
  assert.deepEqual(names(friendsFor(demoFriends, demoOnlineIds, "all")),
    ["Lila", "Inès", "Maëlys", "Sasha", "Camille-Alexandrine", "Jade", "Nora", "Zoé"]);
  assert.deepEqual(names(friendsFor(demoFriends, demoOnlineIds, "online")), ["Lila", "Inès", "Maëlys"]);
  assert.deepEqual(names(friendsFor(demoFriends, demoOnlineIds, "requests")), ["Emma", "Rose"]);
  assert.deepEqual(names(friendsFor(demoFriends, demoOnlineIds, "all", "  MAË ")), ["Maëlys"]);
  assert.deepEqual(names(friendsFor(demoFriends, demoOnlineIds, "requests", "lila")), []);
});

test("the vitrine fits its page to the space: more columns when wide, a second row only when tall", () => {
  assert.deepEqual(vitrineGrid(1080, 560), { columns: 6, rows: 1, pageSize: 6 });
  assert.deepEqual(vitrineGrid(1500, 760), { columns: 7, rows: 2, pageSize: 14 });
  assert.deepEqual(vitrineGrid(360, 520), { columns: 2, rows: 2, pageSize: 4 });
  assert.deepEqual(vitrineGrid(300, 200), { columns: 2, rows: 1, pageSize: 2 });
  // Requests keep both answer buttons on one line, or stacked under two dolls on a phone.
  assert.deepEqual(vitrineGrid(1080, 560, true), { columns: 5, rows: 1, pageSize: 5 });
  assert.deepEqual(vitrineGrid(360, 520, true), { columns: 2, rows: 1, pageSize: 2 });
});

test("the page shows counts, unread messages and the requests banner", () => {
  const html = renderToStaticMarkup(React.createElement(FriendsPanel, {
    contacts: demoFriends,
    onlineIds: demoOnlineIds,
    onProfile: () => {},
    onRespond: async () => {},
    onMessage: () => {},
    onGuestbook: () => {},
    onClose: () => {},
  }));
  assert.match(html, /Tous <em>8<\/em>/);
  assert.match(html, /En ligne <em>3<\/em>/);
  assert.match(html, /aria-label="2 en attente"/);
  assert.match(html, /2 demandes d’amitié/);
  assert.match(html, /aria-label="Écrire à Lila"/);
  assert.match(html, /aria-label="2 non lus"/);
  assert.doesNotMatch(html, /Bloquée/);
});

test("an empty list invites the player to the quartier", () => {
  const html = renderToStaticMarkup(React.createElement(FriendsPanel, {
    contacts: [],
    onlineIds: [],
    onProfile: () => {},
    onRespond: async () => {},
    onMessage: () => {},
    onGuestbook: () => {},
    onClose: () => {},
  }));
  assert.match(html, /Ta liste d’amis est vide/);
  assert.match(html, /Aller au quartier/);
  assert.doesNotMatch(html, /friends-pager/);
});
