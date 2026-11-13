import {
  homeOwner,
  type Character,
  type RoomId,
} from "../../../packages/contracts/src/index";

export const chatRooms: Record<RoomId, { name: string; background: string }> = {
  greenhouse: {
    name: "La serre",
    background: "/assets/chat-rooms/serre.webp",
  },
  fountain: {
    name: "La fontaine fleurie",
    background: "/assets/chat-rooms/fontaine.webp",
  },
  terrace: {
    name: "La terrasse de l’animalerie",
    background: "/assets/chat-rooms/terrasse.webp",
  },
};

export function roomScene(id: RoomId, characters: readonly Character[]) {
  const ownerId = homeOwner(id);
  if (!ownerId) return chatRooms[id];
  const owner = characters.find((character) => character.id === ownerId);
  return {
    name: owner ? `Maison de ${owner.name}` : "Maison",
    background: "",
    color: owner?.color ?? "#b685b5",
  };
}
