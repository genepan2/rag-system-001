'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [query, setQuery] = useState('')

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health')
        
        if (response.ok) {
          const data = await response.json()
          console.log('✅ Backend connectivity verified:', data)
        } else {
          console.error('❌ Health check failed with status:', response.status)
        }
      } catch (error) {
        console.error('❌ Health check failed - network or endpoint error:', error)
      }
    }

    checkHealth()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Submit functionality will be implemented in future stories
    console.log('Query submitted:', query)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            RAG System Query Interface
          </h1>
          <p className="text-lg text-gray-600">
            Enter your query to search through documents
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
            <div className="flex-1">
              <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                Your Query
              </label>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-lg"
                placeholder="Enter your question or query here..."
              />
            </div>
            <button
              type="submit"
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors min-w-[120px]"
            >
              Submit
            </button>
          </div>
        </form>

        <div className="bg-white rounded-lg shadow-lg p-6 min-h-[400px]">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Results
          </h2>
          <div className="text-gray-500 italic">
            Query results will appear here...
          </div>
        </div>
      </div>
    </main>
  )
}