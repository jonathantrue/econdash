import type { Metadata } from 'next'
import { Inter, Manrope } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { TickerStrip } from '@/components/layout/TickerStrip'
import { NuqsAdapter } from 'nuqs/adapters/next/app'

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Federal Intelligence — Economic Command Center',
  description: 'Comprehensive US economic data dashboard powered by FRED, BLS, BEA, and more.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable}`}>
      <body className="bg-background text-foreground min-h-screen">
        <TickerStrip />
        <Sidebar />
        <TopBar />
        <NuqsAdapter>
          <main className="ml-60 mt-[84px] min-h-[calc(100vh-84px)]">
            {children}
          </main>
        </NuqsAdapter>
      </body>
    </html>
  )
}
