import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Contact } from "../packages/contracts/src/index";
import { listTime, PrivateChat, sortConversations } from "../apps/web/src/PrivateChat";

const person = (id: string, extra: Partial<Contact> = {}): Contact => ({
  id, name: id[0].toUpperCase() + id.slice(1), color: "#c97fc9", unread: 0, blocked: false, ...extra,
} as Contact);
const at = (iso: string) => new Date(iso).getTime();

test("conversations are ordered like on a phone: the latest message first, then everyone else", () => {
  const contacts = [
    person("alma", { lastMessage: { body: "Salut", at: at("2026-11-15T10:00:00"), mine: true } }),
    person("zoe", { friend: true }),
    person("milo"),
    person("june", { unread: 2, lastMessage: { body: "Tu viens ?", at: at("2026-11-16T20:00:00"), mine: false } }),
    person("noa", { blocked: true }),
    person("lune", { friend: true }),
  ];
  const { recent, others } = sortConversations(contacts, ["milo", "zoe"]);
  assert.deepEqual(recent.map((c) => c.id), ["june", "alma"]);
  // Friends first, then who is online, then by name; a blocked player without messages is hidden.
  assert.deepEqual(others.map((c) => c.id), ["zoe", "lune", "milo"]);
});

test("the list shows the hour today, then « Hier », the weekday and the date", () => {
  const now = at("2026-11-16T21:00:00");
  assert.equal(listTime(at("2026-11-16T08:05:00"), now), "08:05");
  assert.equal(listTime(at("2026-11-15T23:59:00"), now), "Hier");
  assert.equal(listTime(at("2026-11-12T12:00:00"), now), "jeudi");
  assert.match(listTime(at("2026-10-02T12:00:00"), now), /^2 oct/);
});

test("a conversation shows big bubbles, day separators, the emoji button and the unread badge", () => {
  const june = person("june", { unread: 1, lastMessage: { body: "Coucou 🌸", at: Date.now(), mine: false } });
  const html = renderToStaticMarkup(React.createElement(PrivateChat, {
    contacts: [june, person("milo")], onlineIds: ["june"], me: "iris", peer: "june", loading: false,
    messages: [
      { id: 1, sender: "june", recipient: "iris", body: "Coucou 🌸", created_at: new Date().toISOString() },
      { id: 2, sender: "iris", recipient: "june", body: "Hello !", created_at: new Date().toISOString() },
    ],
    draft: "", busy: false, scroller: { current: null },
    onDraft() {}, onSend() {}, onChoose() {}, onBack() {}, onClose() {}, onProfile() {}, onReport() {},
    onToggleBlock() {}, onScroll() {},
  }));
  assert.match(html, /Aujourd’hui/);
  assert.match(html, /class="pm-bubble" data-incoming-id="1"/);
  assert.match(html, /class="pm-bubble is-mine"/);
  assert.match(html, /aria-label="Ajouter un emoji"/);
  assert.match(html, /aria-label="1 message non lu"/);
  assert.match(html, /placeholder="Écrire à June…"/);
  assert.doesNotMatch(html, /sans son/);
});

test("while a conversation loads, the « petit bonjour » invitation does not flash", () => {
  const props = {
    contacts: [person("june")], onlineIds: [], me: "iris", peer: "june", messages: [],
    draft: "", busy: false, scroller: { current: null },
    onDraft() {}, onSend() {}, onChoose() {}, onBack() {}, onClose() {}, onProfile() {}, onReport() {},
    onToggleBlock() {}, onScroll() {},
  };
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(PrivateChat, { ...props, loading: true })), /petit bonjour/);
  assert.match(renderToStaticMarkup(React.createElement(PrivateChat, { ...props, loading: false })), /petit bonjour/);
});
