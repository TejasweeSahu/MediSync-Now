
'use client';

import React from 'react';
import { HeartPulse } from 'lucide-react';
import Link from 'next/link';

export interface LogoProps { // Exporting LogoProps
  className?: string;
  iconSize?: number;
  textSize?: string;
  onLogoClick?: (event?: React.MouseEvent<HTMLAnchorElement>) => void; // Made event optional for cases where it might not be passed
}

export const Logo: React.FC<LogoProps> = ({ className, iconSize = 28, textSize = "text-2xl", onLogoClick }) => {
  const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (onLogoClick) {
      event.preventDefault(); // Prevent default navigation if onLogoClick is provided
      onLogoClick(event);
    }
    // If onLogoClick is not provided, Link's default href behavior will occur.
  };

  return (
    <Link
      href={onLogoClick ? '#' : '/'}
      onClick={onLogoClick ? handleLinkClick : undefined}
      className={`flex items-center gap-2 text-primary ${className}`}
    >
      <HeartPulse size={iconSize} />
      <span className={`font-headline font-bold ${textSize}`}>MediSync Now</span>
    </Link>
  );
};
