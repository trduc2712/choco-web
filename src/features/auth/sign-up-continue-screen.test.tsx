import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'

import { SIGN_UP_CONTINUE_PATH, SIGN_UP_PATH } from '@/constants/routes'
import { i18n } from '@/i18n/i18n'
import { expectNoA11yViolations } from '@/test/a11y'
import type { SignUpMock } from '@/test/clerk'
import { clerkApiError, createSignUpMock } from '@/test/clerk'
import { LOCATION_TEST_ID, renderRoute } from '@/test/router'
import { startingWith } from '@/test/text'

import { SignUpContinueScreen } from './sign-up-continue-screen'

const clerk = vi.hoisted(() => ({ signUp: undefined as unknown }))

vi.mock('@clerk/react', () => ({
  useSignUp: () => ({ signUp: clerk.signUp }),
}))

let signUp: SignUpMock

beforeEach(() => {
  signUp = createSignUpMock()
  signUp.status = 'missing_requirements'
  signUp.missingFields = ['username']
  clerk.signUp = signUp
})

function renderContinue() {
  return renderRoute(<SignUpContinueScreen />, {
    path: SIGN_UP_CONTINUE_PATH,
    url: `${SIGN_UP_CONTINUE_PATH}?redirect_url=%2Fsettings`,
  })
}

async function submitUsername() {
  await userEvent.type(
    screen.getByRole('textbox', {
      name: startingWith(i18n.t('auth.fields.username')),
    }),
    'ada',
  )
  await userEvent.click(
    screen.getByRole('button', { name: i18n.t('auth.continueSignUp.submit') }),
  )
}

test('sends users with nothing missing back to sign up', () => {
  signUp.missingFields = []

  renderContinue()

  expect(screen.getByTestId(LOCATION_TEST_ID)).toHaveTextContent(
    `${SIGN_UP_PATH}?redirect_url=%2Fsettings`,
  )
})

test('saves the username and finishes signing up', async () => {
  signUp.update.mockImplementation(() => {
    signUp.status = 'complete'
    return Promise.resolve({ error: null })
  })
  const { container } = renderContinue()
  await expectNoA11yViolations(container)

  await submitUsername()

  expect(signUp.update).toHaveBeenCalledWith({ username: 'ada' })
  expect(await screen.findByTestId(LOCATION_TEST_ID)).toHaveTextContent(
    '/settings',
  )
})

test('shows a taken username on the field', async () => {
  signUp.update.mockResolvedValue({
    error: clerkApiError('form_identifier_exists', 'username'),
  })
  renderContinue()

  await submitUsername()

  expect(
    screen.getByRole('textbox', {
      name: startingWith(i18n.t('auth.fields.username')),
    }),
  ).toHaveAccessibleDescription(i18n.t('auth.errors.usernameTaken'))
})

test('explains when Clerk needs a field the page cannot ask for', () => {
  signUp.missingFields = ['phone_number']

  renderContinue()

  expect(screen.getByRole('alert')).toHaveTextContent(
    i18n.t('auth.continueSignUp.unsupported'),
  )
  expect(
    screen.getByRole('link', { name: i18n.t('auth.continueSignUp.startOver') }),
  ).toHaveAttribute('href', `${SIGN_UP_PATH}?redirect_url=%2Fsettings`)
})
