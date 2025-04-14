"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { Box, Text } from "@react-three/drei"
import type * as THREE from "three"
import { Vector3 } from "three"
import { useHelper } from "@react-three/drei"

// Constants
const MOVE_SPEED = 0.12
const JUMP_FORCE = 0.25
const GRAVITY = 0.01
const FRICTION = 0.9
const ATTACK_COOLDOWN = 15
const ATTACK_DURATION = 12
const ATTACK_DAMAGE = 8
const SPECIAL_DAMAGE = 25
const BLOCK_DAMAGE_REDUCTION = 0.7
const KNOCKBACK_FORCE = 0.2
const DASH_FORCE = 0.4
const DASH_COOLDOWN = 30
const SPECIAL_COST = 30
const STAMINA_REGEN = 0.5
const SPECIAL_REGEN = 0.2
const MAX_HEALTH = 100
const MAX_STAMINA = 100
const MAX_SPECIAL = 100
const COMBO_WINDOW = 30 // frames to perform a combo

// Types
type PlayerProps = {
  playerNum: number
  gameStateRef: React.MutableRefObject<{
    player1: PlayerState
    player2: PlayerState
    lastFrameTime: number
    cameraShake: { active: boolean, intensity: number, duration: number }
    platforms: { position: Vector3, size: Vector3 }[]
  }>
  playerKeys: {
    left: boolean
    right: boolean
    jump: boolean
    attack: boolean
    block: boolean
    special: boolean
    dash: boolean
  }
  otherPlayerState: () => PlayerState
  onHit: (damage: number, isSpecial: boolean) => void
  color: string
  onGameEvent: (event: string, data?: any) => void
}

export type PlayerState = { // Export the PlayerState type
  position: { x: number; y: number; z: number }
  velocity: { x: number; y: number; z: number }
  isAttacking: boolean
  isBlocking: boolean
  isDashing: boolean
  isSpecialAttack: boolean
  attackCooldown: number
  dashCooldown: number
  grounded: boolean
  facingRight: boolean
  health: number
  stamina: number
  specialMeter: number
  comboCounter: number
  comboTimer: number
  hitstun: number
  attackSequence: number[]
  lastMoveTime: number
}

type ParticleEffect = {
  position: Vector3
  life: number
  maxLife: number
  color: string
  size: number
  velocity: Vector3
}

export default function Player({ playerNum, gameStateRef, playerKeys, otherPlayerState, onHit, color, onGameEvent }: PlayerProps) {
  const playerRef = useRef<THREE.Group>(null)
  const torsoRef = useRef<THREE.Mesh>(null)
  const leftArmRef = useRef<THREE.Mesh>(null)
  const rightArmRef = useRef<THREE.Mesh>(null)
  const [particles, setParticles] = useState<ParticleEffect[]>([])
  
  // Enable hitbox helpers for development
  // useHelper(torsoRef, THREE.BoxHelper, 'red')

  // Get player state
  const getPlayerState = () => {
    return playerNum === 1 ? gameStateRef.current.player1 : gameStateRef.current.player2
  }

  // Set player state
  const setPlayerState = (newState: Partial<PlayerState>) => {
    if (playerNum === 1) {
      gameStateRef.current.player1 = { ...gameStateRef.current.player1, ...newState }
    } else {
      gameStateRef.current.player2 = { ...gameStateRef.current.player2, ...newState }
    }
  }

  // Add particle effect
  const addParticles = (position: Vector3, color: string, count: number = 10, size: number = 0.1) => {
    const newParticles: ParticleEffect[] = []
    
    for (let i = 0; i < count; i++) {
      newParticles.push({
        position: new Vector3(position.x, position.y, position.z),
        life: 20 + Math.random() * 20,
        maxLife: 40,
        color,
        size: size * (0.5 + Math.random()),
        velocity: new Vector3(
          (Math.random() - 0.5) * 0.1,
          Math.random() * 0.15,
          (Math.random() - 0.5) * 0.05
        )
      })
    }
    
    setParticles(prev => [...prev, ...newParticles])
  }

  // Create camera shake effect
  const shakeCamera = (intensity: number = 0.05, duration: number = 10) => {
    gameStateRef.current.cameraShake = { 
      active: true, 
      intensity, 
      duration 
    }
  }

  // Execute special attack based on combo
  const executeSpecialAttack = (player: PlayerState) => {
    // Different special attacks based on input sequence
    const sequence = player.attackSequence.join('')
    player.isSpecialAttack = true
    player.specialMeter -= SPECIAL_COST
    
    switch(sequence) {
      case '121': // Left, Right, Left combo
        // Tornado attack
        shakeCamera(0.08, 20)
        addParticles(new Vector3(player.position.x, player.position.y + 0.5, player.position.z), '#88CCFF', 30, 0.2)
        onGameEvent('special', { type: 'tornado', player: playerNum })
        break
      
      case '212': // Right, Left, Right combo
        // Fire wave
        shakeCamera(0.1, 15)
        addParticles(new Vector3(player.position.x, player.position.y + 0.5, player.position.z), '#FF6600', 25, 0.25)
        onGameEvent('special', { type: 'firewave', player: playerNum })
        break
        
      case '112': // Left, Left, Right combo
        // Ice blast
        shakeCamera(0.07, 12)
        addParticles(new Vector3(player.position.x, player.position.y + 0.5, player.position.z), '#AADDFF', 20, 0.3)
        onGameEvent('special', { type: 'iceblast', player: playerNum })
        break
        
      default:
        // Generic energy blast
        shakeCamera(0.06, 10)
        addParticles(new Vector3(player.position.x, player.position.y + 0.5, player.position.z), '#FFFF00', 15, 0.2)
        onGameEvent('special', { type: 'energyblast', player: playerNum })
    }
    
    setTimeout(() => {
      setPlayerState({ isSpecialAttack: false })
    }, ATTACK_DURATION * 25) // Special attacks last longer
  }

  // Check collision with platforms
  const checkPlatformCollisions = (player: PlayerState) => {
    const platforms = gameStateRef.current.platforms || []
    let onPlatform = false
    
    for (const platform of platforms) {
      const { position, size } = platform
      
      // Check if player is above platform and falling
      if (player.velocity.y <= 0 &&
          player.position.y >= position.y &&
          player.position.y <= position.y + size.y/2 + 0.2 &&
          Math.abs(player.position.x - position.x) < size.x/2 &&
          Math.abs(player.position.z - position.z) < size.z/2) {
        
        player.position.y = position.y + size.y/2 + 0.1
        player.velocity.y = 0
        player.grounded = true
        onPlatform = true
        break
      }
    }
    
    return onPlatform
  }

  // Initialize player
  useEffect(() => {
    if (playerRef.current) {
      const state = getPlayerState()
      playerRef.current.position.set(state.position.x, state.position.y, state.position.z)
      
      // Initialize player with full stats if not set yet
      if (state.health === undefined) {
        setPlayerState({
          health: MAX_HEALTH,
          stamina: MAX_STAMINA,
          specialMeter: 0,
          comboCounter: 0,
          comboTimer: 0,
          hitstun: 0,
          attackSequence: [],
          lastMoveTime: 0,
        })
      }
    }
  }, [])

  // Game loop
  useFrame((_, delta) => {
    const state = getPlayerState()
    const { left, right, jump, attack, block, special, dash } = playerKeys

    // Don't allow movement during hitstun
    const canMove = state.hitstun <= 0
    
    // Update combos and timers
    if (state.comboTimer > 0) state.comboTimer--
    if (state.hitstun > 0) state.hitstun--
    
    // Handle movement
    let velocityX = 0

    if (canMove) {
      if (left) {
        velocityX -= MOVE_SPEED
        // Track move for combo system
        if (state.lastMoveTime <= 0) {
          state.attackSequence.push(1) // 1 = left
          state.lastMoveTime = 20
          if (state.attackSequence.length > 3) state.attackSequence.shift()
        }
      }
      
      if (right) {
        velocityX += MOVE_SPEED
        // Track move for combo system
        if (state.lastMoveTime <= 0) {
          state.attackSequence.push(2) // 2 = right
          state.lastMoveTime = 20
          if (state.attackSequence.length > 3) state.attackSequence.shift()
        }
      }
      
      if (state.lastMoveTime > 0) state.lastMoveTime--
      
      // Handle dash
      if (dash && state.stamina >= 20 && state.dashCooldown <= 0 && !state.isAttacking) {
        state.isDashing = true
        state.dashCooldown = DASH_COOLDOWN
        state.stamina -= 20
        
        // Dash in facing direction
        const dashDir = state.facingRight ? 1 : -1
        state.velocity.x += dashDir * DASH_FORCE
        
        // Add dash effect
        addParticles(
          new Vector3(state.position.x - (dashDir * 0.5), state.position.y, state.position.z),
          '#FFFFFF',
          15,
          0.1
        )
        
        // End dash after short duration
        setTimeout(() => {
          setPlayerState({ isDashing: false })
        }, 200)
      }
    }

    // Apply velocity
    if (!state.isDashing || !canMove) {
      state.velocity.x = velocityX
    }
    state.velocity.y -= GRAVITY

    // Handle jumping
    if (jump && canMove && state.grounded && state.stamina >= 10) {
      state.velocity.y = JUMP_FORCE
      state.grounded = false
      state.stamina -= 10
      
      // Jump particles
      addParticles(
        new Vector3(state.position.x, state.position.y - 0.5, state.position.z),
        '#CCCCCC',
        8,
        0.08
      )
    }

    // Update position
    state.position.x += state.velocity.x
    state.position.y += state.velocity.y

    // Apply friction
    state.velocity.x *= FRICTION

    // Check ground collision
    if (state.position.y <= 1) {
      state.position.y = 1
      state.velocity.y = 0
      state.grounded = true
    } else {
      // Check platform collisions only if not on ground
      const onPlatform = checkPlatformCollisions(state)
      state.grounded = state.grounded || onPlatform
    }

    // Check wall boundaries
    if (state.position.x < -9) state.position.x = -9
    if (state.position.x > 9) state.position.x = 9

    // Update facing direction (only if moving)
    if (velocityX > 0.01) state.facingRight = true
    else if (velocityX < -0.01) state.facingRight = false

    // Handle attack
    if (attack && canMove && !state.isAttacking && state.attackCooldown <= 0 && state.stamina >= 15) {
      state.isAttacking = true
      state.attackCooldown = ATTACK_COOLDOWN
      state.stamina -= 15
      
      // Combo system
      if (state.comboTimer > 0) {
        state.comboCounter++
        // Add small bonus to special meter for combos
        state.specialMeter += 5
        
        // Visual feedback for combo
        if (typeof onGameEvent === 'function') {
          onGameEvent('combo', { count: state.comboCounter, player: playerNum })
        }
      } else {
        state.comboCounter = 1
      }
      
      // Reset combo timer
      state.comboTimer = COMBO_WINDOW

      // Check for hit
      setTimeout(() => {
        const playerState = getPlayerState()
        const opponent = otherPlayerState()

        // Only check hit if still attacking (not interrupted)
        if (playerState.isAttacking) {
          // Improved hit detection with directional awareness
          const distanceX = opponent.position.x - playerState.position.x
          const distanceY = Math.abs(opponent.position.y - playerState.position.y)
          const attackRange = 1.8
          
          const isInRange = Math.abs(distanceX) < attackRange && distanceY < 1.5
          const isDirectionCorrect = (playerState.facingRight && distanceX > 0) || 
                                     (!playerState.facingRight && distanceX < 0)
          
          if (isInRange && isDirectionCorrect) {
            // Calculate damage with combo multiplier
            let damage = ATTACK_DAMAGE * (1 + (playerState.comboCounter - 1) * 0.2)

            // Reduce damage if opponent is blocking
            if (opponent.isBlocking) {
              damage *= BLOCK_DAMAGE_REDUCTION
              // Still add some to special meter when blocked
              opponent.specialMeter += damage / 2
              
              // Block particles and sound
              addParticles(
                new Vector3(opponent.position.x, opponent.position.y + 0.5, opponent.position.z),
                '#FFFFFF',
                10,
                0.1
              )
              if (typeof onGameEvent === 'function') {
                onGameEvent('block', { player: playerNum === 1 ? 2 : 1 })
              }
            } else {
              // Hit particles and sound
              addParticles(
                new Vector3(opponent.position.x, opponent.position.y + 0.5, opponent.position.z),
                '#FF0000',
                15,
                0.15
              )
              if (typeof onGameEvent === 'function') {
                onGameEvent('hit', { player: playerNum === 1 ? 2 : 1, combo: playerState.comboCounter })
              }
              
              // Apply hitstun
              const opponentStateKey = playerNum === 1 ? "player2" : "player1"
              gameStateRef.current[opponentStateKey].hitstun = 10
              
              // Add to special meter
              playerState.specialMeter += damage / 3
              if (playerState.specialMeter > MAX_SPECIAL) playerState.specialMeter = MAX_SPECIAL
              
              // Small camera shake on hit
              shakeCamera(0.03, 5)
            }

            // Apply damage
            onHit(damage, false)

            // Apply knockback
            const knockbackDirection = playerState.facingRight ? 1 : -1
            const opponentStateKey = playerNum === 1 ? "player2" : "player1"
            const knockbackMultiplier = 1 + (playerState.comboCounter - 1) * 0.1

            gameStateRef.current[opponentStateKey].velocity.x = 
              knockbackDirection * KNOCKBACK_FORCE * knockbackMultiplier
            
            // Add small vertical knockback
            if (playerState.comboCounter > 2) {
              gameStateRef.current[opponentStateKey].velocity.y = 0.1
            }
          }
        }
      }, 100) // Hit detection happens slightly after attack starts

      // End attack after duration
      setTimeout(() => {
        setPlayerState({ isAttacking: false })
      }, ATTACK_DURATION * 16.67) // Convert frames to ms (assuming 60fps)
    }

    // Handle special attack
    if (special && canMove && !state.isAttacking && !state.isSpecialAttack && 
        state.specialMeter >= SPECIAL_COST) {
      executeSpecialAttack(state)
      
      // Check for special hit
      setTimeout(() => {
        const playerState = getPlayerState()
        const opponent = otherPlayerState()
        
        // Wider hit range for special attacks
        const distanceX = Math.abs(opponent.position.x - playerState.position.x)
        const distanceY = Math.abs(opponent.position.y - playerState.position.y)
        
        if (distanceX < 3.5 && distanceY < 2) {
          let damage = SPECIAL_DAMAGE
          
          if (opponent.isBlocking) {
            damage *= BLOCK_DAMAGE_REDUCTION
            if (typeof onGameEvent === 'function') {
              onGameEvent('specialBlocked', { player: playerNum === 1 ? 2 : 1 })
            }
          } else {
            // Special attack hit effects
            addParticles(
              new Vector3(opponent.position.x, opponent.position.y, opponent.position.z),
              '#FFFF00',
              30,
              0.25
            )
            
            // Apply longer hitstun
            const opponentStateKey = playerNum === 1 ? "player2" : "player1"
            gameStateRef.current[opponentStateKey].hitstun = 20
            
            // Strong knockback
            const knockbackDirection = playerState.facingRight ? 1 : -1
            gameStateRef.current[opponentStateKey].velocity.x = knockbackDirection * KNOCKBACK_FORCE * 2
            gameStateRef.current[opponentStateKey].velocity.y = 0.15
            
            // Camera shake on special hit
            shakeCamera(0.1, 15)
            
            if (typeof onGameEvent === 'function') {
              onGameEvent('specialHit', { player: playerNum === 1 ? 2 : 1 })
            }
          }
          
          // Apply damage
          onHit(damage, true)
        }
      }, 200)
    }

    // Handle block
    state.isBlocking = block && canMove
    
    // Stamina regeneration
    if (!state.isAttacking && !state.isDashing && state.stamina < MAX_STAMINA) {
      state.stamina += STAMINA_REGEN
      if (state.stamina > MAX_STAMINA) state.stamina = MAX_STAMINA
    }
    
    // Special meter regeneration
    if (state.specialMeter < MAX_SPECIAL) {
      state.specialMeter += SPECIAL_REGEN
      if (state.specialMeter > MAX_SPECIAL) state.specialMeter = MAX_SPECIAL
    }

    // Update cooldowns
    if (state.attackCooldown > 0) {
      state.attackCooldown--
    }
    
    if (state.dashCooldown > 0) {
      state.dashCooldown--
    }

    // Update player position
    if (playerRef.current) {
      playerRef.current.position.set(state.position.x, state.position.y, state.position.z)

      // Update player rotation based on facing direction
      playerRef.current.rotation.y = state.facingRight ? 0 : Math.PI
    }

    // Update arm animations
    if (leftArmRef.current && rightArmRef.current) {
      if (state.isAttacking) {
        // Attack animation
        const attackProgress = Math.min(1, state.attackCooldown / ATTACK_DURATION)
        const attackAngle = Math.sin(attackProgress * Math.PI) * 1.8
        
        // Different attack animation based on combo count
        if (state.comboCounter <= 1) {
          // Basic punch
          if (state.facingRight) {
            rightArmRef.current.rotation.x = -attackAngle
            leftArmRef.current.rotation.x = 0
          } else {
            leftArmRef.current.rotation.x = -attackAngle
            rightArmRef.current.rotation.x = 0
          }
        } else if (state.comboCounter === 2) {
          // Cross punch (both arms)
          rightArmRef.current.rotation.x = -attackAngle
          leftArmRef.current.rotation.x = -attackAngle * 0.7
        } else {
          // Uppercut
          if (state.facingRight) {
            rightArmRef.current.rotation.x = -attackAngle * 1.2
            rightArmRef.current.rotation.z = attackAngle * 0.5
          } else {
            leftArmRef.current.rotation.x = -attackAngle * 1.2
            leftArmRef.current.rotation.z = -attackAngle * 0.5
          }
        }
      } else if (state.isSpecialAttack) {
        // Special attack animation - both arms forward with shaking
        const shakeX = (Math.random() - 0.5) * 0.2
        const shakeY = (Math.random() - 0.5) * 0.2
        
        leftArmRef.current.rotation.x = -1.2 + shakeX
        rightArmRef.current.rotation.x = -1.2 + shakeY
        leftArmRef.current.rotation.z = 0.3 + shakeX
        rightArmRef.current.rotation.z = -0.3 + shakeY
      } else if (state.isBlocking) {
        // Block animation - cross arms in front
        leftArmRef.current.rotation.x = -0.8
        rightArmRef.current.rotation.x = -0.8
        leftArmRef.current.rotation.z = -0.3
        rightArmRef.current.rotation.z = 0.3
      } else if (state.isDashing) {
        // Dash animation - arms back
        leftArmRef.current.rotation.x = 1
        rightArmRef.current.rotation.x = 1
      } else if (state.hitstun > 0) {
        // Hitstun animation - flinch
        leftArmRef.current.rotation.x = 0.5
        rightArmRef.current.rotation.x = 0.5
      } else {
        // Reset arm positions with slight idle animation
        const idleWave = Math.sin(Date.now() / 500) * 0.1
        leftArmRef.current.rotation.x = idleWave
        rightArmRef.current.rotation.z = 0
        rightArmRef.current.rotation.x = -idleWave
        rightArmRef.current.rotation.z = 0
      }
    }
    
    // Update particles
    setParticles(prev => 
      prev
        .map(p => ({
          ...p,
          life: p.life - 1,
          position: new Vector3(
            isNaN(p.position.x) ? 0 : p.position.x,
            isNaN(p.position.y) ? 0 : p.position.y,
            isNaN(p.position.z) ? 0 : p.position.z
          ).add(p.velocity),
          velocity: p.velocity.setY(p.velocity.y - 0.003) // Apply gravity to particles
        }))
        .filter(p => p.life > 0)
    )
  })

  return (
    <group ref={playerRef}>
      {/* Torso */}
      <Box 
        ref={torsoRef} 
        args={[0.8, 1.2, 0.5]} 
        position={[0, 0.6, 0]} 
        castShadow 
        receiveShadow
      >
        <meshStandardMaterial 
          color={getPlayerState().isBlocking ? "#ffffff" : 
                 getPlayerState().isSpecialAttack ? "#ffff00" : 
                 getPlayerState().hitstun > 0 ? "#ff8888" : 
                 color} 
          roughness={0.5} 
          emissive={getPlayerState().isSpecialAttack ? "#ffaa00" : "#000000"}
          emissiveIntensity={getPlayerState().isSpecialAttack ? 0.5 : 0}
        />
      </Box>

      {/* Head */}
      <Box 
        args={[0.6, 0.6, 0.6]} 
        position={[0, 1.5, 0]} 
        castShadow 
        receiveShadow
      >
        <meshStandardMaterial 
          color={color} 
          roughness={0.5} 
          emissive={getPlayerState().isSpecialAttack ? "#ffaa00" : "#000000"}
          emissiveIntensity={getPlayerState().isSpecialAttack ? 0.3 : 0}
        />
      </Box>

      {/* Left Arm */}
      <Box 
        ref={leftArmRef} 
        args={[0.3, 0.8, 0.3]} 
        position={[-0.55, 0.6, 0]} 
        castShadow 
        receiveShadow
      >
        <meshStandardMaterial 
          color={getPlayerState().isAttacking && !getPlayerState().facingRight ? "#ffcc00" : color} 
          roughness={0.5}
          emissive={getPlayerState().isSpecialAttack ? "#ffaa00" : "#000000"}
          emissiveIntensity={getPlayerState().isSpecialAttack ? 0.5 : 0}
        />
      </Box>

      {/* Right Arm */}
      <Box 
        ref={rightArmRef} 
        args={[0.3, 0.8, 0.3]} 
        position={[0.55, 0.6, 0]} 
        castShadow 
        receiveShadow
      >
        <meshStandardMaterial 
          color={getPlayerState().isAttacking && getPlayerState().facingRight ? "#ffcc00" : color} 
          roughness={0.5}
          emissive={getPlayerState().isSpecialAttack ? "#ffaa00" : "#000000"}
          emissiveIntensity={getPlayerState().isSpecialAttack ? 0.5 : 0}
        />
      </Box>

      {/* Left Leg */}
      <Box 
        args={[0.3, 0.8, 0.3]} 
        position={[-0.25, -0.4, 0]} 
        castShadow 
        receiveShadow
      >
        <meshStandardMaterial color={color} roughness={0.5} />
      </Box>

      {/* Right Leg */}
      <Box 
        args={[0.3, 0.8, 0.3]} 
        position={[0.25, -0.4, 0]} 
        castShadow 
        receiveShadow
      >
        <meshStandardMaterial color={color} roughness={0.5} />
      </Box>

      {/* Special attack effect */}
      {getPlayerState().isSpecialAttack && (
        <group>
          <pointLight
            position={[0, 1, 0]}
            color={getPlayerState().attackSequence.join('') === '121' ? '#88CCFF' : 
                   getPlayerState().attackSequence.join('') === '212' ? '#FF6600' : 
                   getPlayerState().attackSequence.join('') === '112' ? '#AADDFF' : '#FFFF00'}
            intensity={5}
            distance={3}
            decay={2}
          />
          <Box
            args={[1.5, 1.5, 1.5]}
            position={[getPlayerState().facingRight ? 1 : -1, 0.5, 0]}
          >
            <meshBasicMaterial 
              color={getPlayerState().attackSequence.join('') === '121' ? '#88CCFF' : 
                     getPlayerState().attackSequence.join('') === '212' ? '#FF6600' : 
                     getPlayerState().attackSequence.join('') === '112' ? '#AADDFF' : '#FFFF00'}
              transparent={true}
              opacity={0.6}
            />
          </Box>
        </group>
      )}

      {/* Combo counter display */}
      {getPlayerState().comboCounter > 1 && getPlayerState().comboTimer > 0 && (
        <Text
          position={[0, 2.3, 0]}
          color="white"
          fontSize={0.3}
          outlineWidth={0.05}
          outlineColor="#000000"
          anchorX="center"
          anchorY="middle"
        >
          {`${getPlayerState().comboCounter}x`}
        </Text>
      )}
      
      {/* Status bars holder - repositioned based on player */}
      <group position={[playerNum === 1 ? -0.5 : 0.5, 2.5, 0]}>
        {/* Health bar */}
        <Box
          args={[1, 0.1, 0.1]}
          position={[0, 0, 0]}
        >
          <meshBasicMaterial color="#333333" />
        </Box>
        <Box
          args={[Math.max(0.01, getPlayerState().health / MAX_HEALTH) * 0.98, 0.08, 0.11]}
          position={[-(1 - (getPlayerState().health / MAX_HEALTH)) * 0.5, 0, 0]}
        >
          <meshBasicMaterial color="#FF0000" />
        </Box>
        
        {/* Stamina bar */}
        <Box
          args={[1, 0.1, 0.1]}
          position={[0, -0.15, 0]}
        >
          <meshBasicMaterial color="#333333" />
        </Box>
        <Box
          args={[Math.max(0.01, getPlayerState().stamina / MAX_STAMINA) * 0.98, 0.08, 0.11]}
          position={[-(1 - (getPlayerState().stamina / MAX_STAMINA)) * 0.5, -0.15, 0]}
        >
          <meshBasicMaterial color="#00FF00" />
        </Box>
        
        {/* Special meter */}
        <Box
          args={[1, 0.1, 0.1]}
          position={[0, -0.3, 0]}
        >
          <meshBasicMaterial color="#333333" />
        </Box>
        <Box
          args={[Math.max(0.01, getPlayerState().specialMeter / MAX_SPECIAL) * 0.98, 0.08, 0.11]}
          position={[-(1 - (getPlayerState().specialMeter / MAX_SPECIAL)) * 0.5, -0.3, 0]}
        >
          <meshBasicMaterial color="#FFFF00" />
        </Box>
      </group>
      
      {/* Particle effects system */}
      {particles.map((particle, i) => (
        <Box
          key={i}
          args={[particle.size, particle.size, particle.size]}
          position={particle.position}
        >
          <meshBasicMaterial 
            color={particle.color}
            transparent={true}
            opacity={(particle.life / particle.maxLife) * 0.8}
          />
        </Box>
      ))}
    </group>
  )
}
