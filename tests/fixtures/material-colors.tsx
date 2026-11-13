import React, { useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import { avatarCatalogSnapshot, subscribeAvatarCatalog } from "../../apps/web/src/avatar/catalog";
import { archivedPieces, subscribeArchive, visibleShopPieces } from "../../apps/web/src/avatar/archive";
import { AvatarItemThumbnail } from "../../apps/web/src/avatar/LayeredDoll";
const colors = [
  { label: "Original", main: undefined, detail: undefined },
  { label: "Blanc", main: "#ffffff", detail: "#175496" },
  { label: "Rose", main: "#ff80bf", detail: "#d7ad54" },
  { label: "Noir", main: "#151515", detail: "#58ad91" },
] as const;
const size = 7;
function AuditBoard() {
  const [page, setPage] = useState(0);
  const catalog = useSyncExternalStore(subscribeAvatarCatalog, avatarCatalogSnapshot);
  const archived = useSyncExternalStore(subscribeArchive, archivedPieces);
  const pieces = visibleShopPieces(catalog, archived);
  const pageCount = Math.ceil(pieces.length / size);
  const currentPage = Math.min(page, Math.max(0, pageCount - 1));
  return (
    <main style={{ padding: 14, maxWidth: 1150, margin: "auto" }}>
      <h1>Matières · articles en boutique</h1>
      <p>
        Original, blanc, rose et noir. La seconde matière utilise une teinte
        distincte quand elle existe.
      </p>
      <nav aria-label="Pages du dressing">
        {Array.from({ length: pageCount }, (_, i) => (
          <button key={i} aria-pressed={currentPage === i} onClick={() => setPage(i)}>
            {i + 1}
          </button>
        ))}
      </nav>
      <div id="audit-page">
        {pieces.length === 0 && <p>Aucun article en boutique.</p>}
        {pieces.slice(currentPage * size, (currentPage + 1) * size).map((piece) => (
          <section key={piece.id} data-piece={piece.id}>
            <h2 style={{ fontSize: 15, margin: "8px 0 3px" }}>{piece.name}</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 6,
              }}
            >
              {colors.map(({ label, main, detail }) => (
                <div
                  key={label}
                  style={{
                    background: "#ebe3e8",
                    color: "#382733",
                    borderRadius: 8,
                    padding: 3,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      height: 112,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <AvatarItemThumbnail
                      piece={piece}
                      color={main}
                      detailColor={piece.secondaryColor ? detail : undefined}
                    />
                  </div>
                  <small>{label}</small>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
createRoot(document.getElementById("fixture")!).render(<AuditBoard />);
