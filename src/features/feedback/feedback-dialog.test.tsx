import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ToastProvider } from '@/components/toast/toast-provider'
import { i18n } from '@/i18n/i18n'

import { FeedbackDialog } from './feedback-dialog'

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
let client: QueryClient

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('__APP_VERSION__', 'abc123')
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.open = false
  }
  client = new QueryClient()
})

afterEach(() => {
  client.clear()
  vi.unstubAllGlobals()
})

function renderDialog(onClose = vi.fn()) {
  const ui = (isOpen: boolean) => (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/u/ada?secret=1']}>
          <FeedbackDialog isOpen={isOpen} onClose={onClose} />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  )
  const view = render(ui(true))
  return { onClose, rerender: (isOpen: boolean) => view.rerender(ui(isOpen)) }
}

const t = (key: string, options?: Record<string, unknown>) =>
  String(i18n.t(key as never, options as never))
const field = () => screen.getByLabelText(t('feedback.message'))
const submit = () => screen.getByRole('button', { name: t('feedback.submit') })

test('validates the trimmed message and clears the error while typing', async () => {
  const user = userEvent.setup()
  renderDialog()

  await user.type(field(), '   short   ')
  await user.click(submit())
  expect(screen.getByText(t('feedback.tooShort', { min: 10 }))).toBeVisible()
  expect(fetchMock).not.toHaveBeenCalled()

  await user.type(field(), '!')
  expect(
    screen.queryByText(t('feedback.tooShort', { min: 10 })),
  ).not.toBeInTheDocument()

  await user.clear(field())
  await user.click(field())
  await user.paste('a'.repeat(2001))
  expect(screen.getByText('2001/2000')).toBeVisible()
  await user.click(submit())
  expect(screen.getByText(t('feedback.tooLong', { max: 2000 }))).toBeVisible()
  expect(fetchMock).not.toHaveBeenCalled()
})

test.each([
  [9, false],
  [10, true],
  [2000, true],
  [2001, false],
])('a trimmed message of %i characters is sent: %s', async (count, sent) => {
  const user = userEvent.setup()
  fetchMock.mockResolvedValue(
    Response.json({ id: '1', createdAt: 'now' }, { status: 201 }),
  )
  renderDialog()

  await user.click(field())
  await user.paste(`  ${'a'.repeat(count)}  `)
  await user.click(submit())

  if (sent) await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
  else expect(fetchMock).not.toHaveBeenCalled()
})

test('changes the placeholder with the category', async () => {
  const user = userEvent.setup()
  renderDialog()

  expect(field()).toHaveAttribute('placeholder', t('feedback.placeholders.bug'))
  await user.click(screen.getByText(t('feedback.categories.suggestion')))
  expect(field()).toHaveAttribute(
    'placeholder',
    t('feedback.placeholders.suggestion'),
  )
  expect(screen.getByText(t('feedback.contextNote'))).toBeVisible()
})

test('sends the context, locks the form while sending, then thanks the user', async () => {
  const user = userEvent.setup()
  let respond: (response: Response) => void = () => {}
  fetchMock.mockReturnValue(new Promise((resolve) => (respond = resolve)))
  const { onClose } = renderDialog()

  await user.type(field(), '  The feed will not load  ')
  await user.click(submit())

  await waitFor(() => expect(field()).toHaveAttribute('readonly'))
  expect(submit()).toHaveAttribute('aria-disabled', 'true')
  await user.click(screen.getByRole('button', { name: 'Close' }))
  expect(onClose).not.toHaveBeenCalled()

  const [url, init] = fetchMock.mock.calls[0]
  expect(String(url)).toMatch(/\/feedback$/)
  expect(init?.method).toBe('POST')
  const body = JSON.parse(String(init?.body)) as {
    category: string
    message: string
    context: Record<string, unknown>
  }
  expect(body).toMatchObject({
    category: 'bug',
    message: 'The feed will not load',
    context: {
      path: '/u/ada',
      locale: 'en',
      theme: 'system',
      userAgent: navigator.userAgent,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      appVersion: 'abc123',
    },
  })

  respond(Response.json({ id: '1', createdAt: 'now' }, { status: 201 }))
  await waitFor(() => expect(onClose).toHaveBeenCalled())
  expect(await screen.findByText(t('feedback.thanks'))).toBeVisible()
  expect(field()).toHaveValue('')
})

test('keeps the draft when the dialog is closed and reopened', async () => {
  const user = userEvent.setup()
  const { rerender } = renderDialog()

  await user.type(field(), 'Half-written thought')
  rerender(false)
  rerender(true)

  expect(field()).toHaveValue('Half-written thought')
})

test('shows the server field error on a 400', async () => {
  const user = userEvent.setup()
  fetchMock.mockResolvedValue(
    Response.json(
      { errors: { Message: ['Message looks like spam.'] } },
      { status: 400 },
    ),
  )
  renderDialog()

  await user.type(field(), 'A perfectly fine message')
  await user.click(submit())

  expect(await screen.findByText('Message looks like spam.')).toBeVisible()
  await user.type(field(), '!')
  expect(screen.queryByText('Message looks like spam.')).not.toBeInTheDocument()
})

test('shows the wait time on a 429', async () => {
  const user = userEvent.setup()
  fetchMock.mockResolvedValue(
    new Response(null, { status: 429, headers: { 'Retry-After': '720' } }),
  )
  renderDialog()

  await user.type(field(), 'A perfectly fine message')
  await user.click(submit())

  expect(
    await screen.findByText(t('feedback.rateLimited', { wait: '12 minutes' })),
  ).toBeVisible()
  expect(field()).toHaveValue('A perfectly fine message')
})

test('shows a 401 as a send error and keeps the text', async () => {
  const user = userEvent.setup()
  fetchMock.mockResolvedValue(new Response(null, { status: 401 }))
  renderDialog()

  await user.type(field(), 'A perfectly fine message')
  await user.click(submit())

  expect(await screen.findByRole('alert')).toHaveTextContent(
    t('feedback.sendError'),
  )
  expect(field()).toHaveValue('A perfectly fine message')
})

test('logs a context error instead of showing it', async () => {
  const user = userEvent.setup()
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  fetchMock.mockResolvedValue(
    Response.json(
      { errors: { 'Context.Path': ['Path is invalid.'] } },
      { status: 400 },
    ),
  )
  renderDialog()

  await user.type(field(), 'A perfectly fine message')
  await user.click(submit())

  expect(await screen.findByRole('alert')).toHaveTextContent(
    t('feedback.sendError'),
  )
  expect(screen.queryByText('Path is invalid.')).not.toBeInTheDocument()
  expect(log).toHaveBeenCalled()
  log.mockRestore()
})

test.each([
  ['a 500', () => Promise.resolve(new Response(null, { status: 500 }))],
  ['a network error', () => Promise.reject(new TypeError('Failed to fetch'))],
])('keeps the text and shows an alert on %s', async (_name, respond) => {
  const user = userEvent.setup()
  fetchMock.mockImplementation(respond)
  const { onClose } = renderDialog()

  await user.type(field(), 'A perfectly fine message')
  await user.click(submit())

  expect(await screen.findByRole('alert')).toHaveTextContent(
    t('feedback.sendError'),
  )
  expect(field()).toHaveValue('A perfectly fine message')
  expect(onClose).not.toHaveBeenCalled()
})
