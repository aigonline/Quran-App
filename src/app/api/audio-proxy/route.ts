import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const audioUrl = searchParams.get('url')

  if (!audioUrl) {
    return NextResponse.json({ error: 'Audio URL is required' }, { status: 400 })
  }

  try {
    // Fetch the audio file with timeout and proper headers
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
    
    const response = await fetch(audioUrl, {
      headers: {
        'User-Agent': 'Quran-App/1.0',
        'Accept': 'audio/*,*/*;q=0.9',
        'Range': 'bytes=0-', // Support partial content requests
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`❌ Failed to fetch audio: ${response.status} ${response.statusText}`)
      
      // If the main URL fails, try alternative sources
      if (audioUrl.includes('download.quranicaudio.com')) {
        // Extract verse info and try EveryAyah as fallback
        const match = audioUrl.match(/(\d{3})(\d{3})\.mp3$/)
        if (match) {
          const [, chapter, verse] = match
          const fallbackUrl = `https://everyayah.com/data/Alafasy_64kbps/${chapter}${verse}.mp3`
          
          const fallbackResponse = await fetch(fallbackUrl, {
            headers: {
              'User-Agent': 'Quran-App/1.0',
              'Accept': 'audio/*,*/*;q=0.9',
            },
          })
          
          if (fallbackResponse.ok) {
            const audioData = await fallbackResponse.arrayBuffer()
            return new NextResponse(audioData, {
              headers: {
                'Content-Type': fallbackResponse.headers.get('Content-Type') || 'audio/mpeg',
                'Content-Length': audioData.byteLength.toString(),
                'Cache-Control': 'public, max-age=3600',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type',
              },
            })
          }
        }
      }
      
      return NextResponse.json(
        { error: `Failed to fetch audio: ${response.status}` },
        { status: response.status }
      )
    }

    // Get the audio data
    const audioData = await response.arrayBuffer()
    
    // Return the audio with proper headers
    return new NextResponse(audioData, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
        'Content-Length': audioData.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('❌ Error proxying audio:', error)
    return NextResponse.json(
      { error: 'Failed to proxy audio' },
      { status: 500 }
    )
  }
}