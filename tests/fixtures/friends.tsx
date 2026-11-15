import { useState } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/outfit/400.css";
import "@fontsource/outfit/500.css";
import { FriendsPanel } from "../../apps/web/src/FriendsPanel";
import "../../apps/web/src/friends-panel.css";
import { demoFriends, demoOnlineIds, demoStrangers as strangers } from "./friends-demo";

// ?w=390&h=520 sizes the panel; ?vide shows an empty list; ?erreur makes answers fail.
const options = new URLSearchParams(location.search);
const width = options.get("w") ?? "1080";
const height = options.get("h") ?? "620";

function Fixture() {
  const [contacts, setContacts] = useState(options.has("vide") ? [] : demoFriends);
  const [log, setLog] = useState("—");
  return (
    <main style={{ display: "grid", gap: 10, justifyItems: "center", padding: 16 }}>
      <div style={{ width: `${width}px`, maxWidth: "100%", height: `${height}px`, borderRadius: 26, overflow: "hidden",
        border: "1px solid rgba(247,242,255,.16)" }}>
        <FriendsPanel contacts={contacts} onlineIds={demoOnlineIds}
          onProfile={(id) => setLog(`profil ${id}`)}
          onMessage={(id) => setLog(`message ${id}`)}
          onGuestbook={(id) => setLog(`livre d’or ${id}`)}
          onClose={() => setLog("fermer")}
          onOpenPlayer={(person) => setLog(`profil serveur ${person.id}`)}
          onSearch={async (q) => strangers.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))}
          onAddFriend={async (id) => setLog(`demande ${id}`)}
          onRespond={async (id, kind, accept) => {
            if (options.has("erreur")) throw new Error("Cette interaction est indisponible.");
            setLog(`${accept ? "accepter" : "refuser"} ${kind} ${id}`);
            setContacts((list) => list.map((c) => c.id !== id ? c : {
              ...c,
              relationRequests: c.relationRequests?.filter((pending) => pending !== kind),
              ...(kind === "friend" && { friendRequest: false, friend: accept || c.friend }),
            }));
          }} />
      </div>
      <output data-testid="log">{log}</output>
    </main>
  );
}
createRoot(document.getElementById("fixture")!).render(<Fixture />);
