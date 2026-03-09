'use client'
import { GAME_DURATION } from '@/lib/gameLogic'

export default function Timer({ timeLeft, isRunning, gameDuration }) {
  const duration = gameDuration || GAME_DURATION
  const pct = timeLeft / duration
  const isUrgent = timeLeft <= 10
  const isCritical = timeLeft <= 5

  const dashArray = 2 * Math.PI * 28
  const dashOffset = dashArray * (1 - pct)
  const color = isCritical ? '#ff4444' : isUrgent ? '#ff9900' : '#00ff88'

  return (
    <div className="flex flex-col items-center glass neon-border-green rounded-xl px-6 py-4">
      <span className="font-display text-xs tracking-widest text-neon-green/60 mb-2">GAME TIME</span>
      <div className="relative w-20 h-20">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
          <circle
            cx="32" cy="32" r="28"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
            style={{
              transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s',
              filter: `drop-shadow(0 0 6px ${color})`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`font-display font-black text-2xl tabular-nums ${isCritical ? 'animate-pulse' : ''}`}
            style={{ color, textShadow: `0 0 10px ${color}` }}
          >
            {timeLeft}
          </span>
        </div>
      </div>
      <div className="mt-1 font-mono text-xs text-white/30">{duration}s TOTAL</div>
      {!isRunning && timeLeft === duration && (
        <span className="mt-1 font-mono text-xs text-white/40 animate-pulse">WAITING...</span>
      )}
      {isUrgent && isRunning && (
        <span className="mt-1 font-mono text-xs animate-pulse" style={{color}}>
          {isCritical ? '⚠ HURRY!' : '⏰ ALMOST!'}
        </span>
      )}
    </div>
  )
}