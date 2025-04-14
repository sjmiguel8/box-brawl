"use client"

import { useEffect, useRef, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { Stats, OrbitControls } from "@react-three/drei"
import Arena from "./arena"
import Player from "./player"
import { PlayerState } from "./player"
import HealthDisplay from "./health-display"
import GameOverScreen from "./game-over-screen"
import { useKeyboardControls } from "./use-keyboard-controls"

export default function BlockyBrawl() {
  const [player1Health, setPlayer1Health] = useState(100)
  const [player2Health, setPlayer2Health] = useState(100)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<number | null>(null)

  // Game state
  const gameStateRef = useRef({
    player1: {
      position: { x: -3, y: 1, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      isAttacking: false,
      isBlocking: false,
      isDashing: false,
      isSpecialAttack: false,
      attackCooldown: 0,
      dashCooldown: 0,
      health: 100,
      grounded: true,
      facingRight: true,
      stamina: 100,
      specialMeter: 0,
      comboCounter: 0,
      comboTimer: 0,
      invincible: false,
      hitstun: 0,
      attackSequence: [],
      lastMoveTime: 0,
    },
    player2: {
      position: { x: 3, y: 1, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      isAttacking: false,
      isBlocking: false,
      isDashing: false,
      isSpecialAttack: false,
      attackCooldown: 0,
      dashCooldown: 0,
      facingRight: false,
      stamina: 100,
      specialMeter: 0,
      comboCounter: 0,
      health: 100,
      grounded: true,
      comboTimer: 0,
      invincible: false,
      hitstun: 0,
      attackSequence: [],
      lastMoveTime: 0,
    },
    cameraShake: {
      active: false,
      intensity: 0,
      duration: 0,
    },
    platforms: [],
    lastFrameTime: 0,
  })

  // Set up keyboard controls
  const { player1Keys, player2Keys } = useKeyboardControls();
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        resetGame()
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])
  useEffect(() => {


    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [player1Keys])

  // Check for game over
  useEffect(() => {
    if (player1Health <= 0) {
      setGameOver(true)
      setWinner(2)
    } else if (player2Health <= 0) {
      setGameOver(true)
      setWinner(1)
    }
  }, [player1Health, player2Health])

  // Reset game
  const resetGame = () => {
    setPlayer1Health(100)
    setPlayer2Health(100)
    setGameOver(false)
    setWinner(null)

    gameStateRef.current = {
      player1: {
        position: { x: -3, y: 1, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        isAttacking: false,
        isBlocking: false,
        isDashing: false,
        isSpecialAttack: false,
        attackCooldown: 0,
        dashCooldown: 0,
        health: 100,
        grounded: true,
        facingRight: true,
        stamina: 100,
        specialMeter: 0,
        comboCounter: 0,
        comboTimer: 0,
        invincible: false,
        hitstun: 0,
        attackSequence: [],
        lastMoveTime: 0
      },
      player2: {
        position: { x: 3, y: 1, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        isAttacking: false,
        isBlocking: false,
        isDashing: false,
        isSpecialAttack: false,
        attackCooldown: 0,
        dashCooldown: 0,
        health: 100,
        grounded: true,
        facingRight: false,
        stamina: 100,
        specialMeter: 0,
        comboCounter: 0,
        comboTimer: 0,
        invincible: false,
        hitstun: 0,
        attackSequence: [],
        lastMoveTime: 0,
      },
      lastFrameTime: 0,
      cameraShake: {
        active: false,
        intensity: 0,
        duration: 0,
      },
      platforms: [],
    }
  }

  // Handle damage
  const handleDamage = (playerNum: number, damage: number) => {
    if (playerNum === 1) {
      setPlayer1Health((prev) => Math.max(0, Math.min(100, prev - damage)));
    } else {
      setPlayer2Health((prev) => Math.max(0, Math.min(100, prev - damage)));
    }
  }

  // Handle game events
  const handleGameEvent = (event: string, data?: any) => {
    console.log(`Game event: ${event}`, data)
    // Implement game event handling logic here (e.g., sound effects, UI updates)
  }

  return (
    <div className="w-full h-screen relative">
      <Canvas shadows camera={{ position: [0, 5, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          color="#e74c3c"
        />
        <Player
          playerNum={1}
          gameStateRef={gameStateRef}
          playerKeys={player1Keys}
          otherPlayerState={() => gameStateRef.current.player2}
          onHit={(damage: number) => handleDamage(2, damage)}
          onGameEvent={handleGameEvent} color={""}        />
        <Player
          playerNum={2}
          gameStateRef={gameStateRef}
          playerKeys={player2Keys}
          otherPlayerState={() => gameStateRef.current.player1}
          onHit={(damage) => handleDamage(1, damage)}
          color="#3498db"
          onGameEvent={handleGameEvent}
        ></Player>

        <OrbitControls target={[0, 1, 0]} maxPolarAngle={Math.PI / 2} />
        <Stats />
      </Canvas>

      {/* Health bars */}
      <div className="absolute top-4 left-0 right-0 flex justify-center gap-4 px-4">
        <HealthDisplay label="Player 1" health={player1Health} color="#e74c3c" />
        <HealthDisplay label="Player 2" health={player2Health} color="#3498db" />
      </div>

      {/* Game over screen */}
      {gameOver && <GameOverScreen winner={winner} onRestart={resetGame} />}

      {/* Controls info */}
      <div className="absolute bottom-4 left-4 text-xs bg-black/70 text-white p-2 rounded">
        <div className="font-bold mb-1">Player 1:</div>
        <div>Move: A/D | Jump: W | Attack: S | Block: Q</div>
        <div className="font-bold mb-1 mt-2">Player 2:</div>
        <div>Move: ←/→ | Jump: ↑ | Attack: ↓ | Block: Shift</div>
      </div>
    </div>
  )
}

function handleKeyUp(this: Window, ev: KeyboardEvent) {
  // Placeholder for key up handling logic
  console.log("Key up event:", ev.key)
}

