export const GRID_SIZE = 20
export const CELL_SIZE = 24
export const GAME_DURATION = 60
export const TICK_RATE = 120 // ms per game tick

export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
}

export const OPPOSITE = {
  UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT'
}

export const PLAYER_COLORS = [
  { head: '#00ff88', body: '#00cc6a', glow: 'rgba(0,255,136,0.4)' },
  { head: '#00d4ff', body: '#00a8cc', glow: 'rgba(0,212,255,0.4)' },
  { head: '#ff00aa', body: '#cc0088', glow: 'rgba(255,0,170,0.4)' },
  { head: '#ffff00', body: '#cccc00', glow: 'rgba(255,255,0,0.4)' },
  { head: '#ff6600', body: '#cc5200', glow: 'rgba(255,102,0,0.4)' },
  { head: '#aa00ff', body: '#8800cc', glow: 'rgba(170,0,255,0.4)' },
]

export function generateId() {
  return Math.random().toString(36).substr(2, 9)
}

export function generateRoomCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase()
}

export function createInitialSnake(playerId, playerIndex) {
  const startPositions = [
    { x: 3, y: 3 },
    { x: 16, y: 16 },
    { x: 3, y: 16 },
    { x: 16, y: 3 },
    { x: 10, y: 3 },
    { x: 10, y: 16 },
  ]
  const pos = startPositions[playerIndex % startPositions.length]
  return [
    { x: pos.x, y: pos.y },
    { x: pos.x - 1, y: pos.y },
    { x: pos.x - 2, y: pos.y },
  ]
}

export function moveSnake(snake, direction) {
  const head = snake[0]
  const dir = DIRECTIONS[direction]
  const newHead = {
    x: (head.x + dir.x + GRID_SIZE) % GRID_SIZE,
    y: (head.y + dir.y + GRID_SIZE) % GRID_SIZE,
  }
  return [newHead, ...snake.slice(0, -1)]
}

export function growSnake(snake, direction) {
  const head = snake[0]
  const dir = DIRECTIONS[direction]
  const newHead = {
    x: (head.x + dir.x + GRID_SIZE) % GRID_SIZE,
    y: (head.y + dir.y + GRID_SIZE) % GRID_SIZE,
  }
  return [newHead, ...snake]
}

export function checkFoodCollision(snake, food) {
  if (!food) return false
  return snake[0].x === food.x && snake[0].y === food.y
}

export function checkSelfCollision(snake) {
  const head = snake[0]
  return snake.slice(1).some(seg => seg.x === head.x && seg.y === head.y)
}

export function spawnFood(snakes, existingFood) {
  const occupied = new Set()
  if (existingFood) occupied.add(`${existingFood.x},${existingFood.y}`)
  Object.values(snakes).forEach(snake => {
    snake.forEach(seg => occupied.add(`${seg.x},${seg.y}`))
  })

  let attempts = 0
  while (attempts < 200) {
    const x = Math.floor(Math.random() * GRID_SIZE)
    const y = Math.floor(Math.random() * GRID_SIZE)
    if (!occupied.has(`${x},${y}`)) {
      return { x, y, id: generateId() }
    }
    attempts++
  }
  return { x: 10, y: 10, id: generateId() }
}

export function getPlayerColorIndex(playerId, players) {
  const ids = Object.keys(players).sort()
  return ids.indexOf(playerId) % PLAYER_COLORS.length
}