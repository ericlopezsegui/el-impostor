
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function POST(request: NextRequest) {
  const { code } = await request.json()

  // Eliminar todos los jugadores del lobby
  await supabase
    .from('players')
    .delete()
    .eq('lobby_code', code)

  // Eliminar el lobby
  await supabase
    .from('lobbies')
    .delete()
    .eq('code', code)

  return NextResponse.json({ success: true })
}