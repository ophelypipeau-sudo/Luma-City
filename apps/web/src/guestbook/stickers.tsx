/**
 * Scrapbook stickers for the guestbook's left page, drawn in SVG so they stay
 * sharp at any size: outlined stars, a lipstick kiss and a strip of hearts.
 */

const star = "M50 6 L62 37 L95 38 L69 58 L78 91 L50 72 L22 91 L31 58 L5 38 L38 37 Z";

export function StarSticker({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="-8 -8 116 116" aria-hidden="true">
      <path d={star} fill="#f4f1f6" stroke="#f4f1f6" strokeWidth="22" strokeLinejoin="round" />
      <path d={star} fill="#d9d4de" stroke="#d9d4de" strokeWidth="10" strokeLinejoin="round" opacity=".5" />
      <path d={star} fill="none" stroke="#1d1720" strokeWidth="7" strokeLinejoin="round" />
      <path d="M40 30 L46 34" stroke="#1d1720" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export function KissSticker({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 90" aria-hidden="true">
      <defs>
        <pattern id="kiss-lines" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(80)">
          <rect width="5" height="5" fill="transparent" />
          <rect width="1.4" height="5" fill="#fbe1ea" opacity=".75" />
        </pattern>
      </defs>
      <path d="M6 46 C16 30 32 20 46 24 C52 25 56 29 60 34 C64 29 68 25 74 24 C88 20 104 30 114 46 C94 50 78 48 60 50 C42 48 26 50 6 46 Z"
        fill="#e7a0b8" />
      <path d="M6 48 C26 53 42 52 60 54 C78 52 94 53 114 48 C104 68 84 80 60 80 C36 80 16 68 6 48 Z"
        fill="#dd8aa7" />
      <path d="M6 46 C16 30 32 20 46 24 C52 25 56 29 60 34 C64 29 68 25 74 24 C88 20 104 30 114 46 C104 68 84 80 60 80 C36 80 16 68 6 48 Z"
        fill="url(#kiss-lines)" />
      <path d="M12 47 C40 51 80 51 108 47" stroke="#b9587d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

const heart = "M30 52 C10 38 2 26 6 16 C10 6 24 4 30 16 C36 4 50 6 54 16 C58 26 50 38 30 52 Z";

export function HeartsSticker({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 190 70" aria-hidden="true">
      <path d="M4 10 L186 4 L184 64 L8 66 Z" fill="#fff" />
      <path d="M10 14 L180 9 L178 60 L13 61 Z" fill="#f6c9d6" />
      {[0, 1, 2].map((index) => (
        <g key={index} transform={`translate(${16 + index * 55} ${6 + (index % 2) * 4}) rotate(${index * 6 - 6} 30 30)`}>
          <path d={heart} fill="#f2a3b4" stroke="#e0485e" strokeWidth="5" strokeLinejoin="round" />
          <path d={heart} fill="none" stroke="#fff" strokeWidth="1.6" strokeDasharray="3 5" opacity=".7" />
        </g>
      ))}
    </svg>
  );
}
