"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CATEGORIES, CategoryKey } from "../lib/game-data"

type GamePhase = "setup" | "turn" | "reveal" | "playing"

export default function LocalGame() {
    const router = useRouter()
    const [players, setPlayers] = useState<string[]>(["", "", ""])
    const [gameMode, setGameMode] = useState<CategoryKey>("futbol")
    const [impostorCount, setImpostorCount] = useState(1)

    const [phase, setPhase] = useState<GamePhase>("setup")
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0)
    const [roles, setRoles] = useState<{ name: string; isImpostor: boolean; word: string }[]>([])
    const [currentWord, setCurrentWord] = useState<string>("")

    const handlePlayerChange = (index: number, value: string) => {
        const newPlayers = [...players]
        newPlayers[index] = value
        setPlayers(newPlayers)
    }

    const addPlayer = () => setPlayers([...players, ""])

    const removePlayer = (index: number) => {
        if (players.length <= 3) return
        const newPlayers = players.filter((_, i) => i !== index)
        setPlayers(newPlayers)
    }

    const startGame = () => {
        const validPlayers = players.filter(p => p.trim())
        if (validPlayers.length < 3) return

        // Select word
        let category = CATEGORIES[gameMode] || CATEGORIES.futbol
        if (gameMode === 'aleatorio') {
            const allWords = Object.values(CATEGORIES)
                .filter(c => c.label !== 'Aleatorio')
                .flatMap(c => c.words)
            category = { label: 'Aleatorio', words: allWords as any }
        }
        const word = category.words[Math.floor(Math.random() * category.words.length)]
        setCurrentWord(word)

        // Assign roles
        const shuffledIndices = validPlayers.map((_, i) => i).sort(() => Math.random() - 0.5)
        const impostorIndices = shuffledIndices.slice(0, impostorCount)

        const newRoles = validPlayers.map((name, i) => ({
            name,
            isImpostor: impostorIndices.includes(i),
            word
        }))

        setRoles(newRoles)
        setPhase("turn")
        setCurrentPlayerIndex(0)
    }

    const nextTurn = () => {
        if (currentPlayerIndex < roles.length - 1) {
            setCurrentPlayerIndex(prev => prev + 1)
            setPhase("turn")
        } else {
            setPhase("playing")
        }
    }

    return (
        <main className="flex flex-col items-center justify-center min-h-screen px-4 py-8 bg-gradient-to-b from-background to-muted/20">
            <div className="text-center mb-8 animate-fadeIn">
                <div className="inline-block relative mb-6">
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-red-600 tracking-tighter drop-shadow-sm">
                        IMPOSTOR
                    </h1>
                    <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50"></div>
                </div>
                <p className="text-muted-foreground font-medium">Modo Local</p>
            </div>

            {phase === "setup" && (
                <div className="w-full max-w-md space-y-6 animate-fadeIn pb-20">
                    <div className="bg-card/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                        <div>
                            <label className="text-sm font-semibold text-muted-foreground mb-3 block uppercase tracking-wider">
                                Jugadores
                            </label>
                            <div className="space-y-2">
                                {players.map((player, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            placeholder={`Jugador ${index + 1}`}
                                            value={player}
                                            onChange={(e) => handlePlayerChange(index, e.target.value)}
                                            className="flex-1 bg-background/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                        />
                                        {players.length > 3 && (
                                            <button
                                                onClick={() => removePlayer(index)}
                                                className="px-3 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    onClick={addPlayer}
                                    className="w-full py-3 border-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 rounded-xl font-medium transition-all"
                                >
                                    + Añadir Jugador
                                </button>
                            </div>
                        </div>

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
                                    onClick={() => setImpostorCount(Math.min(Math.floor(players.filter(p => p.trim()).length / 2), impostorCount + 1))}
                                    className="w-12 h-12 flex items-center justify-center rounded-lg bg-background/50 border border-white/10 hover:bg-background text-foreground transition-all active:scale-95 text-xl font-bold shadow-sm"
                                    disabled={impostorCount >= Math.floor(players.filter(p => p.trim()).length / 2)}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background/95 to-transparent z-50 md:static md:bg-none md:p-0">
                        <div className="flex flex-col gap-3 max-w-md mx-auto">
                            <button
                                onClick={startGame}
                                disabled={players.filter(p => p.trim()).length < 3}
                                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl ${players.filter(p => p.trim()).length < 3
                                        ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                                        : "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-primary/25 hover:shadow-2xl hover:shadow-primary/40 hover:-translate-y-1 active:translate-y-0"
                                    }`}
                            >
                                EMPEZAR
                            </button>
                            <button
                                onClick={() => router.push('/')}
                                className="w-full py-3 text-muted-foreground hover:text-foreground font-medium text-sm transition-colors"
                            >
                                Volver al inicio
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {phase === "turn" && (
                <div className="w-full max-w-md text-center space-y-8 animate-fadeIn">
                    <div className="p-8 rounded-3xl bg-card/50 backdrop-blur-md border border-white/10 shadow-2xl">
                        <p className="text-muted-foreground font-medium uppercase tracking-widest mb-4">Turno de</p>
                        <h2 className="text-4xl font-black text-foreground mb-8">{roles[currentPlayerIndex].name}</h2>
                        <div className="text-6xl mb-8">📱</div>
                        <p className="text-sm text-muted-foreground mb-8">
                            Pasa el móvil a {roles[currentPlayerIndex].name} para que vea su rol en secreto.
                        </p>
                        <button
                            onClick={() => setPhase("reveal")}
                            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                        >
                            Ver mi rol
                        </button>
                    </div>
                </div>
            )}

            {phase === "reveal" && (
                <div className="w-full max-w-md text-center space-y-8 animate-fadeIn">
                    {roles[currentPlayerIndex].isImpostor ? (
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-destructive to-red-900 p-1 shadow-2xl shadow-destructive/30">
                            <div className="relative bg-black/20 backdrop-blur-sm rounded-[20px] p-8 text-center space-y-6">
                                <div className="text-6xl mb-4 animate-bounce">🤫</div>
                                <h2 className="text-4xl font-black text-white tracking-tight uppercase">Impostor</h2>
                                <p className="text-red-100 font-medium text-lg">Engaña a todos.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-blue-900 p-1 shadow-2xl shadow-primary/30">
                            <div className="relative bg-black/20 backdrop-blur-sm rounded-[20px] p-8 text-center space-y-6">
                                <div className="text-6xl mb-4">🕵️</div>
                                <p className="text-blue-200 font-bold uppercase tracking-widest">La palabra es</p>
                                <h2 className="text-4xl font-black text-white tracking-tight">{currentWord}</h2>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={nextTurn}
                        className="w-full py-4 bg-foreground text-background rounded-2xl font-bold text-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                    >
                        Entendido
                    </button>
                </div>
            )}

            {phase === "playing" && (
                <div className="w-full max-w-md text-center space-y-8 animate-fadeIn">
                    <div className="p-8 rounded-3xl bg-card/50 backdrop-blur-md border border-white/10 shadow-2xl">
                        <div className="text-6xl mb-6">🗣️</div>
                        <h2 className="text-3xl font-black text-foreground mb-4">¡A Jugar!</h2>
                        <p className="text-muted-foreground text-lg mb-8">
                            Es hora de debatir y encontrar al impostor.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    setPhase("setup")
                                    setPlayers(players.map(p => p)) // Keep names
                                }}
                                className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                            >
                                Jugar otra vez
                            </button>
                            <button
                                onClick={() => router.push('/')}
                                className="w-full py-3 text-muted-foreground hover:text-foreground font-medium transition-colors"
                            >
                                Salir al inicio
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}
