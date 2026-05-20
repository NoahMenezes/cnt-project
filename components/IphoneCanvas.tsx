"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import { IphoneModel } from "./IphoneModel";
import { MotionValue } from "motion/react";

export function IphoneCanvas({ progress }: { progress?: MotionValue<number> }) {
  return (
    <div className="w-full h-screen relative flex items-center justify-center">
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm font-medium">
          Loading 3D Model...
        </div>
      }>
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
          <directionalLight position={[-10, 10, 5]} intensity={1.0} />
          
          <IphoneModel progress={progress} />
          
          <Environment preset="city" />
          
          <ContactShadows 
            position={[0, -4.5, 0]} 
            opacity={0.6} 
            scale={10} 
            blur={2.5} 
            far={4.5} 
          />
        </Canvas>
      </Suspense>
    </div>
  );
}
