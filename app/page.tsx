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
    <main className="flex flex-col items-center justify-center min-h-screen px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="text-center mb-16 space-y-4 animate-fadeIn">
        <h1 className="text-5xl md:text-6xl font-bold text-foreground tracking-tight">
          EL IMPOSTOR
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Versión fútbol · Adivina quién es el impostor
        </p>
      </div>

      {!mode && (
        <div className="flex flex-col gap-4 w-full max-w-sm animate-fadeIn">
          <button
            onClick={() => setMode("create")}
            className="group relative px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold text-lg transition-all duration-200 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
          >
            <span className="flex items-center justify-center gap-2">
              Crear Lobby
            </span>
          </button>
          <button
            onClick={() => setMode("join")}
            className="px-8 py-4 bg-card hover:bg-card/80 text-foreground rounded-xl font-semibold text-lg transition-all duration-200 border-2 border-border hover:border-primary/50 shadow-sm hover:shadow-md"
          >
            Unirse a Lobby
          </button>
        </div>
      )}

      {mode && (
        <div className="w-full max-w-sm space-y-5 p-8 rounded-2xl border border-border bg-card shadow-xl animate-fadeIn">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-muted-foreground mb-2">
              Tu nombre
            </label>
            <input
              id="name"
              placeholder="Escribe tu nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-background border-2 border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
          
          {mode === "join" && (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Código de lobby
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
                    className={`w-16 h-16 bg-background border-2 rounded-lg text-center text-2xl font-bold text-primary placeholder:text-muted-foreground/50 focus:outline-none focus:ring-4 transition-all uppercase ${
                      error 
                        ? 'border-destructive focus:border-destructive focus:ring-destructive/10' 
                        : 'border-primary/30 focus:border-primary focus:ring-primary/10'
                    }`}
                    placeholder="·"
                  />
                ))}
              </div>
              {error && (
                <p className="text-destructive text-sm font-medium mt-2 text-center animate-fadeIn">
                  {error}
                </p>
              )}
            </div>
          )}
          
          <button
            disabled={!name || (mode === "join" && code.join("").length !== 4)}
            className={`w-full px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
              !name || (mode === "join" && code.join("").length !== 4)
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
            }`}
            onClick={mode === "create" ? createLobby : joinLobby}
          >
            Entrar
          </button>
          
          <button
            onClick={() => {
              setMode(null)
              setCode(["", "", "", ""])
              setName("")
              setError("")
            }}
            className="w-full px-6 py-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
          >
            ← Volver
          </button>
        </div>
      )}

      <footer className="absolute bottom-8 text-center text-sm text-muted-foreground">
        <p>Juego multijugador en tiempo real</p>
      </footer>
    </main>
  )
}
