import { useEffect, useRef, useState } from "react";
import type { HomeAccessSettings, HomeInvitation } from "../../../../packages/contracts/src/housing";
import { housingRequest as accessRequest } from "./home-http";

const expiry = (value: string) => new Date(value).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const modes = { public: "Publique", friends: "Amis uniquement", private: "Privée" } as const;

export function HomeAccessPanel({ generation, revision, visitors, onClose }: {
  generation: number; revision: number; visitors: { id: string; name: string }[]; onClose: () => void;
}) {
  const [settings, setSettings] = useState<HomeAccessSettings | null>(null);
  const [peer, setPeer] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState(""), [message, setMessage] = useState("");
  const [kick, setKick] = useState<{ id: string; name: string } | null>(null);
  const invitation = useRef<{ peer: string; id: string } | null>(null);
  const mounted = useRef(true), inFlight = useRef(false);
  const readVersion = useRef(0);
  async function load() {
    if (inFlight.current) return;
    const version = ++readVersion.current;
    try { const data = await accessRequest("access", { generation }); if (mounted.current && version === readVersion.current) setSettings(data); }
    catch (failure) { if (mounted.current && version === readVersion.current) setError((failure as Error).message); }
  }
  useEffect(() => {
    mounted.current = true; void load(); const timer = setInterval(() => void load(), 15000);
    return () => { mounted.current = false; readVersion.current++; clearInterval(timer); };
  }, [generation, revision]);
  async function update(action: object, success: string) {
    if (inFlight.current) return;
    readVersion.current++;
    inFlight.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const data = await accessRequest("access/update", { generation, ...action });
      if (mounted.current) {
        setSettings(data); setMessage(success); setKick(null);
        if ("action" in action && action.action === "invite") { setPeer(""); invitation.current = null; }
      }
    } catch (failure) { if (mounted.current) setError((failure as Error).message); }
    finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  }
  return <aside className="home-access-panel" aria-label="Accès et invitations">
    <header><strong>Accès et invitations</strong><button type="button" disabled={busy} onClick={onClose}>Fermer les accès</button></header>
    {error && <p role="alert">{error} <button type="button" disabled={busy} onClick={() => void load()}>Actualiser</button></p>}
    {message && <p role="status">{message}</p>}
    {!settings ? <p>Chargement des accès…</p> : <>
      <h3>Qui peut visiter ?</h3><div className="home-access-modes">{(Object.keys(modes) as (keyof typeof modes)[]).map((mode) =>
        <button key={mode} type="button" disabled={busy} aria-pressed={settings.mode === mode}
          onClick={() => void update({ action: "mode", mode, expectedRevision: settings.revision }, `Maison ${modes[mode].toLocaleLowerCase("fr")}.`)}>{modes[mode]}</button>)}</div>
      <p>Publique : les joueurs autorisés. Amis uniquement : les amitiés confirmées. Privée : toi et les amis ayant accepté une invitation valide.</p>
      <p>Un changement retire immédiatement les visiteurs qui n’ont plus accès.</p>
      <h3>Inviter un ami</h3>
      <form className="home-invite-form" onSubmit={(event) => {
        event.preventDefault(); if (!peer) return;
        if (invitation.current?.peer !== peer) invitation.current = { peer, id: crypto.randomUUID() };
        void update({ action: "invite", peer, operationId: invitation.current.id }, "Invitation envoyée, valable une heure.");
      }}>
        <select aria-label="Ami à inviter" value={peer} disabled={busy} onChange={(event) => { setPeer(event.target.value); invitation.current = null; }}>
          <option value="">Choisir un ami</option>{settings.friends.filter((f) => !settings.excluded.some((e) => e.id === f.id) &&
            !settings.invitations.some((i) => i.guestId === f.id)).map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select>
        <button type="submit" disabled={busy || !peer}>Envoyer l’invitation</button>
      </form>
      {settings.invitations.length === 0 && <p>Aucune invitation en cours.</p>}
      <ul>{settings.invitations.map((i) => <li key={i.id}><span>{i.guestName} · {i.state === "accepted" ? "acceptée" : "en attente"} · jusqu’à {expiry(i.expiresAt)}</span>
        <button type="button" disabled={busy} aria-label={`Révoquer l’invitation de ${i.guestName}`}
          onClick={() => void update({ action: "revoke", invitationId: i.id }, "Invitation révoquée.")}>Révoquer</button></li>)}</ul>
      <h3>Visiteurs présents</h3>{visitors.length === 0 && <p>Aucun visiteur.</p>}
      <ul>{visitors.map((v) => <li key={v.id}><span>{v.name}</span><button type="button" disabled={busy}
        onClick={() => setKick(v)} aria-label={`Expulser ${v.name}`}>Expulser</button></li>)}</ul>
      {kick && <section className="home-kick-confirm" aria-label="Confirmer l’expulsion"><p>Expulser {kick.name} et empêcher son retour jusqu’à ta prochaine autorisation ?</p>
        <button type="button" disabled={busy} onClick={() => void update({ action: "kick", peer: kick.id }, `Expulsion de ${kick.name} confirmée.`)}>Confirmer l’expulsion</button>
        <button type="button" disabled={busy} onClick={() => setKick(null)}>Annuler</button></section>}
      <h3>Retour interdit</h3>{settings.excluded.length === 0 && <p>Aucune exclusion.</p>}
      <ul>{settings.excluded.map((v) => <li key={v.id}><span>{v.name}</span><button type="button" disabled={busy}
        aria-label={`Autoriser le retour de ${v.name}`} onClick={() => void update({ action: "allow", peer: v.id }, "Retour autorisé selon les règles de la maison. Les anciennes invitations restent révoquées.")}>Autoriser le retour</button></li>)}</ul>
    </>}
  </aside>;
}

export function HomeInvitations({ generation, revision, onVisit }: { generation: number; revision: number; onVisit: (owner: string) => void }) {
  const [invitations, setInvitations] = useState<HomeInvitation[]>([]), [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const mounted = useRef(true), inFlight = useRef(false);
  const readVersion = useRef(0);
  async function load() {
    const version = ++readVersion.current;
    try { const data = await accessRequest("invitations", { generation }); if (mounted.current && version === readVersion.current) { setInvitations(data.invitations); setError(""); } }
    catch (failure) { if (mounted.current && version === readVersion.current) setError((failure as Error).message); }
  }
  useEffect(() => {
    mounted.current = true; void load(); const timer = setInterval(() => void load(), 15000);
    return () => { mounted.current = false; readVersion.current++; clearInterval(timer); };
  }, [generation, revision]);
  async function respond(invitation: HomeInvitation, accept: boolean) {
    if (inFlight.current) return;
    readVersion.current++;
    inFlight.current = true; setBusy(true); setError("");
    try {
      await accessRequest("invitations/respond", { generation, invitationId: invitation.id, accept });
      await load(); if (accept && mounted.current) { onVisit(invitation.ownerId); setOpen(false); }
    } catch (failure) { if (mounted.current) setError((failure as Error).message); }
    finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  }
  return <>
    <button type="button" className="home-inbox-toggle" aria-expanded={open} onClick={() => { setOpen(!open); if (!open) void load(); }}>
      Invitations de maison{invitations.filter((i) => i.state === "pending").length > 0 ? ` · ${invitations.filter((i) => i.state === "pending").length}` : ""}</button>
    {open && <aside className="home-inbox-panel" aria-label="Invitations de maison"><header><strong>Invitations de maison</strong><button type="button" onClick={() => setOpen(false)}>Fermer les invitations</button></header>
      {error && <p role="alert">{error}</p>}{invitations.length === 0 && <p>Aucune invitation valide pour le moment.</p>}
      <ul>{invitations.map((i) => <li key={i.id}><p>Maison de {i.ownerName} · jusqu’à {expiry(i.expiresAt)}</p>
        {i.state === "pending" ? <><button type="button" disabled={busy} onClick={() => void respond(i, true)}>Accepter et visiter {i.ownerName}</button>
          <button type="button" disabled={busy} onClick={() => void respond(i, false)}>Décliner</button></> :
          <button type="button" disabled={busy} onClick={() => { onVisit(i.ownerId); setOpen(false); }}>Visiter {i.ownerName}</button>}</li>)}</ul>
    </aside>}
  </>;
}
