import { Link } from 'react-router-dom';
import monocleLogo from '@/assets/monocle-logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const heights = {
    sm: 'h-10',
    md: 'h-12',
    lg: 'h-14',
    xl: 'h-20',
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
