"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Box } from "@react-three/drei"
import type * as THREE from "three"

export default function Arena() {
  const arenaRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (arenaRef.current) {
      // Optional: Add subtle arena animations here
    }
  })

  return (
    <group ref={arenaRef}>
      {/* Ground */}
      <Box args={[20, 0.5, 10]} position={[0, -0.25, 0]} receiveShadow>
        <meshStandardMaterial color="#95a5a6" roughness={0.8} />
      </Box>

      {/* Boundary walls */}
      {/* Left wall */}
      <Box args={[0.5, 2, 10]} position={[-10.25, 1, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#7f8c8d" roughness={0.5} />
      </Box>

      {/* Right wall */}
      <Box args={[0.5, 2, 10]} position={[10.25, 1, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#7f8c8d" roughness={0.5} />
      </Box>

      {/* Back wall */}
      <Box args={[20, 2, 0.5]} position={[0, 1, -5.25]} castShadow receiveShadow>
        <meshStandardMaterial color="#7f8c8d" roughness={0.5} />
      </Box>

      {/* Front wall */}
      <Box args={[20, 2, 0.5]} position={[0, 1, 5.25]} castShadow receiveShadow>
        <meshStandardMaterial color="#7f8c8d" roughness={0.5} />
      </Box>

      {/* Arena decorations */}
      {/* Corner pillars */}
      {[
        [-9.5, 1, -4.5],
        [-9.5, 1, 4.5],
        [9.5, 1, -4.5],
        [9.5, 1, 4.5],
      ].map((pos, i) => (
        <Box key={i} args={[1, 3, 1]} position={pos as [number, number, number]} castShadow receiveShadow>
          <meshStandardMaterial color="#34495e" roughness={0.3} metalness={0.5} />
        </Box>
      ))}

      {/* Center circle */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[1.8, 2, 32]} />
        <meshStandardMaterial color="#e67e22" roughness={0.5} />
      </mesh>
    </group>
  )
}
