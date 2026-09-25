import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Skrining TBC — Puskesmas Tanjungwangi',
  description: 'Aplikasi skrining tuberkulosis (TBC) untuk warga Puskesmas Tanjungwangi',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={`${geist.className} bg-gray-50 min-h-screen`}>
        {/* Header */}
        <header className="bg-blue-700 text-white shadow-md">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 flex-shrink-0 bg-white rounded-full flex items-center justify-center text-blue-700 font-bold text-lg">🏥</div>
            <div>
              <h1 className="font-bold text-base leading-tight">Puskesmas Tanjungwangi</h1>
              <p className="text-blue-200 text-xs">Sistem Skrining TBC Terintegrasi SITB</p>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          {children}
        </main>

        <footer className="text-center text-xs text-gray-400 py-4 border-t border-gray-200 mt-4">
          © {new Date().getFullYear()} Puskesmas Tanjungwangi · Data dijaga kerahasiaannya
        </footer>
      </body>
    </html>
  )
}
