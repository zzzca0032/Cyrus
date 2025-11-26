export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandResults {
  landmarks: HandLandmark[][];
  worldLandmarks: HandLandmark[][];
  handedness: { index: number; score: number; categoryName: 'Left' | 'Right' | string; displayName: string }[];
}

export interface InteractionState {
  leftHand: {
    detected: boolean;
    position: { x: number; y: number }; // 0-1 normalized
    pinchDistance: number;
    isPinching: boolean;
  };
  rightHand: {
    detected: boolean;
    position: { x: number; y: number }; // 0-1 normalized
    pinchDistance: number;
    isPinching: boolean;
  };
}

export interface ContinentData {
  name: string;
  code: string;
  activity: string;
  population: string;
}

export enum SystemState {
  INITIALIZING = 'INITIALIZING',
  SCANNING = 'SCANNING',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR',
}
