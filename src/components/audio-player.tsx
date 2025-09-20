"use client"

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, User } from 'lucide-react'

interface AudioPlayerProps {
  audioUrl?: string
  isPlaying: boolean
  onPlayPause: () => void
  currentVerse?: number
  onVerseChange?: (verse: number) => void
  totalVerses?: number
  currentReciter?: {
    id: number
    name: string
    style?: string
  }
  onReciterChange?: (reciter: { id: number; name: string; style?: string }) => void
  availableReciters?: Array<{
    id: number
    name: string
    style?: string
  }>
  isLoadingAudio?: boolean
}

export function AudioPlayer({ 
  audioUrl, 
  isPlaying, 
  onPlayPause, 
  currentVerse = 1,
  onVerseChange,
  totalVerses = 1,
  currentReciter,
  onReciterChange,
  availableReciters = [],
  isLoadingAudio = false
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(0.75)
  const [isMuted, setIsMuted] = useState(false)
  const [showReciterDropdown, setShowReciterDropdown] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', () => {
      onPlayPause()
      // Auto-advance to next verse if available
      if (currentVerse < totalVerses && onVerseChange) {
        onVerseChange(currentVerse + 1)
      }
    })

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
    }
  }, [audioUrl, currentVerse, totalVerses, onPlayPause, onVerseChange])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showReciterDropdown) {
        const target = event.target as Element
        if (!target.closest('.reciter-dropdown')) {
          setShowReciterDropdown(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showReciterDropdown])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.play().catch(console.error)
    } else {
      audio.pause()
    }
  }, [isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = (parseFloat(e.target.value) / 100) * duration
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value) / 100
    setVolume(newVolume)
    setIsMuted(false)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handlePreviousVerse = () => {
    if (currentVerse > 1 && onVerseChange) {
      onVerseChange(currentVerse - 1)
    }
  }

  const handleNextVerse = () => {
    if (currentVerse < totalVerses && onVerseChange) {
      onVerseChange(currentVerse + 1)
    }
  }

  const handleReciterChange = (reciterId: number) => {
    const reciter = availableReciters.find(r => r.id === reciterId)
    if (reciter && onReciterChange) {
      onReciterChange(reciter)
      setShowReciterDropdown(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-brown-200 dark:border-brown-800">
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
        />
      )}
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          {/* Previous Verse */}
          <button
            onClick={handlePreviousVerse}
            disabled={currentVerse <= 1 || isLoadingAudio}
            className="p-2 rounded-lg bg-brown-100 dark:bg-brown-800 hover:bg-brown-200 dark:hover:bg-brown-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SkipBack className="h-5 w-5 text-brown-700 dark:text-brown-300" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={onPlayPause}
            disabled={isLoadingAudio}
            className="p-3 bg-brown-600 hover:bg-brown-700 disabled:bg-brown-400 text-white rounded-full transition-colors"
          >
            {isLoadingAudio ? (
              <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6 ml-1" />
            )}
          </button>

          {/* Next Verse */}
          <button
            onClick={handleNextVerse}
            disabled={currentVerse >= totalVerses || isLoadingAudio}
            className="p-2 rounded-lg bg-brown-100 dark:bg-brown-800 hover:bg-brown-200 dark:hover:bg-brown-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <SkipForward className="h-5 w-5 text-brown-700 dark:text-brown-300" />
          </button>

          <div className="text-sm text-brown-600 dark:text-brown-400">
            Verse {currentVerse} of {totalVerses}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Reciter Selector */}
          {availableReciters.length > 0 && (
            <div className="relative reciter-dropdown">
              <button
                onClick={() => setShowReciterDropdown(!showReciterDropdown)}
                className="flex items-center space-x-2 px-3 py-2 bg-brown-100 dark:bg-brown-800 hover:bg-brown-200 dark:hover:bg-brown-700 rounded-lg transition-colors text-sm"
                title="Change Reciter"
              >
                <User className="h-4 w-4 text-brown-600 dark:text-brown-400" />
                <span className="text-brown-700 dark:text-brown-300 hidden sm:inline">
                  {currentReciter?.name?.split(' ')[0] || 'Reciter'}
                </span>
              </button>
              
              {showReciterDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-brown-200 dark:border-brown-700 z-50 max-h-60 overflow-y-auto">
                  {availableReciters.map((reciter) => (
                    <button
                      key={reciter.id}
                      onClick={() => handleReciterChange(reciter.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-brown-50 dark:hover:bg-brown-900/20 transition-colors border-b border-brown-100 dark:border-brown-800 last:border-b-0 ${
                        currentReciter?.id === reciter.id ? 'bg-brown-50 dark:bg-brown-900/20' : ''
                      }`}
                    >
                      <div className="font-medium text-brown-900 dark:text-brown-100">
                        {reciter.name}
                      </div>
                      {reciter.style && (
                        <div className="text-xs text-brown-600 dark:text-brown-400">
                          {reciter.style}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Volume Control */}
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              className="p-1 rounded hover:bg-brown-100 dark:hover:bg-brown-800 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5 text-brown-600 dark:text-brown-400" />
              ) : (
                <Volume2 className="h-5 w-5 text-brown-600 dark:text-brown-400" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume * 100}
              onChange={handleVolumeChange}
              className="w-20 h-2 bg-brown-200 dark:bg-brown-700 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <input
          type="range"
          min="0"
          max="100"
          value={duration ? (currentTime / duration) * 100 : 0}
          onChange={handleSeek}
          className="w-full h-2 bg-brown-200 dark:bg-brown-700 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between text-xs text-brown-500 dark:text-brown-400">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: rgb(146, 64, 14);
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: rgb(146, 64, 14);
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
}