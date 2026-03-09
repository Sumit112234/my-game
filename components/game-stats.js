// "use client"

// import { useGame } from "@/context/game-context"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Progress } from "@/components/ui/progress"

// export function GameStats() {
//   const { gameState } = useGame()
//   const { players, gameStatus } = gameState

//   // Calculate match progress
//   const totalTurns = gameStatus === "playing" ? gameState.turnCount : 0
//   const estimatedMaxTurns = 20 // Estimate for a typical game
//   const progress = Math.min(100, (totalTurns / estimatedMaxTurns) * 100)

//   return (
//     <Card>
//       <CardHeader className="py-3">
//         <CardTitle className="text-sm font-medium">Game Stats</CardTitle>
//       </CardHeader>
//       <CardContent className="space-y-4">
//         {gameStatus === "playing" && (
//           <>
//             <div className="space-y-1">
//               <div className="flex justify-between text-xs">
//                 <span>Match Progress</span>
//                 <span>Turn {totalTurns}</span>
//               </div>
//               <Progress value={progress} className="h-2" />
//             </div>

//             <div className="space-y-2">
//               <div className="text-xs font-medium">Players</div>
//               {players.map((player) => (
//                 <div key={player.username} className="flex justify-between items-center text-sm">
//                   <div className="flex items-center">
//                     <span className={player.isAI ? "text-blue-400" : "text-gray-300"}>
//                       {player.username}
//                       {player.isAI && <span className="text-xs ml-1">(AI)</span>}
//                     </span>
//                   </div>
//                   <div className="text-xs">{player.hand.length} cards</div>
//                 </div>
//               ))}
//             </div>
//           </>
//         )}

//         {gameStatus === "gameOver" && gameState.winner && (
//           <div className="text-center py-2">
//             <div className="text-lg font-bold text-amber-400">{gameState.winner} wins!</div>
//             <div className="text-xs text-gray-400 mt-1">Game completed in {gameState.turnCount} turns</div>
//           </div>
//         )}

//         {gameStatus === "waiting" && (
//           <div className="text-center py-2">
//             <div className="text-sm">Waiting for players...</div>
//             <div className="text-xs text-gray-400 mt-1">{players.length} / 4 players joined</div>
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   )
// }
