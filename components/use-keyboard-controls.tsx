"use client"

import { useState, useEffect } from "react"

export function useKeyboardControls() {
  const [player1Keys, setPlayer1Keys] = useState({
    left: false,
    right: false,
    jump: false,
    attack: false,
    block: false,
    special: false,
    dash: false,
    forward: false,
    backward: false,
  })

  const [player2Keys, setPlayer2Keys] = useState({
    left: false,
    right: false,
    jump: false,
    attack: false,
    block: false,
    special: false,
    dash: false,
    forward: false,
    backward: false,
  })

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for game keys to avoid scrolling
      if (["w", "a", "s", "d", "q", "e", "z", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ShiftRight", "ShiftLeft", "/"].includes(e.key)) {
        e.preventDefault()
      }

      // Player 1 controls
      if (e.key === "a" || e.key === "A") {
        setPlayer1Keys(prev => ({ ...prev, left: true }))
      }
      if (e.key === "d" || e.key === "D") {
        setPlayer1Keys(prev => ({ ...prev, right: true }))
      }
      if (e.key === "w" || e.key === "W") {
        setPlayer1Keys(prev => ({ ...prev, forward: true }))
      }
      if (e.key === "s" || e.key === "S") {
        setPlayer1Keys(prev => ({ ...prev, backward: true }))
      }
      if (e.key === "q" || e.key === "Q") {
        setPlayer1Keys(prev => ({ ...prev, attack: true }))
      }
      if (e.key === "e" || e.key === "E") {
        setPlayer1Keys(prev => ({ ...prev, block: true }))
      }
      if (e.key === "z" || e.key === "Z") {
        setPlayer1Keys(prev => ({ ...prev, special: true }))
      }
      if (e.key === "Shift" || e.key === "ShiftLeft") {
        setPlayer1Keys(prev => ({ ...prev, dash: true }))
      }
      if (e.key === " ") {
        setPlayer1Keys(prev => ({ ...prev, jump: true }))
      }

      // Player 2 controls
      if (e.key === "ArrowLeft") {
        setPlayer2Keys(prev => ({ ...prev, left: true }))
      }
      if (e.key === "ArrowRight") {
        setPlayer2Keys(prev => ({ ...prev, right: true }))
      }
      if (e.key === "ArrowUp") {
        setPlayer2Keys(prev => ({ ...prev, jump: true }))
      }
      if (e.key === "ShiftRight") {
        setPlayer2Keys(prev => ({ ...prev, attack: true }))
      }
      if (e.key === "m") {
        setPlayer2Keys(prev => ({ ...prev, block: true }))
      }
      if (e.key === "/") {
        setPlayer2Keys(prev => ({ ...prev, special: true }))
      }
      if (e.key === "ArrowDown") {
        setPlayer2Keys(prev => ({ ...prev, dash: true }))
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      // Player 1 controls
      if (e.key === "a" || e.key === "A") {
        setPlayer1Keys(prev => ({ ...prev, left: false }))
      }
      if (e.key === "d" || e.key === "D") {
        setPlayer1Keys(prev => ({ ...prev, right: false }))
      }
      if (e.key === "w" || e.key === "W") {
        setPlayer1Keys(prev => ({ ...prev, forward: false }))
      }
      if (e.key === "s" || e.key === "S") {
        setPlayer1Keys(prev => ({ ...prev, backward: false }))
      }
      if (e.key === "q" || e.key === "Q") {
        setPlayer1Keys(prev => ({ ...prev, attack: false }))
      }
      if (e.key === "e" || e.key === "E") {
        setPlayer1Keys(prev => ({ ...prev, block: false }))
      }
      if (e.key === "z" || e.key === "Z") {
        setPlayer1Keys(prev => ({ ...prev, special: false }))
      }
      if (e.key === "Shift" || e.key === "ShiftLeft") {
        setPlayer1Keys(prev => ({ ...prev, dash: false }))
      }
      if (e.key === " ") {
        setPlayer1Keys(prev => ({ ...prev, jump: false }))
      }

      // Player 2 controls
      if (e.key === "ArrowLeft") {
        setPlayer2Keys(prev => ({ ...prev, left: false }))
      }
      if (e.key === "ArrowRight") {
        setPlayer2Keys(prev => ({ ...prev, right: false }))
      }
      if (e.key === "ArrowUp") {
        setPlayer2Keys(prev => ({ ...prev, jump: false }))
      }
      if (e.key === "ShiftRight") {
        setPlayer2Keys(prev => ({ ...prev, attack: false }))
      }
      if (e.key === "m") {
        setPlayer2Keys(prev => ({ ...prev, block: false }))
      }
      if (e.key === "/") {
        setPlayer2Keys(prev => ({ ...prev, special: false }))
      }
      if (e.key === "ArrowDown") {
        setPlayer2Keys(prev => ({ ...prev, dash: false }))
      }
    }

    const handleBlur = () => {
      setPlayer1Keys({
        left: false,
        right: false,
        jump: false,
        attack: false,
        block: false,
        special: false,
        dash: false,
        forward: false,
        backward: false,
      });
      setPlayer2Keys({
        left: false,
        right: false,
        jump: false,
        attack: false,
        block: false,
        special: false,
        dash: false,
        forward: false,
        backward: false,
      });
    };

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
      window.removeEventListener("blur", handleBlur);
    }
  }, [])

  return { player1Keys, player2Keys }
}
