import React from 'react';
import Image from 'next/image';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'light' | 'dark' | 'grey';
  showText?: boolean;
  className?: string;
}

export function Logo({ size = 'medium', variant = 'grey', showText = true, className = '' }: LogoProps) {
  const sizeStyles = {
    small: { width: 120, height: 36 },
    medium: { width: 160, height: 48 },
    large: { width: 200, height: 60 },
  };

  const currentSize = sizeStyles[size];

  // Use HOMMIE_LOGO TYPE II [BLUE].png as the main logo
  // Next.js Image component handles spaces in filenames automatically
  const logoSrc = '/HOMMIE_LOGO TYPE II [BLUE].png';
  
  return (
    <div 
      className={`flex items-center justify-center ${className}`}
    >
      <Image
        src={logoSrc}
        alt="Hommie Logo"
        width={currentSize.width}
        height={currentSize.height}
        priority
        style={{ objectFit: 'contain', width: 'auto', height: 'auto' }}
      />
    </div>
  );
}
