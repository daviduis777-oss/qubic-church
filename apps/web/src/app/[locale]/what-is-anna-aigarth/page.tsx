import { setRequestLocale } from 'next-intl/server'
import { AnswerPage, answerMetadata } from '@/components/answers/AnswerPage'

const SLUG = 'what-is-anna-aigarth'
export const metadata = answerMetadata(SLUG)

export default async function Page(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)
  return <AnswerPage slug={SLUG} />
}
