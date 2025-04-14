import * as THREE from 'three';
import { useMemo } from 'react';
import { extend, useFrame } from '@react-three/fiber';

// Shader source (replace with your actual shader code)
const vertexShader = `
  uniform float time;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 transformed = position;
    transformed.x += sin(time * 1.0) * 0.1;
    transformed.y += cos(time * 1.0) * 0.1;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`;

const fragmentShader = `
  uniform vec3 color;
  uniform float time;
  varying vec2 vUv;
  void main() {
    vec3 col = color * sin(vUv.x * time * 5.0) ;
    gl_FragColor = vec4(col, 1.0);
  }
`;

extend({
  CustomMaterial: class extends THREE.ShaderMaterial {
    constructor() {
      super({
        vertexShader,
        fragmentShader,
        uniforms: {
          time: { value: 0.0 },
          color: { value: new THREE.Color('hotpink') },
        },
      });
    }
  },
});

function CustomMaterial({ color }) {
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      time: { value: 0.0 },
      color: { value: new THREE.Color(color) },
    },
  }), [color]);

  useFrame((state) => {
    material.uniforms.time.value = state.clock.getElapsedTime();
  });

  return <primitive object={material} dispose={null} />;
}

export default CustomMaterial;
