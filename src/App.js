import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import CustomMaterial from './components/CustomMaterial';

function Box() {
  const mesh = useRef();

  return (
    <mesh ref={mesh}>
      <boxGeometry args={[1, 1, 1]} />
      <CustomMaterial color="hotpink" />
    </mesh>
  );
}

function App() {
  return (
    <Canvas>
      <ambientLight />
      <pointLight position={[10, 10, 10]} />
      <Box />
    </Canvas>
  );
}

export default App;
