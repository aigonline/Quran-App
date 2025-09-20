"use client"

import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react'

interface ApiStatus {
  isAuthenticated: boolean
  apiSource: 'quran-foundation' | 'fallback' | 'checking'
  lastChecked: Date | null
}

export function ApiStatusIndicator() {
  const [status, setStatus] = useState<ApiStatus>({
    isAuthenticated: false,
    apiSource: 'checking',
    lastChecked: null
  })

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        // Try to make a simple request to check API status
        const response = await fetch('/api/status')
        if (response.ok) {
          const data = await response.json()
          setStatus({
            isAuthenticated: data.authenticated,
            apiSource: data.source,
            lastChecked: new Date()
          })
        }
      } catch (error) {
        setStatus({
          isAuthenticated: false,
          apiSource: 'fallback',
          lastChecked: new Date()
        })
      }
    }

    checkApiStatus()
    // Check status every 5 minutes
    const interval = setInterval(checkApiStatus, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = () => {
    switch (status.apiSource) {
      case 'quran-foundation':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'fallback':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'checking':
        return <Wifi className="h-4 w-4 text-blue-500 animate-pulse" />
      default:
        return <WifiOff className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusText = () => {
    switch (status.apiSource) {
      case 'quran-foundation':
        return 'Quran Foundation API'
      case 'fallback':
        return 'Public API (Fallback)'
      case 'checking':
        return 'Checking...'
      default:
        return 'Offline'
    }
  }

  const getStatusColor = () => {
    switch (status.apiSource) {
      case 'quran-foundation':
        return 'text-green-500'
      case 'fallback':
        return 'text-yellow-500'
      case 'checking':
        return 'text-blue-500'
      default:
        return 'text-red-500'
    }
  }

  return (
    <div className="flex items-center space-x-2 text-xs text-brown-600 dark:text-brown-400">
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      {status.isAuthenticated && (
        <span className="px-1 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded text-xs">
          Auth
        </span>
      )}
    </div>
  )
}