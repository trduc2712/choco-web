import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'

import {
  SIGN_IN_PATH,
  SIGN_UP_CONTINUE_PATH,
  SIGN_UP_PATH,
  SIGN_UP_VERIFY_PATH,
  SSO_CALLBACK_PATH,
} from '@/constants/routes'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'
import type { SignUpMock } from '@/test/clerk'
import { clerkApiError, createSignUpMock } from '@/test/clerk'
import { LOCATION_TEST_ID, renderRoute } from '@/test/router'
import { startingWith } from '@/test/text'

import { SignUpScreen } from './sign-up-screen'

const clerk = vi.hoisted(() => ({ signUp: undefined as unknown }))

vi.mock('@clerk/react', () => ({
  useSignUp: () => ({ signUp: clerk.signUp }),
}))

let signUp: SignUpMock

beforeEach(() => {
  signUp = createSignUpMock()
  clerk.signUp = signUp
})

function renderSignUp() {
  return renderRoute(<SignUpScreen />, {
    path: SIGN_UP_PATH,
    url: `${SIGN_UP_PATH}?redirect_url=%2Fsettings`,
  })
}

async function fillAndSubmit() {
  await userEvent.type(
    screen.getByRole('textbox', {
      name: startingWith(i18n.t('auth.fields.email')),
    }),
    'ada@example.com',
  )
  await userEvent.type(
    screen.getByRole('textbox', {
      name: startingWith(i18n.t('auth.fields.username')),
    }),
    'ada',
  )
  await userEvent.type(
    screen.getByLabelText(startingWith(i18n.t('auth.fields.password'))),
    'a much longer password',
  )
  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('auth.signUp.submit') }),
  )
}

test('checks the email before calling Clerk', async () => {
  const { container } = renderSignUp()

  await userEvent.type(
    screen.getByRole('textbox', {
      name: startingWith(i18n.t('auth.fields.email')),
    }),
    'ada',
  )
  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('auth.signUp.submit') }),
  )

  expect(
    screen.getByRole('textbox', {
      name: startingWith(i18n.t('auth.fields.email')),
    }),
  ).toHaveAccessibleDescription(i18n.t('auth.validation.email'))
  expect(signUp.password).not.toHaveBeenCalled()
  await expectNoA11yViolations(container)
})

test('creates the account and asks for the emailed code', async () => {
  signUp.password.mockImplementation(() => {
    signUp.status = 'missing_requirements'
    signUp.unverifiedFields = ['email_address']
    return Promise.resolve({ error: null })
  })
  renderSignUp()

  await fillAndSubmit()

  expect(signUp.password).toHaveBeenCalledWith({
    emailAddress: 'ada@example.com',
    username: 'ada',
    password: 'a much longer password',
  })
  expect(signUp.verifications.sendEmailCode).toHaveBeenCalledOnce()
  expect(await screen.findByTestId(LOCATION_TEST_ID)).toHaveTextContent(
    `${SIGN_UP_VERIFY_PATH}?redirect_url=%2Fsettings`,
  )
})

test('asks for fields Clerk still needs', async () => {
  signUp.password.mockImplementation(() => {
    signUp.status = 'missing_requirements'
    signUp.missingFields = ['username']
    return Promise.resolve({ error: null })
  })
  renderSignUp()

  await fillAndSubmit()

  expect(await screen.findByTestId(LOCATION_TEST_ID)).toHaveTextContent(
    `${SIGN_UP_CONTINUE_PATH}?redirect_url=%2Fsettings`,
  )
})

test('shows a taken username on the username field', async () => {
  signUp.password.mockResolvedValue({
    error: clerkApiError('form_identifier_exists', 'username'),
  })
  renderSignUp()

  await fillAndSubmit()

  const username = screen.getByRole('textbox', {
    name: startingWith(i18n.t('auth.fields.username')),
  })

  expect(username).toHaveAccessibleDescription(
    i18n.t('auth.errors.usernameTaken'),
  )
  expect(username).toHaveFocus()
})

test('starts a Google sign-up that returns to the callback page', async () => {
  renderSignUp()

  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('auth.continueWithGoogle') }),
  )

  expect(signUp.sso).toHaveBeenCalledWith({
    strategy: 'oauth_google',
    redirectUrl: '/settings',
    redirectCallbackUrl: `${SSO_CALLBACK_PATH}?redirect_url=%2Fsettings`,
  })
})

test('allows retrying Google sign-up after returning with browser Back', async () => {
  renderSignUp()
  const button = screen.getByRole('button', {
    name: i18n.t('auth.continueWithGoogle'),
  })

  await userEvent.click(button)
  expect(button).toHaveAttribute('aria-busy', 'true')

  fireEvent(window, new PageTransitionEvent('pageshow', { persisted: true }))

  expect(button).not.toHaveAttribute('aria-busy')
  expect(button).not.toHaveAttribute('aria-disabled')
  await userEvent.click(button)
  expect(signUp.sso).toHaveBeenCalledTimes(2)
})

test('keeps a place for Clerk bot protection and links to sign in', () => {
  const { container } = renderSignUp()

  expect(container.querySelector('#clerk-captcha')).toBeInTheDocument()
  expect(
    screen.getByRole('link', { name: i18n.t('auth.signUp.signIn') }),
  ).toHaveAttribute('href', `${SIGN_IN_PATH}?redirect_url=%2Fsettings`)
})
