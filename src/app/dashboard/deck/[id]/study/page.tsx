import { redirect } from 'next/navigation'

export default async function DeckStudyRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/dashboard/study?decks=${id}`)
}
