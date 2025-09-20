"use client"

import { useQuran } from '@/components/quran-provider'
import { useState } from 'react'

export function DebugPanel() {
  const { surahs, loading, error } = useQuran()
  const [showDebug, setShowDebug] = useState(false)

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => setShowDebug(true)}
          className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm"
        >
          Debug
        </button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-w-md shadow-lg z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-lg">Debug Info</h3>
        <button
          onClick={() => setShowDebug(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div>
          <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
        </div>
        <div>
          <strong>Error:</strong> {error || 'None'}
        </div>
        <div>
          <strong>Surahs Count:</strong> {Array.isArray(surahs) ? surahs.length : 'Not array'}
        </div>
        <div>
          <strong>Surahs Type:</strong> {typeof surahs}
        </div>
        <div>
          <strong>First Surah:</strong> {surahs.length > 0 ? JSON.stringify(surahs[0], null, 2) : 'None'}
        </div>
        <div>
          <strong>Environment:</strong>
          <ul className="ml-2">
            <li>Client ID: {process.env.NEXT_PUBLIC_QURAN_CLIENT_ID ? 'Set' : 'Missing'}</li>
            <li>API Base: {process.env.NEXT_PUBLIC_QURAN_API_BASE_URL || 'Default'}</li>
            <li>Fallback: {process.env.NEXT_PUBLIC_FALLBACK_API_URL || 'Default'}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}