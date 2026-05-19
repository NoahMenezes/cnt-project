"use client";

import React, { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function IphoneModel() {
  const { scene } = useGLTF("/iphone_14_pro.glb");
  const modelRef = useRef<THREE.Group>(null);

  // Slow rotation for visual dynamic effect (right to left)
  useFrame((state) => {
    if (modelRef.current) {
      modelRef.current.rotation.y = -state.clock.getElapsedTime() * 0.25;
    }
  });

  return (
    <group ref={modelRef} scale={32} position={[0, -0.5, 0]}>
      <primitive object={scene} />
    </group>
  );
}

// Preload the model asset
useGLTF.preload("/iphone_14_pro.glb");
