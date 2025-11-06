"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

type GameState = {
  word: string | null
  isImpostor: boolean
  isLoaded: boolean
}

export default function LobbyClient({ code }: { code: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const name = searchParams.get("name") || ""
  const [players, setPlayers] = useState<string[]>([])
  const [status, setStatus] = useState("waiting")
  const [host, setHost] = useState<string>("")
  const [gameState, setGameState] = useState<GameState>({
    word: null,
    isImpostor: false,
    isLoaded: false
  })

  const fetchState = async () => {
    const { data: playerData } = await supabase.from("players").select("name").eq("lobby_code", code)
    const playerNames = playerData?.map((p) => p.name) || []
    setPlayers(playerNames)

    // Si el jugador actual fue expulsado, redirigir a home
    if (!playerNames.includes(name)) {
      router.push('/')
      return
    }

    const { data: lobbyData, error } = await supabase.from("lobbies").select("status, word, host").eq("code", code).single()

    if (error || !lobbyData) {
      router.push('/')
      return
    }

    if (lobbyData) {
      setStatus(lobbyData.status)
      setHost(lobbyData.host || "")
      
      if (lobbyData.status === "playing") {
        const { data: impostorCheck } = await supabase
          .from("players")
          .select("is_impostor")
          .eq("lobby_code", code)
          .eq("name", name)
          .single()
        
        setGameState({
          word: lobbyData.word,
          isImpostor: impostorCheck?.is_impostor || false,
          isLoaded: true
        })
      } else {
        setGameState({
          word: null,
          isImpostor: false,
          isLoaded: false
        })
      }
    }
  }

  useEffect(() => {
    fetchState()
    const interval = setInterval(fetchState, 2000)
    return () => clearInterval(interval)
  }, [code])

  const startGame = async () => {
    setGameState({
      word: null,
      isImpostor: false,
      isLoaded: false
    })
    
    await fetch(`/api/start-game?code=${code}`)
    setTimeout(fetchState, 500)
  }

  const endRound = async () => {
    setGameState({
      word: null,
      isImpostor: false,
      isLoaded: false
    })
    setStatus("waiting")
    
    await fetch('/api/end-round', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    })
    
    fetchState()
  }

  const closeLobby = async () => {
    if (confirm('¿Estás seguro de que quieres cerrar el lobby? Todos los jugadores serán expulsados.')) {
      await fetch('/api/close-lobby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      })
      router.push('/')
    }
  }

  const kickPlayer = async (playerName: string) => {
    if (confirm(`¿Estás seguro de que quieres expulsar a ${playerName}?`)) {
      await fetch('/api/kick-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, playerName })
      })
      fetchState()
    }
  }

  const isHost = name === host

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-gradient-to-b from-background to-muted/20">
      <div className="text-center mb-8 animate-fadeIn">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-6">
          EL IMPOSTOR
        </h1>
        
        {status === "waiting" && (
          <>
            <h2 className="text-2xl md:text-3xl font-semibold text-muted-foreground mb-4">Lobby</h2>
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-card border-2 border-primary/30 rounded-xl shadow-lg shadow-primary/10">
              <span className="text-sm font-medium text-muted-foreground">Código</span>
              <span className="text-primary font-mono font-bold text-2xl tracking-widest">{code}</span>
            </div>
          </>
        )}
      </div>

      {status === "waiting" && (
        <div className="w-full max-w-2xl mb-8 animate-fadeIn">
          <div className="p-6 rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-foreground">Jugadores</h2>
              <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                {players.length} {players.length === 1 ? 'jugador' : 'jugadores'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {players.map((p, index) => (
                <div
                  key={p}
                  className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/30 transition-all"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-sm font-bold text-primary-foreground shadow-md">
                    {p.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-foreground font-medium flex-1">
                    {p}
                  </span>
                  {p === host && (
                    <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-semibold rounded-md">
                      Host
                    </span>
                  )}
                  {isHost && p !== host && (
                    <button
                      onClick={() => kickPlayer(p)}
                      className="text-destructive hover:bg-destructive/10 p-1.5 rounded-md transition-colors"
                      title="Expulsar jugador"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {status === "waiting" && (
        <div className="flex flex-col gap-3 w-full max-w-md">
          {isHost ? (
            <>
              <button
                onClick={startGame}
                className="px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
              >
                Iniciar Partida
              </button>
              <button
                onClick={closeLobby}
                className="px-8 py-3 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg font-medium transition-all duration-200 border border-destructive/30"
              >
                Cerrar Lobby
              </button>
            </>
          ) : (
            <div className="text-center py-8 px-6 bg-card rounded-xl border border-border">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground font-medium">Esperando a que el host inicie la partida...</p>
            </div>
          )}
        </div>
      )}

      {status === "playing" && (
        <div className="w-full max-w-md space-y-4 animate-fadeIn">
          {!gameState.isLoaded ? (
            <div className="p-10 rounded-2xl bg-card border border-border shadow-xl text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-muted-foreground font-medium">Cargando tu rol...</p>
            </div>
          ) : (
            <>
              {gameState.isImpostor ? (
                <div className="p-10 rounded-2xl bg-gradient-to-br from-destructive/5 to-destructive/10 border-2 border-destructive/30 shadow-2xl shadow-destructive/20 text-center space-y-4">
                  <p className="text-3xl font-bold text-destructive">Eres el Impostor</p>
                  <p className="text-muted-foreground text-lg">Engaña a los otros jugadores sin que te descubran</p>
                </div>
              ) : (
                <div className="p-10 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/30 shadow-2xl shadow-primary/20 text-center space-y-4">
                  <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Tu jugador es</p>
                  <p className="text-4xl font-bold text-primary tracking-tight">{gameState.word}</p>
                  <p className="text-muted-foreground text-lg">Encuentra al impostor entre los demás</p>
                </div>
              )}
            </>
          )}
          
          {isHost && gameState.isLoaded && (
            <div className="flex flex-col gap-3 pt-4">
              <button
                onClick={endRound}
                className="w-full px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
              >
                Finalizar Ronda
              </button>
              <button
                onClick={closeLobby}
                className="w-full px-8 py-3 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg font-medium transition-all duration-200 border border-destructive/30"
              >
                Cerrar Lobby
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
