"use client"

import { useState, useEffect, useCallback } from 'react'
import { Play, Pause, Settings as SettingsIcon, Loader2 } from 'lucide-react'
import { useQuran } from '@/components/quran-provider'
import { AudioPlayer } from '@/components/audio-player'
import { AyahPlayer } from '@/components/ayah-player'
import { Settings } from '@/components/settings'
import { QuranAPI } from '@/lib/quran-api'

// Available reciters (verified IDs from API testing)
const AVAILABLE_RECITERS = [
  { id: 7, name: 'Mishari Rashid Alafasy', style: 'Murattal' },
  { id: 2, name: 'Abdul Basit Abdul Samad', style: 'Murattal' },
  { id: 1, name: 'Abdul Basit Abdul Samad', style: 'Mujawwad' },
  { id: 3, name: 'Abdur Rahman As-Sudais', style: 'Murattal' },
  { id: 4, name: 'Abu Bakr Ash-Shaatri', style: 'Murattal' },
  { id: 5, name: 'Hani Ar-Rifai', style: 'Murattal' },
  { id: 6, name: 'Khalil Al-Husary', style: 'Murattal' },
  { id: 10, name: 'Saud Ash-Shuraim', style: 'Murattal' },
  { id: 9, name: 'Siddiq Minshawi', style: 'Murattal' },
  { id: 8, name: 'Siddiq Al-Minshawi', style: 'Mujawwad' }
]

export function QuranReader() {
  const { 
    surahs, 
    currentSurah, 
    currentAyahs, 
    currentTranslations,
    currentTransliterations,
    settings,
    updateSettings,
    loading, 
    error 
  } = useQuran()
  
  const [currentVerse, setCurrentVerse] = useState<number>(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string>('')
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)
  const [playingAyah, setPlayingAyah] = useState<string | null>(null) // Track which individual ayah is playing

  // Load audio URL when current surah changes
  useEffect(() => {
    const loadAudioUrl = async () => {
      if (!currentSurah) return
      
      setIsLoadingAudio(true)
      try {
        const url = await QuranAPI.getAuthenticatedAudio(currentSurah, settings.reciter.id)
        setAudioUrl(url)
      } catch (error) {
        console.error('Failed to load audio URL:', error)
        // Fallback to public audio
        setAudioUrl(QuranAPI.getAudioUrl(currentSurah, settings.reciter.id))
      } finally {
        setIsLoadingAudio(false)
      }
    }
    
    loadAudioUrl()
  }, [currentSurah, settings.reciter.id])

  const handlePlayPause = () => {
    // Stop any individual ayah playback when main player starts
    if (!isPlaying && playingAyah) {
      setPlayingAyah(null)
    }
    setIsPlaying(!isPlaying)
  }

  const handleVerseChange = (verseNumber: number) => {
    setCurrentVerse(verseNumber)
  }

  const handleVerseClick = useCallback((verseNumber: number) => {
    setCurrentVerse(verseNumber)
    if (!isPlaying) {
      setIsPlaying(true)
    }
  }, [isPlaying])

  const handleReciterChange = (reciter: { id: number; name: string; style?: string }) => {
    // Update settings with the new reciter
    const newSettings = {
      ...settings,
      reciter: reciter
    }
    updateSettings(newSettings)
    
    // Pause audio if currently playing
    if (isPlaying) {
      setIsPlaying(false)
    }
    
    // Stop any individual ayah playback
    if (playingAyah) {
      setPlayingAyah(null)
    }
  }

  const handleAyahPlay = useCallback((verseKey: string) => {
    // Stop main audio player if it's playing
    if (isPlaying) {
      setIsPlaying(false)
    }
    
    // Stop any other ayah that might be playing
    if (playingAyah && playingAyah !== verseKey) {
      setPlayingAyah(null)
      // Small delay to ensure previous audio stops
      setTimeout(() => setPlayingAyah(verseKey), 100)
    } else {
      setPlayingAyah(verseKey)
    }
    
    // Update current verse to match the playing ayah
    const verseNumber = parseInt(verseKey.split(':')[1])
    setCurrentVerse(verseNumber)
  }, [isPlaying, playingAyah])

  const handleAyahPause = useCallback(() => {
    setPlayingAyah(null)
  }, [])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3 text-brown-600 dark:text-brown-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">Loading Quran...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 mb-2">
            Error loading Quran data
          </div>
          <div className="text-sm text-brown-500 dark:text-brown-400">
            {error}
          </div>
        </div>
      </div>
    )
  }

  const currentSurahData = Array.isArray(surahs) ? surahs.find(s => s.number === currentSurah) : null

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      {currentSurahData && (
        <div className="bg-brown-50 dark:bg-brown-900/20 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brown-900 dark:text-brown-100 mb-2 font-arabic" translate="no">
                {currentSurahData.name}
              </h1>
              <p className="text-brown-600 dark:text-brown-400">
                {currentSurahData.englishName} ({currentSurahData.englishNameTranslation}) • {currentSurahData.numberOfAyahs} verses • {currentSurahData.revelationType}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  const newMode = settings.displayMode === 'arabic-only' ? 'arabic-translation' : 'arabic-only'
                  updateSettings({...settings, displayMode: newMode})
                }}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  settings.displayMode !== 'arabic-only'
                    ? 'bg-brown-600 text-white' 
                    : 'bg-brown-200 dark:bg-brown-800 text-brown-700 dark:text-brown-300'
                }`}
              >
                Translation
              </button>
              <button
                onClick={() => {
                  const newMode = settings.displayMode === 'arabic-translation-transliteration' 
                    ? 'arabic-translation' 
                    : 'arabic-translation-transliteration'
                  updateSettings({...settings, displayMode: newMode})
                }}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  settings.displayMode === 'arabic-translation-transliteration'
                    ? 'bg-brown-600 text-white' 
                    : 'bg-brown-200 dark:bg-brown-800 text-brown-700 dark:text-brown-300'
                }`}
              >
                Transliteration
              </button>
              <button 
                onClick={() => setShowSettingsModal(true)}
                className="p-2 rounded-lg bg-brown-200 dark:bg-brown-800 hover:bg-brown-300 dark:hover:bg-brown-700 transition-colors"
              >
                <SettingsIcon className="h-5 w-5 text-brown-700 dark:text-brown-300" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audio Player */}
      <div className="mb-6">
        <AudioPlayer
          audioUrl={audioUrl}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          currentVerse={currentVerse}
          onVerseChange={handleVerseChange}
          totalVerses={currentAyahs.length}
          currentReciter={settings.reciter}
          onReciterChange={handleReciterChange}
          availableReciters={AVAILABLE_RECITERS}
          isLoadingAudio={isLoadingAudio}
        />
      </div>

      {/* Verses */}
      <div className="space-y-6">
        {Array.isArray(currentAyahs) && currentAyahs.length > 0 ? (
          currentAyahs.map((ayah, index) => {
            const translation = Array.isArray(currentTranslations) ? currentTranslations[index] : null
            const transliteration = Array.isArray(currentTransliterations) ? currentTransliterations[index] : null
            
            // Determine what to show based on display mode
            const shouldShowTranslation = 
              settings.displayMode === 'arabic-translation' || 
              settings.displayMode === 'arabic-translation-transliteration'
            
            const shouldShowTransliteration = 
              settings.displayMode === 'arabic-translation-transliteration'
            
            // Get font sizes based on settings
            const arabicFontClass = {
              'small': 'text-lg md:text-xl',
              'medium': 'text-xl md:text-2xl',
              'large': 'text-2xl md:text-3xl',
              'xl': 'text-3xl md:text-4xl'
            }[settings.arabicFontSize]
            
            const translationFontClass = {
              'small': 'text-sm',
              'medium': 'text-base',
              'large': 'text-lg'
            }[settings.translationFontSize]
            
            return (
              <div
                key={ayah.number}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border transition-all duration-300 ${
                  currentVerse === ayah.numberInSurah
                    ? 'border-brown-400 shadow-md bg-brown-50/50 dark:bg-brown-900/20' 
                    : 'border-brown-200 dark:border-brown-800 hover:shadow-md'
                }`}
              >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-brown-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {ayah.numberInSurah}
                  </div>
                  
                  {/* Conditional Audio Player based on settings */}
                  {settings.audioMode === 'verse' ? (
                    /* Individual Ayah Player */
                    <AyahPlayer
                      verseKey={`${currentSurah}:${ayah.numberInSurah}`}
                      reciterId={settings.reciter.id}
                      chapterNumber={currentSurah || 1}
                      isPlaying={playingAyah === `${currentSurah}:${ayah.numberInSurah}`}
                      onPlay={handleAyahPlay}
                      onPause={handleAyahPause}
                      size="sm"
                    />
                  ) : (
                    /* Main Chapter Player Button */
                    <button
                      onClick={() => handleVerseClick(ayah.numberInSurah)}
                      className="p-2 rounded-lg bg-brown-100 dark:bg-brown-800 hover:bg-brown-200 dark:hover:bg-brown-700 transition-colors"
                      title="Play from this verse (chapter audio)"
                    >
                      {currentVerse === ayah.numberInSurah && isPlaying ? (
                        <Pause className="h-4 w-4 text-brown-700 dark:text-brown-300" />
                      ) : (
                        <Play className="h-4 w-4 text-brown-700 dark:text-brown-300" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Arabic Text */}
              <div className="text-right mb-4">
                <p className={`${arabicFontClass} leading-relaxed font-arabic text-brown-900 dark:text-brown-100`} translate="no">
                  {ayah.text}
                </p>
              </div>

              {/* Transliteration */}
              {shouldShowTransliteration && transliteration && (
                <div className="mb-3 text-right">
                  <p className={`${translationFontClass} italic text-brown-600 dark:text-brown-400 leading-relaxed`}>
                    {transliteration.text}
                  </p>
                </div>
              )}

              {/* Translation */}
              {shouldShowTranslation && translation && (
                <div>
                  <p className={`${translationFontClass} text-brown-800 dark:text-brown-200 leading-relaxed`}>
                    {translation.text}
                  </p>
                </div>
              )}
            </div>
          )
        })
        ) : (
          <div className="text-center py-12">
            <div className="text-brown-600 dark:text-brown-400">
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Loading verses...</span>
                </div>
              ) : error ? (
                <div className="text-red-600 dark:text-red-400">
                  <p>{error}</p>
                </div>
              ) : (
                <p>No verses available</p>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Settings Modal */}
      <Settings
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSettingsChange={updateSettings}
        currentSettings={settings}
      />
    </div>
  )
}