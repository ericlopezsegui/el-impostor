"use client"

import { useState, useRef, KeyboardEvent } from "react"
import { supabase } from "./lib/supabase"

export default function Home() {
  const [name, setName] = useState("")
  const [code, setCode] = useState(["", "", "", ""])
  const [mode, setMode] = useState<"create" | "join" | null>(null)
  const [error, setError] = useState("")
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const createLobby = async () => {
    const newCode = Math.random().toString(36).substring(2, 6).toUpperCase()
    await supabase.from("lobbies").insert({ code: newCode, host: name })
    await supabase.from("players").insert({ name, lobby_code: newCode })
    window.location.href = `/lobby/${newCode}?name=${encodeURIComponent(name)}`
  }

  const joinLobby = async () => {
    const fullCode = code.join("")

    // Verificar si el lobby existe
    const { data: lobbyExists } = await supabase
      .from("lobbies")
      .select("code")
      .eq("code", fullCode)
      .single()

    if (!lobbyExists) {
      setError("El lobby no existe, prueba con otro código")
      return
    }

    await supabase.from("players").insert({ name, lobby_code: fullCode })
    window.location.href = `/lobby/${fullCode}?name=${encodeURIComponent(name)}`
  }

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1) return

    setError("") // Limpiar error al escribir
    const newCode = [...code]
    newCode[index] = value.toUpperCase()
    setCode(newCode)

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    setError("") // Limpiar error al pegar
    const pastedData = e.clipboardData.getData('text').toUpperCase().slice(0, 4)
    const newCode = pastedData.split('').concat(['', '', '', '']).slice(0, 4)
    setCode(newCode)

    const nextEmptyIndex = newCode.findIndex(char => !char)
    const focusIndex = nextEmptyIndex === -1 ? 3 : nextEmptyIndex
    inputRefs.current[focusIndex]?.focus()
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 py-12 bg-gradient-to-b from-background to-muted/20 overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="text-center mb-12 space-y-6 animate-fadeIn relative z-10">
        <div className="inline-block relative">
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600 tracking-tighter drop-shadow-sm">
            IMPOSTOR
          </h1>
          <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
        </div>
        <p className="text-xl text-muted-foreground max-w-md mx-auto font-medium leading-relaxed">
          Descubre quién miente. <br />
          <span className="text-primary font-bold">Versión Ultimate</span>
        </p>
      </div>

      {!mode && (
        <div className="flex flex-col gap-4 w-full max-w-sm animate-fadeIn relative z-10">
          <button
            onClick={() => setMode("create")}
            className="group relative px-8 py-5 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-primary-foreground rounded-2xl font-bold text-xl transition-all duration-300 shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <span className="relative flex items-center justify-center gap-3">
              <span className="text-2xl"></span> Crear Partida
            </span>
          </button>
          <button
            onClick={() => setMode("join")}
            className="group px-8 py-5 bg-card/50 backdrop-blur-sm hover:bg-card/80 text-foreground rounded-2xl font-bold text-xl transition-all duration-300 border-2 border-white/10 hover:border-primary/30 shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0"
          >
            <span className="flex items-center justify-center gap-3">
              <span className="text-2xl"></span> Unirse a Partida
            </span>
          </button>

          <button
            onClick={() => window.location.href = '/local'}
            className="group px-8 py-5 bg-secondary/30 backdrop-blur-sm hover:bg-secondary/50 text-foreground rounded-2xl font-bold text-xl transition-all duration-300 border-2 border-white/5 hover:border-white/20 shadow-lg hover:shadow-xl hover:-translate-y-1 active:translate-y-0"
          >
            <span className="flex items-center justify-center gap-3">
              <span className="text-2xl"></span> Un solo móvil
            </span>
          </button>
        </div>
      )}

      {mode && (
        <div className="w-full max-w-sm space-y-6 p-8 rounded-3xl border border-white/10 bg-card/50 backdrop-blur-xl shadow-2xl animate-fadeIn relative z-10">
          <div>
            <label htmlFor="name" className="block text-sm font-bold text-muted-foreground mb-2 uppercase tracking-wider">
              Tu nombre
            </label>
            <input
              id="name"
              placeholder="¿Cómo te llamas?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-background/50 border-2 border-border rounded-xl px-4 py-4 text-lg font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              autoFocus
            />
          </div>

          {mode === "join" && (
            <div>
              <label className="block text-sm font-bold text-muted-foreground mb-4 uppercase tracking-wider text-center">
                Código de la sala
              </label>
              <div className="flex gap-3 justify-center" onPaste={handlePaste}>
                {[0, 1, 2, 3].map((index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    maxLength={1}
                    value={code[index]}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-14 h-16 sm:w-16 sm:h-16 bg-background/50 border-2 rounded-xl text-center text-3xl font-black text-primary placeholder:text-muted-foreground/20 focus:outline-none focus:ring-4 transition-all uppercase shadow-sm ${error
                      ? 'border-destructive focus:border-destructive focus:ring-destructive/10'
                      : 'border-primary/30 focus:border-primary focus:ring-primary/10'
                      }`}
                    placeholder="·"
                  />
                ))}
              </div>
              {error && (
                <p className="text-destructive text-sm font-bold mt-3 text-center animate-fadeIn bg-destructive/10 py-2 rounded-lg">
                  {error}
                </p>
              )}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              disabled={!name || (mode === "join" && code.join("").length !== 4)}
              className={`w-full px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 ${!name || (mode === "join" && code.join("").length !== 4)
                ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                : "bg-gradient-to-r from-primary to-purple-600 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0"
                }`}
              onClick={mode === "create" ? createLobby : joinLobby}
            >
              {mode === "create" ? "Crear Sala" : "Entrar"}
            </button>

            <button
              onClick={() => {
                setMode(null)
                setCode(["", "", "", ""])
                setName("")
                setError("")
              }}
              className="w-full px-6 py-3 text-muted-foreground hover:text-foreground transition-colors text-sm font-semibold hover:bg-secondary/50 rounded-xl"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <footer className="absolute bottom-6 text-center text-xs font-medium text-muted-foreground/60">
        <p>Hecho con ❤️ para jugar con amigos</p>
      </footer>
    </main>
  )
}
