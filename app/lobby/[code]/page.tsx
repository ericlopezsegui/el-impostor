import LobbyClient from './LobbyClient'

export default async function Lobby({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params // ✅ Desempaquetamos la promesa (Next.js 15)
  return <LobbyClient code={code} />
}