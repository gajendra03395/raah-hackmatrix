// RAAH brand mark — a routing pin over a dotted approach path, in a rounded
// accent badge. Crisp at small sizes; the gradient reads on both light and dark
// headers so it needs no per-theme variants. Used in the header and elsewhere
// the wordmark appears.

import { useId } from "react";

export function LogoMark({ size = 34, className = "", title = "RAAH" }) {
  const id = useId();
  const g = `raah-logo-${id}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label={title}
    >
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5A8DF5" />
          <stop offset="1" stopColor="#274FA6" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${g})`} />
      {/* dotted approach route from the start node up to the destination */}
      <path
        d="M7.5 23.5 C 12 23.5 12.5 19 16.5 18"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="0.1 4"
        opacity="0.85"
      />
      {/* start node */}
      <circle cx="7.5" cy="23.5" r="2.5" fill="#fff" />
      {/* destination pin */}
      <path
        d="M20 5.6 c-3.5 0-6.4 2.8-6.4 6.3 0 4.6 6.4 9.5 6.4 9.5 s6.4-4.9 6.4-9.5 C26.4 8.4 23.5 5.6 20 5.6 z"
        fill="#fff"
      />
      <circle cx="20" cy="11.9" r="2.5" fill={`url(#${g})`} />
    </svg>
  );
}

export default LogoMark;
