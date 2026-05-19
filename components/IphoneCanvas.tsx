"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import { IphoneModel } from "./IphoneModel";

export function IphoneCanvas() {
  return (
    <div className="w-full h-[550px] md:h-[650px] relative flex items-center justify-center">
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm font-medium">
          Loading 3D Model...
        </div>
      }>
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} castShadow />
          <directionalLight position={[-10, 10, 5]} intensity={1.0} />
          
          <IphoneModel />
          
          <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.8}
          />
          
          <Environment preset="city" />
          
          <ContactShadows 
            position={[0, -5.0, 0]} 
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
