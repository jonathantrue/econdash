import type { Metadata } from 'next'
import { Inter, Geist } from 'next/font/google'
import './globals.css'
import { NavBar } from '@/components/layout/NavBar'
import { TickerStrip } from '@/components/layout/TickerStrip'
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EconDash — Economic Command Center',
  description: 'Comprehensive US economic data dashboard powered by FRED, BLS, BEA, and more.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${inter.className} bg-slate-50 min-h-screen`}>
        <NavBar />
        <TickerStrip />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </body>
    </html>
  )
}
