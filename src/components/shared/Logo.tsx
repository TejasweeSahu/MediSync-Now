
import React from 'react';
import { HeartPulse } from 'lucide-react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
  onLogoClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}

export const Logo: React.FC<LogoProps> = ({ className, iconSize = 28, textSize = "text-2xl", onLogoClick }) => {
  const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (onLogoClick) {
      event.preventDefault();
      onLogoClick(event);
    }
    // If onLogoClick is not provided, Link default behavior (navigation) occurs
  };

  return (
    <Link
      href={onLogoClick ? '#' : '/'} // Change href if onLogoClick is intended to override navigation
      className={`flex items-center gap-2 text-primary ${className}`}
      onClick={handleLinkClick}
    >
      <HeartPulse size={iconSize} />
      <span className={`font-headline font-bold ${textSize}`}>MediSync Now</span>
    </Link>
  );
};
