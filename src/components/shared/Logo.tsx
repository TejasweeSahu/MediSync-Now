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
      // If onLogoClick is present, make href="#" to signify action, else navigate to home
      href={onLogoClick ? '#' : '/'}
      legacyBehavior
    >
      <a
        className={`flex items-center gap-2 text-primary ${className}`}
        onClick={onLogoClick ? handleLinkClick : undefined}
      >
        <HeartPulse size={iconSize} />
        <span className={`font-headline font-bold ${textSize}`}>MediSync Now</span>
      </a>
    </Link>
  );
};
