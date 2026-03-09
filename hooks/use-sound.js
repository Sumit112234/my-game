"use client"

import { useEffect, useRef } from "react"

export function useSound() {
  const soundsRef = useRef({})

  useEffect(() => {
    // Preload sounds
    soundsRef.current = {
      cardSelect: new Audio("/sounds/card-select.mp3"),
      cardPass: new Audio("/sounds/card-pass.mp3"),
      cardShuffle: new Audio("/sounds/card-shuffle.mp3"),
      gameWin: new Audio("/sounds/game-win.mp3"),
      chatMessage: new Audio("/sounds/chat-message.mp3"),
    }

    // Set volume for all sounds
    Object.values(soundsRef.current).forEach((sound) => {
      sound.volume = 0.5
    })

    return () => {
      // Clean up sounds
      Object.values(soundsRef.current).forEach((sound) => {
        sound.pause()
        sound.currentTime = 0
      })
    }
  }, [])

  const playSound = (soundName) => {
    const sound = soundsRef.current[soundName]
    if (sound) {
      sound.currentTime = 0
      sound.play().catch((err) => console.error("Error playing sound:", err))
    }
  }

  return { playSound }
}
