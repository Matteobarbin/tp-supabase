import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

type Summary = {
  id: string
  original_text: string
  summary: string
  created_at: string
}

export function TextSummarizer() {
  const [text, setText] = useState('')
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<Summary[]>([])
  const { user, signOut } = useAuth()

  const handleSummarize = async () => {
    if (!text.trim()) return

    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.functions.invoke('summarize-text', {
        body: { text }
      })

      if (error) throw error

      setSummary(data.summary)
      
      // Fetch updated history
      const { data: summaries } = await supabase
        .from('summaries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (summaries) {
        setHistory(summaries)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error al generar el resumen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Resumen Inteligente</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => signOut()}
                className="ml-4 px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Generar Resumen</h2>
          <textarea
            className="w-full h-48 p-4 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            placeholder="Pega tu texto aquí..."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button
            onClick={handleSummarize}
            disabled={loading || !text.trim()}
            className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors duration-200 font-medium"
          >
            {loading ? 'Generando resumen...' : 'Generar Resumen'}
          </button>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {summary && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Resumen</h2>
            <div className="p-4 bg-gray-50 rounded-lg text-gray-700">
              {summary}
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Resúmenes Recientes</h2>
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <div className="mb-2">
                    <strong className="text-gray-900">Texto Original:</strong>
                    <p className="text-gray-600 mt-1">{item.original_text.substring(0, 100)}...</p>
                  </div>
                  <div>
                    <strong className="text-gray-900">Resumen:</strong>
                    <p className="text-gray-600 mt-1">{item.summary}</p>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    {new Date(item.created_at).toLocaleString('es-ES')}
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