"use client"

import { useRef, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import Player from './player'
import GameArena from './game-arena'
import SpecialEffects from './special-effects'
import { Vector3 } from 'three'

// Initial player states
const INITIAL_PLAYER_STATE = {
  position: { x: 0, y: 1, z: 0 },
  velocity: { x: 0, y: 0, z: 0 },
  isAttacking: false,
  isBlocking: false,
  isDashing: false,
  isSpecialAttack: false,
  attackCooldown: 0,
  dashCooldown: 0,
  grounded: true,
  facingRight: true,
  health: 100,
  stamina: 100,
  specialMeter: 0,
  comboCounter: 0,
  comboTimer: 0,
  hitstun: 0,
  attackSequence: [],
  lastMoveTime: 0,
}

export default function GameManager() {
  // Game state reference
  const gameStateRef = useRef({
    player1: {
      ...INITIAL_PLAYER_STATE,
      position: { x: -5, y: 1, z: 0 },
      facingRight: true,
    },
    player2: {
      ...INITIAL_PLAYER_STATE,
      position: { x: 5, y: 1, z: 0 },
      facingRight: false,
    },
    lastFrameTime: 0,
    cameraShake: { active: false, intensity: 0, duration: 0 },
    platforms: [],
    gameEffects: []
  })

  // Keep track of keyboard state
  const [player1Keys, setPlayer1Keys] = useState({
    left: false,
    right: false,
    jump: false,
    attack: false,
    block: false,
    special: false,
    dash: false,
  })
  
  const [player2Keys, setPlayer2Keys] = useState({
    left: false,
    right: false,
    jump: false,
    attack: false,
    block: false,
    special: false,
    dash: false,
  })
  
  // Game state
  const [gameActive, setGameActive] = useState(false)
  const [winner, setWinner] = useState<number | null>(null)
  const [gameStartCountdown, setGameStartCountdown] = useState(3)
  const [arenaType, setArenaType] = useState<'dojo' | 'temple' | 'arena' | 'volcano'>('dojo')
  const [showControls, setShowControls] = useState(true)

  // Handle key presses
  useEffect(() => {
    // ...existing code...
  }, [gameActive, winner])
  
  // Start game countdown
  const startGame = () => {
    // ...existing code...
  }
  
  // Reset the game
  const resetGame = () => {
    // ...existing code...
  }
  
  // Handle player damage
  const handlePlayer1Hit = (damage: number, isSpecial: boolean = false) => {
    if (!gameActive) return

    gameStateRef.current.player1 = {
      ...gameStateRef.current.player1,
      health: Math.max(0, gameStateRef.current.player1.health - damage),
    }

    // Check for win condition
    if (gameStateRef.current.player1.health <= 0) {
      setGameActive(false)
      setWinner(2)
    }
  }

  const handlePlayer2Hit = (damage: number, isSpecial: boolean = false) => {
    if (!gameActive) return

    gameStateRef.current.player2 = {
      ...gameStateRef.current.player2,
      health: Math.max(0, gameStateRef.current.player2.health - damage),
    }

    // Check for win condition
    if (gameStateRef.current.player2.health <= 0) {
      setGameActive(false)
      setWinner(1)
    }
  }
  
  // Handle game events
  const handleGameEvent = (event: string, data?: any) => {
    const gameEvent = new CustomEvent('gameEvent', {
      detail: {
        type: event,
        ...data
      }
    })
    window.dispatchEvent(gameEvent)
  }

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      <Canvas shadows style={{ background: '#222' }}>
        <PerspectiveCamera makeDefault position={[0, 9, 10]} fov={50} />
        <OrbitControls />
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 10, 5]} intensity={1} castShadow />

        <GameArena gameStateRef={gameStateRef} arenaType={arenaType} />
        <Player
          playerNum={1}
          gameStateRef={gameStateRef}
          playerKeys={player1Keys}
          otherPlayerState={() => gameStateRef.current.player2}
          onHit={handlePlayer1Hit}
          color="blue"
          onGameEvent={handleGameEvent}
        />
        <Player
          playerNum={2}
          gameStateRef={gameStateRef}
          playerKeys={player2Keys}
          otherPlayerState={() => gameStateRef.current.player1}
          onHit={handlePlayer2Hit}
          color="red"
          onGameEvent={handleGameEvent}
        />
        <SpecialEffects gameStateRef={gameStateRef} onEvent={handleGameEvent} />
      </Canvas>

      {/* Game Over Overlay */}
      {winner && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontSize: '2em',
          }}
        >
          {winner !== 0 && <div>Player {winner} Wins!</div>}
          <button onClick={resetGame} style={{ fontSize: '0.5em', padding: '0.5em 1em' }}>
            Play Again
          </button>
        </div>
      )}

      {/* Start Game Overlay */}
      {!gameActive && winner === null && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontSize: '3em',
            textAlign: 'center',
          }}
        >
          {gameStartCountdown > 0 ? (
            <div>{gameStartCountdown}</div>
          ) : (
            <div>
              Press Space to Start
              {showControls && (
                <div style={{ fontSize: '0.3em', marginTop: '20px' }}>
                  Player 1: WASD to move, G to attack, H to block, T for special, F to dash
                  <br />
                  Player 2: Arrow keys to move, / to attack, . to block, P for special, L to dash
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
