'use client'
import { PLAYER_COLORS } from '@/lib/gameLogic'

const COLOR_NAMES = ['#00ff88','#00d4ff','#ff00aa','#ffff00','#ff6600','#aa00ff']

export default function Leaderboard({ players, myPlayerId }) {
  const sorted = Object.entries(players)
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => (b.score || 0) - (a.score || 0))

  const leader = sorted[0]

  return (
    <div className="glass neon-border-green rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-neon-green/20 flex items-center gap-2">
        <span className="text-neon-green font-display text-xs tracking-widest">LEADERBOARD</span>
        <div className="flex-1 h-px bg-neon-green/20" />
        <span className="text-neon-green/40 font-mono text-xs">{sorted.length} PLAYERS</span>
      </div>

      <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
        {sorted.length === 0 && (
          <div className="text-center py-6 font-mono text-xs text-white/30">NO PLAYERS YET</div>
        )}
        {sorted.map((player, idx) => {
          const isMe = player.id === myPlayerId
          const isLeader = idx === 0 && (player.score || 0) > 0
          const color = COLOR_NAMES[player.colorIndex ?? idx] || '#00ff88'
          return (
            <div
              key={player.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300 ${
                isMe ? 'bg-white/08 border border-white/10' : 'bg-white/02'
              } ${isLeader ? 'animate-pulse-glow' : ''}`}
              style={isLeader ? { borderColor: color, borderWidth: 1, boxShadow: `0 0 8px ${color}30` } : {}}
            >
              {/* Rank */}
              <span className="font-display text-xs w-5 text-center" style={{ color: idx === 0 ? '#ffff00' : idx === 1 ? '#aaaaaa' : idx === 2 ? '#cd7f32' : 'rgba(255,255,255,0.3)' }}>
                {idx === 0 ? '👑' : `${idx + 1}`}
              </span>

              {/* Color dot */}
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />

              {/* Name */}
              <span className={`flex-1 font-mono text-sm truncate ${isMe ? 'text-white font-bold' : 'text-white/80'}`}>
                {player.name || 'UNKNOWN'}
                {isMe && <span className="ml-1 text-neon-green/60 text-xs">YOU</span>}
              </span>

              {/* Score */}
              <span className="font-display text-sm font-bold tabular-nums" style={{ color }}>
                {player.score || 0}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}