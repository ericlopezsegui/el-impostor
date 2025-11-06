import { NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

const PLAYERS = [
  // Leyendas históricas
  'Pelé', 'Maradona', 'Cruyff', 'Beckenbauer', 'Di Stéfano', 'Puskas', 'Garrincha',
  'Zidane', 'Ronaldo Nazário', 'Ronaldinho',
  
  // Era moderna top
  'Messi', 'Cristiano Ronaldo', 'Neymar', 'Mbappé', 'Haaland', 'Lewandowski',
  'Benzema', 'Modrić', 'De Bruyne', 'Salah', 'Kane', 'Son', 'Griezmann',
  
  // Real Madrid
  'Vinicius Jr', 'Bellingham', 'Rodrygo', 'Valverde', 'Camavinga', 'Courtois',
  'Alaba', 'Militão', 'Carvajal', 'Tchouaméni', 'Kroos', 'Ramos', 'Casillas',
  'Raúl', 'Figo', 'Roberto Carlos', 'Marcelo', 'Benzema', 'Endrick',
  
  // FC Barcelona
  'Xavi', 'Iniesta', 'Puyol', 'Busquets', 'Pedri', 'Gavi', 'Lewandowski',
  'Ter Stegen', 'Araújo', 'Kounde', 'Dembélé', 'Raphinha', 'De Jong',
  'Guardiola', 'Rivaldo', 'Lamine Yamal', 'Hustle Hard 304', 'Guardiola',
  
  // Premier League
  'Salah', 'De Bruyne', 'Haaland', 'Kane', 'Son', 'Saka', 'Rashford',
  'Bruno Fernandes', 'Rodri', 'Van Dijk', 'Alexander-Arnold', 'Palmer',
  'Foden', 'Rice', 'Odegaard', 'Grealish', 'Bernardo Silva',
  
  // Italia
  'Buffon', 'Maldini', 'Baresi', 'Nesta', 'Pirlo', 'Totti',
  'Baggio', 'Cannavaro', 'Zambrotta', 'Gattuso', 'Inzaghi',
  
  // Bundesliga
  'Müller', 'Neuer', 'Reus', 'Kimmich', 'Goretzka', 'Sané', 'Gnabry',
  'Musiala', 'Wirtz', 'Havertz',
  
  // Francia
  'Zidane', 'Henry', 'Thuram', 'Desailly', 'Ribéry', 'Lloris',
  'Giroud', 'Pogba', 'Kanté', 'Benzema', 'Griezmann', 'Deschamps',
  
  // Otros grandes
  'Luis Suárez', 'Cavani', 'Agüero', 'Di María', 'Dybala', 'Lautaro Martínez',
  'Zlatan Ibrahimovic', 'Van Persie', 'Robben',
  'Rooney', 'Beckham', 'Drogba', 'Eto\'o', 'Kaka', 'Shevchenko', 'Tevez', 'Mascherano'
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 })

  const { data: players } = await supabase
    .from('players')
    .select('name')
    .eq('lobby_code', code)

  if (!players?.length) return NextResponse.json({ error: 'No players' }, { status: 400 })

  const impostorIndex = Math.floor(Math.random() * players.length)
  const impostor = players[impostorIndex].name
  const word = PLAYERS[Math.floor(Math.random() * PLAYERS.length)]

  await supabase.from('players').update({ is_impostor: false }).eq('lobby_code', code)
  await supabase
    .from('players')
    .update({ is_impostor: true })
    .eq('lobby_code', code)
    .eq('name', impostor)

  await supabase
    .from('lobbies')
    .update({ status: 'playing', impostor, word })
    .eq('code', code)

  return NextResponse.json({ impostor, word })
}