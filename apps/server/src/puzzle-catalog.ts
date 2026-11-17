import type { PuzzlePhoto } from "../../../packages/domain/src/puzzle.ts";

export const puzzleCatalog: readonly (PuzzlePhoto & { active: boolean })[] = [
  { id: "photo-01", name: "Sous la lumière bleue", width: 1200, height: 1200, active: true },
  { id: "photo-02", name: "Oreilles aux aguets", width: 1200, height: 1200, active: true },
  { id: "photo-03", name: "Sur le perchoir", width: 1200, height: 1200, active: true },
  { id: "photo-04", name: "La pause sur la commode", width: 1200, height: 1200, active: true },
  { id: "photo-05", name: "Pattes étendues", width: 1200, height: 1200, active: true },
  { id: "photo-06", name: "Bain de soleil", width: 1200, height: 1200, active: true },
  { id: "photo-07", name: "Sieste dans la rue", width: 1200, height: 1200, active: true },
  { id: "photo-08", name: "Armin", width: 1200, height: 1200, active: true },
  { id: "photo-09", name: "Le chat noir et blanc", width: 1200, height: 1200, active: true },
  { id: "photo-10", name: "Les grandes oreilles", width: 1200, height: 1200, active: true },
  { id: "photo-11", name: "Dans l’allée", width: 1200, height: 1200, active: true },
  { id: "photo-12", name: "Une petite boule de poils", width: 1200, height: 1200, active: true },
  { id: "photo-13", name: "À la gamelle", width: 1200, height: 1200, active: true },
  { id: "photo-14", name: "Le chiot dans le jardin", width: 1200, height: 1200, active: true },
  { id: "photo-15", name: "Museau dans l’herbe", width: 1200, height: 1200, active: true },
  { id: "photo-16", name: "En voiture", width: 1200, height: 1200, active: true },
];
