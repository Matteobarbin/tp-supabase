import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

type Card = {
  id: number
  emoji: string
  isFlipped: boolean
  isMatched: boolean
}

type Score = {
  id: string
  score: number
  moves: number
  time_seconds: number
  created_at: string
}

export function MemoryGame() {
  const [cards, setCards] = useState<Card[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [moves, setMoves] = useState(0)
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [startTime, setStartTime] = useState<number>(0)
  const [endTime, setEndTime] = useState<number>(0)
  const [scores, setScores] = useState<Score[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    loadScores()
  }, [])

  useEffect(() => {
    if (gameStarted && !gameOver) {
      const timer = setInterval(() => {
        setEndTime(Date.now())
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [gameStarted, gameOver])

  useEffect(() => {
    if (gameOver) {
      const timeSeconds = Math.floor((endTime - startTime) / 1000)
      saveScore(timeSeconds)
    }
  }, [gameOver])

  const loadScores = async () => {
    const { data } = await supabase
      .from('game_scores')
      .select('*')
      .order('score', { ascending: false })
      .limit(5)
    if (data) setScores(data)
  }

  const saveScore = async (timeSeconds: number) => {
    const { error } = await supabase
      .from('game_scores')
      .insert([
        {
          user_id: user?.id,
          score,
          moves,
          time_seconds: timeSeconds,
        },
      ])
    if (!error) {
      loadScores()
    }
  }

  const startNewGame = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('generate-cards')
      if (error) throw error
      if (data && data.cards) {
        setCards(data.cards)
        setFlippedCards([])
        setMoves(0)
        setScore(0)
        setGameStarted(true)
        setGameOver(false)
        setStartTime(Date.now())
        setEndTime(Date.now())
      }
    } catch (error) {
      console.error('Error al iniciar el juego:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = (index: number) => {
    if (
      flippedCards.length === 2 ||
      flippedCards.includes(index) ||
      cards[index].isMatched ||
      !gameStarted ||
      gameOver
    ) {
      return
    }

    const newCards = [...cards]
    newCards[index] = { ...newCards[index], isFlipped: true }
    setCards(newCards)

    const newFlippedCards = [...flippedCards, index]
    setFlippedCards(newFlippedCards)

    if (newFlippedCards.length === 2) {
      setMoves(moves + 1)
      const [firstIndex, secondIndex] = newFlippedCards
      const firstCard = cards[firstIndex]
      const secondCard = cards[secondIndex]

      if (firstCard.emoji === secondCard.emoji) {
        const updatedCards = cards.map((card, i) =>
          i === firstIndex || i === secondIndex
            ? { ...card, isMatched: true }
            : card
        )
        setCards(updatedCards)
        setScore(score + 10)
        setFlippedCards([])

        // Check if all cards are matched
        const allMatched = updatedCards.every(card => card.isMatched)
        if (allMatched) {
          setGameOver(true)
        }
      } else {
        setTimeout(() => {
          const resetCards = cards.map((card, i) =>
            i === firstIndex || i === secondIndex
              ? { ...card, isFlipped: false }
              : card
          )
          setCards(resetCards)
          setFlippedCards([])
        }, 1000)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Juego de Memoria</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm font-medium text-gray-900">
                Movimientos: {moves}
              </div>
              <div className="text-sm font-medium text-gray-900">
                Puntuación: {score}
              </div>
              {gameStarted && !gameOver && (
                <div className="text-sm font-medium text-gray-900">
                  Tiempo: {Math.floor((endTime - startTime) / 1000)}s
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center mb-8">
          <button
            onClick={startNewGame}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors duration-200 font-medium"
          >
            {loading ? 'Cargando...' : gameStarted ? 'Nueva Partida' : 'Iniciar Juego'}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {cards.map((card, index) => (
            <div
              key={card.id}
              onClick={() => handleCardClick(index)}
              className={`aspect-square cursor-pointer transition-all duration-300 transform ${
                card.isFlipped || card.isMatched ? 'rotate-y-180' : ''
              }`}
            >
              <div className={`w-full h-full rounded-lg shadow-lg flex items-center justify-center text-4xl ${
                card.isFlipped || card.isMatched
                  ? 'bg-white'
                  : 'bg-indigo-600'
              }`}>
                {(card.isFlipped || card.isMatched) ? card.emoji : '?'}
              </div>
            </div>
          ))}
        </div>

        {gameOver && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">¡Juego Completado!</h2>
            <p className="text-gray-900">
              Puntuación: {score}
              <br />
              Movimientos: {moves}
              <br />
              Tiempo: {Math.floor((endTime - startTime) / 1000)} segundos
            </p>
          </div>
        )}

        {scores.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Mejores Puntuaciones</h2>
            <div className="space-y-4">
              {scores.map((score) => (
                <div key={score.id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">Puntuación: {score.score}</p>
                      <p className="text-sm text-gray-600">
                        Movimientos: {score.moves} | Tiempo: {score.time_seconds}s
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(score.created_at).toLocaleString('es-ES')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
} 