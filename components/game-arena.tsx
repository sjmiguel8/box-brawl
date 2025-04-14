"use client"

import { useRef, useState, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { Box, Plane, useTexture, Environment, Sky, Text } from "@react-three/drei"
import { Vector3 } from "three"
import type * as THREE from "three"

type GameArenaProps = {
  gameStateRef: React.MutableRefObject<{
    player1: any
    player2: any
    lastFrameTime: number
    cameraShake: { active: boolean, intensity: number, duration: number }
    platforms: { position: Vector3, size: Vector3 }[]
    gameEffects: { type: string, position: Vector3, life: number, data: any }[]
  }>
  arenaType?: 'dojo' | 'temple' | 'arena' | 'volcano'
}

export default function GameArena({ gameStateRef, arenaType = 'dojo' }: GameArenaProps) {
  const groupRef = useRef<THREE.Group>(null)
  const cameraRef = useRef<THREE.Camera>(null)
  const [effects, setEffects] = useState<any[]>([])
  
  // Environment settings based on arena type
  const environmentSettings = {
    dojo: {
      floorColor: "#8B4513",
      wallColor: "#D2B48C",
      lightIntensity: 1,
      skyColor: "#87CEEB"
    },
    temple: { 
      floorColor: "#A9A9A9",
      wallColor: "#696969",
      lightIntensity: 0.8,
      skyColor: "#4682B4"
    },
    arena: {
      floorColor: "#CD853F",
      wallColor: "#DEB887",
      lightIntensity: 1.2,
      skyColor: "#00BFFF"
    },
    volcano: {
      floorColor: "#8B0000",
      wallColor: "#A52A2A",
      lightIntensity: 0.9,
      skyColor: "#FF4500"
    }
  }
  
  const settings = environmentSettings[arenaType]
  
  // Setup the arena platforms
  useEffect(() => {
    const platforms = []
    
    // Main floor is handled separately
    
    // Create different platform layouts based on arena type
    if (arenaType === 'dojo') {
      // Simple dojo layout with one central elevated platform
      platforms.push({ 
        position: new Vector3(0, 2, -1), 
        size: new Vector3(6, 0.5, 3) 
      })
    } else if (arenaType === 'temple') {
      // Temple with multiple platforms
      platforms.push({ 
        position: new Vector3(-5, 3, -1), 
        size: new Vector3(3, 0.5, 2) 
      })
      platforms.push({ 
        position: new Vector3(5, 3, -1), 
        size: new Vector3(3, 0.5, 2) 
      })
      platforms.push({ 
        position: new Vector3(0, 5, -1), 
        size: new Vector3(4, 0.5, 2) 
      })
    } else if (arenaType === 'arena') {
      // Arena with symmetrical platforms
      platforms.push({ 
        position: new Vector3(-6, 2, -1), 
        size: new Vector3(2, 0.5, 3) 
      })
      platforms.push({ 
        position: new Vector3(6, 2, -1), 
        size: new Vector3(2, 0.5, 3) 
      })
      platforms.push({ 
        position: new Vector3(0, 3.5, -1), 
        size: new Vector3(4, 0.5, 2) 
      })
    } else if (arenaType === 'volcano') {
      // Volcano with unstable platforms
      platforms.push({ 
        position: new Vector3(-4, 2.5, -1), 
        size: new Vector3(3, 0.5, 2) 
      })
      platforms.push({ 
        position: new Vector3(4, 2.5, -1), 
        size: new Vector3(3, 0.5, 2) 
      })
      platforms.push({ 
        position: new Vector3(0, 4, -1), 
        size: new Vector3(2, 0.5, 2) 
      })
    }
    
    // Store platforms in game state
    gameStateRef.current.platforms = platforms
  }, [arenaType])
  
  // Initialize game effects if not present
  useEffect(() => {
    if (!gameStateRef.current.gameEffects) {
      gameStateRef.current.gameEffects = []
    }
  }, [])
  
  // Handle camera shake and environmental effects
  useFrame((state, delta) => {
    // Camera shake effect
    if (gameStateRef.current.cameraShake?.active) {
      const { intensity, duration } = gameStateRef.current.cameraShake
      
      if (duration > 0) {
        state.camera.position.x += (Math.random() - 0.5) * intensity
        state.camera.position.y += (Math.random() - 0.5) * intensity
        gameStateRef.current.cameraShake.duration--
      } else {
        gameStateRef.current.cameraShake.active = false
        // Reset camera position
        state.camera.position.x = 0
        state.camera.position.y = 9
        state.camera.position.z = 10
      }
    }
    
    // Update game effects
    if (gameStateRef.current.gameEffects) {
      gameStateRef.current.gameEffects = gameStateRef.current.gameEffects
        .map(effect => ({
          ...effect,
          life: effect.life - 1,
          position: effect.type === 'projectile' 
            ? new Vector3(
                effect.position.x + effect.data.direction.x * 0.2,
                effect.position.y + effect.data.direction.y * 0.05,
                effect.position.z
              )
            : effect.position
        }))
        .filter(effect => effect.life > 0)
      
      // Update local effects state for rendering
      setEffects([...gameStateRef.current.gameEffects])
    }
    
    // Volcano specific effects
    if (arenaType === 'volcano' && Math.random() < 0.01) {
      // Random lava bubbles
      const burstPosition = new Vector3(
        (Math.random() - 0.5) * 18,
        0.2,
        (Math.random() - 0.5) * 5
      )
      
      gameStateRef.current.gameEffects.push({
        type: 'lavaBurst',
        position: burstPosition,
        life: 30 + Math.floor(Math.random() * 30),
        data: {
          size: 0.2 + Math.random() * 0.3
        }
      })
    }
  })
  
  // Render arena elements
  return (
    <group ref={groupRef}>
      {/* Main lighting */}
      <ambientLight intensity={settings.lightIntensity * 0.5} />
      <directionalLight 
        position={[5, 10, 5]} 
        intensity={settings.lightIntensity} 
        castShadow 
        shadow-mapSize={[2048, 2048]}
      />
      
      {/* Sky */}
      <Sky 
        distance={450} 
        sunPosition={[5, 1, 8]} 
        inclination={0.5}
        turbidity={arenaType === 'volcano' ? 10 : 8}
        rayleigh={arenaType === 'volcano' ? 3 : 1}
      />

      {/* Main floor */}
      <Plane 
        args={[20, 10]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial 
          color={settings.floorColor} 
          roughness={0.8}
          metalness={0.2}
        />
      </Plane>
      
      {/* Back wall */}
      <Plane
        args={[20, 10]}
        position={[0, 5, -5]}
        receiveShadow
      >
        <meshStandardMaterial 
          color={settings.wallColor}
          roughness={0.7}
        />
      </Plane>
      
      {/* Platforms */}
      {gameStateRef.current.platforms?.map((platform, index) => (
        <Box
          key={index}
          args={[platform.size.x, platform.size.y, platform.size.z]}
          position={platform.position}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial 
            color={arenaType === 'volcano' ? '#A52A2A' : '#8B4513'} 
            roughness={0.8} 
          />
        </Box>
      ))}
      
      {/* Decorative elements based on arena type */}
      {arenaType === 'dojo' && (
        <>
          {/* Dojo style pillars */}
          <Box
            args={[1, 8, 1]}
            position={[-9, 4, -4.5]}
            castShadow
          >
            <meshStandardMaterial color="#8B4513" />
          </Box>
          <Box
            args={[1, 8, 1]}
            position={[9, 4, -4.5]}
            castShadow
          >
            <meshStandardMaterial color="#8B4513" />
          </Box>
          
          {/* Dojo sign */}
          <Text
            position={[0, 8, -4.8]}
            rotation={[0, 0, 0]}
            fontSize={1}
            color="#8B0000"
            anchorX="center"
            anchorY="middle"
          >
            DOJO
          </Text>
        </>
      )}
      
      {arenaType === 'temple' && (
        <>
          {/* Temple statues */}
          <Box
            args={[1, 2, 1]}
            position={[-8, 1, -4]}
            castShadow
          >
            <meshStandardMaterial color="#696969" />
          </Box>
          <Box
            args={[1, 2, 1]}
            position={[8, 1, -4]}
            castShadow
          >
            <meshStandardMaterial color="#696969" />
          </Box>
          
          {/* Temple torches */}
          <pointLight position={[-8, 3, -4]} intensity={0.8} color="#FF4500" distance={5} />
          <pointLight position={[8, 3, -4]} intensity={0.8} color="#FF4500" distance={5} />
        </>
      )}
      
      {arenaType === 'arena' && (
        <>
          {/* Arena audience stands (simplified) */}
          <Box
            args={[20, 1, 3]}
            position={[0, 1, -8]}
            castShadow
          >
            <meshStandardMaterial color="#A9A9A9" />
          </Box>
          
          {/* Arena spotlights */}
          <spotLight 
            position={[-10, 10, 0]} 
            angle={0.3} 
            intensity={0.8}
            penumbra={0.5}
            target-position={[0, 0, 0]}
          />
          <spotLight 
            position={[10, 10, 0]} 
            angle={0.3} 
            intensity={0.8}
            penumbra={0.5}
            target-position={[0, 0, 0]}
          />
        </>
      )}
      
      {arenaType === 'volcano' && (
        <>
          {/* Lava pool */}
          <Plane
            args={[18, 8]}
            position={[0, 0.1, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <meshStandardMaterial 
              color="#FF4500" 
              emissive="#FF0000"
              emissiveIntensity={0.5}
            />
          </Plane>
          
          {/* Volcanic rocks */}
          <Box
            args={[2, 3, 2]}
            position={[-7, 1.5, -3]}
            castShadow
          >
            <meshStandardMaterial color="#303030" />
          </Box>
          <Box
            args={[2, 2, 2]}
            position={[7, 1, -3]}
            castShadow
          >
            <meshStandardMaterial color="#303030" />
          </Box>
          
          {/* Lava light */}
          <pointLight position={[0, 0.5, 0]} intensity={1} color="#FF4500" distance={15} />
        </>
      )}
      
      {/* Game effects rendering */}
      {effects.map((effect, index) => {
        if (effect.type === 'projectile') {
          return (
            <group key={index} position={effect.position}>
              <pointLight color={effect.data.color} intensity={3} distance={4} />
              <Box args={[0.5, 0.5, 0.5]}>
                <meshBasicMaterial 
                  color={effect.data.color} 
                  transparent={true}
                  opacity={effect.life / 30}
                />
              </Box>
            </group>
          )
        } else if (effect.type === 'explosion') {
          return (
            <group key={index} position={effect.position}>
              <pointLight color={effect.data.color} intensity={5 * (effect.life / 30)} distance={8} />
              <Box args={[effect.data.size * (30 - effect.life) / 10, effect.data.size * (30 - effect.life) / 10, effect.data.size * (30 - effect.life) / 10]}>
                <meshBasicMaterial 
                  color={effect.data.color}
                  transparent={true}
                  opacity={effect.life / 30}
                />
              </Box>
            </group>
          )
        } else if (effect.type === 'lavaBurst') {
          return (
            <group key={index} position={effect.position}>
              <pointLight color="#FF4500" intensity={2} distance={3} />
              <Box args={[effect.data.size, effect.data.size, effect.data.size]}>
                <meshBasicMaterial 
                  color="#FF4500"
                  emissive="#FF0000"
                  emissiveIntensity={0.8}
                  transparent={true}
                  opacity={effect.life / 60}
                />
              </Box>
            </group>
          )
        }
        return null
      })}
    </group>
  )
}
