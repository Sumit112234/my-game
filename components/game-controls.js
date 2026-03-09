"use client"

import { useGame } from "@/context/game-context"
import { useSocket } from "@/context/socket-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

export function GameControls() {
  const { gameState } = useGame()
  const { socket } = useSocket()
  const router = useRouter()
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const { toast } = useToast()

  const startGame = () => {
    socket.emit("startGame")
  }

  const leaveGame = () => {
    socket.emit("leaveGame")
    router.push("/")
    toast({
      title: "Left Game",
      description: "You have left the game room",
    })
  }

  const playAgain = () => {
    socket.emit("playAgain")
  }

  return (
    <div className="flex justify-between items-center mt-4">
      <div className="flex space-x-2">
        {gameState.gameStatus === "waiting" && gameState.players.length >= 2 && (
          <Button onClick={startGame}>Start Game</Button>
        )}

        {gameState.gameStatus === "gameOver" && <Button onClick={playAgain}>Play Again</Button>}
      </div>

      <div>
        <Button variant="outline" onClick={() => setShowLeaveDialog(true)}>
          Leave Game
        </Button>
      </div>

      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to leave the game. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={leaveGame}>Leave Game</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
