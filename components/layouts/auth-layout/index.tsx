// components/layouts/auth-layout.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import Footer from '../Footer';
import { CometCard } from '@/components/ui/comet-card'; // Add this import only

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  logoSrc?: string;
  logoAlt?: string;
  logoWidth?: number;
  logoHeight?: number;
  logoWhiteSrc?: string;
  heroImage?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroFeatures?: string[];
  footerText?: string;
  showHeroTitle?: boolean;
  showHeroSubtitle?: boolean;
  showHeroFeatures?: boolean;
  showHeroLogo?: boolean;
  showMobileLogo?: boolean;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showFooter?: boolean;
  showHeroImage?: boolean;
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
  showHeroTitle = true,
  showHeroSubtitle = true,
  showHeroFeatures = true,
  showHeroLogo = true,
  showMobileLogo = true,
  showTitle = true,
  showSubtitle = true,
  showFooter = true,
  showHeroImage = true,
  heroGradientFrom = "",
  heroGradientTo = "",
  heroImageOpacity = "opacity-30",
  logoClassName = "h-10 w-auto",
  heroLogoClassName = "h-12 w-auto"
}: AuthLayoutProps) {
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden">
      <div className="flex-1 grid lg:grid-cols-2 min-h-0">
        {/* Left Side - Hero Image & Content */}
        <div className="hidden lg:flex p-6 min-h-0 h-full">
          {/* FULL HEIGHT AND WIDTH COMETCARD */}
          <CometCard 
            className="w-full h-full"
            rotateDepth={15}
            translateDepth={15}
          >
            {/* Hero Container - FULL HEIGHT */}
            <div className={`w-full h-full relative rounded-2xl bg-gradient-to-br ${heroGradientFrom} ${heroGradientTo} overflow-hidden`}>
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
                  />
                </div>
              )}
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-black to-green-500/40" />
              
              {/* Decorative Elements - Contained within boundaries */}
              <div className="absolute inset-4">
                <div className="absolute top-16 right-16 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-20 left-12 w-20 h-20 bg-white/5 rounded-full blur-lg"></div>
                <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-white/15 rounded-full blur-md"></div>
              </div>
              
              {/* Hero Content */}
              <div className="relative z-10 flex flex-col justify-center p-8 xl:p-12 h-full text-white">
                <div className="max-w-md space-y-6">
                  {/* Logo */}
                  {showHeroLogo && (
                    <div className="w-fit">
                      <Image
                        src={logoWhiteSrc}
                        alt={logoAlt}
                        width={120}
                        height={32}
                        className="h-8 w-auto brightness-0 invert"
                        priority
                      />
                    </div>
                  )}
                  
                  {/* Hero Text */}
                  {showHeroTitle && heroTitle && (
                    <h1 className="text-3xl xl:text-4xl font-bold leading-tight">
                      {heroTitle}
                    </h1>
                  )}
                  
                  {showHeroSubtitle && heroSubtitle && (
                    <p className="text-lg text-green-100 leading-relaxed opacity-90">
                      {heroSubtitle}
                    </p>
                  )}
                  
                  {/* Features */}
                  {showHeroFeatures && heroFeatures && heroFeatures.length > 0 && (
                    <div className="space-y-3">
                      {heroFeatures.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-green-800" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className="text-green-100 text-sm font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CometCard>
        </div>

        {/* Right Side - Auth Form - KEEP EXACTLY THE SAME */}
        <div className="flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-16 xl:px-20 relative min-h-0">
          <div className="w-full max-w-sm mx-auto lg:max-w-md relative z-10">
            {/* Mobile Logo */}
            {showLogo && showMobileLogo && (
              <div className="text-center lg:hidden mb-6">
                <div className="inline-flex items-center justify-center p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                  <Image
                    src={logoSrc}
                    alt={logoAlt}
                    width={logoWidth}
                    height={logoHeight}
                    className={logoClassName}
                    priority
                  />
                </div>
              </div>
            )}

            {/* Welcome Header */}
            <div className="mb-6">
              {showTitle && (
                <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                  {title}
                </h2>
              )}
              {showSubtitle && subtitle && (
                <p className="text-gray-600 text-sm lg:text-base">
                  {subtitle}
                </p>
              )}
            </div>

            {/* Auth Form */}
            <div className="space-y-4">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer auth={true} />
    </div>
  );
}

















// // components/layouts/auth-layout.tsx
// 'use client';

// import React from 'react';
// import Image from 'next/image';
// import Footer from '../Footer';

// interface AuthLayoutProps {
//   children: React.ReactNode;
//   title: string;
//   subtitle?: string;
//   showLogo?: boolean;
//   logoSrc?: string;
//   logoAlt?: string;
//   logoWidth?: number;
//   logoHeight?: number;
//   logoWhiteSrc?: string;
//   heroImage?: string;
//   heroTitle?: string;
//   heroSubtitle?: string;
//   heroFeatures?: string[];
//   footerText?: string;
//   showHeroTitle?: boolean;
//   showHeroSubtitle?: boolean;
//   showHeroFeatures?: boolean;
//   showHeroLogo?: boolean;
//   showMobileLogo?: boolean;
//   showTitle?: boolean;
//   showSubtitle?: boolean;
//   showFooter?: boolean;
//   showHeroImage?: boolean;
//   heroGradientFrom?: string;
//   heroGradientTo?: string;
//   heroImageOpacity?: string;
//   logoClassName?: string;
//   heroLogoClassName?: string;
// }

// export default function AuthLayout({ 
//   children, 
//   title, 
//   subtitle,
//   showLogo = true,
//   logoSrc = "/elan-logo.svg",
//   logoAlt = "Elan Logo",
//   logoWidth = 120,
//   logoHeight = 40,
//   logoWhiteSrc = "/elan-logo.svg",
//   heroImage = "/hero/cta-image.png",
//   heroTitle = "Connect your entire supply chain from freight through fulfillment",
//   heroSubtitle = "With instant pricing and booking, it only takes two minutes to set up and no credit card required. Get started now!",
//   heroFeatures = [
//     "Instant setup in 2 minutes",
//     "No credit card required", 
//     "Enterprise-grade security"
//   ],
//   footerText = "© 2025 Elan Road Test Rental. All rights reserved.",
//   showHeroTitle = true,
//   showHeroSubtitle = true,
//   showHeroFeatures = true,
//   showHeroLogo = true,
//   showMobileLogo = true,
//   showTitle = true,
//   showSubtitle = true,
//   showFooter = true,
//   showHeroImage = true,
//   heroGradientFrom = "",
//   heroGradientTo = "",
//   heroImageOpacity = "opacity-30",
//   logoClassName = "h-10 w-auto",
//   heroLogoClassName = "h-12 w-auto"
// }: AuthLayoutProps) {
  
//   return (
//     <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden">
//       <div className="flex-1 grid lg:grid-cols-2 min-h-0">
//         {/* Left Side - Hero Image & Content */}
//         <div className="hidden lg:flex p-6 min-h-0">
//           {/* Hero Container with padding and rounded corners */}
//           <div className={`w-full relative rounded-2xl bg-gradient-to-br ${heroGradientFrom} ${heroGradientTo} overflow-hidden`}>
//             {/* Background Image */}
//             {showHeroImage && heroImage && (
//               <div className="absolute inset-0">
//                 <Image
//                   src={heroImage}
//                   alt="Auth Hero Background"
//                   fill
//                   className={`object-cover ${heroImageOpacity}`}
//                   priority
//                   quality={100}
//                 />
//               </div>
//             )}
            
//             {/* Gradient Overlay */}
//             <div className="absolute inset-0 bg-gradient-to-br from-black to-green-500/40" />
            
//             {/* Decorative Elements - Contained within boundaries */}
//             <div className="absolute inset-4">
//               <div className="absolute top-16 right-16 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
//               <div className="absolute bottom-20 left-12 w-20 h-20 bg-white/5 rounded-full blur-lg"></div>
//               <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-white/15 rounded-full blur-md"></div>
//             </div>
            
//             {/* Hero Content */}
//             <div className="relative z-10 flex flex-col justify-center p-8 xl:p-12 h-full text-white">
//               <div className="max-w-md space-y-6">
//                 {/* Logo */}
//                 {showHeroLogo && (
//                   <div className="w-fit">
//                     <Image
//                       src={logoWhiteSrc}
//                       alt={logoAlt}
//                       width={120}
//                       height={32}
//                       className="h-8 w-auto brightness-0 invert"
//                       priority
//                     />
//                   </div>
//                 )}
                
//                 {/* Hero Text */}
//                 {showHeroTitle && heroTitle && (
//                   <h1 className="text-3xl xl:text-4xl font-bold leading-tight">
//                     {heroTitle}
//                   </h1>
//                 )}
                
//                 {showHeroSubtitle && heroSubtitle && (
//                   <p className="text-lg text-green-100 leading-relaxed opacity-90">
//                     {heroSubtitle}
//                   </p>
//                 )}
                
//                 {/* Features */}
//                 {showHeroFeatures && heroFeatures && heroFeatures.length > 0 && (
//                   <div className="space-y-3">
//                     {heroFeatures.map((feature, index) => (
//                       <div key={index} className="flex items-center space-x-3">
//                         <div className="flex-shrink-0 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
//                           <svg className="w-3 h-3 text-green-800" fill="currentColor" viewBox="0 0 20 20">
//                             <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
//                           </svg>
//                         </div>
//                         <span className="text-green-100 text-sm font-medium">{feature}</span>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Right Side - Auth Form */}
//         <div className="flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-16 xl:px-20 relative min-h-0">
//           <div className="w-full max-w-sm mx-auto lg:max-w-md relative z-10">
//             {/* Mobile Logo */}
//             {showLogo && showMobileLogo && (
//               <div className="text-center lg:hidden mb-6">
//                 <div className="inline-flex items-center justify-center p-3 bg-white rounded-xl shadow-sm border border-gray-100">
//                   <Image
//                     src={logoSrc}
//                     alt={logoAlt}
//                     width={logoWidth}
//                     height={logoHeight}
//                     className={logoClassName}
//                     priority
//                   />
//                 </div>
//               </div>
//             )}

//             {/* Welcome Header */}
//             <div className="mb-6">
//               {showTitle && (
//                 <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
//                   {title}
//                 </h2>
//               )}
//               {showSubtitle && subtitle && (
//                 <p className="text-gray-600 text-sm lg:text-base">
//                   {subtitle}
//                 </p>
//               )}
//             </div>

//             {/* Auth Form */}
//             <div className="space-y-4">
//               {children}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Footer */}
//       <Footer auth={true} />
//     </div>
//   );
// }