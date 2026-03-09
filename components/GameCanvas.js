'use client'
import { useEffect, useRef, useCallback } from 'react'
import { GRID_SIZE, CELL_SIZE, PLAYER_COLORS } from '@/lib/gameLogic'

const CANVAS_SIZE = GRID_SIZE * CELL_SIZE

export default function GameCanvas({ players, food, myPlayerId, particles, onParticleConsumed }) {
  const canvasRef = useRef(null)
  const animFrameRef = useRef(null)
  const foodPulseRef = useRef(0)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    foodPulseRef.current += 0.08

    // Clear
    ctx.fillStyle = '#030712'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    // Draw grid
    ctx.strokeStyle = 'rgba(0,255,136,0.06)'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(i * CELL_SIZE, 0)
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * CELL_SIZE)
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE)
      ctx.stroke()
    }

    // Draw food
    if (food) {
      const fx = food.x * CELL_SIZE + CELL_SIZE / 2
      const fy = food.y * CELL_SIZE + CELL_SIZE / 2
      const pulse = Math.sin(foodPulseRef.current) * 0.3 + 0.7
      const radius = (CELL_SIZE / 2 - 2) * pulse

      // Outer glow
      const grd = ctx.createRadialGradient(fx, fy, 0, fx, fy, radius * 2.5)
      grd.addColorStop(0, `rgba(255,80,80,${0.3 * pulse})`)
      grd.addColorStop(1, 'rgba(255,80,80,0)')
      ctx.fillStyle = grd
      ctx.beginPath()
      ctx.arc(fx, fy, radius * 2.5, 0, Math.PI * 2)
      ctx.fill()

      // Food circle
      ctx.fillStyle = '#ff4444'
      ctx.shadowColor = '#ff4444'
      ctx.shadowBlur = 12 * pulse
      ctx.beginPath()
      ctx.arc(fx, fy, radius, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      // Highlight
      ctx.fillStyle = 'rgba(255,200,200,0.6)'
      ctx.beginPath()
      ctx.arc(fx - radius * 0.25, fy - radius * 0.25, radius * 0.3, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw snakes
    Object.entries(players).forEach(([pid, playerData]) => {
      if (!playerData.snake || playerData.snake.length === 0) return
      const colorIndex = playerData.colorIndex ?? 0
      const colors = PLAYER_COLORS[colorIndex % PLAYER_COLORS.length]
      const isMe = pid === myPlayerId
      const snake = playerData.snake

      snake.forEach((seg, idx) => {
        const x = seg.x * CELL_SIZE + 1
        const y = seg.y * CELL_SIZE + 1
        const w = CELL_SIZE - 2
        const h = CELL_SIZE - 2
        const r = idx === 0 ? 6 : 4

        if (idx === 0) {
          // Head glow
          ctx.shadowColor = colors.glow.replace('0.4', isMe ? '0.8' : '0.5')
          ctx.shadowBlur = isMe ? 20 : 12
        } else {
          ctx.shadowBlur = 0
        }

        // Body gradient
        const alpha = Math.max(0.3, 1 - idx * 0.04)
        ctx.fillStyle = idx === 0 ? colors.head : colors.body
        ctx.globalAlpha = alpha
        roundRect(ctx, x, y, w, h, r)
        ctx.fill()

        // Head eyes
        if (idx === 0) {
          ctx.globalAlpha = 1
          ctx.shadowBlur = 0
          ctx.fillStyle = '#000'
          ctx.beginPath()
          ctx.arc(x + w * 0.65, y + h * 0.3, 2.5, 0, Math.PI * 2)
          ctx.arc(x + w * 0.65, y + h * 0.7, 2.5, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(x + w * 0.65, y + h * 0.3, 1.2, 0, Math.PI * 2)
          ctx.arc(x + w * 0.65, y + h * 0.7, 1.2, 0, Math.PI * 2)
          ctx.fill()

          // Name label
          if (playerData.name) {
            ctx.globalAlpha = 1
            ctx.fillStyle = colors.head
            ctx.font = `bold 9px "Share Tech Mono", monospace`
            ctx.textAlign = 'center'
            ctx.shadowColor = colors.head
            ctx.shadowBlur = 6
            ctx.fillText(playerData.name.substring(0, 8), x + w / 2, y - 4)
            ctx.shadowBlur = 0
          }
        }
        ctx.globalAlpha = 1
        ctx.shadowBlur = 0
      })
    })

    // Draw particles
    if (particles && particles.length > 0) {
      particles.forEach(p => {
        ctx.globalAlpha = p.life
        ctx.fillStyle = p.color
        ctx.shadowColor = p.color
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.globalAlpha = 1
      })
    }

    animFrameRef.current = requestAnimationFrame(draw)
  }, [players, food, myPlayerId, particles])

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [draw])

  return (
    <div className="relative canvas-glow rounded-xl overflow-hidden">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="block"
        style={{ imageRendering: 'pixelated' }}
      />
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-neon-green/60 rounded-tl-xl" />
      <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-neon-green/60 rounded-tr-xl" />
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-neon-green/60 rounded-bl-xl" />
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-neon-green/60 rounded-br-xl" />
    </div>
  )
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}