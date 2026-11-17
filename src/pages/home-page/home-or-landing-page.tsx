import { useAuth } from '@clerk/react'
import { lazy, Suspense } from 'react'

import { LandingPage } from '@/pages/landing-page/landing-page'

import { HomePageFallback } from './home-page-fallback'

const HomePage = lazy(() =>
  import('./home-page').then((module) => ({ default: module.HomePage })),
)

// "/" is the feed for a signed-in user and the landing page for a visitor. One
// skeleton shows from the session check to the first feed page.
export function HomeOrLandingPage() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) return <HomePageFallback />
  if (!isSignedIn) return <LandingPage />

  return (
    <Suspense fallback={<HomePageFallback />}>
      <HomePage />
    </Suspense>
  )
}
