import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ToastProvider } from '@/components/toast/toast-provider'
import { i18n } from '@/i18n/i18n'

import { BioEditor } from './bio-editor'
import { ProfileHeader } from './profile-header'
import { profileQueryOptions } from './use-profile'

vi.mock('@clerk/react', () => ({
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'clerk-viewer',
    sessionId: 'session',
    getToken: () => Promise.resolve('token'),
  }),
}))

const fetchMock = vi.fn<typeof fetch>()
const id = '00000000-0000-0000-0000-000000000001'
const saved = { id, username: 'ada', displayName: 'Ada', avatarUrl: null }
let client: QueryClient

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  client = new QueryClient()
})

afterEach(() => {
  client.clear()
  vi.unstubAllGlobals()
})

function renderEditor(bio: string | null, onDone = vi.fn()) {
  render(
    <QueryClientProvider client={client}>
      <BioEditor bio={bio} onClose={onDone} />
    </QueryClientProvider>,
  )
  return onDone
}

const field = () => screen.getByLabelText(i18n.t('profile.bioLabel'))
const save = () =>
  screen.getByRole('button', { name: i18n.t('profile.bioSave') })
test('shows the bio on a profile and hides the section without one', () => {
  const profile = { username: 'ada', displayName: 'Ada Lovelace' }
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ToastProvider>
      <MemoryRouter>{children}</MemoryRouter>
    </ToastProvider>
  )
  const { rerender } = render(
    <ProfileHeader profile={{ ...profile, bio: 'Maths and music' }} />,
    { wrapper },
  )
  expect(screen.getByText('Maths and music')).toBeVisible()

  rerender(<ProfileHeader profile={{ ...profile, bio: null }} />)
  expect(screen.queryByText('Maths and music')).not.toBeInTheDocument()
})

test('counts the trimmed text and disables save over 160 characters', async () => {
  const user = userEvent.setup()
  renderEditor(null)

  await user.type(field(), `  ${'a'.repeat(160)}  `)
  expect(screen.getByText('160/160')).toBeVisible()
  expect(save()).toBeEnabled()

  await user.clear(field())
  await user.click(field())
  await user.paste('a'.repeat(161))
  expect(screen.getByText('161/160')).toBeVisible()
  expect(save()).toBeDisabled()
  expect(
    screen.getByText(i18n.t('profile.bioTooLong', { max: 160 })),
  ).toBeVisible()
  expect(fetchMock).not.toHaveBeenCalled()
})

test('saves the trimmed bio and updates the cached profile', async () => {
  const user = userEvent.setup()
  const options = profileQueryOptions(vi.fn(), 'ada', 'clerk-viewer')
  client.setQueryData(options.queryKey, { ...saved, bio: null } as never)
  fetchMock.mockResolvedValue(Response.json({ ...saved, bio: 'Hello' }))
  const onDone = renderEditor(null)

  await user.type(field(), '  Hello  ')
  await user.click(save())

  await waitFor(() => expect(onDone).toHaveBeenCalled())
  const [url, init] = fetchMock.mock.calls[0]
  expect(String(url)).toMatch(/\/me\/profile\/bio$/)
  expect(init?.method).toBe('PUT')
  expect(init?.body).toBe(JSON.stringify({ bio: 'Hello' }))
  expect(client.getQueryData<{ bio: string }>(options.queryKey)?.bio).toBe(
    'Hello',
  )
})

test('saving an empty bio sends null', async () => {
  const user = userEvent.setup()
  fetchMock.mockResolvedValue(Response.json({ ...saved, bio: null }))
  const onDone = renderEditor('Hello')

  await user.clear(field())
  await user.click(save())

  await waitFor(() => expect(onDone).toHaveBeenCalled())
  expect(fetchMock.mock.calls[0][1]?.body).toBe(JSON.stringify({ bio: null }))
})

test('shows a 400 on errors.bio under the field', async () => {
  const user = userEvent.setup()
  fetchMock.mockResolvedValue(
    Response.json(
      {
        code: 'Validation.Failed',
        errors: { bio: ['too long'] },
        errorCodes: { bio: ['User.Bio.TooLong'] },
      },
      { status: 400 },
    ),
  )
  const onDone = renderEditor(null)

  await user.type(field(), 'Hello')
  await user.click(save())

  expect(
    await screen.findByText(i18n.t('profile.bioTooLong', { max: 160 })),
  ).toBeVisible()
  expect(field()).toHaveAttribute('aria-invalid', 'true')
  expect(onDone).not.toHaveBeenCalled()
})
