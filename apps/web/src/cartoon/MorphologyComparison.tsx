import { MorphologyBody } from "./MorphologyBody";
import { MORPHOLOGY_PROPOSALS } from "./morphology-proposals";

/** The board and the calibration fixture render the exact same body components. */
export function MorphologyComparison({ guides = false }: { guides?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="2280"
      height="1210"
      viewBox="0 0 2280 1210"
      role="img"
      aria-label="Proposition comparative des six morphologies X, A, O, H, V et 8 avec la même identité Iris"
      style={{ maxWidth: "100%", height: "auto" }}
    >
      <defs>
        <linearGradient id="morph-board-bg" x2="1" y2="1">
          <stop stopColor="#261c35" />
          <stop offset="1" stopColor="#55416b" />
        </linearGradient>
      </defs>
      <rect width="2280" height="1210" rx="28" fill="url(#morph-board-bg)" />
      <g fontFamily="Arial, sans-serif">
        <text x="48" y="54" fill="#f2d8a4" fontSize="15" letterSpacing="3">
          UN PETIT MONDE · CORPS CARTOON V6
        </text>
        <text x="48" y="112" fill="#fff7ff" fontSize="43" fontWeight="bold">
          Six morphologies, une même identité
        </text>
        <text x="48" y="153" fill="#dacbe8" fontSize="22">
          Iris · visage, mains et pieds identiques · même pose, même échelle ·
          sous-vêtements opaques
        </text>
        <text x="2232" y="54" fill="#ebd5f7" fontSize="16" textAnchor="end">
          PROPOSITION 01 · À VALIDER
        </text>
        {MORPHOLOGY_PROPOSALS.map((profile, i) => (
          <g key={profile.id}>
            <rect
              x={30 + i * 372}
              y="195"
              width="358"
              height="914"
              rx="20"
              fill="#ecd9ff"
              fillOpacity=".045"
              stroke="#b69dc9"
              strokeOpacity=".28"
            />
            <text
              x={209 + i * 372}
              y="241"
              fill="#ffe3ad"
              fontSize="27"
              fontWeight="bold"
              textAnchor="middle"
            >
              {profile.label}
            </text>
            <text
              x={209 + i * 372}
              y="275"
              fill="#d7c9e5"
              fontSize="13.8"
              textAnchor="middle"
            >
              {profile.note}
            </text>
            <path
              d={`M${49 + i * 372} 1074H${367 + i * 372}`}
              stroke="#e6d2f2"
              strokeOpacity=".25"
              strokeDasharray="3 6"
            />
            <svg
              x={35 + i * 372}
              y="300"
              width="348"
              height="774"
              viewBox="0 0 480 1024"
              preserveAspectRatio="xMidYMax meet"
            >
              <MorphologyBody profile={profile} guides={guides} />
            </svg>
          </g>
        ))}
        <text x="48" y="1154" fill="#ffe3ad" fontSize="19" fontWeight="bold">
          X / 8 :
        </text>
        <text x="126" y="1154" fill="#f0e4f8" fontSize="19">
          X : taille creusée et courbe progressive vers les hanches basses. 8 :
          poitrine plus pleine et courbe haute, arrondie, du bassin.
        </text>
        <text x="48" y="1187" fill="#c7b7d6" fontSize="15">
          Chaque corps possède ses contours et ses repères. Proposition de corps
          uniquement ; la tenue pilote sera adaptée après validation.
        </text>
      </g>
    </svg>
  );
}
