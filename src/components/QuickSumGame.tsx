import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

type Score = {
  id: string
  score: number
  created_at: string
  time_seconds: number
  moves: number
}

export function QuickSumGame() {
  const { user } = useAuth()
  const [gameActive, setGameActive] = useState(false)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [numbers, setNumbers] = useState<number[]>([])
  const [userInput, setUserInput] = useState('')
  const [moves, setMoves] = useState(0)
  const [highScores, setHighScores] = useState<Score[]>([])
  const [userScores, setUserScores] = useState<Score[]>([])
  const [showHistory, setShowHistory] = useState(true)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (gameActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      endGame()
    }
    return () => clearInterval(timer)
  }, [gameActive, timeLeft])

  useEffect(() => {
    loadScores()
  }, [])

  const loadScores = async () => {
    try {
      // Cargar puntuaciones globales
      const { data: globalScores, error: globalError } = await supabase
        .from('game_scores')
        .select('*')
        .order('score', { ascending: false })
        .limit(5)

      if (globalError) throw globalError
      setHighScores(globalScores || [])

      // Cargar puntuaciones del usuario
      if (user) {
        const { data: userScoreData, error: userError } = await supabase
          .from('game_scores')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)

        if (userError) throw userError
        setUserScores(userScoreData || [])
      }
    } catch (error) {
      console.error('Error loading scores:', error)
    }
  }

  const saveScore = async () => {
    if (!user) return

    try {
      const { error } = await supabase.from('game_scores').insert([
        {
          user_id: user.id,
          score: score,
          time_seconds: 60 - timeLeft,
          moves: moves,
        },
      ])

      if (error) throw error
      await loadScores()
    } catch (error) {
      console.error('Error saving score:', error)
    }
  }

  const startGame = () => {
    setGameActive(true)
    setScore(0)
    setTimeLeft(60)
    setMoves(0)
    generateNewNumbers()
  }

  const endGame = () => {
    setGameActive(false)
    saveScore()
  }

  const generateNewNumbers = () => {
    const newNumbers = Array.from({ length: 3 }, () => Math.floor(Math.random() * 10) + 1)
    setNumbers(newNumbers)
    setUserInput('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const sum = numbers.reduce((a, b) => a + b, 0)
    const userSum = parseInt(userInput)

    if (userSum === sum) {
      setScore((prev) => prev + 1)
      setMoves((prev) => prev + 1)
      generateNewNumbers()
    } else {
      setMoves((prev) => prev + 1)
      generateNewNumbers()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-red-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 gradient-text">
          Suma Rápida
        </h1>

        <div className="glass-effect rounded-2xl p-6 shadow-xl mb-8">
          <div className="flex justify-between items-center mb-6">
            <div className="text-2xl font-bold gradient-text">
              Puntuación: {score}
            </div>
            <div className="text-2xl font-bold gradient-text">
              Tiempo: {timeLeft}s
            </div>
          </div>

          {!gameActive ? (
            <button
              onClick={startGame}
              className="btn-game w-full text-xl py-4"
            >
              Iniciar Juego
            </button>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center space-x-4">
                {numbers.map((num, index) => (
                  <div
                    key={index}
                    className="text-6xl font-bold gradient-text animate-pulse"
                  >
                    {num}
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex gap-4">
                <input
                  type="number"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  className="input-game flex-1"
                  placeholder="Ingresa la suma"
                  autoFocus
                />
                <button type="submit" className="btn-game">
                  Verificar
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="glass-effect rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold gradient-text mb-4">
              Mejores Puntuaciones
            </h2>
            <div className="space-y-4">
              {highScores.map((score) => (
                <div
                  key={score.id}
                  className="card-hover bg-white/50 rounded-xl p-4"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{score.score} puntos</span>
                    <span className="text-sm text-gray-600">
                      {new Date(score.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Tiempo: {score.time_seconds}s | Movimientos: {score.moves}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-effect rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold gradient-text mb-4">
              Tu Historial
            </h2>
            <div className="space-y-4">
              {userScores.map((score) => (
                <div
                  key={score.id}
                  className="card-hover bg-white/50 rounded-xl p-4"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{score.score} puntos</span>
                    <span className="text-sm text-gray-600">
                      {new Date(score.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Tiempo: {score.time_seconds}s | Movimientos: {score.moves}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 