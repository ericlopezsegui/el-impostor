
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../lib/supabase'

export async function POST(request: NextRequest) {
  const { code, playerName } = await request.json()

  // Eliminar el jugador del lobby
  await supabase
    .from('players')
    .delete()
    .eq('lobby_code', code)
    .eq('name', playerName)

  return NextResponse.json({ success: true })
}