import { CodeBlock } from '@/components'

const CODE = `npm install
npm run dev`

export function CodeBlockUsage() {
  return <CodeBlock code={CODE} language="tsx" title="Terminal" />
}
