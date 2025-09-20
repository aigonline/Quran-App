import { Navigation } from '@/components/navigation'
import { QuranReader } from '@/components/quran-reader'
import { Sidebar } from '@/components/sidebar'

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navigation />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <QuranReader />
        </main>
      </div>
    </div>
  )
}