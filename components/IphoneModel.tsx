"use client";

import React, { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { MotionValue } from "framer-motion";

export function IphoneModel({ progress }: { progress?: MotionValue<number> }) {
  const { scene } = useGLTF("/iphone_14_pro.glb");
  const modelRef = useRef<THREE.Group>(null);

  // Zoom into the phone screen based on scroll progress
  useFrame(() => {
    if (modelRef.current && progress) {
      const p = progress.get(); // 0 to 1
      
      // Uniformly scale the phone up exponentially so it stays perfectly 1:1
      // Initial scale is 32. At p=1, scale reaches ~4000.
      const currentScale = 32 + Math.pow(p, 4) * 4000;
      modelRef.current.scale.set(currentScale, currentScale, currentScale);

      // Keep it fixed perfectly facing the camera
      modelRef.current.rotation.y = 0;
      modelRef.current.rotation.x = 0;
    }
  });

  return (
    // Keep the main group strictly at the origin
    <group ref={modelRef} position={[0, 0, 0]}>
      {/* Offset the primitive so the exact center of the screen is at [0,0,0] */}
      {/* -0.5 divided by 32 base scale = -0.015625 */}
      <primitive object={scene} position={[0, -0.015625, 0]} />
    </group>
  );
}

// Preload the model asset
useGLTF.preload("/iphone_14_pro.glb");
