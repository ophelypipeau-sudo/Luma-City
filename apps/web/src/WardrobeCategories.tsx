import type { Garment } from "./avatar/catalog";

const icons = {
  socks: "M8 3h9v10q0 2-2 4l-5 4a4 4 0 0 1-5-6l3-2z M8 7h9",
  all: "M4 4h6v6H4z M14 4h6v6h-6z M4 14h6v6H4z M14 14h6v6h-6z",
  tops: "M8 3 3 6l-2 4 4 2 2-3v12h10V9l2 3 4-2-2-4-5-3Q12 6 8 3Z M8 3q4 7 8 0",
  dresses: "M7 3h3q0 4 2 4t2-4h3l1 7-2 2 5 8q-9 4-18 0l5-8-2-2Z M8 12h8 M9 14l-2 7 M15 14l2 7",
  skirts: "M7 4q5 1 10 0l5 15q-10 5-20 0Z M6 7q6 2 12 0 M8 9l-3 11 M11 9l-1 12 M14 9l1 12 M17 9l3 11",
  shorts: "M6 4q6 1 12 0l3 13-7 2-2-7-2 7-7-2Z M6 7q6 1 12 0 M12 7v5",
  bottoms: "M6 3q6 1 12 0l3 18-7 1-2-13-2 13-7-1Z M6 6q6 1 12 0 M11 6v4 M7 6q0 3-2 4 M17 6q0 3 2 4",
  shoes: "M2 16q0-2 4-3l3-2 2-5 4 1 2 5 4 2q2 1 2 4v1q-2 2-9 2H5q-4 0-3-5Z M2 17q4 2 10 1l10-2 M9 11l5 1 M10 9l4 1 M6 13q4 0 5 4",
  accessories: "M2 9q1-2 4-2 1-5 6-5t6 5q4 0 4 2t-10 3T2 9Z M6 7q6-2 12 0 M3 17q4-2 8 0h2q4-2 8 0l-2 4q-4 3-6-3h-2q-2 6-6 3Z",
  hair: "M8 18q-4 0-4-6 0-6 6-8 7-2 10 4 3 5-2 10 1-4-2-7-3-1-4-5-1 4-5 6-1 4 1 6Z M10 13q0 5 3 6l1 3 M13 4q1-4 5-3 3 1 3 4l-1 3 M8 8q-3 4-3 7",
} as const;

export const wardrobeCategories = [
  { id: "all", label: "Tout" },
  { id: "tops", label: "Hauts" },
  { id: "dresses", label: "Robes" },
  { id: "skirts", label: "Jupes" },
  { id: "bottoms", label: "Pantalons" },
  { id: "shorts", label: "Shorts" },
  { id: "shoes", label: "Chaussures" },
  { id: "socks", label: "Chaussettes" },
  { id: "accessories", label: "Accessoires" },
  { id: "hair", label: "Cheveux" },
] as const;

export type WardrobeCategory = keyof typeof icons;

export function matchesWardrobeCategory(category: WardrobeCategory, piece: Garment) {
  if (category === "all") return true;
  if (piece.isDress) return category === "dresses";
  switch (piece.slot) {
    case "top":
    case "outerwear":
      return category === "tops";
    case "bottom":
      if (piece.id.includes("skirt")) return category === "skirts";
      if (piece.id.includes("short")) return category === "shorts";
      return category === "bottoms";
    case "legwear":
      return category === "socks";
    case "hair":
    case "shoes":
      return category === piece.slot;
    default:
      return category === "accessories";
  }
}

export function WardrobeCategoryIcon({ category }: { category: WardrobeCategory }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="26" height="26" fill="none"
    stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round">
    <path d={icons[category]} />
  </svg>;
}
