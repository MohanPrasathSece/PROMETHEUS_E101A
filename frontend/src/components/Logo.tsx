import { Link } from 'react-router-dom';
import monocleLogo from '@/assets/monocle-logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const heights = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
  };

  return (
    <Link to="/" className="flex items-center group">
      <img 
        src={monocleLogo} 
        alt="Monocle" 
        className={`${heights[size]} w-auto transition-transform duration-300 group-hover:scale-105`}
      />
    </Link>
  );
}
