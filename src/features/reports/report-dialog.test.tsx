import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { ToastProvider } from '@/components/toast/toast-provider'
import { i18n } from '@/i18n/i18n'

import type { ReportTarget } from './create-report-api'
import { ReportDialog } from './report-dialog'

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
let answer: () => Promise<Response>
const onClose = vi.fn()

function problem(status: number, body: object = {}) {
  return Promise.resolve(
    Response.json(body, {
      status,
      headers: { 'Content-Type': 'application/problem+json' },
    }),
  )
}

beforeEach(() => {
  fetchMock.mockReset()
  onClose.mockClear()
  vi.stubGlobal('fetch', fetchMock)
  answer = () => Promise.resolve(new Response(null, { status: 201 }))
  fetchMock.mockImplementation(() => answer())
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
})

afterEach(() => {
  client.clear()
  vi.unstubAllGlobals()
})

function renderDialog(target: ReportTarget = { type: 'Post', id: 'post-1' }) {
  render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <ReportDialog target={target} onClose={onClose} />
      </ToastProvider>
    </QueryClientProvider>,
  )
}

const text = (key: string, options?: object) =>
  String(i18n.t(key as never, options as never))

function reportCalls() {
  return fetchMock.mock.calls.filter(([input]) =>
    String(input).endsWith('/reports'),
  )
}

async function pick(reason: string) {
  await userEvent.click(
    screen.getByRole('radio', {
      name: text(`admin.reports.reasons.${reason}`),
    }),
  )
}

async function send() {
  await userEvent.click(
    screen.getByRole('button', { name: text('reports.dialog.send') }),
  )
}

test('asks for a reason before sending anything', async () => {
  renderDialog()

  await send()

  expect(
    await screen.findByText(text('reports.dialog.reasonRequired')),
  ).toBeVisible()
  expect(reportCalls()).toHaveLength(0)
})

test('reports a post with the reason and the trimmed details', async () => {
  renderDialog({ type: 'Post', id: 'post-1' })

  await pick('Spam')
  await userEvent.click(screen.getByLabelText(text('reports.dialog.details')))
  await userEvent.paste('  Sells watches  ')
  await send()

  await waitFor(() => expect(reportCalls()).toHaveLength(1))
  const [input, init] = reportCalls()[0]
  expect(String(input)).toContain('/posts/post-1/reports')
  expect(init?.method).toBe('POST')
  expect(JSON.parse(String(init?.body))).toEqual({
    reason: 'Spam',
    details: 'Sells watches',
  })
  await waitFor(() => expect(onClose).toHaveBeenCalled())
})

test('reports a user with no details as null', async () => {
  renderDialog({ type: 'User', id: 'user-1' })

  await pick('Harassment')
  await send()

  await waitFor(() => expect(reportCalls()).toHaveLength(1))
  const [input, init] = reportCalls()[0]
  expect(String(input)).toContain('/users/user-1/reports')
  expect(JSON.parse(String(init?.body))).toEqual({
    reason: 'Harassment',
    details: null,
  })
})

test('counts the trimmed details and refuses more than 500 characters', async () => {
  renderDialog()
  await pick('Other')
  await userEvent.click(screen.getByLabelText(text('reports.dialog.details')))
  await userEvent.paste('a'.repeat(501))

  expect(
    await screen.findByText(
      text('reports.dialog.detailsTooLong', { max: 500 }),
    ),
  ).toBeVisible()
  await send()
  expect(reportCalls()).toHaveLength(0)
})

test.each([
  [404, 'notFound.Post'],
  [400, 'own.Post'],
])('explains a %i and stays open', async (status, key) => {
  answer = () => problem(status)
  renderDialog({ type: 'Post', id: 'post-1' })

  await pick('Spam')
  await send()

  expect(await screen.findByText(text(`reports.dialog.${key}`))).toBeVisible()
  expect(onClose).not.toHaveBeenCalled()
})

test('shows a 400 on the reason field on the field', async () => {
  answer = () =>
    problem(400, {
      errors: { reason: ['not valid'] },
      errorCodes: { reason: ['Report.Reason.Invalid'] },
    })
  renderDialog()

  await pick('Spam')
  await send()

  expect(
    await screen.findByText(text('apiErrors.reasons.Invalid')),
  ).toBeVisible()
  expect(onClose).not.toHaveBeenCalled()
})

test('a suspended viewer cannot send', async () => {
  // The layouts ask for GET /me; the dialog only reads what it answered.
  client.setQueryData(['current-user', 'clerk-viewer'], {
    id: 'me',
    suspension: { reason: 'Spam', suspendedAt: '2026-01-01T00:00:00Z' },
  })
  renderDialog()

  await pick('Spam')

  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: text('reports.dialog.send') }),
    ).toBeDisabled(),
  )
})
