"use client";

import { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useGLTF, Environment, Float, PresentationControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';

function Model() {
  const { scene } = useGLTF('/iphone_17_pro_max.glb');
  const texture = useTexture('/cipherscope_banner.png');

  // Configure texture properties for GLTF/three.js compatibility
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;

  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const material = child.material as THREE.MeshStandardMaterial;
      
      // Target the screen mesh material
      if (material && material.name === "Material.001") {
        material.map = texture;
        material.emissiveMap = texture;
        material.emissive = new THREE.Color(0xffffff);
        material.emissiveIntensity = 1.0;
        material.roughness = 0.1;
        material.metalness = 0.1;
        material.needsUpdate = true;
      }
      
      // Hide the glass/cover mesh
      if (material && material.name === "Material.019") {
        material.visible = false;
      }
    }
  });

  return <primitive object={scene} scale={1.25} position={[0, -1.2, 0]} />;
}

export default function PhoneModel() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
            polar={[-0.4, 0.4]} 
            azimuth={[-1, 1]} 
            snap
          >
            <Float rotationIntensity={0.3} floatIntensity={0.5} speed={1.5}>
              <Model />
            </Float>
          </PresentationControls>
        </Suspense>
      </Canvas>
    </div>
  );
}
