// SolarX Logo component with brand styling
// Displays the company logo image

import Image from 'next/image'

interface LogoProps {
  variant?: 'default' | 'white' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export function Logo({ 
  variant = 'default', 
  size = 'md',
  showTagline = false 
}: LogoProps) {
  // Size dimensions for the logo image (maintaining aspect ratio ~3:1)
  const sizeDimensions = {
    sm: { width: 120, height: 40 },
    md: { width: 180, height: 60 },
    lg: { width: 240, height: 80 }
  };
  
  const dimensions = sizeDimensions[size];
  
  return (
    <div className="flex items-center">
      {/* Logo image - works best on dark backgrounds as designed */}
      <div className={`relative ${
        variant === 'white' || variant === 'dark' 
          ? 'bg-transparent' 
          : 'bg-transparent'
      }`}>
        <Image 
          src="/SolarXLogo cropped.png"
          alt="SolarX - Modern Solar Solutions"
          width={dimensions.width}
          height={dimensions.height}
          priority
          className="object-contain"
          style={{ 
            maxWidth: '100%',
            height: 'auto'
          }}
        />
      </div>
    </div>
  );
}

