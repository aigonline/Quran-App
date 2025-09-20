"use client"

import { useState } from 'react'
import { ChevronRight, Book, Play, Loader2 } from 'lucide-react'
import { useQuran } from '@/components/quran-provider'

export function Sidebar() {
  const { surahs, currentSurah, setCurrentSurah, loading } = useQuran()

  if (loading) {
    return (
      <div className="w-80 bg-brown-50 dark:bg-brown-900/20 border-r border-brown-200 dark:border-brown-800 h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex items-center space-x-2 text-brown-600 dark:text-brown-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading Surahs...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-brown-50 dark:bg-brown-900/20 border-r border-brown-200 dark:border-brown-800 h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-brown-900 dark:text-brown-100 mb-4 flex items-center">
          <Book className="mr-2 h-5 w-5" />
          Surahs
        </h2>
        
        <div className="space-y-2">
          {Array.isArray(surahs) && surahs.length > 0 ? (
            surahs.map((surah) => (
              <div
                key={surah.number}
                onClick={() => setCurrentSurah(surah.number)}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-brown-100 dark:hover:bg-brown-800/50 ${
                  currentSurah === surah.number 
                    ? 'bg-brown-100 dark:bg-brown-800/70 border-l-4 border-brown-600' 
                    : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-arabic text-brown-900 dark:text-brown-100" translate="no">
                        {surah.name}
                      </span>
                      <span className="text-sm font-medium text-brown-600 dark:text-brown-400">
                        {surah.number}
                      </span>
                    </div>
                    <div className="mt-1">
                      <p className="text-sm text-brown-700 dark:text-brown-300">
                        {surah.englishName}
                      </p>
                      <p className="text-xs text-brown-500 dark:text-brown-500">
                        {surah.englishNameTranslation} • {surah.numberOfAyahs} verses
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-3">
                    <button
                      className="p-1 rounded hover:bg-brown-200 dark:hover:bg-brown-700 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        // Handle audio play - will implement later
                      }}
                    >
                      <Play className="h-4 w-4 text-brown-600 dark:text-brown-400" />
                    </button>
                    <ChevronRight className="h-4 w-4 text-brown-400" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="text-brown-600 dark:text-brown-400">
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading surahs...</span>
                  </div>
                ) : (
                  <p>No surahs available</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}