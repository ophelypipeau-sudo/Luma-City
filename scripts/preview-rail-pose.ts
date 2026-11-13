import { readFileSync, writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { HIP_ARM_REGION } from "../apps/web/src/avatar/HandOnHipDoll";
const root = "docs/rail-hand-on-hip";
const src = readFileSync(`${root}/front-source.png`).toString("base64");
const sleeve = readFileSync(
  "public/assets/avatar/poses/hand-on-hip-lilac-v1/arm.png",
).toString("base64");
const hand = readFileSync(
  "public/assets/avatar/poses/hand-on-hip-lilac-v2/hand.png",
).toString("base64");
const preview = `<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><defs><mask id="rest"><rect width="887" height="1774" fill="white"/><path d="${HIP_ARM_REGION}" fill="black"/></mask><clipPath id="arm"><path d="${HIP_ARM_REGION}"/></clipPath><clipPath id="hand"><rect y="788" width="887" height="250"/></clipPath><image id="source" width="887" height="1774" href="data:image/png;base64,${src}"/></defs><rect width="887" height="1774" fill="#eadbdc"/><use href="#source" mask="url(#rest)"/><image width="887" height="1774" href="data:image/png;base64,${hand}"/><image width="887" height="1774" href="data:image/png;base64,${sleeve}"/></svg>`;
writeFileSync(`${root}/pose-preview.png`, new Resvg(preview).render().asPng());
