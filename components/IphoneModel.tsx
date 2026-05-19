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
      
      // Move the phone towards the camera (camera is at z=10).
      // Max z is ~9.8 so it completely fills the screen without clipping the camera.
      // Easing the movement slightly so it starts slow and accelerates
      const easeP = p * p;
      modelRef.current.position.z = easeP * 9.5;
      
      // Center the phone perfectly vertically as it comes closer
      modelRef.current.position.y = -0.5 + (easeP * 0.5);

      // Keep it fixed facing the camera
      modelRef.current.rotation.y = 0;
      modelRef.current.rotation.x = 0;
    }
  });

  return (
    <group ref={modelRef} scale={32} position={[0, -5.0, 0]}>
      <primitive object={scene} />
    </group>
  );
}

// Preload the model asset
useGLTF.preload("/iphone_14_pro.glb");
