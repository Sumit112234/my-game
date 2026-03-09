"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export function Card({ card, onClick, isSelected, isRevealed = true, isDisabled = false }) {
  if (!card) return null

  const { name, points, id } = card

  // Card color based on points
  const getCardColor = () => {
    switch (points) {
      case 100:
        return "from-green-700 to-green-900"
      case 200:
        return "from-blue-700 to-blue-900"
      case 300:
        return "from-purple-700 to-purple-900"
      case 400:
        return "from-amber-700 to-amber-900"
      default:
        return "from-gray-700 to-gray-900"
    }
  }

  const cardVariants = {
    hover: { y: -10, scale: 1.05, transition: { duration: 0.2 } },
    tap: { scale: 0.95, transition: { duration: 0.1 } },
    selected: { y: -20, scale: 1.1, boxShadow: "0 0 15px rgba(255, 255, 255, 0.5)" },
  }

  return (
    <motion.div
      className={cn(
        "relative w-24 h-36 rounded-lg overflow-hidden cursor-pointer transform transition-all duration-200",
        isSelected ? "ring-4 ring-yellow-400" : "",
        isDisabled ? "opacity-50 cursor-not-allowed" : "",
      )}
      onClick={() => !isDisabled && onClick && onClick(card)}
      variants={cardVariants}
      whileHover={!isDisabled && "hover"}
      whileTap={!isDisabled && "tap"}
      animate={isSelected ? "selected" : ""}
    >
      {isRevealed ? (
        <div
          className={`w-full h-full bg-gradient-to-b ${getCardColor()} p-2 flex flex-col justify-between border border-gray-600`}
        >
          <div className="text-xs font-bold text-white/90">{points}</div>

          <div className="flex-grow flex items-center justify-center">
            <div className="text-center">
              <div className="text-xs text-white/80 mb-1">Card of</div>
              <div className="text-sm font-bold text-white">{name}</div>
            </div>
          </div>

          <div className="text-xs font-bold text-white/90 self-end">{points}</div>
        </div>
      ) : (
        <div className="w-full h-full bg-gradient-to-b from-gray-800 to-gray-900 p-2 flex items-center justify-center border border-gray-600">
          <div className="text-xl font-bold text-white/50">?</div>
        </div>
      )}
    </motion.div>
  )
}
