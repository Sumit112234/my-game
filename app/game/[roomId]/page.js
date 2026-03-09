'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, getRoomChannel } from '@/lib/supabase'
import {
  GRID_SIZE, CELL_SIZE, GAME_DURATION, TICK_RATE,
  DIRECTIONS, OPPOSITE, PLAYER_COLORS,
  generateId, createInitialSnake, moveSnake, growSnake,
  checkFoodCollision, checkSelfCollision, spawnFood,
  getPlayerColorIndex
} from '@/lib/gameLogic'
import GameCanvas from '@/components/GameCanvas'
import Leaderboard from '@/components/Leaderboard'
import Timer from '@/components/Timer'
import WinnerScreen from '@/components/WinnerScreen'

export default function GamePage() {
  const { roomId } = useParams()
  const router = useRouter()

  const [playerName, setPlayerName] = useState('')
  const [playerId, setPlayerId] = useState('')
  const [players, setPlayers] = useState({})
  const [food, setFood] = useState(null)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [gameStatus, setGameStatus] = useState('lobby') // lobby | playing | ended
  const [particles, setParticles] = useState([])
  const [copied, setCopied] = useState(false)

  const channelRef = useRef(null)
  const directionRef = useRef('RIGHT')
  const nextDirRef = useRef('RIGHT')
  const gameLoopRef = useRef(null)
  const timerRef = useRef(null)
  const playersRef = useRef({})
  const foodRef = useRef(null)
  const gameStatusRef = useRef('lobby')
  const myPlayerIdRef = useRef('')

  // Keep refs in sync
  useEffect(() => { playersRef.current = players }, [players])
  useEffect(() => { foodRef.current = food }, [food])
  useEffect(() => { gameStatusRef.current = gameStatus }, [gameStatus])

  // Init player from sessionStorage
  useEffect(() => {
    const name = sessionStorage.getItem('playerName') || 'PLAYER'
    const id = sessionStorage.getItem('playerId') || generateId()
    setPlayerName(name)
    setPlayerId(id)
    myPlayerIdRef.current = id
    sessionStorage.setItem('playerId', id)
  }, [])

  // Setup Supabase channel
  useEffect(() => {
    if (!playerId || !playerName) return

    const channel = getRoomChannel(supabase, roomId)
    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const presentIds = new Set(Object.values(state).flat().map(p => p.playerId))

        setPlayers(prev => {
          const next = { ...prev }
          // Remove players who left
          Object.keys(next).forEach(id => {
            if (!presentIds.has(id)) delete next[id]
          })
          return next
        })
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        newPresences.forEach(p => {
          setPlayers(prev => {
            if (prev[p.playerId]) return prev
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
          setPlayers(prev => {
            const next = { ...prev }
            delete next[p.playerId]
            return next
          })
        })
      })
      .on('broadcast', { event: 'player_move' }, ({ payload }) => {
        if (payload.playerId === myPlayerIdRef.current) return
        setPlayers(prev => {
          if (!prev[payload.playerId]) return prev
          return {
            ...prev,
            [payload.playerId]: { ...prev[payload.playerId], snake: payload.snake }
          }
        })
      })
      .on('broadcast', { event: 'food_spawn' }, ({ payload }) => {
        setFood(payload.food)
        foodRef.current = payload.food
      })
      .on('broadcast', { event: 'score_update' }, ({ payload }) => {
        if (payload.playerId === myPlayerIdRef.current) return
        setPlayers(prev => {
          if (!prev[payload.playerId]) return prev
          return {
            ...prev,
            [payload.playerId]: { ...prev[payload.playerId], score: payload.score }
          }
        })
      })
      .on('broadcast', { event: 'game_start' }, ({ payload }) => {
        setGameStatus('playing')
        gameStatusRef.current = 'playing'
        if (payload.food) {
          setFood(payload.food)
          foodRef.current = payload.food
        }
        startGameLoop()
        startTimer()
      })
      .on('broadcast', { event: 'game_end' }, () => {
        endGame()
      })
      .on('broadcast', { event: 'game_reset' }, ({ payload }) => {
        resetGame(payload)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            playerId,
            playerName,
            score: 0,
          })
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
      ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT',
      w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT',
      W: 'UP', S: 'DOWN', A: 'LEFT', D: 'RIGHT',
    }
    const handleKey = (e) => {
      const dir = keyMap[e.key]
      if (!dir) return
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault()
      if (OPPOSITE[dir] !== directionRef.current) {
        nextDirRef.current = dir
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [])

  // Touch controls
  const touchStartRef = useRef(null)
  const handleTouchStart = (e) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y
    const abs = Math.abs
    if (abs(dx) > abs(dy)) {
      const dir = dx > 0 ? 'RIGHT' : 'LEFT'
      if (OPPOSITE[dir] !== directionRef.current) nextDirRef.current = dir
    } else {
      const dir = dy > 0 ? 'DOWN' : 'UP'
      if (OPPOSITE[dir] !== directionRef.current) nextDirRef.current = dir
    }
    touchStartRef.current = null
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
      const currentFood = foodRef.current
      const ateFood = checkFoodCollision(player.snake, currentFood)
      const newSnake = ateFood
        ? growSnake(player.snake, directionRef.current)
        : moveSnake(player.snake, directionRef.current)

      let newScore = player.score || 0
      if (ateFood) {
        newScore += 10
        // Spawn particles
        if (currentFood) {
          spawnParticles(currentFood.x * CELL_SIZE + CELL_SIZE / 2, currentFood.y * CELL_SIZE + CELL_SIZE / 2)
        }
        // Broadcast new food
        const allSnakes = {}
        Object.entries(currentPlayers).forEach(([id, p]) => {
          if (p.snake) allSnakes[id] = p.snake
        })
        allSnakes[pid] = newSnake
        const newFood = spawnFood(allSnakes, null)
        setFood(newFood)
        foodRef.current = newFood
        channelRef.current?.send({ type: 'broadcast', event: 'food_spawn', payload: { food: newFood } })
        channelRef.current?.send({ type: 'broadcast', event: 'score_update', payload: { playerId: pid, score: newScore } })
      }

      setPlayers(prev => ({
        ...prev,
        [pid]: { ...prev[pid], snake: newSnake, score: newScore }
      }))

      channelRef.current?.send({
        type: 'broadcast', event: 'player_move',
        payload: { playerId: pid, snake: newSnake, direction: directionRef.current }
      })
    }, TICK_RATE)
  }

  function startTimer() {
    setTimeLeft(GAME_DURATION)
    clearInterval(timerRef.current)
    let t = GAME_DURATION
    timerRef.current = setInterval(() => {
      t--
      setTimeLeft(t)
      if (t <= 0) {
        clearInterval(timerRef.current)
        channelRef.current?.send({ type: 'broadcast', event: 'game_end', payload: {} })
        endGame()
      }
    }, 1000)
  }

  function endGame() {
    clearInterval(gameLoopRef.current)
    clearInterval(timerRef.current)
    setGameStatus('ended')
    gameStatusRef.current = 'ended'
  }

  function resetGame(payload) {
    clearInterval(gameLoopRef.current)
    clearInterval(timerRef.current)
    setGameStatus('lobby')
    gameStatusRef.current = 'lobby'
    setTimeLeft(GAME_DURATION)
    if (payload?.food) { setFood(payload.food); foodRef.current = payload.food }

    setPlayers(prev => {
      const next = {}
      Object.entries(prev).forEach(([id, p], idx) => {
        next[id] = {
          ...p,
          score: 0,
          snake: createInitialSnake(id, idx),
        }
      })
      return next
    })
  }

  function handleStartGame() {
    if (gameStatus !== 'lobby') return
    setPlayers(prev => {
      const next = {}
      Object.entries(prev).forEach(([id, p], idx) => {
        next[id] = { ...p, snake: createInitialSnake(id, idx), score: 0 }
      })
      return next
    })

    const allSnakes = {}
    Object.keys(playersRef.current).forEach((id, idx) => {
      allSnakes[id] = createInitialSnake(id, idx)
    })
    const initialFood = spawnFood(allSnakes, null)
    setFood(initialFood)
    foodRef.current = initialFood

    channelRef.current?.send({
      type: 'broadcast', event: 'game_start',
      payload: { food: initialFood }
    })
    setGameStatus('playing')
    gameStatusRef.current = 'playing'
    startGameLoop()
    startTimer()
  }

  function handlePlayAgain() {
    const allSnakes = {}
    Object.keys(playersRef.current).forEach((id, idx) => {
      allSnakes[id] = createInitialSnake(id, idx)
    })
    const newFood = spawnFood(allSnakes, null)
    channelRef.current?.send({
      type: 'broadcast', event: 'game_reset',
      payload: { food: newFood }
    })
    resetGame({ food: newFood })
  }

  function spawnParticles(cx, cy) {
    const count = 8
    const newParticles = [...Array(count)].map((_, i) => {
      const angle = (i / count) * Math.PI * 2
      const speed = 2 + Math.random() * 3
      return {
        id: generateId(),
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: ['#ff4444','#ff8800','#ffff00'][i % 3],
        size: 4 + Math.random() * 3,
      }
    })
    setParticles(prev => [...prev, ...newParticles])
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)))
    }, 800)
  }

  function copyRoomCode() {
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const playerCount = Object.keys(players).length

  return (
    <div
      className="min-h-screen flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-neon-green/10 bg-black/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="font-display font-black neon-green text-xl">SNAKE.IO</span>
          <span className="hidden sm:block font-mono text-xs text-white/30">|</span>
          <button
            onClick={copyRoomCode}
            className="hidden sm:flex items-center gap-2 font-mono text-xs text-white/50 hover:text-neon-green transition-colors"
          >
            ROOM: <span className="text-neon-green/80 tracking-widest">{roomId}</span>
            <span className="text-xs">{copied ? '✓' : '⎘'}</span>
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
            <span className="font-mono text-xs text-white/50">{playerCount} ONLINE</span>
          </div>
          <span className="font-mono text-xs text-neon-green/60 hidden sm:block">
            {playerName}
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col lg:flex-row items-start justify-center gap-4 p-4 max-w-7xl mx-auto w-full">
        {/* Left sidebar */}
        <div className="w-full lg:w-56 flex flex-col gap-3 order-2 lg:order-1">
          <Timer timeLeft={timeLeft} isRunning={gameStatus === 'playing'} />
          {gameStatus === 'lobby' && (
            <div className="glass neon-border-green rounded-xl p-4 animate-fade-up">
              <div className="font-display text-xs tracking-widest text-neon-green/60 mb-3">ROOM CODE</div>
              <div className="font-mono text-2xl tracking-widest text-neon-green text-center mb-3">{roomId}</div>
              <button onClick={copyRoomCode} className="btn-neon w-full py-2 rounded-lg text-xs border border-neon-green/30 text-neon-green/70 hover:text-neon-green hover:border-neon-green transition-all mb-3">
                {copied ? '✓ COPIED!' : '⎘ COPY CODE'}
              </button>
              <div className="text-center text-xs text-white/30 font-mono mb-4">
                Share with friends to join
              </div>
              {playerCount >= 1 && (
                <button
                  onClick={handleStartGame}
                  className="btn-neon w-full py-3 rounded-xl text-sm bg-neon-green text-black font-bold hover:bg-neon-green/90 hover:scale-[1.02] transition-all"
                >
                  ⚡ START GAME
                </button>
              )}
            </div>
          )}

          {/* Mobile d-pad */}
          <div className="lg:hidden glass rounded-xl p-4 neon-border-green">
            <div className="grid grid-cols-3 gap-2 w-32 mx-auto">
              <div />
              <button onTouchStart={() => { if(OPPOSITE['UP'] !== directionRef.current) nextDirRef.current='UP' }}
                className="h-10 rounded-lg bg-neon-green/10 border border-neon-green/30 text-neon-green flex items-center justify-center">▲</button>
              <div />
              <button onTouchStart={() => { if(OPPOSITE['LEFT'] !== directionRef.current) nextDirRef.current='LEFT' }}
                className="h-10 rounded-lg bg-neon-green/10 border border-neon-green/30 text-neon-green flex items-center justify-center">◄</button>
              <button onTouchStart={() => { if(OPPOSITE['DOWN'] !== directionRef.current) nextDirRef.current='DOWN' }}
                className="h-10 rounded-lg bg-neon-green/10 border border-neon-green/30 text-neon-green flex items-center justify-center">▼</button>
              <button onTouchStart={() => { if(OPPOSITE['RIGHT'] !== directionRef.current) nextDirRef.current='RIGHT' }}
                className="h-10 rounded-lg bg-neon-green/10 border border-neon-green/30 text-neon-green flex items-center justify-center">►</button>
            </div>
          </div>
        </div>

        {/* Game canvas */}
        <div className="flex-shrink-0 order-1 lg:order-2">
          <GameCanvas
            players={players}
            food={food}
            myPlayerId={playerId}
            particles={particles}
          />
          {gameStatus === 'lobby' && (
            <div className="mt-3 text-center font-mono text-xs text-white/30">
              WAITING FOR HOST TO START · USE ARROW KEYS OR WASD
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-full lg:w-56 order-3">
          <Leaderboard players={players} myPlayerId={playerId} />
          <div className="mt-3 glass rounded-xl p-3 neon-border-green hidden lg:block">
            <div className="font-display text-xs tracking-widest text-neon-green/50 mb-2">CONTROLS</div>
            <div className="space-y-1 font-mono text-xs text-white/40">
              <div className="flex justify-between"><span>MOVE</span><span className="text-white/60">WASD / ↑↓←→</span></div>
              <div className="flex justify-between"><span>EAT FOOD</span><span className="text-white/60">+10 PTS</span></div>
              <div className="flex justify-between"><span>GOAL</span><span className="text-white/60">HIGHEST SCORE</span></div>
            </div>
          </div>
        </div>
      </main>

      {/* Winner screen */}
      {gameStatus === 'ended' && (
        <WinnerScreen
          players={players}
          myPlayerId={playerId}
          onPlayAgain={handlePlayAgain}
          roomId={roomId}
        />
      )}
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
