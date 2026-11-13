import { useState } from "react";
import type { Character } from "../../../packages/contracts/src/index";
import { fittingPieceAt } from "./shop/fitting-hit";
import { Portrait } from "./Avatar";
import { avatarGarment } from "./avatar/catalog";
import { AvatarItemThumbnail } from "./avatar/LayeredDoll";
import { removeGarment, wornSlot, type AvatarLayers } from "./avatar/model";
import { OutfitLayerPanel } from "./avatar/OutfitLayerPanel";
import {
  equipPurchasedItem,
  variantKey,
  type PurchasedItem,
} from "./shop/commerce";

import { matchesWardrobeCategory, wardrobeCategories, WardrobeCategoryIcon, type WardrobeCategory } from "./WardrobeCategories";

export function ProfileWardrobe({
  character,
  equipped,
  items,
  onSave,
}: {
  character: Character;
  equipped: AvatarLayers;
  items: readonly PurchasedItem[];
  onSave: (outfit: AvatarLayers) => void;
}) {
  const [draft, setDraft] = useState(equipped);
  const [category, setCategory] = useState<WardrobeCategory>("all");
  const visibleItems = items
    .map((item) => ({ item, piece: avatarGarment(item.pieceId) }))
    .filter(
      ({ piece }) => matchesWardrobeCategory(category, piece),
    );
  return (
    <div className="profile-wardrobe">
      <div className="profile-wardrobe-catalog">
        <nav
          className="profile-wardrobe-categories"
          aria-label="Catégories du dressing"
        >
          {wardrobeCategories.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              aria-pressed={category === id}
              onClick={() => setCategory(id)}
            >
              <span><WardrobeCategoryIcon category={id} /></span>
              {label}
            </button>
          ))}
        </nav>
        <div
          key={category}
          className="profile-wardrobe-items"
          aria-label="Vêtements achetés"
        >
          {visibleItems.length === 0 && (
            <p>
              {items.length === 0
                ? "Tes vêtements achetés apparaîtront ici."
                : "Aucun article acheté dans cette catégorie."}
            </p>
          )}
          {visibleItems.map(({ item, piece }) => {
            const slot = wornSlot(draft, piece.id);
            const selected =
              slot != null &&
              variantKey(
                piece.id,
                draft.colors?.[piece.id],
                draft.detailColors?.[piece.id],
              ) === item.key;
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={selected}
                onClick={() =>
                  setDraft((current) =>
                    selected
                      ? removeGarment(current, piece.id)
                      : equipPurchasedItem(current, item),
                  )
                }
              >
                <AvatarItemThumbnail
                  piece={piece}
                  color={item.color}
                  detailColor={item.detailColor}
                />
                <span>{piece.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="profile-wardrobe-preview">
        <div className="profile-avatar">
          <Portrait {...character} fullBody layers={draft} onClick={(event) => {
            void fittingPieceAt(event.currentTarget, event.clientX, event.clientY)
              .then((id) => { if (id) setDraft((current) => removeGarment(current, id)); })
              .catch(() => {});
          }} />
          <OutfitLayerPanel layers={draft} onChange={setDraft} />
        </div>
        <button
          type="button"
          disabled={draft === equipped}
          onClick={() => onSave(draft)}
        >
          Enregistrer la tenue
        </button>
      </div>
    </div>
  );
}
