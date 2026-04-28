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
          @keyframes orbit-pulse {
            0%, 100% { opacity: 0.3; }
            50%       { opacity: 1; }
          }
          @keyframes core-glow {
            0%, 100% { r: 5; opacity: 0.8; }
            50%       { r: 7; opacity: 1; }
          }
        `}</style>

        {/* Outer ring */}
        <circle
          cx="32" cy="32" r="28"
          stroke="currentColor"
          strokeOpacity={0.25}
          strokeWidth="1"
          style={{ animation: animate ? 'orbit-pulse 3s ease-in-out infinite' : 'none' }}
        />

        {/* Inner dashed ring */}
        <circle
          cx="32" cy="32" r="18"
          stroke="currentColor"
          strokeOpacity={0.4}
          strokeWidth="0.75"
          strokeDasharray="2 3"
          style={{ animation: animate ? 'orbit-pulse 3s ease-in-out infinite 0.4s' : 'none' }}
        />

        {/* Core dot */}
        <circle
          cx="32" cy="32" r="5"
          fill="currentColor"
          style={{ animation: animate ? 'core-glow 3s ease-in-out infinite' : 'none' }}
        />

        {/* Orbiting dot — uses SVG-native animateTransform so it travels the ring correctly */}
        <circle cx="32" cy="4" r="4" fill="currentColor">
          {animate && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 32 32"
              to="360 32 32"
              dur="4s"
              repeatCount="indefinite"
            />
          )}
        </circle>

        {/* Trailing dots at 120° offsets */}
        <circle cx="32" cy="4" r="2.5" fill="currentColor" opacity="0.6">
          {animate && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="-120 32 32"
              to="240 32 32"
              dur="4s"
              repeatCount="indefinite"
            />
          )}
        </circle>
        <circle cx="32" cy="4" r="2.5" fill="currentColor" opacity="0.3">
          {animate && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="-240 32 32"
              to="120 32 32"
              dur="4s"
              repeatCount="indefinite"
            />
          )}
        </circle>
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
