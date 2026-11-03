import { setRequestLocale } from 'next-intl/server'
import { AnswerPage, answerMetadata } from '@/components/answers/AnswerPage'

const SLUG = 'kto-takoy-come-from-beyond'
export const metadata = answerMetadata(SLUG)

export default async function Page(props: { params: Promise<{ locale: string }> }) {
  const { locale } = await props.params
  setRequestLocale(locale)
  return <AnswerPage slug={SLUG} />
}
