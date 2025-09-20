import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { QuranProvider } from '@/components/quran-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Quran App - Read & Listen',
  description: 'A beautiful Quran app with reading and audio features',
  other: {
    'google': 'notranslate',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QuranProvider>
            {children}
          </QuranProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}