"use client"

import { useState } from 'react'
import { testQuranFoundationAPI } from '@/lib/test-api'

export function APITestButton() {
  const [result, setResult] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  const runTest = async () => {
    setTesting(true)
    try {
      const testResult = await testQuranFoundationAPI()
      setResult(testResult)
    } catch (error) {
      setResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
    }
    setTesting(false)
  }

  return (
    <div className="fixed top-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-w-md shadow-lg z-50">
      <button
        onClick={runTest}
        disabled={testing}
        className="bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-400 mb-3"
      >
        {testing ? 'Testing V4 API...' : 'Test V4 API'}
      </button>
      
      {result && (
        <div className="mt-3">
          <h4 className="font-bold mb-2">Test Result:</h4>
          <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-x-auto max-h-60 overflow-y-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}