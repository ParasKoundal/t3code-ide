import type { SVGProps } from "react";

export interface T3AppLogoProps extends SVGProps<SVGSVGElement> {
  size?: number | string;
  showBackground?: boolean;
}

export function T3AppLogo({
  size = 24,
  showBackground = true,
  className,
  ...props
}: T3AppLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        <linearGradient id="t3-ide-bg-c" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#141726" />
          <stop offset="50%" stop-color="#0a0c14" />
          <stop offset="100%" stop-color="#050608" />
        </linearGradient>
        <linearGradient id="t3-ide-rim-c" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.5" />
          <stop offset="50%" stop-color="#818cf8" stop-opacity="0.25" />
          <stop offset="100%" stop-color="#f43f5e" stop-opacity="0.35" />
        </linearGradient>
        <linearGradient id="t3-prism-top-c" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="100%" stop-color="#22d3ee" />
        </linearGradient>
        <linearGradient id="t3-prism-left-c" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8" />
          <stop offset="50%" stop-color="#6366f1" />
          <stop offset="100%" stop-color="#4338ca" />
        </linearGradient>
        <linearGradient id="t3-prism-right-c" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stop-color="#c084fc" />
          <stop offset="50%" stop-color="#a855f7" />
          <stop offset="100%" stop-color="#ec4899" />
        </linearGradient>
        <linearGradient id="t3-prism-stem-c" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#cbd5e1" />
        </linearGradient>
      </defs>

      {showBackground && (
        <rect
          x="24"
          y="24"
          width="464"
          height="464"
          rx="112"
          fill="url(#t3-ide-bg-c)"
          stroke="url(#t3-ide-rim-c)"
          strokeWidth="3"
        />
      )}

      {/* The Quantum Code Crystal Emblem */}
      <g>
        {/* Left Bracket Ribbon: Vector < */}
        <path
          d="M 236 136 L 136 196 V 316 L 236 376 V 316 L 186 286 V 226 L 236 196 Z"
          fill="url(#t3-prism-left-c)"
        />

        {/* Top Cap of T / Isometric Prism Top */}
        <path
          d="M 236 136 L 276 136 L 376 196 L 326 226 L 276 196 L 236 196 Z"
          fill="url(#t3-prism-top-c)"
        />

        {/* Right 3-Bracket Ribbon: Vector > and '3' */}
        <path
          d="M 276 196 L 326 226 V 246 L 266 256 L 326 266 V 286 L 276 316 V 376 L 376 316 V 196 L 276 136 Z"
          fill="url(#t3-prism-right-c)"
          opacity="0.95"
        />

        {/* Central Pillar of T / Quantum Cursor */}
        <path
          d="M 244 206 H 268 V 348 H 244 Z"
          fill="url(#t3-prism-stem-c)"
          rx="2"
          opacity="0.95"
        />

        {/* Terminal Nodes */}
        <circle cx="136" cy="196" r="6" fill="#38bdf8" />
        <circle cx="376" cy="196" r="6" fill="#c084fc" />
        <circle cx="256" cy="388" r="5" fill="#818cf8" />
      </g>
    </svg>
  );
}
