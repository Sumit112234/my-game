"use client"

import { useState } from "react"
import { useGame } from "@/context/game-context"
import { useSocket } from "@/context/socket-context"
import { useAuth } from "@/context/auth-context"
import { Card } from "@/components/card"
import { PlayerArea } from "@/components/player-area"
import { motion } from "framer-motion"
import { useSound } from "@/hooks/use-sound"

export function GameBoard() {
  const { gameState } = useGame()
  const { socket } = useSocket()
  const { user } = useAuth()
  const [selectedCard, setSelectedCard] = useState(null)
  const [animatingCard, setAnimatingCard] = useState(null)
  const { playSound } = useSound()

  const { players, currentTurn, gameStatus } = gameState

  const handleCardSelect = (card) => {
    if (gameStatus !== "playing" || currentTurn !== user.username) return

    setSelectedCard(card)
    playSound("cardSelect")
  }

  const handleCardPass = (card) => {
    if (!card || gameStatus !== "playing" || currentTurn !== user.username) return

    // Find the next player (clockwise)
    const currentPlayerIndex = players.findIndex((p) => p.username === user.username)
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length
    const nextPlayer = players[nextPlayerIndex]

    // Animate card passing
    setAnimatingCard(card)
    playSound("cardPass")

    // Emit card pass event after animation delay
    setTimeout(() => {
      socket.emit("passCard", {
        card,
        to: nextPlayer.username,
      })
      setSelectedCard(null)
      setAnimatingCard(null)
    }, 500)
  }

  // Get the current player's hand
  const currentPlayer = players.find((p) => p.username === user.username)
  const playerHand = currentPlayer ? currentPlayer.hand : []

  // Organize players for display (current player at bottom, others clockwise)
  const organizedPlayers = [...players]
  if (players.length > 0) {
    const currentPlayerIndex = players.findIndex((p) => p.username === user.username)
    if (currentPlayerIndex !== -1) {
      const before = players.slice(0, currentPlayerIndex)
      const after = players.slice(currentPlayerIndex + 1)
      organizedPlayers.splice(0, players.length, ...after, ...before)
    }
  }

  return (
    <div className="relative w-full h-[600px] bg-gradient-to-r from-emerald-900/30 to-blue-900/30 rounded-lg overflow-hidden border border-gray-700 shadow-xl">
      {/* Game table */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[300px] h-[300px] rounded-full bg-gradient-to-r from-emerald-800/20 to-blue-800/20 border border-gray-700 flex items-center justify-center">
          {gameStatus === "waiting" && (
            <div className="text-center p-4 bg-black/50 rounded-lg">
              <h3 className="text-xl font-bold mb-2">Waiting for players...</h3>
              <p className="text-sm text-gray-300">{players.length} / 4 players joined</p>
            </div>
          )}

          {gameStatus === "playing" && (
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Current Turn</h3>
              <p className="text-lg text-amber-400 font-semibold">
                {currentTurn === user.username ? "Your Turn" : currentTurn}
              </p>
            </div>
          )}

          {gameStatus === "gameOver" && (
            <div className="text-center p-4 bg-black/50 rounded-lg">
              <h3 className="text-xl font-bold mb-2">Game Over</h3>
              <p className="text-lg text-amber-400 font-semibold">{gameState.winner} wins!</p>
            </div>
          )}
        </div>
      </div>

      {/* Player areas */}
      <div className="absolute inset-0">
        {/* Current player (bottom) */}
        <div className="absolute bottom-0 left-0 right-0 h-[150px] flex justify-center">
          <PlayerArea
            player={currentPlayer}
            isCurrentPlayer={true}
            isCurrentTurn={currentTurn === user.username}
            onCardSelect={handleCardSelect}
            selectedCard={selectedCard}
            onCardPass={handleCardPass}
          />
        </div>

        {/* Other players */}
        {organizedPlayers.map((player, index) => {
          if (player.username === user.username) return null

          // Position other players based on index (left, top, right)
          let position
          if (organizedPlayers.length === 2) {
            position = "top"
          } else if (organizedPlayers.length === 3) {
            position = index === 0 ? "right" : index === 1 ? "top" : "left"
          } else {
            position = index === 0 ? "right" : index === 1 ? "top" : "left"
          }

          let positionStyles = {}
          if (position === "left") {
            positionStyles = { left: 0, top: "50%", transform: "translateY(-50%)" }
          } else if (position === "top") {
            positionStyles = { top: 0, left: "50%", transform: "translateX(-50%)" }
          } else if (position === "right") {
            positionStyles = { right: 0, top: "50%", transform: "translateY(-50%)" }
          }

          return (
            <div key={player.username} className="absolute" style={positionStyles}>
              <PlayerArea player={player} position={position} isCurrentTurn={currentTurn === player.username} />
            </div>
          )
        })}
      </div>

      {/* Animating card */}
      {animatingCard && (
        <motion.div
          className="absolute z-50"
          initial={{ x: 0, y: 0 }}
          animate={{ x: 0, y: -200 }}
          transition={{ duration: 0.5 }}
        >
          <Card card={animatingCard} />
        </motion.div>
      )}
    </div>
  )
}
