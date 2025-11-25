"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "../../lib/supabase"

import { CATEGORIES, CategoryKey } from "../../lib/game-data"

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
  const [gameMode, setGameMode] = useState<CategoryKey>("futbol")
  const [impostorCount, setImpostorCount] = useState(1)
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

    await fetch(`/api/start-game?code=${code}&mode=${gameMode}&impostors=${impostorCount}`)
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
      <div className="text-center mb-8 animate-fadeIn flex flex-col items-center">
        <div className="inline-block relative mb-6">
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-red-600 tracking-tighter drop-shadow-sm">
            IMPOSTOR
          </h1>
          <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
        </div>

        {status === "waiting" && (
          <div className="w-full flex justify-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-card/50 backdrop-blur-sm border border-primary/20 rounded-xl shadow-lg shadow-primary/5">
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Código</span>
              <span className="text-primary font-mono font-black text-3xl tracking-widest">{code}</span>
            </div>
          </div>
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
                        <path d="M18 6 6 18M6 6l12 12" />
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
        <div className="flex flex-col gap-6 w-full max-w-md animate-fadeIn pb-20">
          {isHost ? (
            <div className="space-y-6">
              <div className="bg-card/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span className="text-2xl"></span> Configuración
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-muted-foreground mb-3 block uppercase tracking-wider">
                      Categoría
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(CATEGORIES).map(([key, value]) => (
                        <button
                          key={key}
                          onClick={() => setGameMode(key as CategoryKey)}
                          className={`relative overflow-hidden px-4 py-3 rounded-xl text-sm font-bold transition-all duration-300 border ${gameMode === key
                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25 scale-105"
                            : "bg-secondary/30 border-transparent text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                            }`}
                        >
                          {value.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-muted-foreground mb-3 block uppercase tracking-wider">
                      Impostores
                    </label>
                    <div className="flex items-center gap-4 bg-secondary/20 p-2 rounded-xl border border-white/5">
                      <button
                        onClick={() => setImpostorCount(Math.max(1, impostorCount - 1))}
                        className="w-12 h-12 flex items-center justify-center rounded-lg bg-background/50 border border-white/10 hover:bg-background text-foreground transition-all active:scale-95 text-xl font-bold shadow-sm"
                        disabled={impostorCount <= 1}
                      >
                        -
                      </button>
                      <div className="flex-1 text-center">
                        <span className="block text-3xl font-black text-primary tracking-tight">
                          {impostorCount}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                          {impostorCount === 1 ? 'Impostor' : 'Impostores'}
                        </span>
                      </div>
                      <button
                        onClick={() => setImpostorCount(Math.min(Math.floor(players.length / 2), impostorCount + 1))}
                        className="w-12 h-12 flex items-center justify-center rounded-lg bg-background/50 border border-white/10 hover:bg-background text-foreground transition-all active:scale-95 text-xl font-bold shadow-sm"
                        disabled={impostorCount >= Math.floor(players.length / 2)}
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xs text-center mt-2 text-muted-foreground font-medium">
                      Máx. {Math.floor(players.length / 2)} para {players.length} jugadores
                    </p>
                  </div>
                </div>
              </div>

              <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent z-50 md:static md:bg-none md:p-0">
                <div className="flex flex-col gap-3 max-w-md mx-auto">
                  <button
                    onClick={startGame}
                    disabled={players.length < 3}
                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl ${players.length < 3
                      ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                      : "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-primary/25 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0"
                      }`}
                  >
                    {players.length < 3 ? "Esperando jugadores..." : "INICIAR PARTIDA"}
                  </button>
                  <button
                    onClick={closeLobby}
                    className="w-full py-3 text-destructive font-semibold text-sm hover:bg-destructive/5 rounded-xl transition-colors"
                  >
                    Cancelar y cerrar lobby
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 px-6 bg-card/50 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-2xl">
                  ⏳
                </div>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Esperando al anfitrión</h3>
              <p className="text-muted-foreground">El host está configurando la partida...</p>
            </div>
          )}
        </div>
      )}

      {status === "playing" && (
        <div className="w-full max-w-md space-y-6 animate-fadeIn px-4">
          {!gameState.isLoaded ? (
            <div className="py-20 text-center">
              <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
              <h3 className="text-2xl font-bold animate-pulse">Cargando tu rol...</h3>
            </div>
          ) : (
            <>
              {gameState.isImpostor ? (
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-destructive to-red-900 p-1 shadow-2xl shadow-destructive/30">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
                  <div className="relative bg-black/20 backdrop-blur-sm rounded-[20px] p-8 text-center space-y-6">
                    <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto text-5xl mb-4 animate-bounce">
                      🤫
                    </div>
                    <div>
                      <h2 className="text-4xl font-black text-white tracking-tight mb-2 uppercase drop-shadow-lg">
                        Impostor
                      </h2>
                      <p className="text-red-100 font-medium text-lg leading-relaxed">
                        Tu misión es engañar a todos. ¡Que no te descubran!
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-blue-900 p-1 shadow-2xl shadow-primary/30">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>
                  <div className="relative bg-black/20 backdrop-blur-sm rounded-[20px] p-8 text-center space-y-6">
                    <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto text-5xl mb-4">
                      🕵️
                    </div>
                    <div>
                      <p className="text-blue-200 text-sm font-bold uppercase tracking-widest mb-2">
                        La palabra secreta es
                      </p>
                      <h2 className="text-4xl font-black text-white tracking-tight mb-4 drop-shadow-lg">
                        {gameState.word}
                      </h2>
                      <p className="text-blue-100 font-medium">
                        Encuentra a los impostores entre el grupo
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {isHost && gameState.isLoaded && (
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent z-50 md:static md:bg-none md:p-0">
              <div className="flex flex-col gap-3 max-w-md mx-auto">
                <button
                  onClick={endRound}
                  className="w-full py-4 bg-foreground text-background hover:bg-foreground/90 rounded-2xl font-bold text-lg transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  Finalizar Ronda
                </button>
                <button
                  onClick={closeLobby}
                  className="w-full py-3 text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
                >
                  Cerrar Sala
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}
