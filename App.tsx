import React, { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Layout } from './components/Layout';
import { WebcamFeed } from './components/WebcamFeed';
import { HandTrackingLayer } from './components/HandTrackingLayer';
import { HolographicEarth } from './components/Scene/HolographicEarth';
import { HUD } from './components/UI/HUD';
import { InteractionState, SystemState, ContinentData } from './types';

const App: React.FC = () => {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [systemState, setSystemState] = useState<SystemState>(SystemState.INITIALIZING);
  const [activeContinent, setActiveContinent] = useState<ContinentData>({
    name: 'SCANNING...',
    code: 'NULL',
    activity: 'LOW',
    population: '---'
  });

  // Mutable state for high-frequency updates (60fps) to avoid React renders
  const interactionState = useRef<InteractionState>({
    leftHand: { detected: false, position: { x: 0, y: 0 }, pinchDistance: 0, isPinching: false },
    rightHand: { detected: false, position: { x: 0, y: 0 }, pinchDistance: 0, isPinching: false },
  });

  return (
    <Layout>
      {/* 1. Background Webcam */}
      <WebcamFeed onVideoReady={setVideoElement} />

      {/* 2. Hand Tracking Calculation & Visualization (2D Canvas) */}
      <HandTrackingLayer 
        videoElement={videoElement} 
        interactionState={interactionState}
        onSystemStateChange={setSystemState}
      />

      {/* 3. 3D Holographic Scene (R3F) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
          <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} color="#00FFFF" intensity={1} />
            <HolographicEarth 
                interactionState={interactionState} 
                onContinentChange={setActiveContinent}
            />
          </Canvas>
      </div>

      {/* 4. HUD Interface (HTML/Tailwind) */}
      <HUD 
        systemState={systemState}
        continentData={activeContinent}
        interactionState={interactionState}
      />
    </Layout>
  );
};

export default App;
