import { useId } from 'react'

interface AppLogoProps {
  size?: number
  className?: string
}

export function AppLogo({ size = 40, className = '' }: AppLogoProps) {
  const id = useId().replace(/:/g, '')
  const gradId = `appLogoGrad-${id}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
      </defs>
      {/* Rounded square background */}
      <rect width="100" height="100" rx="22" fill={`url(#${gradId})`} />
      {/* Heart outline — clean even stroke */}
      <path
        d="M50 74
           C50 74 20 55 20 35
           C20 24 29 17 38 17
           C43 17 47 20 50 25
           C53 20 57 17 62 17
           C71 17 80 24 80 35
           C80 55 50 74 50 74Z"
        fill="none"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
