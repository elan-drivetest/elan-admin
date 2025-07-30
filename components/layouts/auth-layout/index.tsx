// components/layouts/auth-layout/index.tsx
'use client';

import React from 'react';
import Image from 'next/image';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  logoSrc?: string;
  logoAlt?: string;
  logoWidth?: number;
  logoHeight?: number;
  logoWhiteSrc?: string; // White version for hero section
  heroImage?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroFeatures?: string[];
  footerText?: string;
  // Hide/Show Options
  showHeroTitle?: boolean;
  showHeroSubtitle?: boolean;
  showHeroFeatures?: boolean;
  showHeroLogo?: boolean;
  showMobileLogo?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showFooter?: boolean;
  showHeroImage?: boolean;
  // Styling Options
  heroGradientFrom?: string;
  heroGradientTo?: string;
  heroImageOpacity?: string;
  logoClassName?: string;
  heroLogoClassName?: string;
}

export default function AuthLayout({ 
  children, 
  title, 
  subtitle,
  showLogo = true,
  logoSrc = "/elan-logo.svg",
  logoAlt = "Elan Logo",
  logoWidth = 120,
  logoHeight = 40,
  logoWhiteSrc = "/elan-logo.svg",
  heroImage = "/hero/cta-image.png",
  heroTitle = "Connect your entire supply chain from freight through fulfillment",
  heroSubtitle = "With instant pricing and booking, it only takes two minutes to set up and no credit card required. Get started now!",
  heroFeatures = [
    "Instant setup in 2 minutes",
    "No credit card required", 
    "Enterprise-grade security"
  ],
  footerText = "© 2025 Elan Road Test Rental. All rights reserved.",
  // Hide/Show Options
  showHeroTitle = true,
  showHeroSubtitle = true,
  showHeroFeatures = true,
  showHeroLogo = true,
  showMobileLogo = true,
  showTitle = true,
  showSubtitle = true,
  showFooter = true,
  showHeroImage = true,
  // Styling Options
  heroGradientFrom = "from-green-600",
  heroGradientTo = "to-green-800",
  heroImageOpacity = "opacity-30",
  logoClassName = "h-10 w-auto",
  heroLogoClassName = "h-12 w-auto"
}: AuthLayoutProps) {
  
  // Helper function to render logo with SVG support
  const renderLogo = (src: string, alt: string, width: number, height: number, className: string) => {
    if (src.endsWith('.svg')) {
      return (
        <div className={`${className} flex items-center justify-center`}>
          <svg 
            width={width} 
            height={height} 
            className={className}
            style={{ width: `${width}px`, height: `${height}px` }}
          >
            <image href={src} width={width} height={height} />
          </svg>
        </div>
      );
    }
    
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority
      />
    );
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Image & Content (Hidden on mobile, visible on lg+) */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden">
        {/* Background Image */}
        {showHeroImage && heroImage && (
          <div className="absolute inset-0">
            <Image
              src={heroImage}
              alt="Auth Hero Background"
              fill
              className={`object-cover ${heroImageOpacity}`}
              priority
              quality={100}
              onError={(e) => {
                console.warn('Hero image failed to load:', heroImage);
                // Hide the image container on error
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        )}
        
        {/* Gradient Overlay - Always show for consistent styling */}
        <div className={`absolute inset-0 bg-gradient-to-br ${heroGradientFrom} via-green-700 ${heroGradientTo} ${showHeroImage && heroImage ? 'opacity-85' : 'opacity-100'}`} />
        
        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/10 to-white/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent)] bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent)]" />
        
        {/* Hero Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 py-12 text-white">
          <div className="max-w-md xl:max-w-lg">
            {/* Logo for left side */}
            {showHeroLogo && (
              <div className="mb-8">
                {renderLogo(logoWhiteSrc, logoAlt, 140, 45, heroLogoClassName)}
              </div>
            )}
            
            {/* Hero Text */}
            {showHeroTitle && heroTitle && (
              <h1 className="text-3xl xl:text-4xl font-bold leading-tight mb-6">
                {heroTitle}
              </h1>
            )}
            
            {showHeroSubtitle && heroSubtitle && (
              <p className="text-lg xl:text-xl text-green-100 mb-8 leading-relaxed">
                {heroSubtitle}
              </p>
            )}
            
            {/* Features List */}
            {showHeroFeatures && heroFeatures && heroFeatures.length > 0 && (
              <div className="space-y-4">
                {heroFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-800" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-green-100">{feature}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="flex-1 flex flex-col justify-center bg-white px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Mobile Logo (visible only on mobile) */}
          {showLogo && showMobileLogo && (
            <div className="text-center lg:hidden mb-8">
              <div className="mx-auto flex items-center justify-center mb-6">
                {renderLogo(logoSrc, logoAlt, logoWidth, logoHeight, logoClassName)}
              </div>
            </div>
          )}

          {/* Welcome Header */}
          <div className="mb-8">
            {showTitle && (
              <h2 className="text-2xl font-bold text-gray-900 lg:text-3xl">
                {title}
              </h2>
            )}
            {showSubtitle && subtitle && (
              <p className="mt-2 text-sm text-gray-600 lg:text-base">
                {subtitle}
              </p>
            )}
          </div>

          {/* Auth Form */}
          <div className="space-y-6">
            {children}
          </div>

          {/* Footer */}
          {showFooter && footerText && (
            <div className="mt-8 text-center text-sm text-gray-500">
              <p>{footerText}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}