import { Inter } from "next/font/google"
import "./globals.css"
import Navbar from "@/components/navbar"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { SupabaseProvider } from "@/components/supabase-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "ChekYourSub",
  description: "AI 서비스 구독을 효율적으로 관리하세요",
    generator: 'v0.dev'
}

export default function RootLayout({ children }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${inter.className} bg-[#0a0f1a] text-gray-100`}>
        <SupabaseProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <footer className="py-6 border-t border-gray-800">
                <div className="container mx-auto px-4 text-center text-sm text-gray-500">
                  © {new Date().getFullYear()} ChekYourSub. All rights reserved.
                </div>
              </footer>
            </div>
            <Toaster />
          </ThemeProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
