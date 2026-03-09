'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateRoomCode, generateId } from '@/lib/gameLogic'

const TIMER_OPTIONS = [30, 60, 90, 120, 180]

export default function Home() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [mode, setMode] = useState(null) // 'create' | 'join'
  const [error, setError] = useState('')
  const [gameDuration, setGameDuration] = useState(60)

  function handleCreate() {
    if (!name.trim()) { setError('Enter your name first'); return }
    const roomId = generateRoomCode()
    const playerId = generateId()
    sessionStorage.setItem('playerName', name.trim())
    sessionStorage.setItem('playerId', playerId)
    sessionStorage.setItem('gameDuration', String(gameDuration))
    sessionStorage.setItem('isHost', 'true')
    router.push(`/game/${roomId}`)
  }

  function handleJoin() {
    if (!name.trim()) { setError('Enter your name first'); return }
    if (!roomCode.trim()) { setError('Enter a room code'); return }
    const playerId = generateId()
    sessionStorage.setItem('playerName', name.trim())
    sessionStorage.setItem('playerId', playerId)
    sessionStorage.removeItem('isHost')
    router.push(`/game/${roomCode.trim().toUpperCase()}`)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-green/5 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-neon-blue/5 rounded-full blur-3xl animate-pulse-glow" style={{animationDelay:'1s'}} />
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-neon-pink/5 rounded-full blur-2xl animate-float" />
      </div>

      {/* Logo */}
      <div className="mb-10 text-center animate-fade-up">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-6xl md:text-8xl font-display font-black neon-green tracking-wider">SNAKE</span>
          <span className="text-6xl md:text-8xl font-display font-black text-white/20">.IO</span>
        </div>
        <p className="font-mono text-neon-green/60 tracking-widest text-sm">MULTIPLAYER ARENA v2.0</p>
        <div className="flex justify-center mt-3 gap-1">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-sm" style={{
              background: i % 4 === 0 ? '#00ff88' : i % 4 === 1 ? '#00d4ff' : i % 4 === 2 ? '#ff00aa' : '#ffff00',
              opacity: Math.random() > 0.5 ? 1 : 0.3,
              animation: `pulse-glow ${1 + Math.random()}s ease-in-out infinite`,
              animationDelay: `${i * 0.1}s`
            }} />
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-md glass neon-border-green rounded-2xl p-8 relative animate-bounce-in">
        <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-neon-green to-transparent" />

        {error && (
          <div className="mb-4 p-3 rounded-lg border border-neon-pink/50 bg-neon-pink/10 text-neon-pink font-mono text-sm animate-slide-in">
            ⚠ {error}
          </div>
        )}

        <div className="mb-6">
          <label className="block font-display text-xs tracking-widest text-neon-green/70 mb-2">PLAYER NAME</label>
          <input
            className="input-neon w-full px-4 py-3 rounded-lg text-lg"
            placeholder="ENTER_NAME"
            value={name}
            maxLength={16}
            onChange={e => { setName(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && (mode === 'join' ? handleJoin() : handleCreate())}
          />
        </div>

        {!mode && (
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMode('create')}
              className="btn-neon py-4 rounded-xl text-sm neon-border-green bg-neon-green/10 text-neon-green hover:bg-neon-green/20 hover:scale-105 transition-transform"
            >
              ＋ CREATE<br/>ROOM
            </button>
            <button
              onClick={() => setMode('join')}
              className="btn-neon py-4 rounded-xl text-sm neon-border-blue bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 hover:scale-105 transition-transform"
            >
              → JOIN<br/>ROOM
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="animate-fade-up">
            {/* Timer picker */}
            <div className="mb-5">
              <label className="block font-display text-xs tracking-widest text-neon-green/70 mb-3">
                ⏱ GAME DURATION
              </label>
              <div className="flex gap-2 flex-wrap">
                {TIMER_OPTIONS.map(t => (
                  <button
                    key={t}
                    onClick={() => setGameDuration(t)}
                    className={`flex-1 min-w-[3rem] py-2.5 rounded-lg font-display text-xs transition-all ${
                      gameDuration === t
                        ? 'bg-neon-green text-black font-bold shadow-[0_0_12px_rgba(0,255,136,0.5)]'
                        : 'border border-neon-green/30 text-neon-green/60 hover:border-neon-green/70 hover:text-neon-green bg-neon-green/5'
                    }`}
                  >
                    {t >= 60 ? `${t/60}m` : `${t}s`}
                  </button>
                ))}
              </div>
              <div className="mt-2 text-center font-mono text-xs text-neon-green/40">
                Selected: <span className="text-neon-green">{gameDuration} seconds</span>
              </div>
            </div>

            <button
              onClick={handleCreate}
              className="btn-neon w-full py-4 rounded-xl text-lg neon-border-green bg-neon-green text-black hover:bg-neon-green/90 hover:scale-[1.02] transition-transform mb-3"
            >
              ⚡ CREATE NEW ROOM
            </button>
            <button onClick={() => setMode(null)} className="w-full py-2 text-sm text-white/40 hover:text-white/70 transition-colors font-mono">
              ← BACK
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div className="animate-fade-up">
            <label className="block font-display text-xs tracking-widest text-neon-blue/70 mb-2">ROOM CODE</label>
            <input
              className="input-neon w-full px-4 py-3 rounded-lg text-lg mb-4 uppercase tracking-widest"
              placeholder="XXXXXX"
              value={roomCode}
              maxLength={6}
              onChange={e => { setRoomCode(e.target.value.toUpperCase()); setError('') }}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
            />
            <button
              onClick={handleJoin}
              className="btn-neon w-full py-4 rounded-xl text-lg border border-neon-blue bg-neon-blue text-black hover:bg-neon-blue/90 hover:scale-[1.02] transition-transform mb-3"
            >
              → JOIN ROOM
            </button>
            <button onClick={() => setMode(null)} className="w-full py-2 text-sm text-white/40 hover:text-white/70 transition-colors font-mono">
              ← BACK
            </button>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 text-center animate-fade-up font-mono text-xs text-white/30 space-y-1" style={{animationDelay:'0.5s'}}>
        <p>USE ARROW KEYS / WASD / D-PAD TO CONTROL YOUR SNAKE</p>
        <p>EAT FOOD +10 · BITE ENEMY −3 · HEAD-ON: BIGGER WINS +3</p>
      </div>

      {/* Snake decoration */}
      <div className="mt-6 flex gap-1 animate-float opacity-30">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="w-4 h-4 rounded-sm bg-neon-green" style={{opacity: 1 - i * 0.1}} />
        ))}
        <div className="w-4 h-4 rounded-full bg-neon-green flex items-center justify-center text-[8px]">👁</div>
      </div>
    </div>
  )
}

// // import { LandingPage } from "@/components/landing-page"
// import Snake from "@/components/snake"
// // export default function Home() {
// //   return <LandingPage />
// // }


// export default function Home() {
//   return (
//    <Snake/>
//   )
// }

 