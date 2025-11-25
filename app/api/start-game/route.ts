import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { CATEGORIES, CategoryKey } from '@/app/lib/game-data'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const mode = (searchParams.get('mode') || 'futbol') as CategoryKey
  const impostorCount = parseInt(searchParams.get('impostors') || '1')

  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

  const { data: players } = await supabase
    .from('players')
    .select('name')
    .eq('lobby_code', code)

  if (!players?.length) return NextResponse.json({ error: 'No players' }, { status: 400 })

  // Validar número de impostores
  const maxImpostors = Math.floor(players.length / 2)
  const finalImpostorCount = Math.min(Math.max(1, impostorCount), maxImpostors)

  // Seleccionar impostores
  const shuffledPlayers = [...players].sort(() => 0.5 - Math.random())
  const impostors = shuffledPlayers.slice(0, finalImpostorCount).map(p => p.name)

  // Seleccionar palabra
  let category = CATEGORIES[mode] || CATEGORIES.futbol

  if (mode === 'aleatorio') {
    const allWords = Object.values(CATEGORIES)
      .filter(c => c.label !== 'Aleatorio')
      .flatMap(c => c.words)

    category = {
      label: 'Aleatorio',
      words: allWords as any
    }
  }

  const word = category.words[Math.floor(Math.random() * category.words.length)]

  // Resetear estado
  await supabase.from('players').update({ is_impostor: false }).eq('lobby_code', code)

  // Asignar impostores
  await supabase
    .from('players')
    .update({ is_impostor: true })
    .eq('lobby_code', code)
    .in('name', impostors)

  // Actualizar lobby
  await supabase
    .from('lobbies')
    .update({
      status: 'playing',
      impostor: impostors.join(','), // Guardamos todos los impostores separados por coma
      word
    })
    .eq('code', code)

  return NextResponse.json({ impostors, word })
}