'use client'
import { useEffect, useState } from 'react'
import { PLAYER_COLORS } from '@/lib/gameLogic'

const COLOR_NAMES = ['#00ff88','#00d4ff','#ff00aa','#ffff00','#ff6600','#aa00ff']

function Confetti() {
  const [particles] = useState(() =>
    [...Array(40)].map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: ['#00ff88','#00d4ff','#ff00aa','#ffff00','#ff6600'][i % 5],
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 2,
      size: 4 + Math.random() * 8,
    }))
  )
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 6px ${p.color}`,
            animation: `fall ${p.duration}s ${p.delay}s ease-in infinite`,
            transform: `rotate(${Math.random() * 360}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  )
}

export default function WinnerScreen({ players, myPlayerId, onPlayAgain, roomId }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 100)
    return () => clearTimeout(t)
  }, [])

  const sorted = Object.entries(players)
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => (b.score || 0) - (a.score || 0))

  const winner = sorted[0]
  const isIWon = winner?.id === myPlayerId
  const color = COLOR_NAMES[winner?.colorIndex ?? 0]

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Confetti />
      <div
        className={`relative w-full max-w-lg glass rounded-2xl p-8 text-center transition-all duration-700 ${show ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}
        style={{ border: `1px solid ${color}`, boxShadow: `0 0 40px ${color}40, 0 0 80px ${color}20` }}
      >
        {/* Trophy */}
        <div className="text-7xl mb-4 animate-bounce-in" style={{animationDelay:'0.3s'}}>
          {isIWon ? '🏆' : '🎮'}
        </div>

        <div className="font-display text-xs tracking-widest mb-2" style={{color: `${color}99`}}>
          GAME OVER
        </div>

        <h2
          className="font-display font-black text-3xl mb-1 animate-bounce-in"
          style={{ color, textShadow: `0 0 20px ${color}`, animationDelay: '0.4s' }}
        >
          {isIWon ? '🎉 YOU WIN!' : `${winner?.name || 'PLAYER'} WINS!`}
        </h2>

        {isIWon && (
          <p className="font-mono text-neon-green/60 text-sm mb-4">EXCELLENT SLITHERING!</p>
        )}

        {/* Scores */}
        <div className="mt-6 space-y-2 mb-8">
          {sorted.map((p, i) => {
            const c = COLOR_NAMES[p.colorIndex ?? i]
            return (
              <div
                key={p.id}
                className="flex items-center gap-3 px-4 py-3 rounded-lg"
                style={{ background: `${c}10`, border: `1px solid ${c}30` }}
              >
                <span className="text-xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i+1}.`}</span>
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: c, boxShadow: `0 0 6px ${c}` }} />
                <span className="flex-1 font-mono text-sm text-left" style={{color: p.id === myPlayerId ? '#fff' : 'rgba(255,255,255,0.7)'}}>
                  {p.name}
                  {p.id === myPlayerId && <span className="ml-2 text-xs opacity-50">(YOU)</span>}
                </span>
                <span className="font-display font-bold" style={{color: c}}>{p.score || 0}</span>
              </div>
            )
          })}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => window.location.href = '/'}
            className="btn-neon flex-1 py-3 rounded-xl text-sm border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition-all"
          >
            ← MENU
          </button>
          <button
            onClick={onPlayAgain}
            className="btn-neon flex-1 py-3 rounded-xl text-sm font-bold"
            style={{ background: color, color: '#000', boxShadow: `0 0 20px ${color}60` }}
          >
            ⚡ PLAY AGAIN
          </button>
        </div>

        {/* Room code */}
        <p className="mt-4 font-mono text-xs text-white/30">
          ROOM: {roomId} · SHARE TO INVITE FRIENDS
        </p>
      </div>
    </div>
  )
}