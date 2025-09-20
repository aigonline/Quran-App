"use client"

import { useState, useEffect } from 'react'
import { X, ChevronDown, Volume2, Languages, Settings as SettingsIcon } from 'lucide-react'

interface SettingsProps {
  isOpen: boolean
  onClose: () => void
  onSettingsChange: (settings: QuranSettings) => void
  currentSettings: QuranSettings
}

export interface QuranSettings {
  reciter: {
    id: number
    name: string
    style?: string
  }
  translator: {
    id: string
    name: string
    language: string
  }
  displayMode: 'arabic-only' | 'arabic-translation' | 'arabic-translation-transliteration'
  showTranslation: boolean
  showTransliteration: boolean
  arabicFontSize: 'small' | 'medium' | 'large' | 'xl'
  translationFontSize: 'small' | 'medium' | 'large'
  audioMode: 'verse' | 'chapter' // New audio mode setting
}

// Available reciters (verified IDs from API testing)
const RECITERS = [
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

// Available translations (updated with verified working IDs from API testing)
const TRANSLATORS = [
  // Verified working translations (prioritized)
  { id: '20', name: 'Mohammed Marmaduke William Pickthall', language: 'English', verified: true },
  { id: '85', name: 'Ali Quli Qarai', language: 'English', verified: true },
  { id: '84', name: 'Clear Quran (Talal Itani)', language: 'English', verified: true },
  { id: '19', name: 'Mohammad Habib Shakir', language: 'English', verified: true },
  
  // Other translations (may need testing)
  { id: '131', name: 'Dr. Mustafa Khattab (Clear Quran)', language: 'English', verified: false },
  { id: '22', name: 'Abdullah Yusuf Ali', language: 'English', verified: false },
  { id: '18', name: 'Mohammad Habib Shakir (Alternative)', language: 'English', verified: false },
  { id: '158', name: 'Fateh Muhammad Jalandhri', language: 'Urdu', verified: false },
  { id: '97', name: 'Kanzul Iman', language: 'Urdu', verified: false },
  { id: '169', name: 'التفسير الميسر', language: 'Arabic', verified: false },
  { id: '83', name: 'Julio Cortés', language: 'Spanish', verified: false },
  { id: '31', name: 'Muhammad Hamidullah', language: 'French', verified: false },
  { id: '27', name: 'Bubenheim & Elyas', language: 'German', verified: false }
]

export function Settings({ isOpen, onClose, onSettingsChange, currentSettings }: SettingsProps) {
  const [settings, setSettings] = useState<QuranSettings>(currentSettings)
  const [activeTab, setActiveTab] = useState<'audio' | 'translation' | 'display'>('audio')

  // Save settings to localStorage
  useEffect(() => {
    if (isOpen) {
      const savedSettings = localStorage.getItem('quran-settings')
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings)
          setSettings({ ...currentSettings, ...parsed })
        } catch (error) {
          console.error('Error parsing saved settings:', error)
        }
      }
    }
  }, [isOpen, currentSettings])

  const handleSettingChange = (key: keyof QuranSettings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    
    // Save to localStorage
    localStorage.setItem('quran-settings', JSON.stringify(newSettings))
    
    // Notify parent component
    onSettingsChange(newSettings)
  }

  const handleReciterChange = (reciter: typeof RECITERS[0]) => {
    handleSettingChange('reciter', reciter)
  }

  const handleTranslatorChange = (translator: typeof TRANSLATORS[0]) => {
    handleSettingChange('translator', {
      id: translator.id,
      name: translator.name,
      language: translator.language
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <SettingsIcon className="h-6 w-6 text-brown-600 dark:text-brown-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Quran Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Status Notification */}
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <p className="text-sm text-green-700 dark:text-green-300">
              <strong>Updated:</strong> Now using Quran Foundation API with verified translations and cleaned text (footnotes removed).
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('audio')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'audio'
                ? 'text-brown-600 dark:text-brown-400 border-b-2 border-brown-600 dark:border-brown-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Volume2 className="h-4 w-4 inline mr-2" />
            Audio
          </button>
          <button
            onClick={() => setActiveTab('translation')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'translation'
                ? 'text-brown-600 dark:text-brown-400 border-b-2 border-brown-600 dark:border-brown-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Languages className="h-4 w-4 inline mr-2" />
            Translation
          </button>
          <button
            onClick={() => setActiveTab('display')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'display'
                ? 'text-brown-600 dark:text-brown-400 border-b-2 border-brown-600 dark:border-brown-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Display
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'audio' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Select Reciter
                </label>
                <div className="relative">
                  <select
                    value={settings.reciter.id}
                    onChange={(e) => {
                      const reciter = RECITERS.find(r => r.id === parseInt(e.target.value))
                      if (reciter) handleReciterChange(reciter)
                    }}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brown-500 focus:border-brown-500"
                  >
                    {RECITERS.map((reciter) => (
                      <option key={reciter.id} value={reciter.id}>
                        {reciter.name} ({reciter.style})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Audio Playback Mode
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="audioMode"
                      value="verse"
                      checked={settings.audioMode === 'verse'}
                      onChange={(e) => setSettings({ ...settings, audioMode: e.target.value as 'verse' | 'chapter' })}
                      className="w-4 h-4 text-brown-600 bg-gray-100 border-gray-300 focus:ring-brown-500 dark:focus:ring-brown-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Individual verse audio</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="audioMode"
                      value="chapter"
                      checked={settings.audioMode === 'chapter'}
                      onChange={(e) => setSettings({ ...settings, audioMode: e.target.value as 'verse' | 'chapter' })}
                      className="w-4 h-4 text-brown-600 bg-gray-100 border-gray-300 focus:ring-brown-500 dark:focus:ring-brown-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Continuous chapter audio</span>
                  </label>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Choose between playing individual verses or continuous chapter recitation
                </p>
              </div>
            </div>
          )}

          {activeTab === 'translation' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Select Translation
                </label>
                <div className="relative">
                  <select
                    value={settings.translator.id}
                    onChange={(e) => {
                      const translator = TRANSLATORS.find(t => t.id === e.target.value)
                      if (translator) handleTranslatorChange(translator)
                    }}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brown-500 focus:border-brown-500"
                  >
                    {TRANSLATORS.map((translator) => (
                      <option key={translator.id} value={translator.id}>
                        {translator.verified ? '✅ ' : '⚠️ '}{translator.name} ({translator.language})
                        {translator.verified ? ' - Verified' : ' - Testing needed'}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  <p><strong>Note:</strong> Use the Display Mode setting in the Display tab to control whether translation and transliteration are shown.</p>
                  <p className="mt-2"><strong>Status:</strong> ✅ Verified translations have been tested with the Quran Foundation API. ⚠️ Other translations may need verification.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'display' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Display Mode
                </label>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={() => handleSettingChange('displayMode', 'arabic-only')}
                      className={`p-4 border rounded-lg text-left transition-colors ${
                        settings.displayMode === 'arabic-only'
                          ? 'border-brown-600 bg-brown-50 dark:bg-brown-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                        Arabic Text Only
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Display only the Arabic Quran text
                      </div>
                      <div className="mt-2 text-right">
                        <span className="font-arabic text-lg text-brown-700 dark:text-brown-300" translate="no">
                          بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                        </span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleSettingChange('displayMode', 'arabic-translation')}
                      className={`p-4 border rounded-lg text-left transition-colors ${
                        settings.displayMode === 'arabic-translation'
                          ? 'border-brown-600 bg-brown-50 dark:bg-brown-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                        Arabic + Translation (Default)
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Display Arabic text with translation below
                      </div>
                      <div className="mt-2">
                        <div className="text-right mb-2">
                          <span className="font-arabic text-lg text-brown-700 dark:text-brown-300" translate="no">
                            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          In the name of Allah, the Entirely Merciful, the Especially Merciful.
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleSettingChange('displayMode', 'arabic-translation-transliteration')}
                      className={`p-4 border rounded-lg text-left transition-colors ${
                        settings.displayMode === 'arabic-translation-transliteration'
                          ? 'border-brown-600 bg-brown-50 dark:bg-brown-900/20'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                        Arabic + Translation + Transliteration
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Display all three: Arabic, translation, and transliteration
                      </div>
                      <div className="mt-2">
                        <div className="text-right mb-2">
                          <span className="font-arabic text-lg text-brown-700 dark:text-brown-300" translate="no">
                            بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 italic">
                          Bismillahi r-rahmani r-raheem
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          In the name of Allah, the Entirely Merciful, the Especially Merciful.
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Arabic Font Size
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['small', 'medium', 'large', 'xl'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => handleSettingChange('arabicFontSize', size)}
                      className={`p-2 border rounded-lg text-center transition-colors ${
                        settings.arabicFontSize === size
                          ? 'border-brown-600 bg-brown-50 dark:bg-brown-900/20 text-brown-700 dark:text-brown-300'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className={`font-arabic ${
                        size === 'small' ? 'text-lg' :
                        size === 'medium' ? 'text-xl' :
                        size === 'large' ? 'text-2xl' : 'text-3xl'
                      }`}>
                        بِسْمِ
                      </div>
                      <div className="text-xs mt-1 capitalize">{size}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Translation Font Size
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => handleSettingChange('translationFontSize', size)}
                      className={`p-2 border rounded-lg text-center transition-colors ${
                        settings.translationFontSize === size
                          ? 'border-brown-600 bg-brown-50 dark:bg-brown-900/20 text-brown-700 dark:text-brown-300'
                          : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className={`${
                        size === 'small' ? 'text-sm' :
                        size === 'medium' ? 'text-base' : 'text-lg'
                      }`}>
                        In the name of Allah
                      </div>
                      <div className="text-xs mt-1 capitalize">{size}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}