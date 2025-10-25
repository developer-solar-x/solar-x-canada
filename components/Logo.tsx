// SolarX Logo component with brand styling
// Displays the company name with proper color scheme

interface LogoProps {
  variant?: 'default' | 'white' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export function Logo({ 
  variant = 'default', 
  size = 'md',
  showTagline = true 
}: LogoProps) {
  // Size classes for the main logo text
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };
  
  // Size classes for the tagline
  const subtitleSizes = {
    sm: 'text-[0.45rem]',
    md: 'text-[0.55rem]',
    lg: 'text-[0.65rem]'
  };
  
  return (
    <div className="flex flex-col">
      {/* Main logo with SOLAR in navy and X in red */}
      <div className={`flex items-center font-bold tracking-tight ${sizeClasses[size]}`}>
        <span className={
          variant === 'white' ? 'text-white' : 
          variant === 'dark' ? 'text-gray-900' : 
          'text-navy-500'
        }>
          SOLAR
        </span>
        <span className={
          variant === 'white' ? 'text-white' : 
          'text-red-500'
        }>
          X
        </span>
      </div>
      
      {/* Tagline text */}
      {showTagline && (
        <p className={`${subtitleSizes[size]} tracking-widest font-medium ${
          variant === 'white' ? 'text-white/80' : 'text-gray-500'
        }`}>
          MODERN SOLAR SOLUTIONS
        </p>
      )}
    </div>
  );
}

