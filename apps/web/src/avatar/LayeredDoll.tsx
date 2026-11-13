import { isPunkCut } from "../../../../packages/domain/src/punk-pattern";
import { PunkGarment } from "./PunkGarment";
import { RegisteredGarmentImage } from "./RegisteredGarmentImage";
import { TextileGarment } from "./TextileGarment";
import { materialArt } from "./materials";
import { useId } from "react";
import { useFaceBody } from "./face-customization";
import { GarmentDrawing } from "../cartoon/GarmentDrawing";
import { AVATAR_BASE, FASHION_BASE, type AvatarBodyBase } from "./base";
import { type AvatarSlot, type Garment, type GarmentPass } from "./catalog";
import { equippedPieces, orderedOutfitPieces, validateLayers, type AvatarLayers } from "./model";

export type LayerInspection = "normal" | "body-cutaway" | "garments";

/** This same drawing powers item-only thumbnails and equipped layers. */
export function AvatarGarment({
  piece,
  pass = "all",
  color,
  detailColor,
}: {
  piece: Garment;
  pass?: GarmentPass;
  color?: string;
  detailColor?: string;
}) {
  if (piece.art.kind === "vector") {
    if (piece.art.textile && isPunkCut(piece.art.textile))
      return (
        <PunkGarment
          cut={piece.art.textile}
          color={color}
          detailColor={detailColor}
          pass={pass}
        />
      );
    if (piece.art.textile)
      return pass === "back" ? null : (
        <TextileGarment cut={piece.art.textile} color={color} />
      );
    if (!piece.geometry)
      throw new Error(`Missing vector geometry: ${piece.id}`);
    return (
      <GarmentDrawing
        geometry={piece.geometry}
        category={piece.art.drawing}
        pass={pass}
      />
    );
  }
  return (
    <>
      {pass !== "back" &&
        piece.frontPaths?.map((path, i) => (
          <path
            key={i}
            d={path.d}
            fill={
              piece.secondaryColor &&
              detailColor &&
              /^#[0-9a-f]{6}$/i.test(detailColor)
                ? detailColor
                : path.fill
            }
          />
        ))}
      <RegisteredGarmentImage
        art={materialArt(piece) as Extract<Garment["art"], { kind: "image" }>}
        pass={pass}
        color={piece.colorable ? color : undefined}
        detailColor={detailColor}
      />
    </>
  );
}
export function AvatarItemThumbnail({
  piece,
  color,
  detailColor,
}: {
  piece: Garment;
  color?: string;
  detailColor?: string;
}) {
  return (
    <svg
      className="garment-thumbnail"
      viewBox={piece.crop.join(" ")}
      aria-hidden="true"
    >
      <AvatarGarment piece={piece} color={color} detailColor={detailColor} />
    </svg>
  );
}

/** Native pixels are shared by body, garments, coverage and front-body passes.
 * Future hair/accessory passes can be inserted explicitly before/after body;
 * no uncalibrated wig from the old atlas is applied to this base. */
export function LayeredDoll({
  layers,
  inspection = "normal",
  bodyBase,
  hiddenSlots = [],
  topArt,
  artOverrides,
  presentationPose = "front",
  restMask,
}: {
  layers: AvatarLayers;
  bodyBase?: AvatarBodyBase;
  inspection?: LayerInspection;
  hiddenSlots?: readonly string[];
  topArt?: Garment["art"];
  artOverrides?: Partial<
    Record<import("./catalog").AvatarSlot, Garment["art"]>
  >;
  presentationPose?: "front" | "hand-on-hip" | "heart-hands";
  /** Pose removes resting limbs from skin only, never from lower garments. */
  restMask?: string;
}) {
  const id = useId();
  const bag = orderedOutfitPieces(layers).find((piece) => piece.slot === "bag");
  const handCarry = bag?.handCarry && presentationPose !== "heart-hands";
  validateLayers(layers);
  const pieces = equippedPieces(layers).map((piece) => {
    const { slot, art } = piece;
    return {
      ...piece,
      art: artOverrides?.[slot] ??
        (piece.handCarry && presentationPose === "heart-hands" && art.kind === "image"
          ? { ...art, front: piece.handCarry.shoulder, colorMasks: art.colorMasks && {
              ...art.colorMasks, main: piece.handCarry.shoulderMask ?? art.colorMasks.main,
            } }
          : undefined) ??
        (slot === "top" && piece.id === layers.top ? topArt : undefined) ?? art,
    };
  });
  const base =
    bodyBase ??
    (pieces.some(
      (piece) =>
        piece.id.startsWith("fashion.") || piece.id.startsWith("atelier."),
    )
      ? FASHION_BASE
      : AVATAR_BASE);
  const scale = base.viewHeight / base.height;
  const beltFit = pieces.find((piece) => piece.slot === "bottom")?.beltFit ?? {
    scaleX: 0.92,
    offsetY: -8,
  };
  const offset = (base.viewWidth - base.width * scale) / 2;
  const strapless = pieces.some(
    (p) => (p.slot === "top" || p.slot === "top2") && p.underwearCut === "strapless",
  );
  const lowRise = pieces.some(
    (p) => p.slot === "bottom" && p.underwearCut === "low-rise",
  );
  const underwear =
    strapless && lowRise
      ? "combined"
      : strapless
        ? "strapless"
        : lowRise
          ? "low-rise"
          : null;
  const fittedBody =
    base.id === FASHION_BASE.id && presentationPose !== "heart-hands"
      ? pieces.find((piece) => piece.slot === "top")?.fittingBody?.[
          presentationPose
        ]
      : undefined;
  const fittedLowRise = fittedBody && lowRise;
  const orderedPieces = orderedOutfitPieces(layers, pieces).reverse();
  const bottomPiece = [...orderedPieces].reverse().find((piece) => piece.slot === "bottom");
  const bottomIndex = bottomPiece ? orderedPieces.indexOf(bottomPiece) : -1;
  const tuckedIds = new Set(orderedPieces.slice(0, Math.max(0, bottomIndex))
    .filter((piece) => (piece.slot === "top" || piece.slot === "top2") && !piece.isDress &&
      (layers.pieceOrder?.includes(piece.id) || piece.id === layers.top && layers.topTucked ||
        piece.slot === "top2" && layers.layerOrder))
    .map((piece) => piece.id));
  const tuckLine = Math.min(820, Math.max(650, (bottomPiece?.crop[1] ?? 690) + 50));
  const tuckClip = (pieceId: string) => tuckedIds.has(pieceId) ? "url(#" + id + "-tucked-top)" : undefined;
  const hairMasks = new Map(orderedPieces.flatMap((piece, index) => {
    if (piece.slot !== "hair" || hiddenSlots.includes(piece.slot)) return [];
    const covers = orderedPieces.slice(index + 1).filter(({ slot }) =>
      (slot === "top" || slot === "top2" || slot === "outerwear") && !hiddenSlots.includes(slot));
    return covers.length ? [[piece.id, { id: `${id}-hair-under-${index}`, covers }] as const] : [];
  }));
  // The combined underwear only differs inside this native-coordinate region.
  // Keep the fitted shoulders and arm when styling the top with a low rise.
  const lowRiseRegion = "M304 690H590V792H304Z";
  const bodySource = fittedBody ?? (base.id === FASHION_BASE.id && underwear
    ? `/assets/avatar/leopard-v1/underwear-${underwear}.png` : base.src);
  const face = base.id === FASHION_BASE.id ? layers.face : undefined;
  const faceBody = useFaceBody(bodySource, face);
  const lowRiseBody = useFaceBody("/assets/avatar/leopard-v1/underwear-combined.png",
    fittedLowRise && face?.skin !== "original" ? face : undefined);
  const image = {
    href: faceBody,
    width: base.width,
    height: base.height,
    preserveAspectRatio: "xMidYMid meet",
    filter: fittedBody ? undefined : `url(#${id}-alpha)`,
  };
  return (
    <g
      data-avatar-version="layered-base-v1"
      data-body={base.id}
      transform={`translate(${offset} 0) scale(${scale})`}
    >
      <defs>
        {hairMasks.size > 0 && (
          <filter id={`${id}-hair-coverage`} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 8 0" />
          </filter>
        )}
        {[...hairMasks.values()].map(({ id: maskId, covers }) => (
          <mask key={maskId} id={maskId} maskUnits="userSpaceOnUse"
            x={0} y={0} width={base.width} height={base.height}>
            <rect width={base.width} height={base.height} fill="white" />
            {covers.map((cover) => (
              <g key={cover.id} clipPath={tuckClip(cover.id)} filter={`url(#${id}-hair-coverage)`}>
                <AvatarGarment piece={cover} pass="front" />
              </g>
            ))}
          </mask>
        ))}
        {tuckedIds.size > 0 && (
          <clipPath id={`${id}-tucked-top`}>
            {bottomPiece?.tuckedTopRegion
              ? <path d={bottomPiece.tuckedTopRegion} />
              : <rect width={base.width} height={tuckLine} />}
            {/* Keep the two sleeve corridors. The edges follow the gap
                between Iris's resting arms and torso on the native canvas. */}
            <path d="M0 600H328L316 625 303 650 298 675 285 700 271 725 256 750 243 775 213 825 188 885 180 1774H0Z" />
            <path d="M887 600H559L572 625 585 650 590 675 600 700 615 725 632 750 646 775 674 825 699 885 707 1774H887Z" />
          </clipPath>
        )}
        {fittedLowRise && (
          <>
            <clipPath id={`${id}-fitted-upper`}>
              <path
                clipRule="evenodd"
                d={`M0 0H887V1774H0Z ${lowRiseRegion}`}
              />
            </clipPath>
            <clipPath id={`${id}-fitted-low-rise`}>
              <path d={lowRiseRegion} />
            </clipPath>
          </>
        )}
        <mask
          id={`${id}-restored-hands`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="887"
          height="1774"
        >
          <rect width="887" height="1774" fill="white" />
          {handCarry && <path d="M0 870H230V1010H0Z" fill="black" />}
        </mask>
        <filter id={`${id}-coverage-ink`} colorInterpolationFilters="sRGB">
          <feFlood floodColor="black" />
          <feComposite in2="SourceAlpha" operator="in" />
        </filter>
        <filter id={`${id}-alpha`} colorInterpolationFilters="sRGB">
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0 0 .6 1" />
          </feComponentTransfer>
        </filter>
        <mask
          id={`${id}-body`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width={base.width}
          height={base.height}
        >
          <rect width={base.width} height={base.height} fill="white" />
          <g fill="black" data-layer="body-coverage">
            {handCarry && <path d="M0 870H230V1010H0Z" />}
            {pieces
              .filter((piece) => piece.bodyMask)
              .map((piece) => (
                <image
                  key={piece.id}
                  href={piece.bodyMask}
                  clipPath={tuckClip(piece.id)}
                  width="887"
                  height="1774"
                />
              ))}
            {pieces
              .filter((piece) => piece.coverageFromArt)
              .map((piece) => (
                <g key={piece.id} filter={`url(#${id}-coverage-ink)`} clipPath={tuckClip(piece.id)}>
                  <AvatarGarment piece={piece} pass="front" />
                </g>
              ))}
            {pieces.flatMap((piece) =>
              piece.coverage.map((d, i) => (
                <path key={`${piece.id}-${i}`} d={d} clipPath={tuckClip(piece.id)} />
              )),
            )}
          </g>
        </mask>
        {pieces
          .filter((piece) => piece.foreground)
          .map((piece) => (
            <g key={piece.id}>
              <clipPath id={`${id}-${piece.id}-region`}>
                <path d={piece.foreground!.region} />
              </clipPath>
              <clipPath id={`${id}-${piece.id}-overlap`}>
                <path d={piece.foreground!.overlap} />
              </clipPath>
            </g>
          ))}
      </defs>
      {inspection === "normal" &&
        (layers.layerOrder || layers.pieceOrder || layers.extraPieces?.length ? orderedPieces : pieces)
          .filter((piece) => !hiddenSlots.includes(piece.slot))
          .map((piece) => (
            <g key={piece.id} data-layer={`${piece.slot}-back`} data-hit-piece={piece.id} clipPath={tuckClip(piece.id)}>
              <AvatarGarment
                piece={piece}
                pass="back"
                color={layers.colors?.[piece.id]}
                detailColor={layers.detailColors?.[piece.id]}
              />
            </g>
          ))}
      {inspection !== "garments" && (
        <g data-hit-body="" mask={restMask && !fittedBody ? `url(#${restMask})` : undefined}>
          <g mask={`url(#${id}-body)`}>
            <image
              {...image}
              data-layer="body"
              clipPath={fittedLowRise ? `url(#${id}-fitted-upper)` : undefined}
            />
            {fittedLowRise && (
              <image
                {...image}
                href={lowRiseBody}
                clipPath={`url(#${id}-fitted-low-rise)`}
              />
            )}
          </g>
        </g>
      )}
      {orderedPieces.map((piece) => {
          const { slot } = piece;
          const hairMask = hairMasks.get(piece.id);
          return (
              <g key={piece.id}>
                {inspection !== "body-cutaway" &&
                  !hiddenSlots.includes(slot) && (
                    <g
                      data-layer={slot}
                      data-piece={piece.id}
                      mask={hairMask && `url(#${hairMask.id})`}
                      clipPath={tuckClip(piece.id)}
                      transform={
                        slot === "belt"
                          ? `translate(${base.width / 2} ${beltFit.offsetY}) scale(${beltFit.scaleX} 1) translate(${-base.width / 2} 0)`
                          : undefined
                      }
                    >
                      <AvatarGarment
                        piece={piece}
                        pass="front"
                        color={layers.colors?.[piece.id]}
                        detailColor={layers.detailColors?.[piece.id]}
                      />
                    </g>
                  )}
                {inspection !== "garments" && piece.foreground && (
                  <g mask={restMask ? `url(#${restMask})` : undefined}>
                    <g
                      data-layer={`${slot}-body-front`}
                      clipPath={`url(#${id}-${piece.id}-overlap)`}
                      mask={`url(#${id}-restored-hands)`}
                    >
                      <image
                        {...image}
                        clipPath={`url(#${id}-${piece.id}-region)`}
                      />
                    </g>
                  </g>
                )}
              </g>
          );
        })}
      {inspection === "normal" && handCarry && (
        <image
          data-pose-part="closed-bag-grip"
          href={bag!.handCarry!.hand}
          width="887"
          height="1774"
        />
      )}
    </g>
  );
}
