import React, { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowLeft,
  ArrowRight,
  CircleDot,
  Check,
  DoorOpen,
  Flag,
  Flower2,
  Gamepad2,
  Info,
  LogOut,
  MessageCircle,
  MousePointer2,
  Map,
  Pencil,
  Send,
  Shield,
  Shirt,
  ShoppingBag,
  Sparkles,
  Star,
  Trophy,
  Users,
  X,
} from "lucide-react";
import { Room } from "./Room";
import { WalletCounter } from "./WalletCounter";
import { RoomChat, type RoomChatReceipt } from "./RoomChat";
import { RoomDrawer } from "./RoomDrawer";
import { Portrait } from "./Avatar";
import { NeighborhoodMap } from "./NeighborhoodMap";
import { BeautySalon } from "./BeautySalon";
import { roomScene } from "./chat-rooms";
import { BackgroundPicker } from "./BackgroundPicker";
import { ProfileCard, type ProfileAction } from "./ProfileCard";
import { Guestbook } from "./Guestbook";
import { FriendsPanel } from "./FriendsPanel";
import { WorldPanel } from "./WorldPanel";
import { TodayPanel } from "./TodayPanel";
import { ProfileWardrobe } from "./ProfileWardrobe";
import { ServerRanking } from "./ServerRanking";
import { Arcade, PrizeWheel } from "./Arcade";
import { FloatingRewards, walletPickups, type Collectible } from "./FloatingRewards";
import { splitReward } from "../../../packages/domain/src/arcade";
import { MottoEditor } from "./MottoEditor";
import { Shop } from "./shop/Shop";
import { DEFAULT_LAYERS, type AvatarLayers } from "./avatar/model";
import { outfitOwner, readAvatarLayers, shareOutfit, snapshotOutfit } from "./avatar/worn-outfits";
import { COMMERCE_KEY, readCommerce, equipPurchasedItem, type PurchasedItem } from "./shop/commerce";
import { avatarCatalogSnapshot } from "./avatar/catalog";
import {archivedPieces,subscribeArchive,withoutArchivedPieces} from './avatar/archive';
import {
  DEFAULT_ROOM,
  homeRoom,
  homeOwner,
  levelProgress,
  type ProfileTemplate,
  type GarmentTransfer,
  type Character,
  type Contact,
  type Message,
  type Presence,
  type RoomId,
  type RoomMessage,
  type RankingEntry,
  type XpMagazine,
  type XpRewardSource,
  type RewardWheel,
  type ScratchTicket,
} from "../../../packages/contracts/src/index";
import { PlayerWelcome } from "./PlayerWelcome";
import { createAuthClient } from "@neon/auth";
import { isCreatedPlayer, type StarterOutfit } from "../../../packages/contracts/src/player-account";
import "./style.css";
import "./world.css";
import "./game-shell.css";
import "./map-markers.css";
import "./profile.css";
import "./quartier.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/outfit/400.css";
import "@fontsource/outfit/500.css";
type State = {
  account: string;
  characters: Character[];
  character: Character | null;
  generation: number;
  contacts: Contact[];
  garmentTransfers?: GarmentTransfer[];
  homeGifts?: number[] | null;
  xpMagazine?: XpMagazine;
  rewardWheel?: RewardWheel;
  /** Owned garments and balance, computed by the server. */
  wardrobe?: Wardrobe;
  uiCapabilities?: { customBackground?: boolean; customGarmentColors?: boolean; customProfileImage?: boolean };
};
type Wardrobe = { items: PurchasedItem[]; balance: number; diamonds: number };
const EMPTY_WARDROBE: Wardrobe = { items: [], balance: 0, diamonds: 0 };
const createPlayerAuth = (url: string) => createAuthClient(url);
async function api(path: string, body?: unknown, token?: string) {
  const r = await fetch("/api/" + path, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await r.json().catch(() => {
    throw new Error(
      "Le serveur démarre ou est indisponible. Réessaie dans un instant.",
    );
  });
  if (!r.ok) throw new Error(data.error ?? "Le serveur ne répond pas.");
  return data;
}
const checkPlayerName = async (name: string) => (await api("player-name?" + new URLSearchParams({ name }))).available === true;
const loadScratchTicket = (): Promise<{ ticket: ScratchTicket | null }> => api("arcade/scratch");
function App() {
  const [state, setState] = useState<State | null>(null),
    [ready, setReady] = useState(false);
  const [multiplayer, setMultiplayer] = useState(false);
  const [demoAccounts, setDemoAccounts] = useState(false);
  const [auth, setAuth] = useState<ReturnType<typeof createPlayerAuth>>();
  const [needsCharacter, setNeedsCharacter] = useState(false);
  async function neonGameSession(client: NonNullable<typeof auth>, setup: object | null = null) {
    const { data, error } = await client.getSession({
      query: { disableCookieCache: true },
      // Neon Auth consumes this header locally to bypass the SDK's session cache.
      fetchOptions: { headers: { "X-Force-Fetch": "true" } },
    });
    if (error) throw new Error("Impossible de récupérer ta session Neon. Réessaie dans un instant.");
    if (!data?.session?.token) throw new Error("Aucune session Neon ouverte. Vérifie ton adresse e-mail si Neon t’a envoyé un lien, puis reconnecte-toi.");
    return api("neon-session", setup, data.session.token);
  }
  const [presence, setPresence] = useState<{
    roomId: RoomId;
    players: Presence[];
    counts: Partial<Record<RoomId, number>>;
    onlineIds: string[];
  } | null>(null);
  const [roomId, setRoomId] = useState<RoomId>(DEFAULT_ROOM);
  const [roomChat, setRoomChat] = useState<{ roomId: RoomId; messages: RoomMessage[] } | null>(null);
  const [roomReceipt, setRoomReceipt] = useState<RoomChatReceipt | null>(null);
  const requestedRoom = useRef<RoomId | null>(null);
  const knownCharacters = [...(state?.characters ?? []), ...(state?.contacts ?? [])];
  const scene = roomScene(roomId, knownCharacters);
  const players = presence?.players ?? [];
  const [status, setStatus] = useState("offline"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const [peer, setPeer] = useState<string | null>(null),
    [messages, setMessages] = useState<Message[]>([]),
    [draft, setDraft] = useState("");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [editingMotto, setEditingMotto] = useState(false);
  const [profileRevision, setProfileRevision] = useState(0);
  const [guestbookId, setGuestbookId] = useState<string | null>(null);
  const [panel, setPanel] = useState<"chat" | "people" | "help">("people");
  const [report, setReport] = useState(false),
    [reason, setReason] = useState("");
  const [theme, setTheme] = useState(
    () => localStorage.getItem("interface-theme") ?? "lavender",
  );
  const [view, setView] = useState<"explore" | "garden" | "shop" | "dressing" | "salon" | "arcade" | "ranking" | "friends">("explore");
  const [worldPanel, setWorldPanel] = useState<"magazine" | "quests" | null>(null);
  const [magazineMenu, setMagazineMenu] = useState(false);
  const magazineNav = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!magazineMenu) return;
    const closeOutside = (event: PointerEvent) => {
      if (!magazineNav.current?.contains(event.target as Node)) setMagazineMenu(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMagazineMenu(false);
        magazineNav.current?.querySelector("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [magazineMenu]);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [coinBurst, setCoinBurst] = useState<{ id: string; x: number; y: number }>();
  const [ranking, setRanking] = useState<RankingEntry[] | null>(null);
  const [rankingStatus, setRankingStatus] = useState("");
  const [claimingXp, setClaimingXp] = useState(false);
  const xpClaim = useRef<Promise<void> | null>(null);
  const walletClaims = useRef(Promise.resolve());
  const pendingXpClaims = useRef(0);
  const [xpBatch, setXpBatch] = useState<{ owner: string; pickups: { id: string; points: number }[] }>();
  const [featureStatus, setFeatureStatus] = useState("");
  const [socialOpen, setSocialOpen] = useState(false);
  const privateChatOpen = socialOpen && panel === "chat";
  const [chatPage, setChatPage] = useState(0);
  const wornOwner = outfitOwner(state?.account ?? 'local', state?.character?.id ?? 'iris');
  const savedOutfit = readAvatarLayers(state?.character?.outfit);
  const starterOutfit = readAvatarLayers(state?.character?.starter_outfit) ?? DEFAULT_LAYERS;
  const characterId = state?.character?.id;
  const archived=useSyncExternalStore(subscribeArchive,archivedPieces,()=>[]);
  // The server owns the worn outfit, the purchases and the balance.
  const wornLayers = withoutArchivedPieces(savedOutfit ?? DEFAULT_LAYERS, archived);
  const activeId = state?.character?.id;
  const ownLayers = (id: string | undefined) => id === activeId ? wornLayers : undefined;
  const wardrobe = state?.wardrobe ?? EMPTY_WARDROBE;
  function applyWardrobe(result: { outfit?: unknown; wardrobe?: Wardrobe }, characterId = activeId) {
    setState((current) => current?.character && current.character.id === characterId ? {
      ...current,
      ...(result.wardrobe && { wardrobe: result.wardrobe }),
      character: "outfit" in result
        ? { ...current.character, outfit: result.outfit as Character["outfit"] } : current.character,
    } : current);
  }
  const outfitGeneration = state?.generation;
  // One-time move of purchases made while the wardrobe lived in this browser.
  // The server charges each piece again from the coins it knows, so nothing is created.
  useEffect(() => {
    if (!activeId || outfitGeneration === undefined || status !== "online") return;
    const doneKey = "fashion-commerce-imported:" + wornOwner;
    let local;
    try {
      if (localStorage.getItem(doneKey)) return;
      local = readCommerce(localStorage.getItem(COMMERCE_KEY)).wardrobes[wornOwner];
    } catch { return; }
    if (!local) return;
    const items = local.items.filter((item) => item.purchasedAt > 0);
    const equipped = local.equipped;
    void (async () => {
      try {
        if (items.length) {
          const result = await api("shop/import", { generation: outfitGeneration, items });
          applyWardrobe(result, activeId);
          if (result.imported) setNotice(`${result.imported} article(s) de ta garde-robe ont été enregistrés sur ton compte.`);
        }
        if (equipped) {
          const saved = await api("profile/outfit", { generation: outfitGeneration, outfit: shareOutfit(equipped) }).catch(() => null);
          if (saved) applyWardrobe({ outfit: saved.outfit }, activeId);
        }
        try { localStorage.setItem(doneKey, "1"); } catch { /* retried next time */ }
      } catch { /* retried at the next connection */ }
    })();
  }, [activeId, outfitGeneration, status, wornOwner]);
  async function purchaseShopOutfit(layers: AvatarLayers, onlyPieceId?: string): Promise<string | null> {
    try {
      const result = await api("shop/buy", {
        generation: state?.generation,
        draft: shareOutfit(withoutArchivedPieces(layers, archived)),
        onlyPieceId,
      });
      applyWardrobe(result);
      if (!result.added) setNotice("Ta tenue est maintenant portée par ton personnage.");
      return null;
    } catch (e) { return (e as Error).message; }
  }
  function saveEquippedOutfit(layers: AvatarLayers) {
    const outfit = shareOutfit(snapshotOutfit(withoutArchivedPieces(layers, archived)));
    const previous = state?.character?.outfit;
    const characterId = activeId;
    applyWardrobe({ outfit }, characterId);
    void api("profile/outfit", { generation: state?.generation, outfit })
      .then((saved) => applyWardrobe({ outfit: saved.outfit }, characterId))
      .catch((e: Error) => {
        applyWardrobe({ outfit: previous }, characterId);
        setError(e.message);
      });
  }
  function wearGift(item: GarmentTransfer["item"]) {
    if (archived.includes(item.pieceId) || !avatarCatalogSnapshot().some((piece) => piece.id === item.pieceId)) return;
    saveEquippedOutfit(equipPurchasedItem(wornLayers, item));
  }
  const [vipBackground, setVipBackground] = useState(
    () => localStorage.getItem("vip-background") ?? "",
  );
  const canCustomizeBackground =
    state?.uiCapabilities?.customBackground === true;
  const profile = state?.character?.id === profileId
    ? state?.character
    : state?.contacts.find((character) => character.id === profileId)
      ?? players.find((character) => character.id === profileId);
  const ownProfile = profile?.id === state?.character?.id;
  const guestbookCharacter = knownCharacters.find((character) => character.id === guestbookId);
  const guestbook = guestbookCharacter?.id === activeId && guestbookCharacter
    ? { ...guestbookCharacter, outfit: wornLayers }
    : guestbookCharacter;
  const xp = state?.character?.xp ?? 0;
  const { level, earned: xpInLevel, required: xpRequired } = levelProgress(xp);
  const xpRemaining = xpRequired - xpInLevel;
  const pendingXp = state?.xpMagazine?.rewards.reduce((total, reward) => total + reward.points, 0) ?? 0;
  const xpOwner = state?.character ? `${state.generation}:${state.character.id}` : "";
  useEffect(() => {
    if (pendingXpClaims.current) return;
    setXpBatch((current) => {
      if (current?.owner === xpOwner && current.pickups.reduce((sum, pickup) => sum + pickup.points, 0) === pendingXp)
        return current;
      return {
        owner: xpOwner,
        pickups: splitReward(pendingXp).map((points) => ({ id: crypto.randomUUID(), points })),
      };
    });
  }, [xpOwner, pendingXp, xpBatch]);
  const rewards: Collectible[] = [
    ...(pendingXp && xpBatch?.owner === xpOwner ? xpBatch.pickups.map((pickup) => ({
      ...pickup, currency: "xp" as const, amount: pickup.points * (state?.xpMagazine?.multiplier ?? 1),
    })) : []),
    ...walletPickups(state?.rewardWheel?.pending ?? []),
  ];
  const friends = state?.contacts.filter((character) => character.friend) ?? [];
  const incomingRequests = state?.contacts.filter((contact) => (contact.profileRequests ?? 0) > 0) ?? [];
  const requestCount = incomingRequests.filter(contact => contact.friendRequest).length;
  function openMagazine() {
    setMagazineMenu(false);
    setWorldPanel("magazine");
    setFeatureStatus("");
    setSocialOpen(false);
  }
  function openDressing() {
    setGuestbookId(null);
    setSocialOpen(false);
    setView("dressing");
  }
  function openRanking() {
    setGuestbookId(null);
    setSocialOpen(false);
    setView("ranking");
    setRanking(null);
    setRankingStatus("");
    void api("ranking").then((data) => setRanking(data.entries))
      .catch((error: Error) => setRankingStatus(error.message));
  }
  function claimXp(source?: XpRewardSource) {
    if (xpClaim.current) return xpClaim.current;
    if (!state?.character) return Promise.resolve();
    const generation = state.generation;
    setClaimingXp(true);
    setFeatureStatus("");
    const task = walletClaims.current.then(() => api("xp/claim", { generation, source })).then(({ claimed, xp, magazine, wheel }) => {
      setState((current) => current?.generation === generation && current.character
        ? { ...current, character: { ...current.character, xp }, xpMagazine: magazine, rewardWheel: wheel }
        : current);
      setFeatureStatus(claimed ? `+${claimed} XP ajoutés à ton niveau.`
        : source ? "Cette rubrique est à jour." : "Ton magazine est à jour.");
    }).catch((error: Error) => {
      setFeatureStatus((error as Error).message);
      throw error;
    }).finally(() => {
      xpClaim.current = null;
      setClaimingXp(false);
    });
    xpClaim.current = task;
    walletClaims.current = task.catch(() => {});
    return task;
  }
  function updateWheel(generation: number, rewardWheel: RewardWheel) {
    setState((current) => current?.generation === generation && current.character
      ? { ...current, rewardWheel } : current);
  }
  async function startArcade(game: "memory" | "mole" = "memory") {
    if (!state?.character) throw new Error("Connecte-toi pour jouer.");
    return api("arcade/start", { generation: state.generation, game });
  }
  async function scratchTicket() {
    if (!state?.character) throw new Error("Connecte-toi pour jouer.");
    return api("arcade/scratch", { generation: state.generation });
  }
  async function claimScratchTicket(id: string) {
    if (!state?.character) throw new Error("Connecte-toi pour réclamer ton prix.");
    const generation = state.generation;
    const { xp, wheel } = await api("arcade/scratch/claim", { generation, id });
    setState((current) => current?.generation === generation && current.character
      ? { ...current, character: { ...current.character, xp }, rewardWheel: wheel }
      : current);
  }
  async function finishArcade(id: string, moves: number[]) {
    if (!state?.character) throw new Error("Connecte-toi pour jouer.");
    const generation = state.generation;
    const { wheel } = await api("arcade/finish", { generation, id, moves });
    updateWheel(generation, wheel);
  }
  async function spinWheel(id: string) {
    if (!state?.character) throw new Error("Connecte-toi pour tourner la roue.");
    const generation = state.generation;
    const { wheel, index, prize } = await api("wheel/spin", { generation, id });
    return { index, prize, reveal: () => updateWheel(generation, wheel) };
  }
  async function collectReward(reward: Collectible) {
    if (!state?.character) throw new Error("Connecte-toi pour récolter ton gain.");
    const generation = state.generation;
    if ("points" in reward) pendingXpClaims.current++;
    const task = walletClaims.current.then(async () => {
      if ("points" in reward) {
        const { xp, magazine, wheel } = await api("xp/claim", {
          generation, pickup: { id: reward.id, points: reward.points },
        });
        setXpBatch((current) => current?.owner === xpOwner
          ? { ...current, pickups: current.pickups.filter(({ id }) => id !== reward.id) } : current);
        setState((current) => current?.generation === generation && current.character
          ? { ...current, character: { ...current.character, xp }, xpMagazine: magazine, rewardWheel: wheel } : current);
        return;
      }
      const { xp, wheel } = await api("wheel/collect", { generation, id: reward.id, ids: reward.ids });
      setState((current) => current?.generation === generation && current.character
        ? { ...current, character: { ...current.character, xp }, rewardWheel: wheel } : current);
    }).finally(() => {
      if ("points" in reward) pendingXpClaims.current--;
    });
    walletClaims.current = task.catch(() => {});
    return task;
  }
  const loadSocial = useCallback((id: string) => api("profile/social/" + encodeURIComponent(id)), []);
  async function updateSocial(id: string, action: ProfileAction) {
    const result = await api("profile/social", { generation: state?.generation, peer: id, action });
    if (action.type === "gift") await refresh();
    return result;
  }
  async function saveMotto(motto: string, template?: ProfileTemplate, profileImage?: string) {
    const characterId = state?.character?.id;
    const saved = await api("profile/motto", { generation: state?.generation, motto, template, profileImage });
    const changes = {
      motto: saved.motto,
      ...(saved.profile_template && { profile_template: saved.profile_template }),
      ...(saved.profile_image_version && { profile_image_version: saved.profile_image_version }),
    };
    setState((previous) => {
      if (!previous?.character || previous.character.id !== characterId) return previous;
      return {
        ...previous,
        character: { ...previous.character, ...changes },
        characters: previous.characters.map((item) =>
          item.id === characterId ? { ...item, ...changes } : item),
      };
    });
  }
  const socket = useRef<WebSocket | null>(null),
    current = useRef(state),
    selected = useRef(peer),
    conversationVersion = useRef(0),
    pending = useRef<{ peer: string; body: string; commandId: string } | null>(
      null,
    );
  const scroller = useRef<HTMLDivElement>(null),
    readAcknowledged = useRef("");
  const [focusTick, setFocusTick] = useState(0);
  current.current = state;
  selected.current = peer;
  const refresh = useCallback(async () => {
    const s = await api("state");
    setState(s);
    return s as State;
  }, []);
  useEffect(() => {
    Promise.all([api("health"), api("state").catch(() => null)])
      .then(async ([health, game]) => {
        setMultiplayer(health.multiplayer === true);
        setDemoAccounts(health.demoAccounts !== false);
        if (health.authUrl) {
          const client = createPlayerAuth(health.authUrl);
          // The SDK proxy is callable, so React needs an explicit state updater.
          setAuth(() => client);
          if (!game) {
            const { data } = await client.getSession();
            if (data?.user) {
              game = await neonGameSession(client).catch((error: unknown) => {
                if (error instanceof Error && error.message === "Termine la création de ton personnage.") {
                  setNeedsCharacter(true);
                } else {
                  setError(error instanceof Error ? error.message : "Impossible de rouvrir ta session.");
                }
                return null;
              });
            }
          }
        }
        setState(game);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  const accountId = state?.character?.id;
  useEffect(() => {
    if (!auth || !accountId?.startsWith("player-")) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) void neonGameSession(auth).catch(() => {});
    }, 4 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [auth, accountId]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("interface-theme", theme);
  }, [theme]);
  const loadConversation = useCallback(async () => {
    const p = selected.current,
      me = current.current?.character?.id;
    if (!p || !me) return;
    const version = ++conversationVersion.current;
    try {
      const data = await api("conversation/" + encodeURIComponent(p));
      if (
        version !== conversationVersion.current ||
        selected.current !== p ||
        current.current?.character?.id !== me
      )
        return;
      setMessages(data.messages);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    setMessages([]);
    setDraft("");
    pending.current = null;
    if (peer) void loadConversation();
  }, [peer, state?.character?.id, loadConversation]);
  useEffect(() => {
    if (
      !socialOpen ||
      panel !== "chat" ||
      !peer ||
      document.visibilityState !== "visible" ||
      !document.hasFocus()
    )
      return;
    if (!state?.contacts.find((c) => c.id === peer)?.unread) return;
    // A message is read only if its bubble is visible in the focused conversation.
    const timer = setTimeout(() => {
      const box = scroller.current?.getBoundingClientRect();
      if (!box) return;
      const visible = [
        ...scroller.current!.querySelectorAll<HTMLElement>(
          "[data-incoming-id]",
        ),
      ]
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.top < box.bottom && r.bottom > box.top;
        })
        .at(-1);
      const lastId = Number(visible?.dataset.incomingId);
      if (!lastId) return;
      const key = `${state.character?.id}:${peer}:${lastId}`;
      if (readAcknowledged.current === key) return;
      readAcknowledged.current = key;
      void api("read", { generation: state.generation, peer, lastId })
        .then(refresh)
        .catch((e) => {
          readAcknowledged.current = "";
          setError(e.message);
        });
    }, 200);
    return () => clearTimeout(timer);
  }, [messages, panel, peer, state, refresh, focusTick, socialOpen]);
  useEffect(() => {
    scroller.current?.scrollTo({
      top: scroller.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, privateChatOpen]);
  useEffect(() => {
    const focus = () => {
      setFocusTick((x) => x + 1);
      if (selected.current) void loadConversation();
    };
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", focus);
    return () => {
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", focus);
    };
  }, [loadConversation]);
  useEffect(() => {
    if (!state?.character) return;
    let stopped = false,
      timer: ReturnType<typeof setTimeout>;
    let ws: WebSocket;
    const connect = () => {
      setStatus("connecting");
      ws = new WebSocket(
        `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`,
      );
      socket.current = ws;
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "welcome") {
          setStatus("online");
          setError("");
          setState((s) => (s ? { ...s, contacts: data.contacts } : s));
          if (requestedRoom.current) {
            ws.send(JSON.stringify({
              type: "join-room",
              generation: data.generation,
              roomId: requestedRoom.current,
            }));
          }
        }
        if (data.type === "room") setPresence(data);
        if (data.type === "room-chat") setRoomChat(data);
        if (data.type === "room-chat-ack") setRoomReceipt(data);
        if (["room-full", "room-unavailable"].includes(data.type) && requestedRoom.current === data.roomId) {
          requestedRoom.current = null;
          setView("explore");
          setError(data.type === "room-full" ? "Cette salle est complète (15 personnes)." : "Cette maison est indisponible.");
        }
        if (data.type === "refresh") {
          setProfileRevision((revision) => revision + 1);
          void refresh().catch((e) => setError(e.message));
          if (selected.current) void loadConversation();
        }
        if (data.type === "inactive") {
          stopped = true;
          setState((s) => (s ? { ...s, character: null } : s));
          setPresence(null);
          setNotice(
            "Le personnage actif a changé. Tu peux en choisir un à nouveau.",
          );
        }
        if (data.type === "error") {
          setError(data.message);
          if (data.requiresLogin) {
            stopped = true;
            setState(null);
            setPeer(null);
          }
        }
      };
      ws.onclose = (event) => {
        setStatus("offline");
        setPresence(null);
        setRoomChat(null);
        if (!stopped && event.code !== 4001 && event.code !== 4000)
          timer = setTimeout(connect, 1800);
      };
      ws.onerror = () => setStatus("offline");
    };
    connect();
    return () => {
      stopped = true;
      clearTimeout(timer);
      ws?.close();
    };
  }, [state?.character?.id, state?.generation, refresh, loadConversation]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 6500);
    return () => clearTimeout(t);
  }, [notice]);
  async function action(fn: () => Promise<void>) {
    setError("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Impossible de terminer cette action. Réessaie.");
    } finally {
      setBusy(false);
    }
  }
  async function playAs(character: "iris" | "june") {
    await action(async () => {
      setEditingMotto(false);
      setProfileId(null);
      setGuestbookId(null);
      setPeer(null);
      const account = character === "iris" ? "aurore" : "sacha";
      if (state?.account !== account) await api("login", { account });
      setState(await api("activate", { character }));
      setNotice("");
    });
  }
  function enterPlayer(input: { name: string; email: string; password: string; outfit?: StarterOutfit }) {
    void action(async () => {
      const { name, email, password, outfit } = input;
      let next: State;
      if (auth) {
        if (outfit && !(await checkPlayerName(name))) throw new Error("Ce pseudo est déjà pris.");
        if (!needsCharacter) {
          const result = outfit ? await auth.signUp.email({ name, email, password, callbackURL: window.location.origin })
            : await auth.signIn.email({ email, password });
          if (result.error) throw new Error(outfit ? "Inscription impossible avec cette adresse e-mail." : "Adresse e-mail ou mot de passe incorrect.");
        }
        try {
          next = await neonGameSession(auth, outfit ? { name, outfit, privacy: true } : null);
        } catch (error) {
          if (error instanceof Error && (error.message.includes("création de ton personnage") ||
            (outfit && (await auth.getSession()).data?.user))) setNeedsCharacter(true);
          throw error;
        }
      } else {
        next = outfit ? await api("register", { name, password, outfit, privacy: true }) : await api("login", { name, password });
      }
      setNeedsCharacter(false);
      setPeer(null); setProfileId(null); setGuestbookId(null); setNotice("");
      requestedRoom.current = null;
      setRoomId(DEFAULT_ROOM);
      setView("explore");
      setSocialOpen(false);
      setState(next);
    });
  }
  function choosePeer(id: string) {
    if (id === state?.character?.id) return;
    setPeer(id);
    setPanel("chat");
    setSocialOpen(true);
  }
  function enterRoom(nextRoom: RoomId) {
    setGuestbookId(null);
    requestedRoom.current = nextRoom;
    setRoomId(nextRoom);
    setView("garden");
    setPanel("people");
    setSocialOpen(false);
    setError("");
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({
        type: "join-room",
        generation: state?.generation,
        roomId: nextRoom,
      }));
    }
  }
  function openMap() {
    if (homeOwner(roomId)) enterRoom(DEFAULT_ROOM);
    setGuestbookId(null);
    setView("explore");
    setSocialOpen(false);
  }
  function move(x: number, y: number) {
    if (presence?.roomId === roomId && socket.current?.readyState === 1)
      socket.current.send(
        JSON.stringify({ type: "move", generation: state?.generation, x, y }),
      );
  }
  const contact = state?.contacts.find((c) => c.id === peer),
    unread = state?.contacts.reduce((n, c) => n + c.unread, 0) ?? 0;
  const chatContacts = state?.contacts ?? [];
  const lastChatPage = Math.max(0, Math.ceil(chatContacts.length / 5) - 1);
  const currentChatPage = Math.min(chatPage, lastChatPage);
  const onlineContacts =
    state?.contacts.filter((c) => presence?.onlineIds.includes(c.id)) ?? [];
  const roomPeople = status === "online" && presence?.roomId === roomId ? players : [];
  const onlinePeople = status === "online" && presence
    ? [...players, ...onlineContacts.filter((person) => !players.some((player) => player.id === person.id))]
    : [];
  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || !peer || busy) return;
    await action(async () => {
      const previous = pending.current;
      const command =
        previous?.peer === peer && previous.body === draft.trim()
          ? previous
          : { peer, body: draft.trim(), commandId: crypto.randomUUID() };
      pending.current = command;
      await api("message", { ...command, generation: state?.generation });
      pending.current = null;
      setDraft("");
      await loadConversation();
      await refresh();
    });
  }
  const loginView = !state?.character;
  const modalOpen = (ready && loginView) || report;
  useEffect(() => {
    if (!modalOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]');
    const focusable = () => [
      ...(dialog?.querySelectorAll<HTMLElement>(
        'button:not(:disabled),input,textarea,[tabindex="0"]',
      ) ?? []),
    ];
    focusable()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const nodes = focusable();
      if (!nodes.length) return;
      const first = nodes[0],
        last = nodes.at(-1)!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [modalOpen, state?.account]);
  return (
    <div
      data-vip-background={
        canCustomizeBackground && /^#[0-9a-fA-F]{6}$/.test(vipBackground)
      }
      style={
        canCustomizeBackground && /^#[0-9a-fA-F]{6}$/.test(vipBackground)
          ? ({ "--vip-background": vipBackground } as React.CSSProperties)
          : undefined
      }
      className={`app-shell game-fullscreen ${socialOpen && !privateChatOpen ? "social-open" : ""} ${view === "shop" ? "is-shopping" : ""}`}
    >
      <aside className="rail" inert={modalOpen}>
        <div className="sidebar-brand">
          <a className="luma-brand" href="/" aria-label="Luma City — Retour au quartier"
            onClick={(event) => { event.preventDefault(); openMap(); }}>
            <img src="/assets/luma-city.png" alt="" width={541} height={376} />
          </a>
        </div>
        {state?.character && (editingMotto ? (
          <div className="character-motto profile-motto-editor">
            <MottoEditor key={state.character.id} initial={state.character.motto ?? ""}
              onSave={saveMotto} onClose={() => setEditingMotto(false)} />
          </div>
        ) : <button type="button" className="character-motto profile-motto-trigger"
          onClick={() => setEditingMotto(true)} aria-label="Modifier ma bulle">
          <Pencil size={13} />
          <span>{state.character.motto || "Écrire ma bulle"}</span>
        </button>)}
        <div className="character-stage">
          <div className="character-orbit orbit-one" />
          <div className="character-orbit orbit-two" />
          <span className="avatar-spark spark-one">✧</span>
          <span className="avatar-spark spark-two">✦</span>
          <div className="avatar-pedestal" />
          <Portrait {...(state?.character ?? { id: "iris" })} layers={wornLayers} fullBody />
          {state?.character && <button type="button" className="profile-avatar-trigger"
            aria-label={`Voir le profil de ${state.character.name}`}
            onClick={() => setProfileId(state.character!.id)} />}
          <div className="stage-caption">
            {state?.character?.name ?? "Bienvenue"}
            <span>Un style, une personnalité.</span>
          </div>
        </div>
        {state?.character && <div className="rail-actions">
          <button type="button" className="rail-primary" onClick={() => setProfileId(state.character!.id)}>Mon profil</button>
          <button type="button" aria-pressed={view === "dressing"} onClick={openDressing}>Ma tenue</button>
        </div>}
        <div className="rail-bottom">
          <BackgroundPicker theme={theme} custom={vipBackground} vip={canCustomizeBackground}
            onTheme={(next) => {
              setTheme(next);
              if (canCustomizeBackground) {
                setVipBackground("");
                localStorage.removeItem("vip-background");
              }
            }} onCustom={(hex) => {
              setVipBackground(hex);
              localStorage.setItem("vip-background", hex);
            }} />
          <button
            className="rail-button"
            title="Aide"
            aria-label="Aide"
            onClick={() => {
              setPanel("help");
              setSocialOpen(true);
            }}
          >
            <Info />
            <span>Aide</span>
          </button>
          {state && (
            <button
              className="rail-button"
              title="Déconnexion"
              aria-label="Déconnexion"
              onClick={() =>
                void action(async () => {
                  await api("logout", {});
                  setState(null);
                  setPeer(null);
                  if (auth) {
                    const { error } = await auth.signOut();
                    if (error) throw new Error("La déconnexion Neon a échoué. Réessaie.");
                  }
                })
              }
            >
              <LogOut size={18} />
              <span>Déconnexion</span>
            </button>
          )}
        </div>
      </aside>
      <div className="workspace" inert={modalOpen}>
        <header className="topbar">
          <div
            className="game-wallet"
            aria-label="Monnaie du jeu et progression"
          >
            <div className="wallet-counters">
              <WalletCounter kind="monnaie" amount={wardrobe.balance} />
              <WalletCounter kind="diamants" amount={wardrobe.diamonds} />
            </div>
            <div className="fame-meter">
              <Star size={17} aria-hidden="true" />
              <span>Niv. {level}</span>
              <div className="fame-track" role="progressbar" aria-label="Progression du niveau"
                aria-valuenow={xpInLevel} aria-valuemax={xpRequired}
                aria-valuetext={`${xpInLevel} sur ${xpRequired} XP, ${xpRemaining} XP avant le prochain niveau`}>
                <span style={{ width: `${100 * xpInLevel / xpRequired}%` }} />
              </div>
              <span className="fame-progress" title={`${xpRemaining} XP avant le prochain niveau`}>
                {xpInLevel} / {xpRequired}
              </span>
              {activeId && <button type="button" className="level-wheel" onClick={() => setWheelOpen(true)}
                aria-label={`Roue des récompenses, ${state?.rewardWheel?.tickets ?? 0} tour(s)`}>
                <CircleDot size={12} /> {state?.rewardWheel?.tickets ?? 0}
              </button>}
            </div>
          </div>
          <div className="wordmark">
            <span>PRENDS TA PLACE, ÉCRIS TON HISTOIRE</span>
          </div>
          <nav className="world-nav" aria-label="Navigation principale">
            {([
              ["Quartier", Map, (view === "explore" || view === "garden") && !socialOpen && !guestbook, () => openMap()],
              ["Boutique", ShoppingBag, view === "shop", () => { setGuestbookId(null); setView("shop"); setSocialOpen(false); }],
              ["Dressing", Shirt, view === "dressing", openDressing],
              ["Salon", Sparkles, view === "salon", () => { setGuestbookId(null); setView("salon"); setSocialOpen(false); }],
              ["Jeux", Gamepad2, view === "arcade", () => { setGuestbookId(null); setView("arcade"); setSocialOpen(false); }],
              ["Amis", Users, view === "friends", () => { setGuestbookId(null); setSocialOpen(false); setView("friends"); }],
              ["Messages", MessageCircle, privateChatOpen, () => { setPanel("chat"); setSocialOpen(true); }],
              ["Classement", Trophy, view === "ranking", openRanking],
            ] as const).map(([label, Icon, selected, open]) => {
              const badge = label === "Amis" ? requestCount : label === "Messages" ? unread : 0;
              // Private messages open over the current view: only their entry is highlighted then.
              const current = label === "Messages" ? selected : selected && !privateChatOpen;
              return (
                <button key={label} type="button" className={current ? "selected" : ""}
                  aria-current={current ? "page" : undefined} disabled={!activeId} onClick={open}>
                  <Icon aria-hidden="true" />
                  <span>{label}</span>
                  {badge > 0 && <b className="nav-unread" aria-label={label === "Amis"
                    ? `${badge} demande${badge > 1 ? "s" : ""} reçue${badge > 1 ? "s" : ""}`
                    : `${badge} message${badge > 1 ? "s" : ""} non lu${badge > 1 ? "s" : ""}`}>{badge}</b>}
                </button>
              );
            })}
          </nav>
          <div className="top-actions">
            <span className="local-tag">
              <span /> Session locale
            </span>
            {state?.character && (
              <button
                className="profile-button"
                aria-label="Ouvrir mon profil"
                onClick={() => setProfileId(activeId ?? null)}
              >
                <span className="mini-portrait">
                  <Portrait {...state.character} layers={wornLayers} />
                </span>
                <span>
                  {state.character.name}
                </span>
              </button>
            )}
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span />{" "}
                {view === "explore"
                  ? "UN PETIT MONDE DE POSSIBLES"
                  : "TON ESPACE PARTAGÉ"}
              </div>
              <h1>
                {view === "explore"
                  ? `Bienvenue ${state?.character?.name ?? "chez toi"}.`
                  : scene.name}
                <span>✧</span>
              </h1>
              <p>
                {view === "explore"
                  ? "Une balade, une rencontre… et si tout commençait ici ?"
                  : "Un coin tranquille pour se croiser et papoter."}
              </p>
            </div>
            <div className="room-count">
              <Users size={16} />
              <strong>{players.length}</strong>
              <span>/ 15 dans la salle</span>
            </div>
          </div>
          {error && (
            <div className="alert" role="alert">
              {error}
              <button aria-label="Fermer l’erreur" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {notice && (
            <div className="notice" role="status">
              <Check size={16} />
              {notice}
            </div>
          )}
          <div className="game-grid">
            <section
              className="room-card"
              aria-label={
                privateChatOpen ? "Messages privés" : guestbook ? `Livre d’or de ${guestbook.name}` : view === "explore"
                  ? "Carte du quartier"
                  : view === "shop"
                    ? "Boutique de vêtements"
                    : view === "dressing" ? "Mon dressing"
                    : view === "friends" ? "Mes amis" : view === "salon" ? "Salon d’esthétique" : view === "arcade" ? "Coin détente" : view === "ranking" ? "Classements" : scene.name
              }
            >
              {privateChatOpen ? (
                <div className="private-chat">
                  <aside className="private-chat-list" aria-label="Conversations privées">
                    <div className="private-chat-contacts">
                      {chatContacts.slice(currentChatPage * 5, (currentChatPage + 1) * 5).map(c => {
                        const online = presence?.onlineIds.includes(c.id);
                        return <button type="button" key={c.id} aria-pressed={peer === c.id}
                          className="private-chat-contact" onClick={() => choosePeer(c.id)}>
                          <span className="private-chat-avatar">
                            <Portrait {...c} />
                            <i data-online={Boolean(online)} aria-hidden="true" />
                          </span>
                          <span className="private-chat-name">{c.name}
                            <small>{c.blocked ? "Bloqué" : online ? "En ligne" : "Hors ligne"}</small>
                          </span>
                          {c.unread > 0 && <b className="count-pill" aria-label={`${c.unread} messages non lus`}>{c.unread}</b>}
                        </button>;
                      })}
                      {!chatContacts.length && <p>Aucun joueur disponible.</p>}
                    </div>
                    <nav className="private-chat-pages" aria-label="Pages des conversations">
                      <button type="button" aria-label="Page précédente" disabled={currentChatPage === 0}
                        onClick={() => setChatPage(currentChatPage - 1)}><ArrowLeft size={18} /></button>
                      <button type="button" aria-label="Page suivante" disabled={currentChatPage === lastChatPage}
                        onClick={() => setChatPage(currentChatPage + 1)}><ArrowRight size={18} /></button>
                    </nav>
                  </aside>
                  <div className="private-chat-pane">
                    <button type="button" className="private-chat-close icon-button" aria-label="Fermer les messages privés"
                      onClick={() => setSocialOpen(false)}><X size={18} /></button>
                    {contact && peer ? (
                  <div className="conversation">
                    <div className="conversation-header">
                      <button
                        className="icon-button"
                        aria-label="Retour aux conversations"
                        onClick={() => setPeer(null)}
                      >
                        <ArrowLeft size={18} />
                      </button>
                      <div>
                          <button type="button" className="conversation-profile" onClick={() => setProfileId(peer)}
                            aria-label={`Voir le profil de ${contact?.name ?? "ce personnage"}`}><strong>Message privé avec {contact?.name}</strong></button>
                        <small>
                          {onlineContacts.some((p) => p.id === peer)
                            ? "En ligne"
                            : "Hors ligne · les messages l’attendront"}
                        </small>
                      </div>
                      <button
                        className="icon-button"
                        title="Signaler"
                        aria-label="Signaler ce joueur"
                        onClick={() => setReport(true)}
                      >
                        <Flag size={16} />
                      </button>
                      <button
                        className={
                          "icon-button " +
                          (contact?.blocked ? "is-blocked" : "")
                        }
                        title={contact?.blocked ? "Débloquer" : "Bloquer"}
                        aria-label={contact?.blocked ? "Débloquer" : "Bloquer"}
                        onClick={() =>
                          void action(async () => {
                            await api("block", {
                              generation: state?.generation,
                              peer,
                              blocked: !contact?.blocked,
                            });
                            await refresh();
                            setNotice(
                              contact?.blocked
                                ? "Personnage débloqué."
                                : "Personnage bloqué. Les nouveaux messages sont désactivés dans les deux sens.",
                            );
                          })
                        }
                      >
                        <Shield size={16} />
                      </button>
                    </div>
                    <div
                      className="messages"
                      ref={scroller}
                      onScroll={() => setFocusTick((x) => x + 1)}
                    >
                      {messages.length === 0 && (
                        <div className="empty-state">
                          <MessageCircle size={30} />
                          <h3>Un petit bonjour ?</h3>
                          <p>
                            Tu peux écrire même si {contact?.name} est hors
                            ligne.
                          </p>
                        </div>
                      )}
                      {messages.map((m) => (
                        <div
                          key={m.id}
                          data-incoming-id={
                            m.recipient === state?.character?.id
                              ? m.id
                              : undefined
                          }
                          className={
                            "bubble " +
                            (m.sender === state?.character?.id ? "mine" : "")
                          }
                        >
                          <strong>{m.sender === state?.character?.id ? "Moi" : contact?.name}</strong>
                          <p>{m.body}</p>
                          <time>
                            {new Date(m.created_at).toLocaleTimeString(
                              "fr-FR",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </time>
                        </div>
                      ))}
                    </div>
                    {contact?.blocked && (
                      <div className="blocked-note">
                        Tu as bloqué ce personnage.
                      </div>
                    )}
                    <form className="message-form" onSubmit={sendMessage}>
                      <label className="sr-only" htmlFor="message">
                        Ton message
                      </label>
                      <input
                        id="message"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder="Écrire mon message…"
                        maxLength={800}
                        disabled={contact?.blocked}
                      />
                      <button
                        disabled={!draft.trim() || busy || contact?.blocked}
                        aria-label="Envoyer le message"
                      >
                        <Send size={17} />
                      </button>
                    </form>
                    <div className="message-note">
                      Messages privés · sans son · {draft.length}/800
                    </div>
                  </div>
                    ) : <p className="private-chat-empty">Choisis un joueur pour ouvrir une conversation.</p>}
                  </div>
                </div>
              ) : view === "friends" && !guestbook ? (
                <FriendsPanel key={activeId} contacts={state?.contacts ?? []}
                  onlineIds={presence?.onlineIds ?? []} onProfile={setProfileId}
                  onClose={openMap}
                  onRespond={async (id, accept) => {
                    await updateSocial(id, accept
                      ? { type: "relation", kind: "friend", accept: true }
                      : { type: "decline-friend" });
                    await refresh();
                  }} />
              ) : guestbook ? (
                <Guestbook key={guestbook.id} character={guestbook}
                  canWrite={guestbook.id !== state?.character?.id && !state?.contacts.find((c) => c.id === guestbook.id)?.blocked}
                  load={loadSocial}
                  post={(id, body) => updateSocial(id, { type: "guestbook", body })}
                  gifts={guestbook.id === state?.character?.id
                    ? state?.garmentTransfers?.filter((gift) => gift.recipient === guestbook.id)
                    : undefined}
                  onWearGift={wearGift}
                  onBack={() => setGuestbookId(null)} />
              ) : view === "dressing" && state?.character ? (
                <div className="dressing-view">
                  <div className="dressing-heading">
                    <h2>Mon dressing</h2>
                    <span>Tes vêtements achetés, reçus et de départ. Compose ta tenue puis enregistre-la.</span>
                  </div>
                  <ProfileWardrobe
                    key={`${state.character.id}:${JSON.stringify(state.character.outfit ?? null)}`}
                    character={state.character}
                    equipped={wornLayers}
                    items={wardrobe.items.filter((item) => !archived.includes(item.pieceId) &&
                      avatarCatalogSnapshot().some((piece) => piece.id === item.pieceId))}
                    onSave={(outfit) => {
                      saveEquippedOutfit(outfit);
                      setNotice("Tenue enregistrée.");
                    }} />
                </div>
              ) : view === "ranking" ? (
                <ServerRanking entries={ranking} status={rankingStatus} onSelect={setProfileId}
                  onClose={() => setView("explore")} />
              ) : view === "explore" ? (
                <>
                  <div className="map-heading">
                    <span className="room-icon">
                      <Map size={19} />
                    </span>
                    <div>
                      <strong>Le quartier</strong>
                      <span>Une nouvelle histoire, au bout du chemin.</span>
                    </div>
                    <span className="map-time">✦ Belle journée</span>
                  </div>
                  <NeighborhoodMap
                    homeGifts={state?.homeGifts}
                    onGift={gift => {
                      if (busy) return;
                      void action(async () => {
                        const next: State = await api("home-gifts", { generation: state?.generation, gift });
                        setState(next);
                        setNotice(next.homeGifts?.length === 5 ? "Quête terminée ! +5 000 XP et +200 monnaie." : "+5 000 XP et +200 monnaie");
                      });
                    }}
                    roomCounts={presence?.counts ?? {}}
                    onShop={() => {
                      setView("shop");
                      setSocialOpen(false);
                    }}
                    onSalon={() => {
                      setView("salon");
                      setSocialOpen(false);
                    }}
                    onEnter={enterRoom}
                    onArcade={() => { setView("arcade"); setSocialOpen(false); }}
                  />
                  {activeId && <TodayPanel key={activeId}
                    homeGifts={state?.homeGifts}
                    pendingXp={pendingXp}
                    wheelTickets={state?.rewardWheel?.tickets ?? 0}
                    busy={busy}
                    loadScratch={loadScratchTicket}
                    onAcceptQuest={() => void action(async () => {
                      setState(await api("home-gifts", { generation: state?.generation }));
                    })}
                    onOpenMagazine={openMagazine}
                    onScratch={() => { setView("arcade"); setSocialOpen(false); }}
                    onWheel={() => setWheelOpen(true)} />}
                  <div className="map-bottom">
                    <span>
                      <span className="live-dot" /> Le jardin est ouvert
                    </span>
                    <button
                      onClick={() => enterRoom(DEFAULT_ROOM)}
                    >
                      Retrouver les joueurs <ArrowRight size={14} />
                    </button>
                  </div>
                </>
              ) : view === "arcade" ? (
                <Arcade tickets={state?.rewardWheel?.tickets ?? 0}
                  onBack={openMap} onWheel={() => setWheelOpen(true)}
                  start={startArcade} finish={finishArcade}
                  loadScratch={loadScratchTicket} scratch={scratchTicket} claimScratch={claimScratchTicket} />
              ) : view === "salon" ? (
                <BeautySalon key={activeId} layers={wornLayers} onBack={openMap}
                  onSave={(activeId === "iris" || (activeId && isCreatedPlayer(activeId))) ? (face) => saveEquippedOutfit({ ...wornLayers, face }) : undefined} />
              ) : view === "shop" && state?.character ? (
                <Shop
                  canCustomizeColors={state.uiCapabilities?.customGarmentColors === true}
                  key={state.character.id}
                  character={state.character}
                  equippedLayers={wornLayers}
                  onPurchase={purchaseShopOutfit}
                  ownedItems={wardrobe.items}
                  balance={wardrobe.balance}
                  onClose={() => setView("explore")}
                />
              ) : (
                <div className="room-layout">
                  <div className="room-stage">
                    <div className="room-label">
                      <button
                        type="button"
                        className="room-icon room-back"
                        aria-label="Retour au quartier"
                        title="Retour au quartier"
                        onClick={() => {
                          if (homeOwner(roomId)) enterRoom(DEFAULT_ROOM);
                          setView("explore");
                          setSocialOpen(false);
                        }}
                      >
                        <ArrowLeft size={20} />
                      </button>
                      <div>
                        <strong>{scene.name}</strong>
                        <span>{presence?.counts[roomId] ?? 0} / 15 · Salle de chat</span>
                      </div>
                      <span className={"connection " + status}>
                        <i />
                        {status === "online"
                          ? "En direct"
                          : status === "connecting"
                            ? "Connexion…"
                            : "Hors ligne"}
                      </span>
                    </div>
                    <div className="scene-wrap">
                      <Room
                        roomId={roomId}
                        scene={scene}
                        players={presence?.roomId === roomId ? players : []}
                        me={state?.character?.id}
                        wornLayers={wornLayers}
                        messages={roomChat?.roomId === roomId ? roomChat.messages : undefined}
                        onMove={move}
                        onSelect={setProfileId}
                      />
                    </div>
                    <div className="room-footer">
                      <span>
                        <MousePointer2 size={15} /> Clique au sol pour te déplacer
                      </span>
                      <span className="keyboard-hint">
                        ou utilise les touches <kbd>←</kbd>
                        <kbd>↑</kbd>
                        <kbd>↓</kbd>
                        <kbd>→</kbd>
                      </span>
                    </div>
                  </div>
                  <RoomDrawer
                    key={roomId}
                    chat={
                      <RoomChat
                        key={roomId}
                        messages={roomChat?.roomId === roomId ? roomChat.messages : []}
                        receipt={roomReceipt}
                        enabled={status === "online" && presence?.roomId === roomId}
                        me={activeId}
                        avatarFor={(sender) => {
                          const who = players.find((p) => p.id === sender) ?? knownCharacters.find((c) => c.id === sender);
                          return who ? <Portrait {...who} layers={ownLayers(sender)} /> : null;
                        }}
                        onSend={(body, commandId) => {
                          if (socket.current?.readyState === WebSocket.OPEN) {
                            socket.current.send(JSON.stringify({
                              type: "room-chat",
                              generation: state?.generation,
                              roomId,
                              body,
                              commandId,
                            }));
                          } else {
                            setRoomReceipt({ commandId, error: "Connexion à la salle interrompue." });
                          }
                        }}
                      />
                    }
                    chatLatest={roomChat?.roomId === roomId ? roomChat.messages.at(-1)?.id : undefined}
                    contacts={chatContacts}
                    presentIds={presence?.roomId === roomId ? players.map((p) => p.id) : []}
                    onlineIds={presence?.onlineIds ?? []}
                    portrait={(person) => <Portrait {...person} />}
                    onOpenChat={choosePeer}
                    onOpenProfile={setProfileId}
                    onAllMessages={() => { setPanel("chat"); setSocialOpen(true); }}
                    onAllFriends={() => { setGuestbookId(null); setSocialOpen(false); setView("friends"); }}
                  />
                </div>
              )}
            </section>
            <aside
              className="social-card"
              inert={!socialOpen || privateChatOpen}
              aria-hidden={!socialOpen || privateChatOpen}
            >
              <button
                className="close-social"
                aria-label="Fermer le panneau social"
                onClick={() => setSocialOpen(false)}
              >
                <X size={17} />
              </button>
              <div className="panel-tabs">
                <button
                  className={panel === "people" ? "selected" : ""}
                  onClick={() => setPanel("people")}
                >
                  <Users size={16} /> Joueurs
                  {incomingRequests.length > 0 && <b>{incomingRequests.length}</b>}
                </button>
                <button
                  className={panel === "chat" ? "selected" : ""}
                  onClick={() => setPanel("chat")}
                >
                  <MessageCircle size={16} /> Messages{" "}
                  {unread > 0 && <b>{unread}</b>}
                </button>
              </div>
              {panel === "people" && (
                <div className="people-panel">
                  {incomingRequests.length > 0 && <div className="profile-requests">
                    <strong>Demandes reçues</strong>
                    {incomingRequests.map((contact) => <button type="button" className="person-row"
                      key={contact.id} onClick={() => setProfileId(contact.id)}>
                      <span>{contact.name}</span><b className="count-pill">{contact.profileRequests}</b>
                    </button>)}
                  </div>}
                  <div className="panel-heading">
                    <span>Mes amis</span>
                    <span className="counter">{friends.length}</span>
                  </div>
                  {!friends.length ? (
                    <div className="empty-state">
                      <Flower2 size={32} />
                      <h3>Ta liste d’amis est vide</h3>
                      <p>Ouvre le profil d’un joueur dans une salle pour l’ajouter.</p>
                    </div>
                  ) : (
                    friends.map((p) => (
                      <button
                        className="person-row"
                        key={p.id}
                        onClick={() => setProfileId(p.id)}
                      >
                        <span
                          className="person-avatar"
                          style={{ background: p.color + "20" }}
                        >
                          <Portrait {...p} layers={ownLayers(p.id)} />
                          {presence?.onlineIds.includes(p.id) && <i />}
                        </span>
                        <span>
                          <strong>
                            {p.name}
                          </strong>
                          <small>
                            {presence?.onlineIds.includes(p.id) ? "En ligne" : "Hors ligne"}
                          </small>
                        </span>
                        <MessageCircle size={17} />
                      </button>
                    ))
                  )}
                </div>
              )}
              {panel === "help" && (
                <div className="people-panel">
                  <div className="panel-heading">Bienvenue dans P0</div>
                  <p className="panel-copy">
                    Clique sur le sol pour déplacer ton avatar, ou utilise les
                    flèches quand le jardin a le focus. Clique sur un joueur
                    pour lui écrire.
                  </p>
                  <div className="help-item">
                    <MessageCircle size={20} />
                    <div>
                      <strong>Les mots restent</strong>
                      <p>
                        Les messages attendent les joueurs hors ligne. Ils ne
                        peuvent pas être supprimés depuis l’interface.
                      </p>
                    </div>
                  </div>
                  <div className="help-item">
                    <Shield size={20} />
                    <div>
                      <strong>Garde la main</strong>
                      <p>
                        Bloque ou signale un personnage depuis sa conversation.
                        Les signalements sont enregistrés ; aucun service de
                        modération humain n’est actif dans ce prototype.
                      </p>
                    </div>
                  </div>
                  <p className="prototype-note">
                    Prototype local · comptes de démonstration · visuels
                    provisoires · aucun achat.
                  </p>
                </div>
              )}
            </aside>
          </div>
          <footer className="bottom-note">
            <div className={view === "garden" ? "world-dock in-room" : "world-dock"}>
              <div className="dock-heading">
                <h2>{view === "garden" ? `Dans ${scene.name}` : "En ligne"}</h2>
                <span><i aria-hidden="true" />{view === "garden"
                  ? `${roomPeople.length} présent${roomPeople.length > 1 ? "s" : ""} · 15 max`
                  : `${onlinePeople.length} joueur${onlinePeople.length > 1 ? "s" : ""} connecté${onlinePeople.length > 1 ? "s" : ""}`}</span>
              </div>
              <div className="dock-avatars" role="group" aria-label={view === "garden" ? `Personnes dans ${scene.name}` : "Personnes en ligne"}>
                {(view === "garden" ? roomPeople : onlinePeople).map((p) => {
                  const contact = state?.contacts.find((c) => c.id === p.id);
                  const mine = p.id === activeId;
                  const tag = view !== "garden" ? null : mine ? "toi" : contact?.friend ? "ami·e"
                    : contact?.friendRequest ? "veut être ami·e" : null;
                  return (
                    <button
                      key={p.id}
                      title={p.name}
                      aria-label={mine ? "Voir mon profil" : `Voir le profil de ${p.name}`}
                      className={contact?.friend ? "is-friend" : mine ? "is-me" : undefined}
                      onClick={() => setProfileId(p.id)}
                    >
                      <span className="portrait-circle dock-avatar-picture"><Portrait {...p} layers={ownLayers(p.id)} /></span>
                      <span>{p.name}</span>
                      {tag && <small>{tag}</small>}
                    </button>
                  );
                })}
              </div>
              {view === "garden" && <p className="dock-hint">Clique sur un joueur pour voir son profil, l’ajouter en ami ou lui écrire.</p>}
            </div>
            <span>
              <span className="tiny-flower">✳</span> Un monde en construction, à
              explorer ensemble.
            </span>
            <span>P0 · Navigateur · 16+</span>
          </footer>
        </main>
      </div>
      {worldPanel === "quests" && !modalOpen && <div className="modal-backdrop quest-backdrop"
        onKeyDown={event => { if (event.key === "Escape" && !busy) setWorldPanel(null); }}>
        <section className="quest-dialog" role="dialog" aria-modal="true" aria-labelledby="quest-title">
          <h2 id="quest-title">Quêtes</h2>
          <h3>Trouver les 5 cadeaux sur la page d’accueil</h3>
          <div className="quest-progress">
            <img src="/assets/navigation/quest-gift.png" alt="" />
            <strong>{state?.homeGifts?.length ?? 0}/5</strong>
            <img src="/assets/navigation/quest-gift.png" alt="" />
          </div>
          <p>Chaque cadeau rapporte 5 000 XP et 200 monnaie.</p>
          {state?.homeGifts?.length === 5 && <p>Quête terminée !</p>}
          {error && <p role="alert">{error}</p>}
          <div className="quest-buttons">
            {!state?.homeGifts && <button type="button" disabled={busy} onClick={() => void action(async () => {
              setState(await api("home-gifts", { generation: state?.generation }));
              setWorldPanel(null);
            })}>Accepter</button>}
            <button type="button" autoFocus disabled={busy} onClick={() => setWorldPanel(null)}>
              {state?.homeGifts ? "Fermer" : "Refuser"}
            </button>
          </div>
        </section>
      </div>}
      {worldPanel === "magazine" && !modalOpen && <WorldPanel
        magazine={state?.xpMagazine} busy={claimingXp} status={featureStatus}
        onClose={() => setWorldPanel(null)} onClaim={(source) => void claimXp(source).catch(() => {})}
        rewards={<FloatingRewards rewards={rewards.filter((reward) => !("points" in reward))} collect={collectReward} inDialog />} />}
      {wheelOpen && !modalOpen && <PrizeWheel wheel={state?.rewardWheel}
        onClose={() => setWheelOpen(false)} onSpin={spinWheel}
        onBurst={(id, origin) => { setCoinBurst({ id, ...origin }); setWheelOpen(false); }} />}
      {!worldPanel && !wheelOpen && !profile && !modalOpen && activeId &&
        <FloatingRewards rewards={rewards} collect={collectReward} burstOrigin={coinBurst} />}
      {profile && state?.character && !modalOpen && <ProfileCard
        key={`${state.character.id}:${profile.id}`} character={profile}
        viewerLayers={wornLayers} own={ownProfile}
        rewards={<FloatingRewards rewards={rewards} collect={collectReward} inDialog />}
        blocked={state.contacts.find((contact) => contact.id === profile.id)?.blocked}
        generation={state.generation} requestVersion={profileRevision}
        purchased={wardrobe.items.filter((item) => item.purchasedAt > 0 && !archived.includes(item.pieceId) &&
          avatarCatalogSnapshot().some((piece) => piece.id === item.pieceId))}
        loadSocial={loadSocial} act={updateSocial}
        onClose={() => setProfileId(null)}
        onProfile={() => { setProfileId(null); setGuestbookId(profile.id); setSocialOpen(false); }}
        onHome={() => { setProfileId(null); enterRoom(homeRoom(profile.id)); }}
        onSave={saveMotto}
        canUploadImage={state.uiCapabilities?.customProfileImage === true}
        onWear={saveEquippedOutfit}
        onMessage={() => {
          setProfileId(null);
          choosePeer(profile.id);
        }} />}
      {ready && loginView && <PlayerWelcome busy={busy} error={error} multiplayer={multiplayer} neonAuth={Boolean(auth)} needsCharacter={needsCharacter} checkName={checkPlayerName} submit={enterPlayer} playDemo={demoAccounts ? playAs : undefined} />}
      {report && (
        <div className="modal-backdrop">
          <form
            className="report-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
            onSubmit={(e) => {
              e.preventDefault();
              void action(async () => {
                await api("report", {
                  generation: state?.generation,
                  peer,
                  reason,
                });
                setReport(false);
                setReason("");
                setNotice(
                  "Signalement enregistré. Ce prototype ne dispose pas encore d’équipe de modération.",
                );
              });
            }}
          >
            <button
              type="button"
              className="modal-close icon-button"
              aria-label="Fermer"
              onClick={() => setReport(false)}
            >
              <X />
            </button>
            <Flag size={26} />
            <h2 id="report-title">Signaler {contact?.name}</h2>
            <label htmlFor="reason">Décris le comportement à signaler</label>
            <textarea
              id="reason"
              required
              minLength={3}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p>
              Le signalement sera conservé côté serveur. Il ne sera pas visible
              par les autres joueurs.
            </p>
            {error && (
              <p className="modal-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="primary-button"
              disabled={busy || reason.trim().length < 3}
            >
              Envoyer le signalement
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
// The rig lab is a development tool: it is left out of the production bundle.
if (import.meta.env.DEV && new URLSearchParams(location.search).get('avatar-rig') === '1') {
  import('./avatar/rig/RigLab').then(({default:RigLab})=>root.render(<RigLab/>));
} else root.render(<App />);
