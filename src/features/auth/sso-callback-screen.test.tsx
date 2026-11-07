import { act, screen } from '@testing-library/react'
import { beforeEach, expect, test, vi } from 'vitest'

import {
  SIGN_IN_PATH,
  SIGN_IN_VERIFY_PATH,
  SIGN_UP_CONTINUE_PATH,
  SSO_CALLBACK_PATH,
} from '@/constants/routes'
import { i18n } from '@/i18n/i18n'
import type { SignInMock, SignUpMock } from '@/test/clerk'
import { createSignInMock, createSignUpMock } from '@/test/clerk'
import { LOCATION_TEST_ID, renderRoute } from '@/test/router'

import { SsoCallbackScreen } from './sso-callback-screen'

type CallbackProps = {
  navigateToApp: (params: { decorateUrl: (url: string) => string }) => void
  navigateToSignIn: () => void
  navigateToSignUp: () => void
}

const clerk = vi.hoisted(() => ({
  signIn: undefined as unknown,
  signUp: undefined as unknown,
  callback: undefined as CallbackProps | undefined,
}))

vi.mock('@clerk/react', () => ({
  useSignIn: () => ({ signIn: clerk.signIn }),
  useSignUp: () => ({ signUp: clerk.signUp }),
  HandleSSOCallback: (props: CallbackProps) => {
    clerk.callback = props
    return null
  },
}))

let signIn: SignInMock
let signUp: SignUpMock

beforeEach(() => {
  signIn = createSignInMock()
  signUp = createSignUpMock()
  clerk.signIn = signIn
  clerk.signUp = signUp
  clerk.callback = undefined
})

function renderCallback() {
  renderRoute(<SsoCallbackScreen />, {
    path: SSO_CALLBACK_PATH,
    url: `${SSO_CALLBACK_PATH}?redirect_url=%2Fsettings`,
  })

  return clerk.callback!
}

test('shows progress while Clerk finishes the sign-in', () => {
  renderCallback()

  expect(screen.getByRole('status')).toHaveTextContent(
    i18n.t('auth.ssoCallback.label'),
  )
})

test('goes to the page the user came from once signed in', async () => {
  const callback = renderCallback()

  act(() => callback.navigateToApp({ decorateUrl: (url) => url }))

  expect(await screen.findByTestId(LOCATION_TEST_ID)).toHaveTextContent(
    '/settings',
  )
})

test('asks for the device code when Clerk does not trust the device', async () => {
  signIn.status = 'needs_client_trust'
  signIn.supportedSecondFactors = [{ strategy: 'email_code' }]
  const callback = renderCallback()

  act(() => callback.navigateToSignIn())

  expect(await screen.findByTestId(LOCATION_TEST_ID)).toHaveTextContent(
    `${SIGN_IN_VERIFY_PATH}?redirect_url=%2Fsettings`,
  )
  expect(signIn.mfa.sendEmailCode).toHaveBeenCalledOnce()
})

test('goes back to sign in for anything else the sign-in needs', async () => {
  signIn.status = 'needs_first_factor'
  const callback = renderCallback()

  act(() => callback.navigateToSignIn())

  expect(await screen.findByTestId(LOCATION_TEST_ID)).toHaveTextContent(
    `${SIGN_IN_PATH}?redirect_url=%2Fsettings`,
  )
})

test('asks for the fields a Google sign-up still needs', async () => {
  signUp.status = 'missing_requirements'
  signUp.missingFields = ['username']
  const callback = renderCallback()

  act(() => callback.navigateToSignUp())

  expect(await screen.findByTestId(LOCATION_TEST_ID)).toHaveTextContent(
    `${SIGN_UP_CONTINUE_PATH}?redirect_url=%2Fsettings`,
  )
})
