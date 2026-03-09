import { Inter } from "next/font/google"
import "./globals.css"
import { SocketProvider } from "@/context/socket-context"
import { GameProvider } from "@/context/game-context"
import { AuthProvider } from "@/context/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Fantasy Card Game",
  description: "Real-time multiplayer card game with AI opponents",
    generator: 'v0.dev'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark">
          {/* <AuthProvider>
            <SocketProvider>
              <GameProvider> */}
                {children}
                <Toaster />
              {/* </GameProvider>
            </SocketProvider>
          </AuthProvider> */}
        </ThemeProvider>
      </body>
    </html>
  )
}
