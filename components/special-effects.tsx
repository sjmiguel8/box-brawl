"use client"

import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, MathUtils } from 'three'
import type * as THREE from 'three'

type SpecialEffectsProps = {
  gameStateRef: React.MutableRefObject<{
    player1: any
    player2: any
    cameraShake: { active: boolean, intensity: number, duration: number }
    gameEffects: { type: string, position: Vector3, life: number, data: any }[]
  }>
  onEvent?: (event: string, data?: any) => void
}

export default function SpecialEffects({ gameStateRef, onEvent }: SpecialEffectsProps) {
  const lastSpecialTime = useRef(0)

  // Initialize effects array if not present
  useEffect(() => {
    if (!gameStateRef.current.gameEffects) {
      gameStateRef.current.gameEffects = []
    }
  }, [])

  // Create special attack effects
  const createSpecialEffect = (type: string, position: Vector3, playerFacing: boolean) => {
    const now = Date.now()
    if (now - lastSpecialTime.current < 500) return // Don't spam effects
    
    lastSpecialTime.current = now
    
    const direction = new Vector3(playerFacing ? 1 : -1, 0, 0)
    
    switch (type) {
      case 'tornado':
        // Create a series of wind projectiles
        for (let i = 0; i < 8; i++) {
          setTimeout(() => {
            const spread = (Math.random() - 0.5) * 0.3
            gameStateRef.current.gameEffects.push({
              type: 'projectile',
              position: new Vector3(position.x, position.y + spread, position.z),
              life: 30,
              data: {
                direction: new Vector3(direction.x, spread, 0),
                color: '#88CCFF',
                damage: 3
              }
            })
          }, i * 100)
        }
        
        // Final explosion effect
        setTimeout(() => {
          gameStateRef.current.gameEffects.push({
            type: 'explosion',
            position: new Vector3(position.x + direction.x * 3, position.y, position.z),
            life: 30,
            data: {
              size: 2,
              color: '#88CCFF'
            }
          })
          
          // Camera shake on explosion
          gameStateRef.current.cameraShake = {
            active: true,
            intensity: 0.08,
            duration: 10
          }
        }, 800)
        break
        
      case 'firewave':
        // Large fire wave
        gameStateRef.current.gameEffects.push({
          type: 'projectile',
          position: new Vector3(position.x, position.y, position.z),
          life: 60,
          data: {
            direction: direction,
            color: '#FF6600',
            damage: 10,
            size: 2
          }
        })
        
        // Add flames around the wave
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            gameStateRef.current.gameEffects.push({
              type: 'explosion',
              position: new Vector3(
                position.x + direction.x * (2 + i * 0.8), 
                position.y - 0.5 + Math.random(), 
                position.z
              ),
              life: 20,
              data: {
                size: 0.8 + Math.random() * 0.5,
                color: '#FF6600'
              }
            })
          }, i * 100)
        }
        break
        
      case 'iceblast':
        // Ice crystal projectiles
        for (let i = 0; i < 5; i++) {
          const spread = (i - 2) * 0.15
          gameStateRef.current.gameEffects.push({
            type: 'projectile',
            position: new Vector3(position.x, position.y + spread, position.z),
            life: 45,
            data: {
              direction: new Vector3(direction.x, spread, 0),
              color: '#AADDFF',
              damage: 5
            }
          })
        }
        
        // Freezing effect at end
        setTimeout(() => {
          gameStateRef.current.gameEffects.push({
            type: 'explosion',
            position: new Vector3(position.x + direction.x * 4, position.y, position.z),
            life: 40,
            data: {
              size: 2.5,
              color: '#AADDFF'
            }
          })
        }, 600)
        break
        
      case 'energyblast':
        // Energy beam
        gameStateRef.current.gameEffects.push({
          type: 'projectile',
          position: new Vector3(position.x, position.y, position.z),
          life: 50,
          data: {
            direction: direction,
            color: '#FFFF00',
            damage: 8
          }
        })
        
        // Explosion at impact
        setTimeout(() => {
          gameStateRef.current.gameEffects.push({
            type: 'explosion',
            position: new Vector3(position.x + direction.x * 5, position.y, position.z),
            life: 30,
            data: {
              size: 1.5,
              color: '#FFFF00'
            }
          })
        }, 500)
        break
    }
    
    // Notify of effect creation
    if (onEvent) {
      onEvent('specialEffect', { type, position })
    }
  }
  
  // Listen for events to create effects
  useEffect(() => {
    const handleGameEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ type: string; player: number }>
      if (customEvent.type === 'special' && customEvent.detail) {
        const { type, player } = customEvent.detail
        const playerState = player === 1 ? gameStateRef.current.player1 : gameStateRef.current.player2

        createSpecialEffect(
          type, 
          new Vector3(playerState.position.x, playerState.position.y + 0.5, playerState.position.z),
          playerState.facingRight
        )
      }
    }
    
    window.addEventListener('gameEvent', handleGameEvent)
    
    return () => {
      window.removeEventListener('gameEvent', handleGameEvent)
    }
  }, [gameStateRef, onEvent]) 
  
  // Update special effects
  useFrame((_, delta) => {
    const effects = gameStateRef.current.gameEffects
    for (let i = effects.length - 1; i >= 0; i--) {
      const effect = effects[i]
      effect.life -= delta
      
      if (effect.life <= 0) {
        effects.splice(i, 1)
      }
    }    
    gameStateRef.current.gameEffects = effects
  })
  
  return null
}