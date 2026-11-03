import { Outlet } from 'react-router'

import { Container } from '@/components/container/container'
import { Header } from '@/components/header/header'
import { SkipLink } from '@/components/skip-link/skip-link'

const MAIN_ID = 'main-content'

export function AppLayout() {
  return (
    <>
      <SkipLink targetId={MAIN_ID} />
      <Header />
      <Container as="main" id={MAIN_ID}>
        <Outlet />
      </Container>
    </>
  )
}
