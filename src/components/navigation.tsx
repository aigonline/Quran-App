"use client"

import { useState } from 'react'
import { useTheme } from '@/components/theme-provider'
import { useQuran } from '@/components/quran-provider'
import { ApiStatusIndicator } from '@/components/api-status'
import { Moon, Sun, Menu, Search, X } from 'lucide-react'

export function Navigation() {
  const { theme, setTheme } = useTheme()
  const { searchQuran, searchResults, searchLoading, setCurrentSurah } = useQuran()
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      searchQuran(searchQuery)
      setShowSearchResults(true)
    }
  }

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    
    if (value.trim()) {
      searchQuran(value)
      setShowSearchResults(true)
    } else {
      setShowSearchResults(false)
    }
  }

  const handleResultClick = (surahNumber: number, ayahNumber: number) => {
    setCurrentSurah(surahNumber)
    setShowSearchResults(false)
    setSearchQuery('')
    // TODO: Navigate to specific ayah
  }

  return (
    <nav className="bg-brown-900 dark:bg-brown-950 text-white shadow-lg relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and title */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-white">
                القرآن الكريم
              </h1>
              <div className="flex items-center justify-between">
                <p className="text-sm text-brown-200">Quran App</p>
                <ApiStatusIndicator />
              </div>
            </div>
          </div>

          {/* Center - Search */}
          <div className="hidden md:block flex-1 max-w-md mx-8 relative">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-brown-300" />
                </div>
                <input
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  className="block w-full pl-10 pr-10 py-2 border border-brown-700 rounded-md leading-5 bg-brown-800 text-white placeholder-brown-300 focus:outline-none focus:bg-brown-700 focus:border-brown-500"
                  placeholder="Search verses, surahs..."
                  type="search"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('')
                      setShowSearchResults(false)
                    }}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <X className="h-4 w-4 text-brown-300 hover:text-white" />
                  </button>
                )}
              </div>
            </form>

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-brown-200 dark:border-brown-700 max-h-96 overflow-y-auto z-50">
                {searchLoading ? (
                  <div className="p-4 text-center text-brown-600 dark:text-brown-400">
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.slice(0, 10).map((result, index) => (
                      <button
                        key={index}
                        onClick={() => handleResultClick(result.surah.number, result.numberInSurah)}
                        className="w-full px-4 py-3 text-left hover:bg-brown-50 dark:hover:bg-brown-800/50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-brown-900 dark:text-brown-100">
                              {result.surah.englishName} ({result.surah.name})
                            </p>
                            <p className="text-xs text-brown-500 dark:text-brown-400 mb-1">
                              Verse {result.numberInSurah}
                            </p>
                            <p className="text-sm text-brown-700 dark:text-brown-300 line-clamp-2">
                              {result.text}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                    {searchResults.length > 10 && (
                      <div className="px-4 py-2 text-center text-sm text-brown-500 dark:text-brown-400 border-t border-brown-200 dark:border-brown-700">
                        {searchResults.length - 10} more results...
                      </div>
                    )}
                  </div>
                ) : searchQuery.trim() ? (
                  <div className="p-4 text-center text-brown-600 dark:text-brown-400">
                    No results found for &quot;{searchQuery}&quot;
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Right side - Theme toggle and menu */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-md hover:bg-brown-800 transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            <button className="md:hidden p-2 rounded-md hover:bg-brown-800 transition-colors">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="md:hidden px-4 pb-4">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-brown-300" />
            </div>
            <input
              value={searchQuery}
              onChange={handleSearchInputChange}
              className="block w-full pl-10 pr-10 py-2 border border-brown-700 rounded-md leading-5 bg-brown-800 text-white placeholder-brown-300 focus:outline-none focus:bg-brown-700 focus:border-brown-500"
              placeholder="Search verses, surahs..."
              type="search"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setShowSearchResults(false)
                }}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-4 w-4 text-brown-300 hover:text-white" />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Overlay to close search results */}
      {showSearchResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSearchResults(false)}
        />
      )}
    </nav>
  )
}