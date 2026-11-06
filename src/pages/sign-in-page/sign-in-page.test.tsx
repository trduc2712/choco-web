import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'

import {
  RESET_PASSWORD_PATH,
  SIGN_IN_PATH,
  SIGN_IN_VERIFY_PATH,
  SIGN_UP_PATH,
  SSO_CALLBACK_PATH,
} from '@/constants/routes'
import { i18n } from '@/i18n/i18n'
import { SignInPage } from '@/pages/sign-in-page/sign-in-page'
import { expectNoA11yViolations } from '@/test/a11y'
import type { SignInMock } from '@/test/clerk'
import { clerkApiError, createSignInMock } from '@/test/clerk'
import { LOCATION_TEST_ID, renderRoute } from '@/test/router'
import { startingWith } from '@/test/text'

const clerk = vi.hoisted(() => ({ signIn: undefined as unknown }))

vi.mock('@clerk/react', () => ({
  useSignIn: () => ({ signIn: clerk.signIn }),
}))

let signIn: SignInMock

beforeEach(() => {
  signIn = createSignInMock()
  clerk.signIn = signIn
})

function renderSignIn(url = SIGN_IN_PATH) {
  return renderRoute(<SignInPage />, { path: SIGN_IN_PATH, url })
}

async function fillAndSubmit(identifier = 'ada', password = 'secret') {
  await userEvent.type(
    screen.getByRole('textbox', {
      name: startingWith(i18n.t('auth.fields.identifier')),
    }),
    identifier,
  )
  await userEvent.type(
    screen.getByLabelText(startingWith(i18n.t('auth.fields.password'))),
    password,
  )
  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('auth.signIn.submit') }),
  )
}

test('asks for both fields before calling Clerk', async () => {
  const { container } = renderSignIn()

  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('auth.signIn.submit') }),
  )

  expect(
    screen.getByRole('textbox', {
      name: startingWith(i18n.t('auth.fields.identifier')),
    }),
  ).toHaveAccessibleDescription(i18n.t('auth.errors.required'))
  expect(signIn.password).not.toHaveBeenCalled()
  await expectNoA11yViolations(container)
})

test('signs in and goes to the page the user came from', async () => {
  signIn.password.mockImplementation(() => {
    signIn.status = 'complete'
    return Promise.resolve({ error: null })
  })
  renderSignIn(`${SIGN_IN_PATH}?redirect_url=%2Fsettings%3Ftab%3D2`)

  await fillAndSubmit()

  expect(signIn.password).toHaveBeenCalledWith({
    identifier: 'ada',
    password: 'secret',
  })
  expect(signIn.finalize).toHaveBeenCalledOnce()
  expect(await screen.findByTestId(LOCATION_TEST_ID)).toHaveTextContent(
    '/settings?tab=2',
  )
})

test('shows a Clerk error on the field it belongs to', async () => {
  signIn.password.mockResolvedValue({
    error: clerkApiError('form_password_incorrect', 'password'),
  })
  renderSignIn()

  await fillAndSubmit()

  const password = screen.getByLabelText(
    startingWith(i18n.t('auth.fields.password')),
  )

  expect(password).toHaveAccessibleDescription(
    i18n.t('auth.errors.passwordIncorrect'),
  )
  expect(password).toHaveFocus()
  expect(signIn.finalize).not.toHaveBeenCalled()
})

test('shows errors that belong to no field as an alert', async () => {
  signIn.password.mockResolvedValue({
    error: clerkApiError('too_many_requests'),
  })
  const { container } = renderSignIn()

  await fillAndSubmit()

  expect(screen.getByRole('alert')).toHaveTextContent(
    i18n.t('auth.errors.tooManyRequests'),
  )
  await expectNoA11yViolations(container)
})

test('sends a code and asks for it when Clerk does not trust the device', async () => {
  signIn.password.mockImplementation(() => {
    signIn.status = 'needs_client_trust'
    signIn.supportedSecondFactors = [{ strategy: 'email_code' }]
    return Promise.resolve({ error: null })
  })
  renderSignIn(`${SIGN_IN_PATH}?redirect_url=%2Fsettings`)

  await fillAndSubmit()

  expect(signIn.mfa.sendEmailCode).toHaveBeenCalledOnce()
  expect(await screen.findByTestId(LOCATION_TEST_ID)).toHaveTextContent(
    `${SIGN_IN_VERIFY_PATH}?redirect_url=%2Fsettings`,
  )
})

test('explains when the account needs a step the app does not support', async () => {
  signIn.password.mockImplementation(() => {
    signIn.status = 'needs_second_factor'
    signIn.supportedSecondFactors = [{ strategy: 'totp' }]
    return Promise.resolve({ error: null })
  })
  renderSignIn()

  await fillAndSubmit()

  expect(screen.getByRole('alert')).toHaveTextContent(
    i18n.t('auth.errors.secondFactorUnsupported'),
  )
})

test('starts a Google sign-in that returns to the callback page', async () => {
  renderSignIn(`${SIGN_IN_PATH}?redirect_url=%2Fsettings`)

  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('auth.continueWithGoogle') }),
  )

  expect(signIn.sso).toHaveBeenCalledWith({
    strategy: 'oauth_google',
    redirectUrl: '/settings',
    redirectCallbackUrl: `${SSO_CALLBACK_PATH}?redirect_url=%2Fsettings`,
  })
})

test('allows retrying Google sign-in after returning with browser Back', async () => {
  renderSignIn()
  const button = screen.getByRole('button', {
    name: i18n.t('auth.continueWithGoogle'),
  })

  await userEvent.click(button)
  expect(button).toHaveAttribute('aria-busy', 'true')

  fireEvent(window, new PageTransitionEvent('pageshow', { persisted: true }))

  expect(button).not.toHaveAttribute('aria-busy')
  expect(button).not.toHaveAttribute('aria-disabled')
  await userEvent.click(button)
  expect(signIn.sso).toHaveBeenCalledTimes(2)
})

test('links to sign-up and password reset, keeping the redirect', () => {
  renderSignIn(`${SIGN_IN_PATH}?redirect_url=%2Fsettings`)

  expect(
    screen.getByRole('link', { name: i18n.t('auth.signIn.signUp') }),
  ).toHaveAttribute('href', `${SIGN_UP_PATH}?redirect_url=%2Fsettings`)
  expect(
    screen.getByRole('link', { name: i18n.t('auth.signIn.forgotPassword') }),
  ).toHaveAttribute('href', `${RESET_PASSWORD_PATH}?redirect_url=%2Fsettings`)
})
