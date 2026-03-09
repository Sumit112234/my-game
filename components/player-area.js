// "use client"

// import { useAuth } from "@/context/auth-context"
// import { Card } from "@/components/card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { cn } from "@/lib/utils"
// import { User, Bot } from "lucide-react"

// export function PlayerArea({
//   player,
//   position = "bottom",
//   isCurrentPlayer = false,
//   isCurrentTurn = false,
//   onCardSelect,
//   selectedCard,
//   onCardPass,
// }) {
//   const { user } = useAuth()

//   if (!player) return null

//   const { username, hand, isAI } = player

//   // Determine layout based on position
//   const getContainerClasses = () => {
//     switch (position) {
//       case "top":
//         return "flex-col items-center"
//       case "left":
//         return "flex-row-reverse items-center"
//       case "right":
//         return "flex-row items-center"
//       default: // bottom
//         return "flex-col-reverse items-center"
//     }
//   }

//   const getCardContainerClasses = () => {
//     switch (position) {
//       case "top":
//         return "flex-row space-x-2 mb-2"
//       case "left":
//         return "flex-col space-y-2 ml-2"
//       case "right":
//         return "flex-col space-y-2 mr-2"
//       default: // bottom
//         return "flex-row space-x-2 mt-2"
//     }
//   }

//   return (
//     <div className={cn("flex p-4", getContainerClasses())}>
//       {/* Player info */}
//       <div
//         className={cn(
//           "flex items-center bg-gray-800/80 rounded-lg p-2 shadow-md",
//           isCurrentTurn ? "ring-2 ring-amber-400" : "",
//         )}
//       >
//         <div className="flex items-center space-x-2">
//           {isAI ? <Bot className="h-5 w-5 text-blue-400" /> : <User className="h-5 w-5 text-gray-300" />}
//           <div>
//             <div className="font-medium text-sm">
//               {username === user?.username ? "You" : username}
//               {isAI && <span className="text-xs text-blue-400 ml-1">(AI)</span>}
//             </div>
//             <div className="text-xs text-gray-400">{hand.length} cards</div>
//           </div>
//         </div>

//         {isCurrentTurn && (
//           <Badge variant="outline" className="ml-2 bg-amber-900/50 text-amber-400 border-amber-500">
//             Turn
//           </Badge>
//         )}
//       </div>

//       {/* Cards */}
//       <div className={cn("flex", getCardContainerClasses())}>
//         {isCurrentPlayer ? (
//           <>
//             {hand.map((card) => (
//               <Card
//                 key={card.id}
//                 card={card}
//                 onClick={onCardSelect}
//                 isSelected={selectedCard && selectedCard.id === card.id}
//                 isDisabled={!isCurrentTurn}
//               />
//             ))}

//             {isCurrentTurn && selectedCard && (
//               <Button
//                 className="absolute bottom-4 right-4 bg-amber-600 hover:bg-amber-700"
//                 onClick={() => onCardPass(selectedCard)}
//               >
//                 Pass Card
//               </Button>
//             )}
//           </>
//         ) : (
//           // Other players' cards (face down)
//           hand.map((_, index) => (
//             <Card key={index} card={{ id: `hidden-${index}`, name: "Hidden", points: 0 }} isRevealed={false} />
//           ))
//         )}
//       </div>
//     </div>
//   )
// }
