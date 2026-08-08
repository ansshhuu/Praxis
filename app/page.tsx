import './landing.css'
import { LandingNav } from '@/components/landing/landing-nav'
import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { LandingFooter } from '@/components/landing/landing-footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Praxis — No-Code AI Workflow Automation',
  description:
    'Build, run, and monitor enterprise workflows with no-code AI. Document intelligence, resume screening, workflow automation, and AI chat assistant — all in one platform.',
}

export default function LandingPage() {
  return (
    <div className="landing-root">
      {/* Frosted glass nav — sits over glowing hero background */}
      <LandingNav />

      {/* Full-viewport hero with ambient glow background + floating cards */}
      <HeroSection />

      {/* 4-column feature module highlights */}
      <FeaturesSection />

      {/* Minimal footer */}
      <LandingFooter />
    </div>
  )
}
