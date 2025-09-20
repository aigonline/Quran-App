"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Loader2 } from 'lucide-react'

interface AyahPlayerProps {
  verseKey: string // e.g., "1:1"
  reciterId: number
  chapterNumber: number
  isPlaying?: boolean
  onPlay?: (verseKey: string) => void
  onPause?: () => void
  size?: 'sm' | 'md'
}

export function AyahPlayer({ 
  verseKey, 
  reciterId, 
  chapterNumber, 
  isPlaying = false,
  onPlay,
  onPause,
  size = 'sm'
}: AyahPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [hasLoadedAudio, setHasLoadedAudio] = useState(false)

  // Load verse audio URL only when requested
  const loadVerseAudio = useCallback(async () => {
    if (!verseKey || !reciterId || !chapterNumber || hasLoadedAudio) return
    
    setIsLoading(true)
    setHasError(false)
    
    try {
      const response = await fetch(`/api/verse-audio?reciter=${reciterId}&chapter=${chapterNumber}`)
      
      if (!response.ok) {
        console.error(`❌ API request failed with status ${response.status}`)
        setHasError(true)
        return
      }
      
      // Check content type
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error(`❌ Expected JSON but got ${contentType}`)
        const text = await response.text()
        console.error(`❌ Response text:`, text.substring(0, 200))
        setHasError(true)
        return
      }
      
      const data = await response.json()
      
      if (data.success && data.data && data.data.audio_files) {
        // Find the audio file for this specific verse
        const verseAudio = data.data.audio_files.find((file: any) => file.verse_key === verseKey)
        
        if (verseAudio) {
          // Use audio proxy to avoid CORS issues
          const proxiedUrl = `/api/audio-proxy?url=${encodeURIComponent(verseAudio.url)}`
          setAudioUrl(proxiedUrl)
          setHasLoadedAudio(true)
        } else {
          console.warn(`No audio found for verse ${verseKey}`)
          setHasError(true)
        }
      } else {
        console.error('❌ Failed to load verse audio:', data.error || 'Unknown error')
        setHasError(true)
      }
    } catch (error) {
      console.error('❌ Error loading verse audio:', error)
      setHasError(true)
    } finally {
      setIsLoading(false)
    }
  }, [verseKey, reciterId, chapterNumber, hasLoadedAudio])

  // Reset audio when reciter changes
  useEffect(() => {
    setAudioUrl('')
    setHasLoadedAudio(false)
    setHasError(false)
  }, [reciterId, chapterNumber])

  // Handle play/pause state changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return

    if (isPlaying) {
      audio.play().catch((error) => {
        console.error('❌ Error playing verse audio:', error)
        setHasError(true)
        // Notify parent that play failed
        onPause?.()
      })
    } else {
      audio.pause()
    }
  }, [isPlaying, audioUrl, onPause])

  // Handle audio end and errors
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleEnded = () => {
      onPause?.()
    }

    const handleError = (e: Event) => {
      console.error('❌ Audio element error:', e)
      setHasError(true)
      onPause?.()
    }

    const handleCanPlay = () => {
      setHasError(false)
    }

    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    audio.addEventListener('canplay', handleCanPlay)
    
    return () => {
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('canplay', handleCanPlay)
    }
  }, [audioUrl, onPause])

  const handleClick = async () => {
    if (isLoading) return
    
    if (isPlaying) {
      onPause?.()
    } else {
      // Load audio first if not already loaded
      if (!hasLoadedAudio && !audioUrl) {
        await loadVerseAudio()
        // After loading, if there's an error, don't proceed
        if (hasError) return
      }
      
      onPlay?.(verseKey)
    }
  }

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  const buttonSize = size === 'sm' ? 'p-1.5' : 'p-2'

  return (
    <>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
        />
      )}
      
      <button
        onClick={handleClick}
        disabled={isLoading}
        className={`${buttonSize} rounded-lg bg-brown-100 dark:bg-brown-800 hover:bg-brown-200 dark:hover:bg-brown-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        title={
          hasError 
            ? 'Audio not available' 
            : isLoading 
              ? 'Loading audio...' 
              : isPlaying 
                ? 'Pause verse' 
                : hasLoadedAudio
                  ? 'Play verse'
                  : 'Load and play verse'
        }
      >
        {isLoading ? (
          <Loader2 className={`${iconSize} animate-spin text-brown-600 dark:text-brown-400`} />
        ) : hasError ? (
          <div className={`${iconSize} bg-brown-300 dark:bg-brown-600 rounded-full`} />
        ) : isPlaying ? (
          <Pause className={`${iconSize} text-brown-700 dark:text-brown-300`} />
        ) : (
          <Play className={`${iconSize} text-brown-700 dark:text-brown-300 ml-0.5`} />
        )}
      </button>
    </>
  )
}