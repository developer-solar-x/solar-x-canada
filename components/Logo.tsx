import Image from 'next/image'

interface LogoProps {
  variant?: 'default' | 'white' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  framed?: boolean;
}

export function Logo({ 
  variant = 'default', 
  size = 'md',
  showTagline = false,
  framed = true,
}: LogoProps) {
  const dimensions: Record<NonNullable<LogoProps['size']>, { height: number; paddingX: string }> = {
    sm: { height: 60, paddingX: 'px-3' },
    md: { height: 100, paddingX: 'px-4' },
    lg: { height: 120, paddingX: 'px-5' },
  }

  const taglineSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  const { height, paddingX } = dimensions[size]

  const containerBorder =
    variant === 'white' || variant === 'dark'
      ? 'border-white/20 shadow-md'
      : 'border-emerald-100 shadow-sm'

  const isFramed = framed && (variant === 'white' || variant === 'dark')

  return (
    <div className="flex flex-col items-start">
      <div
        className={`inline-flex items-center justify-center overflow-hidden ${
          isFramed
            ? `rounded-lg bg-white ${containerBorder} ${paddingX} h-12 md:h-16`
            : 'bg-transparent'
        }`}
        style={!isFramed ? { height: `${height}px` } : {}}
      >
        <Image
          src="/logo.png"
          alt="Solar Calculator Canada"
          height={height}
          width={height * 5}
          priority={size === 'lg'}
          className={`object-contain ${isFramed ? 'h-full w-auto' : 'w-auto'}`}
          style={!isFramed ? { height: `${height}px`, width: 'auto' } : {}}
        />
      </div>
      {showTagline && (
        <div
          className={`${taglineSizes[size]} ${
            variant === 'white' || variant === 'dark' ? 'text-gray-300' : 'text-gray-600'
          } mt-1`}
        >
          Free Solar Estimate Tool
        </div>
      )}
    </div>
  );
}

