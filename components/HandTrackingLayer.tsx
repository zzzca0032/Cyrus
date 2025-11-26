import React, { useEffect, useRef } from 'react';
import { HandLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import { MediaPipeService } from '../services/mediapipeService';
import { InteractionState, SystemState } from '../types';

interface HandTrackingLayerProps {
  videoElement: HTMLVideoElement | null;
  interactionState: React.MutableRefObject<InteractionState>;
  onSystemStateChange: (state: SystemState) => void;
}

export const HandTrackingLayer: React.FC<HandTrackingLayerProps> = ({ 
  videoElement, 
  interactionState,
  onSystemStateChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);

  useEffect(() => {
    let animationFrameId: number;

    const setupMediaPipe = async () => {
      try {
        onSystemStateChange(SystemState.INITIALIZING);
        const landmarker = await MediaPipeService.getInstance();
        handLandmarkerRef.current = landmarker;
        onSystemStateChange(SystemState.ACTIVE);
        predictWebcam();
      } catch (e) {
        onSystemStateChange(SystemState.ERROR);
      }
    };

    const predictWebcam = () => {
      if (!handLandmarkerRef.current || !videoElement || !canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if(!ctx) return;

      // Ensure canvas matches video size
      if (canvas.width !== videoElement.videoWidth || canvas.height !== videoElement.videoHeight) {
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
      }

      const startTimeMs = performance.now();
      const results = handLandmarkerRef.current.detectForVideo(videoElement, startTimeMs);

      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Mirror the context to match the mirrored video
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);

      const drawingUtils = new DrawingUtils(ctx);

      // Reset state for this frame
      interactionState.current.leftHand.detected = false;
      interactionState.current.rightHand.detected = false;

      if (results.landmarks) {
        for (let i = 0; i < results.landmarks.length; i++) {
            const landmarks = results.landmarks[i];
            const handedness = results.handedness[i];
            const wrist = landmarks[0];
            
            // --- STRICT HAND SEPARATION LOGIC ---
            // In mirrored selfie mode:
            // MediaPipe Label 'Left'  -> Physical Right Hand
            // MediaPipe Label 'Right' -> Physical Left Hand
            
            const mpLabel = handedness[0].categoryName;
            
            // Physical Hands
            const isPhysicalRight = mpLabel === 'Left'; 
            const isPhysicalLeft  = mpLabel === 'Right';

            // --- SPATIAL FILTERING ---
            // Raw Camera X Coordinates (0 = Camera Left/Screen Right, 1 = Camera Right/Screen Left)
            // Screen Right Zone (HUD)   : X < 0.6  (Allow slight overlap)
            // Screen Left Zone (Earth)  : X > 0.4  (Allow slight overlap)
            
            const isInRightZone = wrist.x < 0.6; 
            const isInLeftZone  = wrist.x > 0.4;

            // Determine Active Role
            let role: 'NONE' | 'RIGHT_HUD' | 'LEFT_EARTH' = 'NONE';

            if (isPhysicalRight && isInRightZone) {
                role = 'RIGHT_HUD';
            } else if (isPhysicalLeft && isInLeftZone) {
                role = 'LEFT_EARTH';
            }

            // --- GEOMETRY CALCULATION ---
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
            // Pinch Threshold: < 0.08 means fingers are touching
            const isPinching = pinchDist < 0.08;

            // --- VISUALIZATION ---
            if (role !== 'NONE') {
                 // Color coding: Cyan for HUD (Right), Blue for Earth (Left)
                const color = role === 'RIGHT_HUD' ? "rgba(0, 255, 255, 0.8)" : "rgba(0, 100, 255, 0.8)";
                
                // 1. Skeleton
                drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
                    color: color, 
                    lineWidth: 2
                });
                
                // 2. Joints
                for (const landmark of landmarks) {
                    ctx.beginPath();
                    ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 3, 0, 2 * Math.PI);
                    ctx.fillStyle = "#FFFFFF";
                    ctx.fill();
                }

                // 3. Interaction Ring (Visual Feedback) - REMOVED per user request

                // 4. Update State
                if (role === 'RIGHT_HUD') {
                    interactionState.current.rightHand = {
                        detected: true,
                        position: { x: wrist.x, y: wrist.y },
                        pinchDistance: pinchDist,
                        isPinching: isPinching
                    };
                } else if (role === 'LEFT_EARTH') {
                    interactionState.current.leftHand = {
                        detected: true,
                        position: { x: wrist.x, y: wrist.y },
                        pinchDistance: pinchDist,
                        isPinching: isPinching
                    };
                }
            } else {
                // Dimmed skeleton for ignored hands (wrong zone/wrong type)
                drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
                    color: "rgba(100, 100, 100, 0.2)", 
                    lineWidth: 1
                });
            }
        }
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    if (videoElement) {
        if(videoElement.readyState >= 2) {
             setupMediaPipe();
        } else {
            videoElement.oncanplay = setupMediaPipe;
        }
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoElement]);

  return (
    <canvas 
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
    />
  );
};