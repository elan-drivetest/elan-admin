// app/(auth)/login/page.tsx
import React from 'react';
import AuthLayout from '@/components/layouts/auth-layout';
import LoginForm from '@/components/auth/LoginForm';
import { Metadata } from 'next';

// Since AuthLayout is now a client component, we can keep metadata here
export const metadata: Metadata = {
  title: 'Login | Elan Admin',
  description: 'Sign in to your Elan admin account',
};

export default function LoginPage() {
  return (
    <AuthLayout
      // Main Content
      title="Welcome Back!"
      subtitle="Connect your entire supply chain from freight through fulfillment with instant pricing and booking."
      
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
      heroImage="/hero/cta-image.png"
      heroTitle="Connect your entire supply chain from freight through fulfillment"
      heroSubtitle="With instant pricing and booking, it only takes two minutes to set up and no credit card required. Get started now!"
      heroFeatures={[
        "Instant setup in 2 minutes",
        "No credit card required", 
        "Enterprise-grade security",
        "24/7 customer support"
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
      heroGradientFrom="from-green-600"
      heroGradientTo="to-green-800"
      heroImageOpacity="opacity-100"
      footerText="© 2025 Elan Road Test Rental. All rights reserved."
    >
      <LoginForm />
    </AuthLayout>
  );
}