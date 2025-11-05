// app/(auth)/login/page.tsx
import React from 'react';
import AuthLayout from '@/components/layouts/auth-layout';
import LoginForm from '@/components/auth/LoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | Elan Admin',
  description: 'Sign in to your Elan admin account',
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome Back!"
      subtitle="Connect to your Elan admin account"
      
      // Logo Configuration
      showLogo={true}
      logoSrc="/elan-logo.svg"
      logoAlt="Elan Logo"
      logoWidth={120}
      logoHeight={40}
      logoWhiteSrc="/elan-logo.svg"
      logoClassName="h-16 w-fit"
      heroLogoClassName="h-12 w-fit"
      
      // Hero Section Configuration
      heroImage="/hero/cta-image.jpg"
      heroTitle=""
      heroSubtitle=""
      heroFeatures={[
        "Admin dashboard",
        "Rides Route Tracking", 
        "And more..."
      ]}
      
      // Hide/Show Options
      showHeroTitle={true}
      showHeroSubtitle={true}
      showHeroFeatures={true}
      showHeroLogo={true}
      showMobileLogo={true}
      showTitle={true}
      showSubtitle={true}
      showFooter={true}
      showHeroImage={true}
      
      // Styling Options
      heroGradientFrom="from-black"
      heroGradientTo="to-transparent"
      heroImageOpacity="opacity-100"
      footerText="© 2025 Elan Road Test Rental. All rights reserved."
    >
      <LoginForm />
    </AuthLayout>
  );
}