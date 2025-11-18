// Logo component with brand styling
// Displays a text-based logo

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
  // Text sizes for different logo sizes
  const textSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };
  
  const taglineSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  const textColor = variant === 'white' || variant === 'dark' 
    ? 'text-white' 
    : 'text-navy-500';
  
  return (
    <div className="flex flex-col items-start">
      <div className={`font-bold font-display ${textSizes[size]} ${textColor}`}>
        Solar Calculator Canada
      </div>
      {showTagline && (
        <div className={`${taglineSizes[size]} ${variant === 'white' || variant === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
          Free Solar Estimate Tool
        </div>
      )}
    </div>
  );
}

