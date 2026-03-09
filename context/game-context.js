// "use client"

// import { createContext, useContext, useState } from "react"

// const GameContext = createContext(null)

// const initialGameState = {
//   gameId: null,
//   roomId: null,
//   players: [],
//   currentTurn: null,
//   gameStatus: "waiting", // waiting, playing, gameOver
//   winner: null,
//   turnCount: 0,
// }

// export function GameProvider({ children }) {
//   const [gameState, setGameState] = useState(initialGameState)

//   const resetGame = () => {
//     setGameState(initialGameState)
//   }

//   return <GameContext.Provider value={{ gameState, setGameState, resetGame }}>{children}</GameContext.Provider>
// }

// export const useGame = () => {
//   const context = useContext(GameContext)
//   if (!context) {
//     throw new Error("useGame must be used within a GameProvider")
//   }
//   return context
// }
