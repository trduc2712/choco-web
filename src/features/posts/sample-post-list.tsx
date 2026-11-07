import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/badge/badge'
import { CodeBlock } from '@/components/code-block/code-block'
import { Heading } from '@/components/heading/heading'
import { Icon } from '@/components/icon/icon'
import { Progress } from '@/components/progress/progress'
import { Text } from '@/components/text/text'

import type { PostAuthor, TimelinePostProps } from './timeline-post'
import { TimelinePost } from './timeline-post'
import styles from './timeline-post.module.scss'

const samples: (TimelinePostProps & { id: string })[] = [
  {
    id: 'short',
    language: 'vi',
    author: { name: 'Linh Nguyễn', username: 'linhnotes' },
    publishedAt: '2026-11-07',
    counts: { replies: 2, reposts: 0, likes: 14 },
    children: <Text>Sáng nay trời mát, mở cửa sổ làm việc thích ghê.</Text>,
  },
  {
    id: 'multiline',
    language: 'en',
    author: { name: 'Jamie Brooks', username: 'jamiebuilds' },
    publishedAt: '2026-11-07',
    counts: { replies: 5, reposts: 2, likes: 31 },
    children: (
      <>
        <Text>
          I spent a week writing down every moment I hesitated while using the
          app. The most frustrating things were tiny, but I ran into them every
          day.
        </Text>
        <Text>
          Next week I’ll fix one of them and ask a few people to try the same
          flow again.
        </Text>
      </>
    ),
  },
  {
    id: 'announcement',
    language: 'ja',
    author: { name: '森 彩', username: 'ayamori' },
    publishedAt: '2026-11-06',
    counts: { replies: 8, reposts: 12, likes: 96 },
    children: (
      <>
        <div>
          <Badge tone="primary" icon="megaphone">
            お知らせ
          </Badge>
        </div>
        <Text weight="semibold">初めてのデザインレビューを開きます</Text>
        <Text>
          制作中の画面を一つと、みんなに相談したい質問を一つ持ってきてください。
        </Text>
      </>
    ),
  },
  {
    id: 'question',
    language: 'ar',
    author: { name: 'ليلى منصور', username: 'laylamansour' },
    publishedAt: '2026-11-06',
    counts: { replies: 17, reposts: 1, likes: 22 },
    children: (
      <Text weight="semibold">
        لو كان بإمكانك الاحتفاظ بميزة واحدة فقط في تطبيق الملاحظات، فأي ميزة
        ستختار؟
      </Text>
    ),
  },
  {
    id: 'list',
    language: 'hi',
    author: { name: 'अनन्या शर्मा', username: 'ananyasharma' },
    publishedAt: '2026-11-05',
    counts: { replies: 3, reposts: 6, likes: 44 },
    children: (
      <>
        <Text>डिज़ाइन समीक्षा से पहले मैं ये तीन चीज़ें जाँचती हूँ।</Text>
        <ol className={styles.list}>
          <li>सबसे छोटी स्क्रीन पर डिज़ाइन देखना।</li>
          <li>खाली स्क्रीन और त्रुटि संदेश पढ़ना।</li>
          <li>सारे चरण सिर्फ़ कीबोर्ड से पूरे करना।</li>
        </ol>
      </>
    ),
  },
  {
    id: 'quote',
    language: 'ru',
    author: { name: 'София Волкова', username: 'sofiavolkova' },
    publishedAt: '2026-11-05',
    counts: { replies: 1, reposts: 8, likes: 63 },
    children: (
      <>
        <Text>Запись с первой страницы моего блокнота.</Text>
        <blockquote className={styles.quote}>
          Если действие требует длинного объяснения, сначала попробуй сделать
          само действие понятнее.
        </blockquote>
      </>
    ),
  },
  {
    id: 'code',
    language: 'zh-Hans',
    author: { name: '陈凯', username: 'kaichen' },
    publishedAt: '2026-11-04',
    counts: { replies: 4, reposts: 9, likes: 72 },
    children: (
      <>
        <Text>用一行 CSS 预留滚动条的位置，内容变化时布局就不会跳动。</Text>
        <CodeBlock
          language="scss"
          title="CSS"
          code={'.timeline {\n  scrollbar-gutter: stable;\n}'}
        />
      </>
    ),
  },
  {
    id: 'palette',
    language: 'ko',
    author: { name: '김하늘', username: 'haneulkim' },
    publishedAt: '2026-11-04',
    counts: { replies: 6, reposts: 4, likes: 58 },
    children: (
      <>
        <Text>이번 주 팔레트에 초록색 세 가지를 넣어 봤어요.</Text>
        <div className={styles.palette} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </>
    ),
  },
  {
    id: 'poll',
    language: 'es',
    author: { name: 'Lucía Ramos', username: 'luciaramos' },
    publishedAt: '2026-11-03',
    counts: { replies: 11, reposts: 2, likes: 35 },
    children: (
      <>
        <Text weight="semibold">¿De qué hablamos en la próxima charla?</Text>
        <Progress label="Diseño de interfaces" value={64} isValueShown />
        <Progress label="Frontend" value={36} isValueShown />
        <Text size="xs" tone="muted">
          Resultados de la encuesta · 50 votos
        </Text>
      </>
    ),
  },
  {
    id: 'event',
    language: 'sw',
    author: { name: 'Amani Juma', username: 'amanijuma' },
    publishedAt: '2026-11-02',
    counts: { replies: 7, reposts: 3, likes: 28 },
    children: (
      <>
        <Text>Tukutane wikendi ijayo.</Text>
        <div className={styles.event}>
          <Icon name="calendar" size="lg" />
          <div>
            <Text weight="semibold">Kahawa na michoro</Text>
            <Text size="sm" tone="muted">
              <time dateTime="2026-11-14T09:30:00+07:00">14/11 · 09:30</time>
            </Text>
          </div>
        </div>
      </>
    ),
  },
]

export function SamplePostList({ author }: { author?: PostAuthor }) {
  const { t } = useTranslation()

  return (
    <section aria-label={t('posts.samples')}>
      <Heading level={2} size="sm" className={styles.sampleHeading}>
        {t('posts.samples')}
      </Heading>
      {samples.map(({ id, author: sampleAuthor, ...post }) => (
        <TimelinePost key={id} {...post} author={author ?? sampleAuthor} />
      ))}
    </section>
  )
}
