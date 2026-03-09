// import { Server } from "socket.io"
// import { createServer } from "http"
// import { generateText } from "ai"
// import { gemini } from "@ai-sdk/gemini"
// import mongoose from "mongoose"
// import { GameModel, PlayerModel } from "../../models/game"

// // MongoDB connection
// mongoose
//   .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/fantasy-card-game")
//   .then(() => console.log("MongoDB connected"))
//   .catch((err) => console.error("MongoDB connection error:", err))

// // Create HTTP server
// const httpServer = createServer()

// // Create Socket.IO server
// const io = new Server(httpServer, {
//   path: "/api/socket",
//   cors: {
//     origin: "*",
//     methods: ["GET", "POST"],
//   },
// })

// // Game rooms storage
// const gameRooms = new Map()

// // Card definitions
// const cardTypes = [
//   { name: "Frostbite", points: 100 },
//   { name: "Thunderstrike", points: 200 },
//   { name: "Shadowmeld", points: 300 },
//   { name: "Dragonfire", points: 400 },
// ]

// // Generate a deck of 16 cards (4 of each type)
// function generateDeck() {
//   const deck = []
//   let id = 1

//   cardTypes.forEach((type) => {
//     for (let i = 0; i < 4; i++) {
//       deck.push({
//         id: id++,
//         name: type.name,
//         points: type.points,
//       })
//     }
//   })

//   return shuffleDeck(deck)
// }

// // Shuffle deck using Fisher-Yates algorithm
// function shuffleDeck(deck) {
//   const shuffled = [...deck]
//   for (let i = shuffled.length - 1; i > 0; i--) {
//     const j = Math.floor(Math.random() * (i + 1))
//     ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
//   }
//   return shuffled
// }

// // Check if a player has won (has 4 identical cards)
// function checkWinCondition(hand) {
//   // Group cards by name
//   const cardGroups = {}
//   hand.forEach((card) => {
//     if (!cardGroups[card.name]) {
//       cardGroups[card.name] = []
//     }
//     cardGroups[card.name].push(card)
//   })

//   // Check if any group has 4 cards
//   return Object.values(cardGroups).some((group) => group.length === 4)
// }

// // Generate a random room ID
// function generateRoomId() {
//   return Math.random().toString(36).substring(2, 8).toUpperCase()
// }

// // AI opponent logic
// async function getAIMove(aiPlayer, gameState) {
//   try {
//     // Prepare game state for AI
//     const gameStateForAI = {
//       players: gameState.players.map((p) => ({
//         username: p.username,
//         handSize: p.hand.length,
//         isAI: p.isAI,
//       })),
//       myHand: aiPlayer.hand,
//       currentTurn: gameState.currentTurn,
//       turnCount: gameState.turnCount,
//     }

//     // Use Gemini AI to decide which card to pass
//     const prompt = `
//       You are an AI playing a card game. The goal is to collect 4 identical cards (same name).
//       Current game state:
//       - Your hand: ${JSON.stringify(aiPlayer.hand)}
//       - Other players: ${gameState.players
//         .filter((p) => p.username !== aiPlayer.username)
//         .map((p) => `${p.username} (${p.hand.length} cards)`)
//         .join(", ")}
//       - Turn count: ${gameState.turnCount}
      
//       Strategy tips:
//       - Keep cards that you already have multiples of
//       - Pass cards that don't help you form a set
//       - If you have no duplicates, keep higher value cards
      
//       Which card should you pass? Return ONLY a JSON object with the card ID, like: {"cardId": 5}
//     `

//     const { text } = await generateText({
//       model: gemini("gemini-1.5-pro"),
//       prompt,
//     })

//     // Parse AI response
//     let response
//     try {
//       // Extract JSON from the response
//       const jsonMatch = text.match(/\{.*\}/s)
//       if (jsonMatch) {
//         response = JSON.parse(jsonMatch[0])
//       }
//     } catch (error) {
//       console.error("Error parsing AI response:", error)
//     }

//     if (response && response.cardId) {
//       // Find the card in the AI's hand
//       const cardToPass = aiPlayer.hand.find((card) => card.id === response.cardId)
//       if (cardToPass) {
//         return cardToPass
//       }
//     }

//     // Fallback: simple strategy if AI response couldn't be parsed
//     // Find cards that don't have duplicates
//     const cardCounts = {}
//     aiPlayer.hand.forEach((card) => {
//       if (!cardCounts[card.name]) {
//         cardCounts[card.name] = 0
//       }
//       cardCounts[card.name]++
//     })

//     // First try to pass a card that has no duplicates
//     const singleCards = aiPlayer.hand.filter((card) => cardCounts[card.name] === 1)
//     if (singleCards.length > 0) {
//       // Pass the lowest value single card
//       return singleCards.sort((a, b) => a.points - b.points)[0]
//     }

//     // If all cards have duplicates, pass the one with the fewest duplicates
//     return aiPlayer.hand.sort((a, b) => {
//       if (cardCounts[a.name] !== cardCounts[b.name]) {
//         return cardCounts[a.name] - cardCounts[b.name]
//       }
//       return a.points - b.points
//     })[0]
//   } catch (error) {
//     console.error("Error in AI move:", error)
//     // Fallback to random card selection
//     return aiPlayer.hand[Math.floor(Math.random() * aiPlayer.hand.length)]
//   }
// }

// // Socket.IO connection handler
// io.on("connection", (socket) => {
//   console.log("Client connected:", socket.id)
//   let currentUser = null

//   // Identify user
//   socket.on("identify", (data) => {
//     currentUser = data.username
//     console.log(`User identified: ${currentUser}`)
//   })

//   // Create a new game room
//   socket.on("createRoom", async (data) => {
//     if (!currentUser) return

//     const roomId = generateRoomId()

//     // Create room
//     gameRooms.set(roomId, {
//       id: roomId,
//       isPrivate: data.isPrivate,
//       accessCode: data.isPrivate ? data.accessCode : null,
//       players: [
//         {
//           socketId: socket.id,
//           username: currentUser,
//           hand: [],
//           isAI: false,
//         },
//       ],
//       gameStatus: "waiting",
//       currentTurn: null,
//       turnCount: 0,
//       deck: [],
//       winner: null,
//       aiOpponents: data.aiOpponents || 0,
//     })

//     // Join socket room
//     socket.join(roomId)

//     // Add AI opponents if requested
//     const room = gameRooms.get(roomId)
//     for (let i = 0; i < room.aiOpponents; i++) {
//       const aiName = `AI-${i + 1}`
//       room.players.push({
//         socketId: `ai-${roomId}-${i}`,
//         username: aiName,
//         hand: [],
//         isAI: true,
//       })
//     }

//     // Notify client
//     socket.emit("roomCreated", { roomId })

//     // Broadcast game state
//     io.to(roomId).emit("gameStateUpdate", {
//       roomId,
//       players: room.players,
//       gameStatus: room.gameStatus,
//       currentTurn: room.currentTurn,
//       turnCount: room.turnCount,
//       winner: room.winner,
//     })

//     // Send game event
//     io.to(roomId).emit("gameEvent", {
//       message: `${currentUser} created the room`,
//     })

//     console.log(`Room created: ${roomId} by ${currentUser}`)
//   })

//   // Join an existing room
//   socket.on("joinRoom", (data) => {
//     if (!currentUser) return

//     const { roomId, accessCode } = data
//     const room = gameRooms.get(roomId)

//     // Check if room exists
//     if (!room) {
//       socket.emit("roomError", { message: "Room not found" })
//       return
//     }

//     // Check if room is private and requires access code
//     if (room.isPrivate && room.accessCode !== accessCode) {
//       socket.emit("roomError", { message: "Invalid access code" })
//       return
//     }

//     // Check if room is full
//     if (room.players.length >= 4) {
//       socket.emit("roomError", { message: "Room is full" })
//       return
//     }

//     // Check if game is already in progress
//     if (room.gameStatus === "playing") {
//       socket.emit("roomError", { message: "Game already in progress" })
//       return
//     }

//     // Check if player is already in the room
//     const existingPlayer = room.players.find((p) => p.username === currentUser)
//     if (existingPlayer) {
//       // Update socket ID for reconnection
//       existingPlayer.socketId = socket.id
//     } else {
//       // Add player to room
//       room.players.push({
//         socketId: socket.id,
//         username: currentUser,
//         hand: [],
//         isAI: false,
//       })
//     }

//     // Join socket room
//     socket.join(roomId)

//     // Notify client
//     socket.emit("roomJoined", {
//       gameState: {
//         roomId,
//         players: room.players,
//         gameStatus: room.gameStatus,
//         currentTurn: room.currentTurn,
//         turnCount: room.turnCount,
//         winner: room.winner,
//       },
//     })

//     // Broadcast game state to all players
//     io.to(roomId).emit("gameStateUpdate", {
//       roomId,
//       players: room.players,
//       gameStatus: room.gameStatus,
//       currentTurn: room.currentTurn,
//       turnCount: room.turnCount,
//       winner: room.winner,
//     })

//     // Send game event
//     io.to(roomId).emit("gameEvent", {
//       message: `${currentUser} joined the room`,
//     })

//     console.log(`${currentUser} joined room: ${roomId}`)
//   })

//   // Start game
//   socket.on("startGame", () => {
//     if (!currentUser) return

//     // Find room where this player is
//     const roomEntry = Array.from(gameRooms.entries()).find(([_, room]) =>
//       room.players.some((p) => p.username === currentUser),
//     )

//     if (!roomEntry) return

//     const [roomId, room] = roomEntry

//     // Check if enough players
//     if (room.players.length < 2) {
//       socket.emit("gameError", { message: "Need at least 2 players to start" })
//       return
//     }

//     // Check if game already started
//     if (room.gameStatus === "playing") {
//       socket.emit("gameError", { message: "Game already in progress" })
//       return
//     }

//     // Generate and shuffle deck
//     room.deck = generateDeck()

//     // Deal cards (4 to each player)
//     room.players.forEach((player) => {
//       player.hand = room.deck.splice(0, 4)
//     })

//     // Set game status
//     room.gameStatus = "playing"
//     room.turnCount = 1

//     // Set first player's turn (random)
//     const firstPlayerIndex = Math.floor(Math.random() * room.players.length)
//     room.currentTurn = room.players[firstPlayerIndex].username

//     // Broadcast game state
//     io.to(roomId).emit("gameStateUpdate", {
//       roomId,
//       players: room.players,
//       gameStatus: room.gameStatus,
//       currentTurn: room.currentTurn,
//       turnCount: room.turnCount,
//       winner: room.winner,
//     })

//     // Send game event
//     io.to(roomId).emit("gameEvent", {
//       message: `Game started! ${room.currentTurn}'s turn`,
//     })

//     console.log(`Game started in room: ${roomId}`)

//     // If AI's turn, make a move after a short delay
//     const currentPlayer = room.players.find((p) => p.username === room.currentTurn)
//     if (currentPlayer && currentPlayer.isAI) {
//       handleAITurn(room, roomId)
//     }
//   })

//   // Pass card
//   socket.on("passCard", async (data) => {
//     if (!currentUser) return

//     // Find room where this player is
//     const roomEntry = Array.from(gameRooms.entries()).find(([_, room]) =>
//       room.players.some((p) => p.username === currentUser),
//     )

//     if (!roomEntry) return

//     const [roomId, room] = roomEntry

//     // Check if it's player's turn
//     if (room.currentTurn !== currentUser) {
//       socket.emit("gameError", { message: "Not your turn" })
//       return
//     }

//     // Find current player
//     const currentPlayer = room.players.find((p) => p.username === currentUser)
//     if (!currentPlayer) return

//     // Find card in player's hand
//     const cardIndex = currentPlayer.hand.findIndex((c) => c.id === data.card.id)
//     if (cardIndex === -1) {
//       socket.emit("gameError", { message: "Card not in your hand" })
//       return
//     }

//     // Find next player (clockwise)
//     const currentPlayerIndex = room.players.findIndex((p) => p.username === currentUser)
//     const nextPlayerIndex = (currentPlayerIndex + 1) % room.players.length
//     const nextPlayer = room.players[nextPlayerIndex]

//     // Remove card from current player's hand
//     const card = currentPlayer.hand.splice(cardIndex, 1)[0]

//     // Add card to next player's hand
//     nextPlayer.hand.push(card)

//     // Send game event
//     io.to(roomId).emit("gameEvent", {
//       message: `${currentUser} passed a card to ${nextPlayer.username}`,
//     })

//     // Check if next player has won
//     if (checkWinCondition(nextPlayer.hand)) {
//       // Game over
//       room.gameStatus = "gameOver"
//       room.winner = nextPlayer.username

//       // Save game to database
//       try {
//         const game = new GameModel({
//           roomId,
//           players: room.players.map((p) => p.username),
//           winner: nextPlayer.username,
//           duration: room.turnCount,
//           date: new Date(),
//         })
//         await game.save()

//         // Update player stats
//         for (const player of room.players) {
//           const isWinner = player.username === nextPlayer.username
//           await PlayerModel.findOneAndUpdate(
//             { username: player.username },
//             {
//               $inc: {
//                 gamesPlayed: 1,
//                 wins: isWinner ? 1 : 0,
//               },
//             },
//             { upsert: true },
//           )
//         }
//       } catch (error) {
//         console.error("Error saving game:", error)
//       }

//       // Broadcast game over
//       io.to(roomId).emit("gameOver", {
//         winner: nextPlayer.username,
//         turnCount: room.turnCount,
//       })

//       // Send game event
//       io.to(roomId).emit("gameEvent", {
//         message: `${nextPlayer.username} wins the game!`,
//       })
//     } else {
//       // Next player's turn
//       room.currentTurn = nextPlayer.username
//       room.turnCount++

//       // Send game event
//       io.to(roomId).emit("gameEvent", {
//         message: `It's ${nextPlayer.username}'s turn`,
//       })

//       // If AI's turn, make a move after a short delay
//       if (nextPlayer.isAI) {
//         handleAITurn(room, roomId)
//       }
//     }

//     // Broadcast updated game state
//     io.to(roomId).emit("gameStateUpdate", {
//       roomId,
//       players: room.players,
//       gameStatus: room.gameStatus,
//       currentTurn: room.currentTurn,
//       turnCount: room.turnCount,
//       winner: room.winner,
//     })
//   })

//   // Handle AI turn
//   async function handleAITurn(room, roomId) {
//     // Wait a bit to simulate thinking
//     setTimeout(async () => {
//       // Find AI player
//       const aiPlayer = room.players.find((p) => p.username === room.currentTurn)
//       if (!aiPlayer || !aiPlayer.isAI) return

//       // Get AI move
//       const cardToPass = await getAIMove(aiPlayer, room)

//       // Find next player (clockwise)
//       const aiPlayerIndex = room.players.findIndex((p) => p.username === aiPlayer.username)
//       const nextPlayerIndex = (aiPlayerIndex + 1) % room.players.length
//       const nextPlayer = room.players[nextPlayerIndex]

//       // Remove card from AI player's hand
//       const cardIndex = aiPlayer.hand.findIndex((c) => c.id === cardToPass.id)
//       const card = aiPlayer.hand.splice(cardIndex, 1)[0]

//       // Add card to next player's hand
//       nextPlayer.hand.push(card)

//       // Send game event
//       io.to(roomId).emit("gameEvent", {
//         message: `${aiPlayer.username} passed a card to ${nextPlayer.username}`,
//       })

//       // Send AI chat message occasionally
//       if (Math.random() < 0.3) {
//         const aiMessages = [
//           "I think I'm getting closer to winning!",
//           "Hmm, interesting move...",
//           "This card might help me complete my set.",
//           "I'm watching your strategy closely.",
//           "That wasn't the card I wanted!",
//         ]
//         const randomMessage = aiMessages[Math.floor(Math.random() * aiMessages.length)]

//         io.to(roomId).emit("chatMessage", {
//           sender: aiPlayer.username,
//           content: randomMessage,
//           timestamp: new Date().toISOString(),
//         })
//       }

//       // Check if next player has won
//       if (checkWinCondition(nextPlayer.hand)) {
//         // Game over
//         room.gameStatus = "gameOver"
//         room.winner = nextPlayer.username

//         // Save game to database
//         try {
//           const game = new GameModel({
//             roomId,
//             players: room.players.map((p) => p.username),
//             winner: nextPlayer.username,
//             duration: room.turnCount,
//             date: new Date(),
//           })
//           await game.save()

//           // Update player stats
//           for (const player of room.players) {
//             const isWinner = player.username === nextPlayer.username
//             await PlayerModel.findOneAndUpdate(
//               { username: player.username },
//               {
//                 $inc: {
//                   gamesPlayed: 1,
//                   wins: isWinner ? 1 : 0,
//                 },
//               },
//               { upsert: true },
//             )
//           }
//         } catch (error) {
//           console.error("Error saving game:", error)
//         }

//         // Broadcast game over
//         io.to(roomId).emit("gameOver", {
//           winner: nextPlayer.username,
//           turnCount: room.turnCount,
//         })

//         // Send game event
//         io.to(roomId).emit("gameEvent", {
//           message: `${nextPlayer.username} wins the game!`,
//         })
//       } else {
//         // Next player's turn
//         room.currentTurn = nextPlayer.username
//         room.turnCount++

//         // Send game event
//         io.to(roomId).emit("gameEvent", {
//           message: `It's ${nextPlayer.username}'s turn`,
//         })

//         // If next player is also AI, handle their turn
//         if (nextPlayer.isAI) {
//           handleAITurn(room, roomId)
//         }
//       }

//       // Broadcast updated game state
//       io.to(roomId).emit("gameStateUpdate", {
//         roomId,
//         players: room.players,
//         gameStatus: room.gameStatus,
//         currentTurn: room.currentTurn,
//         turnCount: room.turnCount,
//         winner: room.winner,
//       })
//     }, 1500) // Delay AI move by 1.5 seconds
//   }

//   // Send chat message
//   socket.on("sendMessage", (data) => {
//     if (!currentUser) return

//     const { roomId, content } = data
//     const room = gameRooms.get(roomId)

//     if (!room) return

//     // Broadcast message to room
//     io.to(roomId).emit("chatMessage", {
//       sender: currentUser,
//       content,
//       timestamp: new Date().toISOString(),
//     })
//   })

//   // Leave game
//   socket.on("leaveGame", () => {
//     if (!currentUser) return

//     // Find room where this player is
//     const roomEntry = Array.from(gameRooms.entries()).find(([_, room]) =>
//       room.players.some((p) => p.username === currentUser),
//     )

//     if (!roomEntry) return

//     const [roomId, room] = roomEntry

//     // Remove player from room
//     room.players = room.players.filter((p) => p.username !== currentUser)

//     // Leave socket room
//     socket.leave(roomId)

//     // Send game event
//     io.to(roomId).emit("gameEvent", {
//       message: `${currentUser} left the game`,
//     })

//     // If room is empty, delete it
//     if (room.players.length === 0) {
//       gameRooms.delete(roomId)
//       console.log(`Room deleted: ${roomId}`)
//       return
//     }

//     // If game was in progress, end it
//     if (room.gameStatus === "playing") {
//       room.gameStatus = "waiting"
//       room.currentTurn = null
//       room.turnCount = 0
//       room.winner = null
//       room.deck = []

//       // Clear players' hands
//       room.players.forEach((player) => {
//         player.hand = []
//       })

//       // Send game event
//       io.to(roomId).emit("gameEvent", {
//         message: "Game ended because a player left",
//       })
//     }

//     // Broadcast updated game state
//     io.to(roomId).emit("gameStateUpdate", {
//       roomId,
//       players: room.players,
//       gameStatus: room.gameStatus,
//       currentTurn: room.currentTurn,
//       turnCount: room.turnCount,
//       winner: room.winner,
//     })
//   })

//   // Play again
//   socket.on("playAgain", () => {
//     if (!currentUser) return

//     // Find room where this player is
//     const roomEntry = Array.from(gameRooms.entries()).find(([_, room]) =>
//       room.players.some((p) => p.username === currentUser),
//     )

//     if (!roomEntry) return

//     const [roomId, room] = roomEntry

//     // Reset game
//     room.gameStatus = "waiting"
//     room.currentTurn = null
//     room.turnCount = 0
//     room.winner = null
//     room.deck = []

//     // Clear players' hands
//     room.players.forEach((player) => {
//       player.hand = []
//     })

//     // Send game event
//     io.to(roomId).emit("gameEvent", {
//       message: "Starting a new game...",
//     })

//     // Broadcast updated game state
//     io.to(roomId).emit("gameStateUpdate", {
//       roomId,
//       players: room.players,
//       gameStatus: room.gameStatus,
//       currentTurn: room.currentTurn,
//       turnCount: room.turnCount,
//       winner: room.winner,
//     })

//     // Start new game automatically if enough players
//     if (room.players.length >= 2) {
//       // Generate and shuffle deck
//       room.deck = generateDeck()

//       // Deal cards (4 to each player)
//       room.players.forEach((player) => {
//         player.hand = room.deck.splice(0, 4)
//       })

//       // Set game status
//       room.gameStatus = "playing"
//       room.turnCount = 1

//       // Set first player's turn (random)
//       const firstPlayerIndex = Math.floor(Math.random() * room.players.length)
//       room.currentTurn = room.players[firstPlayerIndex].username

//       // Broadcast game state
//       io.to(roomId).emit("gameStateUpdate", {
//         roomId,
//         players: room.players,
//         gameStatus: room.gameStatus,
//         currentTurn: room.currentTurn,
//         turnCount: room.turnCount,
//         winner: room.winner,
//       })

//       // Send game event
//       io.to(roomId).emit("gameEvent", {
//         message: `New game started! ${room.currentTurn}'s turn`,
//       })

//       // If AI's turn, make a move after a short delay
//       const currentPlayer = room.players.find((p) => p.username === room.currentTurn)
//       if (currentPlayer && currentPlayer.isAI) {
//         handleAITurn(room, roomId)
//       }
//     }
//   })

//   // Disconnect
//   socket.on("disconnect", () => {
//     if (!currentUser) return

//     console.log(`Client disconnected: ${socket.id} (${currentUser})`)

//     // Find room where this player is
//     const roomEntry = Array.from(gameRooms.entries()).find(([_, room]) =>
//       room.players.some((p) => p.username === currentUser),
//     )

//     if (!roomEntry) return

//     const [roomId, room] = roomEntry

//     // Mark player as disconnected but don't remove yet
//     // This allows for reconnection
//     const player = room.players.find((p) => p.username === currentUser)
//     if (player) {
//       player.disconnected = true

//       // Send game event
//       io.to(roomId).emit("gameEvent", {
//         message: `${currentUser} disconnected`,
//       })

//       // Set a timeout to remove player if they don't reconnect
//       setTimeout(() => {
//         // Check if player is still disconnected
//         if (player.disconnected) {
//           // Remove player from room
//           room.players = room.players.filter((p) => p.username !== currentUser)

//           // If room is empty, delete it
//           if (room.players.length === 0) {
//             gameRooms.delete(roomId)
//             console.log(`Room deleted: ${roomId}`)
//             return
//           }

//           // If game was in progress, end it
//           if (room.gameStatus === "playing") {
//             room.gameStatus = "waiting"
//             room.currentTurn = null
//             room.turnCount = 0
//             room.winner = null
//             room.deck = []

//             // Clear players' hands
//             room.players.forEach((player) => {
//               player.hand = []
//             })

//             // Send game event
//             io.to(roomId).emit("gameEvent", {
//               message: "Game ended because a player left",
//             })
//           }

//           // Broadcast updated game state
//           io.to(roomId).emit("gameStateUpdate", {
//             roomId,
//             players: room.players,
//             gameStatus: room.gameStatus,
//             currentTurn: room.currentTurn,
//             turnCount: room.turnCount,
//             winner: room.winner,
//           })
//         }
//       }, 60000) // 1 minute timeout
//     }
//   })
// })

// // Start server
// const PORT = process.env.PORT || 3001
// httpServer.listen(PORT, () => {
//   console.log(`Socket.IO server running on port ${PORT}`)
// })

// export default httpServer
