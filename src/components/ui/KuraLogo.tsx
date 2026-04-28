'use client'

import { Box } from '@mui/material'

interface KuraLogoProps {
  size?: number
  showWordmark?: boolean
  animate?: boolean
}

const KuraLogo = ({ size = 64, showWordmark = true, animate = true }: KuraLogoProps) => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, color: 'text.primary' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>{`
          .orbit-outer {
            transform-origin: 32px 32px;
            animation: ${animate ? 'orbit-pulse 3s ease-in-out infinite' : 'none'};
          }
          .orbit-inner {
            transform-origin: 32px 32px;
            animation: ${animate ? 'orbit-pulse 3s ease-in-out infinite 0.4s' : 'none'};
          }
          .orbit-core {
            animation: ${animate ? 'core-glow 3s ease-in-out infinite' : 'none'};
          }
          .orbit-dot-top {
            transform-origin: 32px 32px;
            animation: ${animate ? 'dot-orbit 4s linear infinite' : 'none'};
          }
          .orbit-dot-br {
            transform-origin: 32px 32px;
            animation: ${animate ? 'dot-orbit 4s linear infinite 1.3s' : 'none'};
          }
          .orbit-dot-bl {
            transform-origin: 32px 32px;
            animation: ${animate ? 'dot-orbit 4s linear infinite 2.6s' : 'none'};
          }
          @keyframes orbit-pulse {
            0%, 100% { opacity: 0.3; }
            50%       { opacity: 1; }
          }
          @keyframes core-glow {
            0%, 100% { r: 5; opacity: 0.8; }
            50%       { r: 7; opacity: 1; }
          }
          @keyframes dot-orbit {
            0%   { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>

        {/* Outer ring */}
        <circle
          className="orbit-outer"
          cx="32" cy="32" r="28"
          stroke="currentColor"
          strokeOpacity={0.25}
          strokeWidth="1"
        />

        {/* Inner dashed ring */}
        <circle
          className="orbit-inner"
          cx="32" cy="32" r="18"
          stroke="currentColor"
          strokeOpacity={0.4}
          strokeWidth="0.75"
          strokeDasharray="2 3"
        />

        {/* Core dot */}
        <circle
          className="orbit-core"
          cx="32" cy="32" r="5"
          fill="currentColor"
        />

        {/* Orbiting dots */}
        <g className="orbit-dot-top">
          <circle cx="32" cy="4" r="4" fill="currentColor" opacity="1" />
        </g>
        <g className="orbit-dot-br">
          <circle cx="56.9" cy="46" r="2.5" fill="currentColor" opacity="0.7" />
        </g>
        <g className="orbit-dot-bl">
          <circle cx="7.1" cy="46" r="2.5" fill="currentColor" opacity="0.5" />
        </g>
      </svg>

      {showWordmark && (
        <svg
          width={size * 0.94}
          height={size * 0.25}
          viewBox="0 0 60 16"
        >
          <text
            x="30"
            y="13"
            textAnchor="middle"
            fontSize="13"
            fill="currentColor"
            fontFamily="Georgia, serif"
            fontWeight="400"
            letterSpacing="5"
          >
            KURA
          </text>
        </svg>
      )}
    </Box>
  )
}

export default KuraLogo
