'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, getRoomChannel } from '@/lib/supabase'
import {
  GRID_SIZE, CELL_SIZE, GAME_DURATION, TICK_RATE,
  DIRECTIONS, OPPOSITE, PLAYER_COLORS,
  generateId, createInitialSnake, moveSnake, growSnake,
  checkFoodCollision, checkBodyBite, checkHeadOnCollision,
  shrinkSnake, growSnakeBy, spawnFood,
} from '@/lib/gameLogic'
import { sound, initAudio, isMuted, toggleMute } from '@/lib/soundManager'
import GameCanvas from '@/components/GameCanvas'
import Leaderboard from '@/components/Leaderboard'
import Timer from '@/components/Timer'
import WinnerScreen from '@/components/WinnerScreen'
import Thumbpad from '../../../components/Thumb-pad'

export default function GamePage() {
  const { roomId } = useParams()

  const [playerName, setPlayerName] = useState('')
  const [playerId, setPlayerId] = useState('')
  const [isHost, setIsHost] = useState(false)
  const [players, setPlayers] = useState({})
  const [food, setFood] = useState(null)
  const [gameDuration, setGameDuration] = useState(GAME_DURATION)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [gameStatus, setGameStatus] = useState('lobby')
  const [particles, setParticles] = useState([])
  const [copied, setCopied] = useState(false)
  const [soundMuted, setSoundMuted] = useState(false)
  const [collisionFlash, setCollisionFlash] = useState(null) // 'penalty' | 'bonus'

  const channelRef = useRef(null)
  const directionRef = useRef('RIGHT')
  const nextDirRef = useRef('RIGHT')
  const gameLoopRef = useRef(null)
  const timerRef = useRef(null)
  const playersRef = useRef({})
  const foodRef = useRef(null)
  const gameStatusRef = useRef('lobby')
  const myPlayerIdRef = useRef('')
  const gameDurationRef = useRef(GAME_DURATION)
  const prevTimeRef = useRef(GAME_DURATION)

  useEffect(() => { playersRef.current = players }, [players])
  useEffect(() => { foodRef.current = food }, [food])
  useEffect(() => { gameStatusRef.current = gameStatus }, [gameStatus])
  useEffect(() => { gameDurationRef.current = gameDuration }, [gameDuration])

  // Init player from sessionStorage
  useEffect(() => {
    const name = sessionStorage.getItem('playerName') || 'PLAYER'
    const id = sessionStorage.getItem('playerId') || generateId()
    const host = sessionStorage.getItem('isHost') === 'true'
    const dur = parseInt(sessionStorage.getItem('gameDuration') || '60', 10)
    setPlayerName(name)
    setPlayerId(id)
    setIsHost(host)
    setGameDuration(dur)
    setTimeLeft(dur)
    gameDurationRef.current = dur
    prevTimeRef.current = dur
    myPlayerIdRef.current = id
    sessionStorage.setItem('playerId', id)
  }, [])

  // Setup Supabase channel
  useEffect(() => {
    if (!playerId || !playerName) return
    initAudio()

    const channel = getRoomChannel(supabase, roomId)
    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const presentIds = new Set(Object.values(state).flat().map(p => p.playerId))
        setPlayers(prev => {
          const next = { ...prev }
          Object.keys(next).forEach(id => { if (!presentIds.has(id)) delete next[id] })
          return next
        })
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach(p => {
          setPlayers(prev => {
            if (prev[p.playerId]) return prev
            sound.join()
            const playerIds = Object.keys(prev)
            const colorIndex = playerIds.length % PLAYER_COLORS.length
            const idx = playerIds.length
            return {
              ...prev,
              [p.playerId]: {
                name: p.playerName,
                score: 0,
                colorIndex,
                snake: gameStatusRef.current === 'lobby' ? createInitialSnake(p.playerId, idx) : [],
              }
            }
          })
        })
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        leftPresences.forEach(p => {
          setPlayers(prev => { const next = { ...prev }; delete next[p.playerId]; return next })
        })
      })
      .on('broadcast', { event: 'player_move' }, ({ payload }) => {
        if (payload.playerId === myPlayerIdRef.current) return
        setPlayers(prev => {
          if (!prev[payload.playerId]) return prev
          return { ...prev, [payload.playerId]: { ...prev[payload.playerId], snake: payload.snake } }
        })
      })
      .on('broadcast', { event: 'food_spawn' }, ({ payload }) => {
        setFood(payload.food); foodRef.current = payload.food
      })
      .on('broadcast', { event: 'score_update' }, ({ payload }) => {
        if (payload.playerId === myPlayerIdRef.current) return
        setPlayers(prev => {
          if (!prev[payload.playerId]) return prev
          return { ...prev, [payload.playerId]: { ...prev[payload.playerId], score: payload.score, snake: payload.snake || prev[payload.playerId].snake } }
        })
      })
      .on('broadcast', { event: 'game_start' }, ({ payload }) => {
        const dur = payload.duration || gameDurationRef.current
        setGameDuration(dur)
        setTimeLeft(dur)
        prevTimeRef.current = dur
        gameDurationRef.current = dur
        if (payload.food) { setFood(payload.food); foodRef.current = payload.food }
        setGameStatus('playing'); gameStatusRef.current = 'playing'
        sound.start()
        startGameLoop()
        startTimer(dur)
      })
      .on('broadcast', { event: 'game_end' }, () => { endGame() })
      .on('broadcast', { event: 'game_reset' }, ({ payload }) => { resetGame(payload) })
      // Collision events from the biter
      .on('broadcast', { event: 'snake_penalty' }, ({ payload }) => {
        // Another player bit us — apply penalty to us
        if (payload.victimId === myPlayerIdRef.current) {
          applyPenalty()
        }
      })
      .on('broadcast', { event: 'snake_bonus' }, ({ payload }) => {
        // We won a head-on — apply bonus (handled locally by both sides too)
        if (payload.winnerId === myPlayerIdRef.current) {
          applyBonus()
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ playerId, playerName, score: 0 })
        }
      })

    return () => {
      clearInterval(gameLoopRef.current)
      clearInterval(timerRef.current)
      channel.unsubscribe()
    }
  }, [playerId, playerName, roomId])

  // Keyboard input
  useEffect(() => {
    const keyMap = {
      ArrowUp:'UP', ArrowDown:'DOWN', ArrowLeft:'LEFT', ArrowRight:'RIGHT',
      w:'UP', s:'DOWN', a:'LEFT', d:'RIGHT',
      W:'UP', S:'DOWN', A:'LEFT', D:'RIGHT',
    }
    const handleKey = (e) => {
      const dir = keyMap[e.key]
      if (!dir) return
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault()
      if (OPPOSITE[dir] !== directionRef.current) nextDirRef.current = dir
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Touch swipe
  const touchStartRef = useRef(null)
  const handleTouchStart = useCallback((e) => {
    // Don't intercept touches on d-pad buttons
    if (e.target.closest('[data-dpad]')) return
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }, [])
  const handleTouchEnd = useCallback((e) => {
    if (!touchStartRef.current || e.target.closest('[data-dpad]')) return
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y
    if (Math.abs(dx) > Math.abs(dy)) {
      const dir = dx > 0 ? 'RIGHT' : 'LEFT'
      if (OPPOSITE[dir] !== directionRef.current) nextDirRef.current = dir
    } else {
      const dir = dy > 0 ? 'DOWN' : 'UP'
      if (OPPOSITE[dir] !== directionRef.current) nextDirRef.current = dir
    }
    touchStartRef.current = null
  }, [])

  function applyPenalty() {
    sound.penalty()
    setCollisionFlash('penalty')
    setTimeout(() => setCollisionFlash(null), 600)
    setPlayers(prev => {
      const pid = myPlayerIdRef.current
      if (!prev[pid]) return prev
      const newSnake = shrinkSnake(prev[pid].snake || [], 10)
      const newScore = Math.max(0, (prev[pid].score || 0) - 10)
      return { ...prev, [pid]: { ...prev[pid], snake: newSnake, score: newScore } }
    })
  }

  function applyBonus() {
    sound.bonus()
    setCollisionFlash('bonus')
    setTimeout(() => setCollisionFlash(null), 600)
    setPlayers(prev => {
      const pid = myPlayerIdRef.current
      if (!prev[pid]) return prev
      const newSnake = growSnakeBy(prev[pid].snake || [], 10)
      const newScore = (prev[pid].score || 0) + 10
      return { ...prev, [pid]: { ...prev[pid], snake: newSnake, score: newScore } }
    })
  }

  function startGameLoop() {
    clearInterval(gameLoopRef.current)
    gameLoopRef.current = setInterval(() => {
      if (gameStatusRef.current !== 'playing') return
      const pid = myPlayerIdRef.current
      const currentPlayers = playersRef.current
      const player = currentPlayers[pid]
      if (!player || !player.snake || player.snake.length === 0) return

      directionRef.current = nextDirRef.current

      // Compute new head position
      const currentFood = foodRef.current
      const ateFood = checkFoodCollision(player.snake, currentFood)
      const newSnake = ateFood
        ? growSnake(player.snake, directionRef.current)
        : moveSnake(player.snake, directionRef.current)

      let newScore = player.score || 0
      let finalSnake = newSnake

      // --- Collision checks against other snakes ---
      const otherPlayers = Object.entries(currentPlayers).filter(([id]) => id !== pid)

      for (const [otherId, other] of otherPlayers) {
        if (!other.snake || other.snake.length === 0) continue

        // 1. Head-on collision (both heads same cell)
        if (checkHeadOnCollision(finalSnake, other.snake)) {
          const myLen = finalSnake.length
          const theirLen = other.snake.length
          if (myLen > theirLen) {
            // I win — get +3 / grow
            applyBonus()
            channelRef.current?.send({
              type: 'broadcast', event: 'snake_penalty',
              payload: { victimId: otherId, attackerId: pid }
            })
          } else if (theirLen > myLen) {
            // I lose — get -3 / shrink (they will send penalty to me)
            // Don't double-apply; the bigger one broadcasts
          } else {
            // Equal — both penalty
            applyPenalty()
          }
          sound.collide()
          break
        }

        // 2. My head bit their body
        if (checkBodyBite(finalSnake, other.snake)) {
          sound.collide()
          // I bit them: I get penalty, they are the victim of my bite
          // Actually rule: biter loses 3, their snake shrinks 3
          applyPenalty()
          // Tell the other player they got bitten (victim shrinks too) — optional interpretation:
          // The spec says "biter's points reduced by 3 and body decreases by 3"
          // The bitten snake is unaffected per spec — only biter is penalized
          setCollisionFlash('penalty')
          break
        }

        // 3. Their head bit MY body (I am the victim, they will have applied penalty themselves)
        // Nothing extra needed — they handle their own penalty
      }

      // Food eaten
      if (ateFood) {
        newScore += 10
        sound.eat()
        if (currentFood) spawnParticles(currentFood.x * CELL_SIZE + CELL_SIZE/2, currentFood.y * CELL_SIZE + CELL_SIZE/2)
        const allSnakes = {}
        Object.entries(currentPlayers).forEach(([id, p]) => { if (p.snake) allSnakes[id] = p.snake })
        allSnakes[pid] = finalSnake
        const newFood = spawnFood(allSnakes, null)
        setFood(newFood); foodRef.current = newFood
        channelRef.current?.send({ type:'broadcast', event:'food_spawn', payload:{food:newFood} })
      }

      setPlayers(prev => ({ ...prev, [pid]: { ...prev[pid], snake: finalSnake, score: newScore } }))

      channelRef.current?.send({
        type:'broadcast', event:'player_move',
        payload:{ playerId:pid, snake:finalSnake, direction:directionRef.current }
      })
      if (ateFood || newScore !== (player.score || 0)) {
        channelRef.current?.send({
          type:'broadcast', event:'score_update',
          payload:{ playerId:pid, score:newScore, snake:finalSnake }
        })
      }
    }, TICK_RATE)
  }

  function startTimer(duration) {
    const dur = duration || gameDurationRef.current
    setTimeLeft(dur)
    prevTimeRef.current = dur
    clearInterval(timerRef.current)
    let t = dur
    timerRef.current = setInterval(() => {
      t--
      setTimeLeft(t)
      // Tick sounds
      if (t <= 3 && t > 0) sound.urgentTick()
      else if (t <= 10 && t > 0) sound.tick()
      if (t <= 0) {
        clearInterval(timerRef.current)
        channelRef.current?.send({ type:'broadcast', event:'game_end', payload:{} })
        endGame()
      }
    }, 1000)
  }

  function endGame() {
    clearInterval(gameLoopRef.current)
    clearInterval(timerRef.current)
    setGameStatus('ended'); gameStatusRef.current = 'ended'
    // Play win/lose sound
    const pid = myPlayerIdRef.current
    const sorted = Object.entries(playersRef.current).sort((a,b) => (b[1].score||0) - (a[1].score||0))
    if (sorted[0]?.[0] === pid) sound.win()
    else sound.lose()
  }

  function resetGame(payload) {
    clearInterval(gameLoopRef.current); clearInterval(timerRef.current)
    setGameStatus('lobby'); gameStatusRef.current = 'lobby'
    const dur = payload?.duration || gameDurationRef.current
    setGameDuration(dur); setTimeLeft(dur); gameDurationRef.current = dur
    if (payload?.food) { setFood(payload.food); foodRef.current = payload.food }
    setPlayers(prev => {
      const next = {}
      Object.entries(prev).forEach(([id, p], idx) => {
        next[id] = { ...p, score:0, snake:createInitialSnake(id,idx) }
      })
      return next
    })
  }

  function handleStartGame() {
    if (gameStatus !== 'lobby') return
    const dur = gameDurationRef.current
    setPlayers(prev => {
      const next = {}
      Object.entries(prev).forEach(([id,p],idx) => {
        next[id] = { ...p, snake:createInitialSnake(id,idx), score:0 }
      })
      return next
    })
    const allSnakes = {}
    Object.keys(playersRef.current).forEach((id,idx) => { allSnakes[id] = createInitialSnake(id,idx) })
    const initialFood = spawnFood(allSnakes, null)
    setFood(initialFood); foodRef.current = initialFood

    channelRef.current?.send({ type:'broadcast', event:'game_start', payload:{ food:initialFood, duration:dur } })
    setGameStatus('playing'); gameStatusRef.current = 'playing'
    sound.start()
    startGameLoop()
    startTimer(dur)
  }

  function handlePlayAgain() {
    const allSnakes = {}
    Object.keys(playersRef.current).forEach((id,idx) => { allSnakes[id] = createInitialSnake(id,idx) })
    const newFood = spawnFood(allSnakes, null)
    const dur = gameDurationRef.current
    channelRef.current?.send({ type:'broadcast', event:'game_reset', payload:{ food:newFood, duration:dur } })
    resetGame({ food:newFood, duration:dur })
  }

  function spawnParticles(cx, cy) {
    const count = 8
    const newParticles = [...Array(count)].map((_,i) => {
      const angle = (i/count)*Math.PI*2
      const speed = 2+Math.random()*3
      return { id:generateId(), x:cx, y:cy, vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed, life:1, color:['#ff4444','#ff8800','#ffff00'][i%3], size:4+Math.random()*3 }
    })
    setParticles(prev => [...prev, ...newParticles])
    setTimeout(() => setParticles(prev => prev.filter(p => !newParticles.find(np=>np.id===p.id))), 800)
  }

  function copyRoomCode() {
    navigator.clipboard.writeText(roomId).then(() => { setCopied(true); setTimeout(()=>setCopied(false),2000) })
  }

  function handleToggleMute() {
    const m = toggleMute()
    setSoundMuted(m)
  }

  // D-pad direction handler
  function dpadPress(dir) {
    initAudio()
    if (OPPOSITE[dir] !== directionRef.current) nextDirRef.current = dir
  }

  const playerCount = Object.keys(players).length

  return (
    <div
      className="min-h-screen flex flex-col select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Collision flash overlay */}
      {collisionFlash && (
        <div
          className="fixed inset-0 pointer-events-none z-40 rounded-none"
          style={{
            background: collisionFlash === 'penalty'
              ? 'rgba(255,0,0,0.18)'
              : 'rgba(0,255,136,0.15)',
            animation: 'fadeOut 0.6s ease-out forwards',
          }}
        />
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-neon-green/10 bg-black/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <span className="font-display font-black neon-green text-lg">SNAKE.IO</span>
          <button
            onClick={copyRoomCode}
            className="flex items-center gap-1.5 font-mono text-xs text-white/50 hover:text-neon-green transition-colors"
          >
            <span className="hidden sm:inline">ROOM:</span>
            <span className="text-neon-green/80 tracking-widest">{roomId}</span>
            <span>{copied ? '✓' : '⎘'}</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
            <span className="font-mono text-xs text-white/50">{playerCount}</span>
          </div>
          <span className="font-mono text-xs text-neon-green/60 hidden sm:block">{playerName}</span>
          {/* Mute button */}
          <button
            onClick={handleToggleMute}
            className="w-8 h-8 rounded-lg border border-neon-green/30 text-neon-green/70 hover:text-neon-green hover:border-neon-green flex items-center justify-center transition-all text-sm"
            title={soundMuted ? 'Unmute' : 'Mute'}
          >
            {soundMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      {/* ─── MOBILE LAYOUT ─── */}
      <div className="flex flex-col lg:hidden max-h-screen w-screen overflow-y-hidden flex-1">
        {/* Top strip: timer + score */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-neon-green/10 bg-black/30">
          {/* Compact timer */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-neon-green/50">TIME</span>
            <span
              className={`font-display font-black text-2xl tabular-nums ${timeLeft <= 5 ? 'animate-pulse text-red-400' : timeLeft <= 10 ? 'text-orange-400' : 'neon-green'}`}
            >
              {timeLeft}s
            </span>
          </div>
          {/* My score */}
          {players[playerId] && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-white/40">SCORE</span>
              <span className="font-display font-black text-xl neon-green">{players[playerId]?.score || 0}</span>
            </div>
          )}
          {/* Start button (host only, lobby) */}
          {gameStatus === 'lobby' && isHost && (
            <button
              onClick={handleStartGame}
              className="btn-neon px-3 py-1.5 rounded-lg text-xs bg-neon-green text-black font-bold"
            >
              ⚡ START
            </button>
          )}
          {gameStatus === 'lobby' && !isHost && (
            <span className="font-mono text-xs text-white/30 animate-pulse">WAITING HOST...</span>
          )}
        </div>

        {/* Canvas — centered, scaled to fit width */}
        <div className="flex justify-center sm:px-2 pt-2">
          <div style={{ transform: `scale(${Math.min(1, (typeof window !== 'undefined' ? window.innerWidth - 16 : 360) / (GRID_SIZE * CELL_SIZE))})`, transformOrigin:'top center' }}>
            <GameCanvas players={players} food={food} myPlayerId={playerId} particles={particles} />
          </div>
        </div>

        {/* Mini leaderboard — horizontal scroll */}
        {/* <div className="px-3 py-2">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {Object.entries(players)
              .sort((a,b) => (b[1].score||0)-(a[1].score||0))
              .map(([id,p],i) => {
                const colors = ['#00ff88','#00d4ff','#ff00aa','#ffff00','#ff6600','#aa00ff']
                const c = colors[p.colorIndex ?? i]
                return (
                  <div key={id} className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-lg"
                    style={{background:`${c}12`, border:`1px solid ${c}30`}}>
                    <div className="w-2 h-2 rounded-full" style={{background:c, boxShadow:`0 0 4px ${c}`}}/>
                    <span className="font-mono text-xs" style={{color: id===playerId?'#fff':'rgba(255,255,255,0.7)'}}>
                      {p.name?.substring(0,8)}
                    </span>
                    <span className="font-display text-xs font-bold" style={{color:c}}>{p.score||0}</span>
                  </div>
                )
              })}
          </div>
        </div> */}

        {/* D-PAD — always visible on mobile, large and comfortable */}

       <Thumbpad dpadPress={dpadPress}/>
        <div className="flex-1 flex items-center justify-center py-4 bg-black/20">
          <div data-dpad className="relative" style={{width:180, height:180}}>
            {/* Background ring */}
            <div className="absolute inset-0 rounded-full border-2 border-neon-green/10 bg-black/30"/>

            {/* UP */}
            <button
              data-dpad
              onTouchStart={e=>{e.preventDefault(); dpadPress('UP')}}
              onClick={()=>dpadPress('UP')}
              className="absolute flex items-center justify-center rounded-2xl transition-all active:scale-90"
              style={{top:0, left:'50%', transform:'translateX(-50%)', width:56, height:56, background:'rgba(0,255,136,0.12)', border:'2px solid rgba(0,255,136,0.35)', color:'#00ff88', fontSize:22}}
            >▲</button>

            {/* DOWN */}
            <button
              data-dpad
              onTouchStart={e=>{e.preventDefault(); dpadPress('DOWN')}}
              onClick={()=>dpadPress('DOWN')}
              className="absolute flex items-center justify-center rounded-2xl transition-all active:scale-90"
              style={{bottom:0, left:'50%', transform:'translateX(-50%)', width:56, height:56, background:'rgba(0,255,136,0.12)', border:'2px solid rgba(0,255,136,0.35)', color:'#00ff88', fontSize:22}}
            >▼</button>

            {/* LEFT */}
            <button
              data-dpad
              onTouchStart={e=>{e.preventDefault(); dpadPress('LEFT')}}
              onClick={()=>dpadPress('LEFT')}
              className="absolute flex items-center justify-center rounded-2xl transition-all active:scale-90"
              style={{left:0, top:'50%', transform:'translateY(-50%)', width:56, height:56, background:'rgba(0,255,136,0.12)', border:'2px solid rgba(0,255,136,0.35)', color:'#00ff88', fontSize:22}}
            >◄</button>

            {/* RIGHT */}
            <button
              data-dpad
              onTouchStart={e=>{e.preventDefault(); dpadPress('RIGHT')}}
              onClick={()=>dpadPress('RIGHT')}
              className="absolute flex items-center justify-center rounded-2xl transition-all active:scale-90"
              style={{right:0, top:'50%', transform:'translateY(-50%)', width:56, height:56, background:'rgba(0,255,136,0.12)', border:'2px solid rgba(0,255,136,0.35)', color:'#00ff88', fontSize:22}}
            >►</button>

            {/* Center dot */}
            <div className="absolute rounded-full bg-neon-green/20 border border-neon-green/30"
              style={{width:40, height:40, top:'50%', left:'50%', transform:'translate(-50%,-50%)'}}/>
          </div>
        </div>

        {/* Room code (lobby) */}
        {gameStatus === 'lobby' && (
          <div className="px-4 py-3 border-t border-neon-green/10 flex items-center justify-between">
            <div>
              <span className="font-mono text-xs text-white/40">ROOM CODE: </span>
              <span className="font-mono text-sm text-neon-green tracking-widest">{roomId}</span>
            </div>
            <button onClick={copyRoomCode} className="font-mono text-xs text-neon-green/60 hover:text-neon-green border border-neon-green/30 px-3 py-1.5 rounded-lg">
              {copied ? '✓ COPIED' : '⎘ COPY'}
            </button>
          </div>
        )}
      </div>

      {/* ─── DESKTOP LAYOUT ─── */}
      <main className="hidden lg:flex flex-1 flex-row items-start justify-center gap-4 p-4 max-w-7xl mx-auto w-full">
        {/* Left sidebar */}
        <div className="w-56 flex flex-col gap-3">
          <Timer timeLeft={timeLeft} isRunning={gameStatus === 'playing'} gameDuration={gameDuration} />
          {gameStatus === 'lobby' && (
            <div className="glass neon-border-green rounded-xl p-4 animate-fade-up">
              <div className="font-display text-xs tracking-widest text-neon-green/60 mb-3">ROOM CODE</div>
              <div className="font-mono text-2xl tracking-widest text-neon-green text-center mb-3">{roomId}</div>
              <button onClick={copyRoomCode} className="btn-neon w-full py-2 rounded-lg text-xs border border-neon-green/30 text-neon-green/70 hover:text-neon-green hover:border-neon-green transition-all mb-3">
                {copied ? '✓ COPIED!' : '⎘ COPY CODE'}
              </button>
              <div className="text-center text-xs text-white/30 font-mono mb-4">
                Duration: <span className="text-neon-green">{gameDuration}s</span>
              </div>
              {console.log('isHost:', isHost, 'playerCount:', playerCount)}
              {isHost && playerCount >= 1 && (
                <button onClick={handleStartGame}
                  className="btn-neon w-full py-3 rounded-xl text-sm bg-neon-green text-black font-bold hover:bg-neon-green/90 hover:scale-[1.02] transition-all">
                  ⚡ START GAME
                </button>
              )}
              {!isHost && (
                <div className="text-center font-mono text-xs text-white/30 animate-pulse py-2">WAITING FOR HOST...</div>
              )}
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-shrink-0">
          <GameCanvas players={players} food={food} myPlayerId={playerId} particles={particles} />
          {gameStatus === 'lobby' && (
            <div className="mt-3 text-center font-mono text-xs text-white/30">
              WAITING TO START · ARROW KEYS OR WASD TO MOVE
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-56">
          <Leaderboard players={players} myPlayerId={playerId} />
          <div className="mt-3 glass rounded-xl p-3 neon-border-green">
            <div className="font-display text-xs tracking-widest text-neon-green/50 mb-2">RULES</div>
            <div className="space-y-1 font-mono text-xs text-white/40">
              <div className="flex justify-between"><span>EAT FOOD</span><span className="text-neon-green">+10 PTS</span></div>
              <div className="flex justify-between"><span>BITE ENEMY</span><span className="text-red-400">−3 PTS / −3 BODY</span></div>
              <div className="flex justify-between"><span>HEAD-ON WIN</span><span className="text-yellow-400">+3 PTS / +3 BODY</span></div>
              <div className="flex justify-between"><span>EQUAL HEAD-ON</span><span className="text-orange-400">BOTH −3</span></div>
            </div>
          </div>
        </div>
      </main>

      {/* Winner screen */}
      {gameStatus === 'ended' && (
        <WinnerScreen players={players} myPlayerId={playerId} onPlayAgain={handlePlayAgain} roomId={roomId} />
      )}

      <style>{`
        @keyframes fadeOut { from { opacity:1 } to { opacity:0 } }
        .no-scrollbar::-webkit-scrollbar { display:none }
        .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none }
      `}</style>
    </div>
  )
}

// "use client"

// import { useEffect, useState } from "react"
// import { useParams, useRouter } from "next/navigation"
// import { useSocket } from "@/context/socket-context"
// import { useGame } from "@/context/game-context"
// import { useAuth } from "@/context/auth-context"
// import { GameBoard } from "@/components/game-board"
// import { GameChat } from "@/components/game-chat"
// import { GameStats } from "@/components/game-stats"
// import { GameControls } from "@/components/game-controls"
// import { LoadingScreen } from "@/components/loading-screen"
// import { useToast } from "@/components/ui/use-toast"

// export default function GameRoom() {
//   const { roomId } = useParams()
//   const router = useRouter()
//   const { socket, isConnected } = useSocket()
//   const { gameState, setGameState, resetGame } = useGame()
//   const { user } = useAuth()
//   const { toast } = useToast()
//   const [isLoading, setIsLoading] = useState(true)

//   useEffect(() => {
//     if (!user) {
//       router.push("/")
//       return
//     }

//     if (isConnected && socket) {
//       // Join the room
//       socket.emit("joinRoom", { roomId, user })

//       // Listen for room join confirmation
//       socket.on("roomJoined", (data) => {
//         setGameState(data.gameState)
//         setIsLoading(false)
//         toast({
//           title: "Joined Game Room",
//           description: `You've joined room ${roomId}`,
//         })
//       })

//       // Listen for room join errors
//       socket.on("roomError", (error) => {
//         toast({
//           title: "Error",
//           description: error.message,
//           variant: "destructive",
//         })
//         router.push("/")
//       })

//       // Listen for game state updates
//       socket.on("gameStateUpdate", (updatedGameState) => {
//         setGameState(updatedGameState)
//       })

//       // Listen for game over
//       socket.on("gameOver", (result) => {
//         toast({
//           title: "Game Over",
//           description: `${result.winner} has won the game!`,
//         })
//       })

//       // Clean up listeners when component unmounts
//       return () => {
//         socket.off("roomJoined")
//         socket.off("roomError")
//         socket.off("gameStateUpdate")
//         socket.off("gameOver")
//         socket.emit("leaveRoom", { roomId, user })
//         resetGame()
//       }
//     }
//   }, [isConnected, socket, roomId, user, router, setGameState, resetGame, toast])

//   if (isLoading) {
//     return <LoadingScreen message="Joining game room..." />
//   }

//   return (
//     <div className="flex flex-col h-screen bg-gradient-to-b from-gray-900 to-gray-800">
//       <div className="flex flex-col md:flex-row h-full p-4 gap-4">
//         <div className="flex-grow">
//           <GameBoard />
//           <GameControls />
//         </div>
//         <div className="w-full md:w-80 flex flex-col gap-4">
//           <GameChat roomId={roomId} />
//           <GameStats />
//         </div>
//       </div>
//     </div>
//   )
// }
