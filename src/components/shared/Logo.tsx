import React from 'react';
import { HeartPulse } from 'lucide-react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  iconSize?: number;
  textSize?: string;
}

export const Logo: React.FC<LogoProps> = ({ className, iconSize = 28, textSize = "text-2xl" }) => {
  return (
    <Link href="/" className={`flex items-center gap-2 text-primary ${className}`}>
      <HeartPulse size={iconSize} />
      <span className={`font-headline font-bold ${textSize}`}>MediSync Now</span>
    </Link>
  );
};
