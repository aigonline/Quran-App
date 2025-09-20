export interface Surah {
  number: number
  name: string
  englishName: string
  englishNameTranslation: string
  numberOfAyahs: number
  revelationType: string
}

export interface Ayah {
  number: number
  text: string
  numberInSurah: number
  juz: number
  manzil: number
  page: number
  ruku: number
  hizbQuarter: number
  sajda?: boolean
}

export interface Translation {
  number: number
  text: string
  numberInSurah: number
}

export interface Transliteration {
  number: number
  text: string
  numberInSurah: number
}

export interface AudioData {
  identifier: string
  audio_url: string
  format: string
  total_files: number
}

// V4 API Response interfaces
export interface ChapterV4 {
  id: number
  revelation_place: string
  revelation_order: number
  bismillah_pre: boolean
  name_complex: string
  name_arabic: string
  verses_count: number
  pages: number[]
  translated_name: {
    language_name: string
    name: string
  }
}

export interface WordV4 {
  id: number
  position: number
  audio_url: string
  char_type_name: string
  line_number?: number
  page_number?: number
  code_v1?: string
  text_uthmani?: string
  text_indopak?: string
  text_imlaei?: string
  verse_key?: string
  translation: {
    text: string
    language_name: string
  }
  transliteration: {
    text: string
    language_name: string
  }
}

export interface TranslationV4 {
  resource_id: number
  resource_name?: string
  id?: number
  text: string
  verse_id?: number
  language_id?: number
  language_name?: string
  verse_key?: string
  chapter_id?: number
  verse_number?: number
  juz_number?: number
  hizb_number?: number
  rub_number?: number
  page_number?: number
}

export interface TafsirV4 {
  id: number
  language_name: string
  name: string
  text: string
}

export interface VerseV4 {
  id: number
  chapter_id?: number
  verse_number: number
  verse_key: string
  verse_index?: number
  text_uthmani: string
  text_uthmani_simple?: string
  text_imlaei?: string
  text_imlaei_simple?: string
  text_indopak?: string
  text_uthmani_tajweed?: string
  juz_number: number
  hizb_number: number
  rub_number?: number
  rub_el_hizb_number?: number
  page_number: number
  image_url?: string
  image_width?: number
  sajdah_type?: string | null
  sajdah_number?: number | null
  words?: WordV4[]
  translations?: TranslationV4[]
  tafsirs?: TafsirV4[]
}

export interface PaginationV4 {
  per_page: number
  current_page: number
  next_page?: number
  total_pages: number
  total_records: number
}

// Audio API interfaces
export interface ReciterV4 {
  id: number
  name: string
  translated_name?: {
    name: string
    language_name: string
  }
  style: string
  qirat: string
}

export interface ChapterAudioV4 {
  id: number
  chapter_id: number
  file_size: number
  format: string
  total_files: number
  audio_url: string
}

export interface AyahAudioV4 {
  id: number
  verse_key: string
  url: string
  duration: number
  format: string
  segments?: Array<[number, number, number]> // [word_index, start_ms, end_ms]
}

export interface ChapterAudioTimestampV4 {
  verse_key: string
  timestamp_from: number
  timestamp_to: number
  segments?: Array<[number, number, number]>
}

// Quran Foundation API v4 Configuration
// Quran Foundation API v4 Configuration
const QURAN_FOUNDATION_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_QURAN_CLIENT_ID || '',
  clientSecret: process.env.QURAN_CLIENT_SECRET || '',
  tokenEndpoint: process.env.NEXT_PUBLIC_QURAN_TOKEN_ENDPOINT || 'https://oauth2.quran.foundation/oauth/token',
  apiBaseUrl: process.env.NEXT_PUBLIC_QURAN_API_BASE_URL || 'https://apis.quran.foundation/content/api/v4',
}

// Fallback to public API
const FALLBACK_API_BASE_URL = process.env.NEXT_PUBLIC_FALLBACK_API_URL || 'https://api.alquran.cloud/v1'

class TokenManager {
  private static accessToken: string | null = null
  private static tokenExpiry: number | null = null

  static async getAccessToken(): Promise<string | null> {
    // Skip OAuth in browser environments due to CORS restrictions
    if (typeof window !== 'undefined') {
      console.log('Browser environment detected, skipping OAuth due to CORS restrictions')
      return null
    }
    
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    // Get new token
    try {
      // Use Basic authentication (client_secret_basic) instead of POST body (client_secret_post)
      const credentials = Buffer.from(`${QURAN_FOUNDATION_CONFIG.clientId}:${QURAN_FOUNDATION_CONFIG.clientSecret}`).toString('base64')
      
      const response = await fetch(QURAN_FOUNDATION_CONFIG.tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'content',
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get access token')
      }

      const data = await response.json()
      this.accessToken = data.access_token
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000 // Refresh 1 minute early
      
      return this.accessToken
    } catch (error) {
      console.error('Error getting access token:', error)
      return null
    }
  }

  static clearToken() {
    this.accessToken = null
    this.tokenExpiry = null
  }
}

export class QuranAPI {
  private static async makeAuthenticatedRequest(endpoint: string): Promise<Response> {
    console.log(`🔍 Making request to: ${endpoint}`)
    
    // Always try Quran Foundation API first
    try {
      const token = await TokenManager.getAccessToken()
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (token && QURAN_FOUNDATION_CONFIG.clientId) {
        headers['x-auth-token'] = token
        headers['x-client-id'] = QURAN_FOUNDATION_CONFIG.clientId
        console.log('🔐 Using authenticated request')
      } else {
        console.log('🔓 Using non-authenticated request')
      }
      
      const response = await fetch(`${QURAN_FOUNDATION_CONFIG.apiBaseUrl}${endpoint}`, {
        headers
      })
      
      if (response.ok) {
        console.log('✅ Quran Foundation API succeeded')
        return response
      }
      
      console.log(`⚠️ Quran Foundation API returned ${response.status}: ${response.statusText}`)
      
      // If unauthorized, clear token and don't retry
      if (response.status === 401) {
        TokenManager.clearToken()
      }
    } catch (error) {
      console.warn('❌ Quran Foundation API failed:', error)
    }
    
    // Fallback to public API for browser environments
    if (typeof window !== 'undefined') {
      console.log('🔄 Falling back to public API')
      // Transform endpoints for public API format
      let publicEndpoint = endpoint
        .replace('/chapters', '/surah')
        .replace('/verses/by_chapter/', '/surah/')
        .replace('/audio/reciters/', '/audio/reciters/')
        .replace('/audio/chapter_reciters/', '/audio/reciters/')
      
      return fetch(`${FALLBACK_API_BASE_URL}${publicEndpoint}`)
    }
    
    // Server environments - fallback to public API if all else fails
    let publicEndpoint = endpoint
      .replace('/chapters', '/surah')
      .replace('/verses/by_chapter/', '/surah/')
    return fetch(`${FALLBACK_API_BASE_URL}${publicEndpoint}`)
  }

  static async getSurahs(): Promise<Surah[]> {
    try {
      console.log('Fetching surahs...')
      
      // For browser environments, use proxy API to avoid CORS
      if (typeof window !== 'undefined') {
        try {
          console.log('🌐 Browser: Using proxy API for chapters')
          const response = await fetch('/api/chapters')
          
          if (response.ok) {
            const result = await response.json()
            if (result.success && result.data) {
              const data = result.data
              
              // Handle v4 API response structure
              if (data.chapters && Array.isArray(data.chapters)) {
                return data.chapters.map((chapter: ChapterV4) => ({
                  number: chapter.id,
                  name: chapter.name_arabic,
                  englishName: chapter.name_complex,
                  englishNameTranslation: chapter.translated_name.name,
                  numberOfAyahs: chapter.verses_count,
                  revelationType: chapter.revelation_place === 'makkah' ? 'meccan' : 'medinan'
                }))
              }
            }
          }
          
          console.log('⚠️ Proxy API failed, using fallback')
        } catch (error) {
          console.warn('❌ Proxy API error:', error)
        }
        
        // Fallback to public API
        const response = await fetch(`${FALLBACK_API_BASE_URL}/surah`)
        const data = await response.json()
        
        console.log('API Response:', data)
        
        if (data.data && Array.isArray(data.data)) {
          return data.data.map((surah: any) => ({
            number: surah.number,
            name: surah.name,
            englishName: surah.englishName,
            englishNameTranslation: surah.englishNameTranslation,
            numberOfAyahs: surah.numberOfAyahs,
            revelationType: surah.revelationType
          }))
        }
        
        return []
      }
      
      // Server-side: Use /chapters for v4 API, will be transformed to /surah for fallback
      const response = await this.makeAuthenticatedRequest('/chapters')
      const data = await response.json()
      
      console.log('API Response:', data)
      
      // Handle v4 API response structure
      if (data.chapters && Array.isArray(data.chapters)) {
        return data.chapters.map((chapter: ChapterV4) => ({
          number: chapter.id,
          name: chapter.name_arabic,
          englishName: chapter.name_complex,
          englishNameTranslation: chapter.translated_name.name,
          numberOfAyahs: chapter.verses_count,
          revelationType: chapter.revelation_place === 'makkah' ? 'meccan' : 'medinan'
        }))
      }
      
      // Handle v1 fallback API structure
      if (data.data && Array.isArray(data.data)) {
        return data.data.map((surah: any) => ({
          number: surah.number,
          name: surah.name,
          englishName: surah.englishName,
          englishNameTranslation: surah.englishNameTranslation,
          numberOfAyahs: surah.numberOfAyahs,
          revelationType: surah.revelationType
        }))
      }
      
      // Handle direct array response
      if (Array.isArray(data)) {
        return data.map((surah: any) => ({
          number: surah.number || surah.id,
          name: surah.name || surah.name_arabic,
          englishName: surah.englishName || surah.name_simple,
          englishNameTranslation: surah.englishNameTranslation || surah.translated_name?.name || '',
          numberOfAyahs: surah.numberOfAyahs || surah.verses_count,
          revelationType: surah.revelationType || 'meccan'
        }))
      }
      
      console.error('Unexpected API response structure:', data)
      return []
    } catch (error) {
      console.error('Error fetching surahs:', error)
      throw new Error('Failed to fetch surahs')
    }
  }

  static async getSurah(surahNumber: number, edition: string = 'ar.alafasy'): Promise<{
    surah: Surah
    ayahs: Ayah[]
  }> {
    try {
      const response = await this.makeAuthenticatedRequest(`/surah/${surahNumber}/${edition}`)
      const data = await response.json()
      return {
        surah: data.data,
        ayahs: data.data.ayahs
      }
    } catch (error) {
      console.error('Error fetching surah:', error)
      throw new Error(`Failed to fetch surah ${surahNumber}`)
    }
  }

  static async getSurahWithTranslation(
    surahNumber: number, 
    arabicEdition: string = 'ar.alafasy',
    translationEdition: string = '131'
  ): Promise<{
    surah: Surah
    ayahs: Ayah[]
    translations: Translation[]
  }> {
    try {
      console.log(`Fetching surah ${surahNumber} with translation...`)
      
      // For browser environments, try proxy API first
      if (typeof window !== 'undefined') {
        try {
          console.log('🌐 Browser: Using proxy API for verses')
          const response = await fetch(`/api/verses/chapter/${surahNumber}?translations=${translationEdition}&words=false&per_page=50`)
          
          if (response.ok) {
            const result = await response.json()
              console.log('🔍 Proxy API response:', result)
              if (result.success && result.data) {
                const versesData = result.data
                console.log('🔍 Verses data structure:', {
                  hasVerses: !!versesData.verses,
                  versesCount: versesData.verses?.length || 0,
                  hasTranslations: !!versesData.translations,
                  translationsCount: versesData.translations?.length || 0,
                  sampleVerse: versesData.verses?.[0],
                  sampleTranslation: versesData.translations?.[0]
                })              // Get chapter info from proxy
              const chapterResponse = await fetch(`/api/chapters`)
              if (chapterResponse.ok) {
                const chapterResult = await chapterResponse.json()
                if (chapterResult.success && chapterResult.data.chapters) {
                  const chapter = chapterResult.data.chapters.find((ch: ChapterV4) => ch.id === surahNumber)
                  
                  if (versesData.verses && chapter) {
                    const ayahs: Ayah[] = versesData.verses.map((verse: VerseV4) => {
                      // Handle missing text_uthmani by constructing from words if available
                      let arabicText = verse.text_uthmani || ''
                      if (!arabicText && verse.words && verse.words.length > 0) {
                        // Try to construct text from words (this is a fallback)
                        arabicText = verse.words.map(word => word.code_v1 || '').join(' ')
                      }
                      
                      return {
                        number: verse.id,
                        text: arabicText,
                        numberInSurah: verse.verse_number,
                        juz: verse.juz_number,
                        manzil: 1,
                        page: verse.page_number,
                        ruku: 1,
                        hizbQuarter: verse.hizb_number,
                        sajda: verse.sajdah_type !== null
                      }
                    })
                    
                    const translations: Translation[] = versesData.translations?.map((translation: TranslationV4, index: number) => {
                      console.log(`🔍 Translation ${index + 1} FULL OBJECT:`, translation);
                      console.log(`🔍 Translation ${index + 1} keys:`, Object.keys(translation));
                      console.log(`🔍 Translation ${index + 1} analysis:`, {
                        verse_id: translation.verse_id,
                        id: translation.id,
                        text: translation.text,
                        resource_id: translation.resource_id,
                        verse_number: translation.verse_number,
                        verse_key: translation.verse_key,
                        textLength: translation.text?.length,
                        allFields: translation
                      });
                      
                      return {
                        number: translation.verse_id || translation.id || versesData.verses[index]?.id || (index + 1),
                        text: translation.text || '',
                        numberInSurah: translation.verse_number || (index + 1)
                      };
                    }) || []
                    
                    console.log('📋 Final translations array:', translations.map(t => ({ 
                      number: t.number, 
                      textPreview: t.text.substring(0, 50) + '...',
                      textLength: t.text.length 
                    })))
                    
                    const surah: Surah = {
                      number: chapter.id,
                      name: chapter.name_arabic,
                      englishName: chapter.name_complex,
                      englishNameTranslation: chapter.translated_name.name,
                      numberOfAyahs: chapter.verses_count,
                      revelationType: chapter.revelation_place === 'makkah' ? 'meccan' : 'medinan'
                    }
                    
                    return { surah, ayahs, translations }
                  }
                }
              }
            }
          }
          
          console.log('⚠️ Proxy API failed, using fallback')
        } catch (error) {
          console.warn('❌ Proxy API error:', error)
        }
        
        // Fallback to public API
        // The translationEdition already contains the correct format for fallback API
        // (e.g., 'en.sahih', 'en.pickthall', etc.)
        const fallbackTranslation = translationEdition || 'en.sahih'
        
        const [arabicResponse, translationResponse] = await Promise.all([
          fetch(`${FALLBACK_API_BASE_URL}/surah/${surahNumber}`),
          fetch(`${FALLBACK_API_BASE_URL}/surah/${surahNumber}/${fallbackTranslation}`)
        ])
        
        const [arabicData, translationData] = await Promise.all([
          arabicResponse.json(),
          translationResponse.json()
        ])
        
        console.log('Fallback Arabic data:', arabicData)
        console.log('Fallback Translation data:', translationData)
        
        if (arabicData.data && translationData.data) {
          const surah: Surah = {
            number: arabicData.data.number,
            name: arabicData.data.name,
            englishName: arabicData.data.englishName,
            englishNameTranslation: arabicData.data.englishNameTranslation,
            numberOfAyahs: arabicData.data.numberOfAyahs,
            revelationType: arabicData.data.revelationType
          }
          
          const ayahs: Ayah[] = arabicData.data.ayahs.map((ayah: any) => ({
            number: ayah.number,
            text: ayah.text,
            numberInSurah: ayah.numberInSurah,
            juz: ayah.juz,
            manzil: ayah.manzil,
            page: ayah.page,
            ruku: ayah.ruku,
            hizbQuarter: ayah.hizbQuarter,
            sajda: ayah.sajda
          }))
          
          const translations: Translation[] = translationData.data.ayahs.map((ayah: any) => ({
            number: ayah.number,
            text: ayah.text,
            numberInSurah: ayah.numberInSurah
          }))
          
          return { surah, ayahs, translations }
        }
      }
      
      // Try v4 API first - get verses with translations
      try {
        const versesResponse = await this.makeAuthenticatedRequest(
          `/verses/by_chapter/${surahNumber}?translations=${translationEdition}&words=false&per_page=50`
        )
        const versesData = await versesResponse.json()
        
        // Get chapter info
        const chapterResponse = await this.makeAuthenticatedRequest(`/chapters/${surahNumber}`)
        const chapterData = await chapterResponse.json()
        
        console.log('Verses data:', versesData)
        console.log('Chapter data:', chapterData)
        
        if (versesData.verses && chapterData.chapter) {
          const chapter = chapterData.chapter
          
          const ayahs: Ayah[] = versesData.verses.map((verse: VerseV4) => ({
            number: verse.id,
            text: verse.text_uthmani,
            numberInSurah: verse.verse_number,
            juz: verse.juz_number,
            manzil: 1, // Not provided in v4
            page: verse.page_number,
            ruku: 1, // Not provided in v4
            hizbQuarter: verse.hizb_number,
            sajda: verse.sajdah_type !== null
          }))
          
          const translations: Translation[] = versesData.verses.map((verse: VerseV4) => ({
            number: verse.id,
            text: verse.translations?.[0]?.text || '',
            numberInSurah: verse.verse_number
          }))
          
          const surah: Surah = {
            number: chapter.id,
            name: chapter.name_arabic,
            englishName: chapter.name_complex,
            englishNameTranslation: chapter.translated_name.name,
            numberOfAyahs: chapter.verses_count,
            revelationType: chapter.revelation_place === 'makkah' ? 'meccan' : 'medinan'
          }
          
          return { surah, ayahs, translations }
        }
      } catch (v4Error) {
        console.warn('V4 API failed, trying fallback:', v4Error)
      }
      
      // Fallback to v1 API
      const arabicResponse = await this.makeAuthenticatedRequest(`/surah/${surahNumber}`)
      const arabicData = await arabicResponse.json()
      
      const translationResponse = await this.makeAuthenticatedRequest(`/surah/${surahNumber}/en.sahih`)
      const translationData = await translationResponse.json()
      
      console.log('Fallback Arabic data:', arabicData)
      console.log('Fallback Translation data:', translationData)
      
      if (arabicData.data) {
        const surahInfo = arabicData.data
        const ayahs: Ayah[] = surahInfo.ayahs?.map((ayah: any) => ({
          number: ayah.number,
          text: ayah.text,
          numberInSurah: ayah.numberInSurah,
          juz: ayah.juz || 1,
          manzil: ayah.manzil || 1,
          page: ayah.page || 1,
          ruku: ayah.ruku || 1,
          hizbQuarter: ayah.hizbQuarter || 1,
          sajda: ayah.sajda || false
        })) || []
        
        const translations: Translation[] = translationData.data?.ayahs?.map((ayah: any) => ({
          number: ayah.number,
          text: ayah.text,
          numberInSurah: ayah.numberInSurah
        })) || []
        
        const surah: Surah = {
          number: surahInfo.number,
          name: surahInfo.name,
          englishName: surahInfo.englishName,
          englishNameTranslation: surahInfo.englishNameTranslation,
          numberOfAyahs: surahInfo.numberOfAyahs,
          revelationType: surahInfo.revelationType
        }
        
        return { surah, ayahs, translations }
      }
      
      throw new Error('No valid response from either API')
    } catch (error) {
      console.error('Error fetching surah with translation:', error)
      throw new Error(`Failed to fetch surah ${surahNumber} with translation`)
    }
  }

  static async getTransliterations(surahNumber: number): Promise<Transliteration[]> {
    try {
      // Use AlQuran.cloud API for transliterations
      const response = await fetch(`${FALLBACK_API_BASE_URL}/surah/${surahNumber}/en.transliteration`)
      const data = await response.json()
      
      if (data.data && data.data.ayahs) {
        return data.data.ayahs.map((ayah: any) => ({
          number: ayah.number,
          text: ayah.text,
          numberInSurah: ayah.numberInSurah
        }))
      }
      
      return []
    } catch (error) {
      console.warn('Failed to get transliterations:', error)
      return []
    }
  }

  static async getAyah(ayahNumber: number, edition: string = 'ar.alafasy'): Promise<Ayah> {
    try {
      const response = await this.makeAuthenticatedRequest(`/ayah/${ayahNumber}/${edition}`)
      const data = await response.json()
      return data.data
    } catch (error) {
      console.error('Error fetching ayah:', error)
      throw new Error(`Failed to fetch ayah ${ayahNumber}`)
    }
  }

  static async searchQuran(query: string, surah?: number): Promise<{
    count: number
    matches: Array<{
      number: number
      text: string
      surah: {
        number: number
        name: string
        englishName: string
      }
      numberInSurah: number
    }>
  }> {
    try {
      const endpoint = surah 
        ? `/search/${encodeURIComponent(query)}/${surah}/en.sahih`
        : `/search/${encodeURIComponent(query)}/all/en.sahih`
      
      const response = await this.makeAuthenticatedRequest(endpoint)
      const data = await response.json()
      return data.data
    } catch (error) {
      console.error('Error searching Quran:', error)
      throw new Error('Failed to search Quran')
    }
  }

  static getAudioUrl(surahNumber: number, reciterId: number = 7): string {
    // Use reliable public audio sources
    const paddedSurahNumber = surahNumber.toString().padStart(3, '0')
    
    // Try different public audio sources in order of preference
    const audioSources = [
      // EveryAyah.com - reliable public source
      `https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/${paddedSurahNumber}.mp3`,
      // Alternative source
      `https://server8.mp3quran.net/afs/${paddedSurahNumber}.mp3`,
      // Backup source
      `https://download.quranicaudio.com/quran/abdul_basit_murattal/${paddedSurahNumber}.mp3`
    ]
    
    return audioSources[0] // Return the primary source
  }

  static async getChapterAudio(
    chapterNumber: number, 
    reciterId: number = 7, 
    includeSegments: boolean = false
  ): Promise<ChapterAudioV4 | null> {
    try {
      // Use correct endpoint from API documentation: /chapter_recitations/{id}/{chapter_number}
      const endpoint = `/chapter_recitations/${reciterId}/${chapterNumber}${
        includeSegments ? '?segments=true' : ''
      }`
      
      const response = await this.makeAuthenticatedRequest(endpoint)
      const data = await response.json()
      
      console.log('Chapter audio data:', data)
      return data.audio_file || data || null
    } catch (error) {
      console.error('Error fetching chapter audio:', error)
      return null
    }
  }

  static async getAvailableReciters(): Promise<ReciterV4[]> {
    try {
      // Use correct endpoint for chapter reciters
      const response = await this.makeAuthenticatedRequest('/audio/chapter_reciters')
      const data = await response.json()
      
      console.log('Available reciters:', data)
      return data.reciters || data || []
    } catch (error) {
      console.error('Error fetching reciters:', error)
      return []
    }
  }

  static async getAyahAudio(
    recitationId: number,
    ayahKey: string
  ): Promise<AyahAudioV4 | null> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/audio/recitations/${recitationId}/ayahs/${ayahKey}`
      )
      const data = await response.json()
      
      console.log('Ayah audio data:', data)
      return data.audio_file || null
    } catch (error) {
      console.error('Error fetching ayah audio:', error)
      return null
    }
  }

  static async getVerseWithWords(
    surahNumber: number,
    verseNumber: number,
    translationIds: string = '131'
  ): Promise<{
    verse: VerseV4
    words: WordV4[]
  }> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/verses/by_chapter/${surahNumber}?verse_number=${verseNumber}&translations=${translationIds}&language=en&words=true&word_fields=text_uthmani,text_indopak,text_imlaei,translation,transliteration,audio_url`
      )
      
      const data = await response.json()
      
      if (data.verses && data.verses.length > 0) {
        const verse = data.verses[0] as VerseV4
        const words = verse.words || []
        return { verse, words }
      }
      
      throw new Error('Verse not found')
    } catch (error) {
      console.error('Error fetching verse with words:', error)
      throw new Error(`Failed to fetch verse ${surahNumber}:${verseNumber} with words`)
    }
  }

  static async getChapterInfo(chapterNumber: number): Promise<ChapterV4> {
    try {
      const response = await this.makeAuthenticatedRequest(`/chapters/${chapterNumber}`)
      const data = await response.json()
      
      if (data.chapter) {
        return data.chapter as ChapterV4
      }
      
      throw new Error('Chapter not found')
    } catch (error) {
      console.error('Error fetching chapter info:', error)
      throw new Error(`Failed to fetch chapter ${chapterNumber} info`)
    }
  }

  static async getAvailableTranslations(): Promise<Array<{
    id: number
    name: string
    author_name: string
    language_name: string
    direction: string
  }>> {
    try {
      const response = await this.makeAuthenticatedRequest('/resources/translations')
      const data = await response.json()
      return data.translations || []
    } catch (error) {
      console.error('Error fetching available translations:', error)
      return []
    }
  }

  // Method to get audio with authentication using v4 API
  static async getAuthenticatedAudio(surahNumber: number, reciterId: number = 7): Promise<string> {
    console.log(`🎵 Getting audio for Surah ${surahNumber}, Reciter ${reciterId}`)
    
    // For browser environments, use our proxy API to avoid CORS
    if (typeof window !== 'undefined') {
      try {
        console.log('🌐 Browser: Using proxy API for Quran Foundation')
        const response = await fetch(`/api/audio/${reciterId}/${surahNumber}`)
        
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.audio_url) {
            console.log('✅ Got Quran Foundation audio via proxy:', result.audio_url)
            return result.audio_url
          }
        }
        
        console.log('⚠️ Proxy API failed, using fallback')
      } catch (error) {
        console.warn('❌ Proxy API error:', error)
      }
      
      // Fallback to public CDN
      return this.getAudioUrl(surahNumber, reciterId)
    }
    
    // Server-side: Try direct Quran Foundation API
    try {
      const chapterAudio = await this.getChapterAudio(surahNumber, reciterId)
      
      if (chapterAudio && chapterAudio.audio_url) {
        console.log('✅ Got Quran Foundation audio (server):', chapterAudio.audio_url)
        return chapterAudio.audio_url
      }
      
    } catch (error) {
      console.warn('❌ Server-side Quran Foundation API failed:', error)
    }
    
    // Final fallback to public audio source
    console.log('⚠️ Using public audio fallback')
    return this.getAudioUrl(surahNumber, reciterId)
  }
}