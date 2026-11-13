// Compatibility adapter for archived six-body previews and their tests.
import { GarmentDrawing } from "./GarmentDrawing";
import { morphologyFit } from "./morphology-fits";
import type { MorphologyId } from "./model";
import type { PilotSlot } from "./pilot";
export function PilotGarment({
  morphology,
  category,
  pass = "all",
}: {
  morphology: MorphologyId;
  category: PilotSlot;
  pass?: "all" | "front" | "back";
}) {
  return (
    <GarmentDrawing
      geometry={morphologyFit(morphology)}
      category={category}
      pass={pass}
    />
  );
}
