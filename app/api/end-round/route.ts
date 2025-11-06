
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function POST(request: NextRequest) {
  const { code } = await request.json()

  // Reiniciar el estado del lobby
  await supabase
    .from('lobbies')
    .update({ status: 'waiting', word: null })
    .eq('code', code)

  // Reiniciar el estado de los jugadores
  await supabase
    .from('players')
    .update({ is_impostor: false })
    .eq('lobby_code', code)

  return NextResponse.json({ success: true })
}