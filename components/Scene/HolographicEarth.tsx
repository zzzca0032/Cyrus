import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { InteractionState, ContinentData } from '../../types';

interface HolographicEarthProps {
  interactionState: React.MutableRefObject<InteractionState>;
  onContinentChange: (data: ContinentData) => void;
}

const CONTINENTS: { range: [number, number]; data: ContinentData }[] = [
  { range: [300, 360], data: { name: 'NORTH AMERICA', code: 'NA-01', activity: 'HIGH', population: '592M' } },
  { range: [0, 60], data: { name: 'EUROPE / AFRICA', code: 'EU-AF', activity: 'MODERATE', population: '2.1B' } },
  { range: [60, 150], data: { name: 'ASIA', code: 'AS-01', activity: 'CRITICAL', population: '4.7B' } },
  { range: [150, 240], data: { name: 'PACIFIC OCEAN', code: 'OC-00', activity: 'LOW', population: 'N/A' } },
  { range: [240, 300], data: { name: 'SOUTH AMERICA', code: 'SA-01', activity: 'MODERATE', population: '430M' } },
];

function generateParticles(count: number, radius: number) {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const r = radius + (Math.random() - 0.5) * 0.2;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
}

export const HolographicEarth: React.FC<HolographicEarthProps> = ({ interactionState, onContinentChange }) => {
  const groupRef = useRef<THREE.Group>(null);
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Points>(null);
  
  // Internal physics state for smooth interpolation
  const targetRotation = useRef({ x: 0, y: 0 });
  const targetScale = useRef(1.2);
  const currentRotation = useRef({ x: 0, y: 0 });
  const currentScale = useRef(1.2);

  // Memoize materials to prevent recreation
  const earthMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color('#00FFFF'),
    wireframe: true,
    transparent: true,
    opacity: 0.25,
    blending: THREE.AdditiveBlending,
  }), []);

  const glowMaterial = useMemo(() => new THREE.MeshBasicMaterial({
    color: new THREE.Color('#0044aa'),
    transparent: true,
    opacity: 0.15,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
  }), []);
  
  const particlePositions = useMemo(() => generateParticles(1500, 1.3), []);

  useFrame((state, delta) => {
    if (!groupRef.current || !earthRef.current || !cloudsRef.current) return;

    const { leftHand } = interactionState.current;
    
    // Auto rotation speed (idle)
    let rotationSpeedY = 0.1 * delta;

    // STRICT: Only update based on Left Hand State
    if (leftHand.detected) {
      // Rotation: Map Hand Position directly to rotation
      // Raw X for Left hand in camera space is > 0.4.
      // We center rotation pivot around raw X = 0.75
      const pivotX = 0.75;
      const pivotY = 0.5;
      
      const targetY = (leftHand.position.x - pivotX) * Math.PI * 6; // Horizontal Spin
      const targetX = (leftHand.position.y - pivotY) * Math.PI * 2; // Vertical Tilt

      targetRotation.current.y = -targetY;
      targetRotation.current.x = -targetX;

      // Scaling: Map Pinch Distance directly to Scale
      // Open hand (large distance ~0.3) = Zoom IN (Large Earth)
      // Pinched hand (small distance ~0.0) = Zoom OUT (Small Earth)
      // We map 0.0 -> 0.6 scale, 0.3 -> 2.5 scale
      const pinchFactor = Math.min(leftHand.pinchDistance, 0.4); // Cap at 0.4
      const scaleRange = 2.0; 
      const minScale = 0.6;
      
      // Multiplier increased for more dramatic zoom effect
      const rawScale = minScale + (pinchFactor * 6); 
      
      targetScale.current = THREE.MathUtils.clamp(rawScale, 0.5, 3.0);
      
      // Smooth interpolation (Lerp)
      // Rotation is snappy (0.1), Scale is smoother/weightier (0.05)
      currentRotation.current.y = THREE.MathUtils.lerp(currentRotation.current.y, targetRotation.current.y, 0.1);
      currentRotation.current.x = THREE.MathUtils.lerp(currentRotation.current.x, targetRotation.current.x, 0.1);
      currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale.current, 0.08);

    } else {
       // Idle Animation: Rotate slowly & Return to base scale
       currentRotation.current.y += rotationSpeedY;
       // Slowly return to 0 tilt
       currentRotation.current.x = THREE.MathUtils.lerp(currentRotation.current.x, 0, 0.02);
       // Slowly return to default size
       currentScale.current = THREE.MathUtils.lerp(currentScale.current, 1.2, 0.02);
    }

    // Apply Transforms
    earthRef.current.rotation.y = currentRotation.current.y;
    earthRef.current.rotation.x = currentRotation.current.x;
    groupRef.current.scale.setScalar(currentScale.current);

    // Cloud/Ring animation
    if(cloudsRef.current) {
        cloudsRef.current.rotation.y -= rotationSpeedY * 1.5;
        cloudsRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
    
    // Particles animation
    if (particlesRef.current) {
        particlesRef.current.rotation.y += rotationSpeedY * 0.5;
    }

    // Calculate Continent
    // Convert rotation Y to degrees, normalize 0-360
    let deg = (THREE.MathUtils.radToDeg(currentRotation.current.y) % 360);
    if (deg < 0) deg += 360;
    
    const viewLongitude = (360 - deg) % 360;

    const continent = CONTINENTS.find(c => viewLongitude >= c.range[0] && viewLongitude < c.range[1]);
    if (continent) {
        onContinentChange(continent.data);
    }
  });

  return (
    <group ref={groupRef} position={[-1.4, 0, 0]}>
        {/* Main Earth Wireframe */}
        <Sphere ref={earthRef} args={[1, 32, 32]}>
          <primitive object={earthMaterial} attach="material" />
        </Sphere>
        
        {/* Glow Sphere */}
        <Sphere args={[0.9, 32, 32]}>
             <primitive object={glowMaterial} attach="material" />
        </Sphere>

        {/* Outer Ring / Clouds */}
        <Sphere ref={cloudsRef} args={[1.15, 24, 24]}>
            <meshBasicMaterial 
                color="#00FFFF" 
                wireframe 
                transparent 
                opacity={0.08} 
                side={THREE.DoubleSide}
            />
        </Sphere>
        
        {/* Data Particles */}
        <Points ref={particlesRef} positions={particlePositions} stride={3} frustumCulled={false}>
            <PointMaterial
                transparent
                color="#00FFFF"
                size={0.015}
                sizeAttenuation={true}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </Points>
        
        {/* Orbital Rings */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.5, 1.51, 64]} />
            <meshBasicMaterial color="#00FFFF" side={THREE.DoubleSide} transparent opacity={0.4} blending={THREE.AdditiveBlending} />
        </mesh>
         <mesh rotation={[Math.PI / 1.8, Math.PI / 4, 0]}>
            <ringGeometry args={[1.8, 1.81, 64]} />
            <meshBasicMaterial color="#0088FF" side={THREE.DoubleSide} transparent opacity={0.2} blending={THREE.AdditiveBlending}/>
        </mesh>
    </group>
  );
};