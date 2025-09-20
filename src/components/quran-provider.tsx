"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { QuranAPI, Surah, Ayah, Translation, Transliteration } from '@/lib/quran-api'
import type { QuranSettings } from '@/components/settings'

interface QuranContextType {
  surahs: Surah[]
  currentSurah: number
  currentAyahs: Ayah[]
  currentTranslations: Translation[]
  currentTransliterations: Transliteration[]
  settings: QuranSettings
  loading: boolean
  error: string | null
  setCurrentSurah: (surahNumber: number) => void
  updateSettings: (newSettings: QuranSettings) => void
  searchResults: any[]
  searchLoading: boolean
  searchQuran: (query: string) => void
}

// Default settings
const defaultSettings: QuranSettings = {
  reciter: { id: 7, name: 'Mishari Rashid Alafasy', style: 'Murattal' },
  translator: { id: '20', name: 'Mohammed Marmaduke William Pickthall', language: 'English' },
  displayMode: 'arabic-translation',
  showTranslation: true,
  showTransliteration: false,
  arabicFontSize: 'medium',
  translationFontSize: 'medium',
  audioMode: 'verse' // Default to individual verse audio
}

const QuranContext = createContext<QuranContextType | undefined>(undefined)

interface QuranProviderProps {
  children: React.ReactNode
}

export function QuranProvider({ children }: QuranProviderProps) {
  const [surahs, setSurahs] = useState<Surah[]>([])
  const [currentSurah, setCurrentSurahState] = useState<number>(1)
  const [currentAyahs, setCurrentAyahs] = useState<Ayah[]>([])
  const [currentTranslations, setCurrentTranslations] = useState<Translation[]>([])
  const [currentTransliterations, setCurrentTransliterations] = useState<Transliteration[]>([])
  const [settings, setSettings] = useState<QuranSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Ensure we're on the client side
  useEffect(() => {
    setMounted(true)
  }, [])

  // Load surahs on mount (client-side only)
  useEffect(() => {
    if (!mounted) return

    const loadSurahs = async () => {
      try {
        setLoading(true)
        const surahsData = await QuranAPI.getSurahs()
        setSurahs(surahsData)
        setError(null)
      } catch (err) {
        console.error('Error loading surahs:', err)
        setError(err instanceof Error ? err.message : 'Failed to load surahs')
      } finally {
        setLoading(false)
      }
    }

    loadSurahs()
  }, [mounted])

  // Load current surah data when currentSurah changes (client-side only)
  useEffect(() => {
    if (!mounted || currentSurah < 1 || currentSurah > 114) return

    const loadSurahData = async () => {
      try {
        setLoading(true)
        const { ayahs, translations } = await QuranAPI.getSurahWithTranslation(
          currentSurah, 
          'ar.alafasy', 
          settings.translator.id
        )
        
        console.log('🔍 QuranProvider received data:', {
          currentSurah,
          ayahsCount: ayahs?.length || 0,
          translationsCount: translations?.length || 0,
          firstAyah: ayahs?.[0],
          firstTranslation: translations?.[0],
          translatorId: settings.translator.id
        })
        
        // Load transliterations if enabled
        let transliterations: Transliteration[] = []
        if (settings.showTransliteration) {
          transliterations = await QuranAPI.getTransliterations(currentSurah)
        }
        
        setCurrentAyahs(ayahs)
        setCurrentTranslations(translations)
        setCurrentTransliterations(transliterations)
        setError(null)
      } catch (err) {
        console.error('Error loading surah data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load surah data')
      } finally {
        setLoading(false)
      }
    }

    loadSurahData()
  }, [currentSurah, mounted, settings.translator.id, settings.showTransliteration])

  const setCurrentSurah = (surahNumber: number) => {
    if (surahNumber >= 1 && surahNumber <= 114) {
      setCurrentSurahState(surahNumber)
    }
  }

  const updateSettings = (newSettings: QuranSettings) => {
    // Auto-update showTranslation and showTransliteration based on displayMode
    const updatedSettings = {
      ...newSettings,
      showTranslation: newSettings.displayMode !== 'arabic-only',
      showTransliteration: newSettings.displayMode === 'arabic-translation-transliteration'
    }
    setSettings(updatedSettings)
  }

  const searchQuran = async (query: string) => {
    if (!mounted || !query.trim()) {
      setSearchResults([])
      return
    }

    try {
      setSearchLoading(true)
      const results = await QuranAPI.searchQuran(query.trim())
      setSearchResults(results.matches || [])
    } catch (err) {
      console.error('Search error:', err)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const value: QuranContextType = {
    surahs,
    currentSurah,
    currentAyahs,
    currentTranslations,
    currentTransliterations,
    settings,
    loading,
    error,
    setCurrentSurah,
    updateSettings,
    searchResults,
    searchLoading,
    searchQuran,
  }

  // Don't render anything until we're mounted on client
  if (!mounted) {
    return (
      <QuranContext.Provider value={{
        surahs: [],
        currentSurah: 1,
        currentAyahs: [],
        currentTranslations: [],
        currentTransliterations: [],
        settings: defaultSettings,
        loading: true,
        error: null,
        setCurrentSurah: () => {},
        updateSettings: () => {},
        searchResults: [],
        searchLoading: false,
        searchQuran: () => {},
      }}>
        {children}
      </QuranContext.Provider>
    )
  }

  return (
    <QuranContext.Provider value={value}>
      {children}
    </QuranContext.Provider>
  )
}

export function useQuran() {
  const context = useContext(QuranContext)
  if (context === undefined) {
    throw new Error('useQuran must be used within a QuranProvider')
  }
  return context
}