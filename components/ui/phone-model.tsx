"use client";

import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Environment, Float, PresentationControls } from '@react-three/drei';

function Model() {
  const { scene } = useGLTF('/iphone_17_pro_max.glb');
  return <primitive object={scene} scale={1.8} position={[0, -2, 0]} />;
}

export default function PhoneModel() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-full h-[600px]" />; // Prevents layout shift

  return (
    <div className="w-full h-[600px] flex items-center justify-center cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [0, 0, 10], fov: 35 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={1.5} />
          <Environment preset="city" />
          <PresentationControls 
            global 
            rotation={[0.1, 0.1, 0]} 
            polar={[-0.4, 0.2]} 
            azimuth={[-1, 0.75]} 
            snap
          >
            <Float rotationIntensity={0.4} floatIntensity={2} speed={1.5}>
              <Model />
            </Float>
          </PresentationControls>
        </Suspense>
      </Canvas>
    </div>
  );
}
