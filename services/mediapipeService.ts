import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

export class MediaPipeService {
  private static instance: HandLandmarker | null = null;

  static async getInstance(): Promise<HandLandmarker> {
    if (this.instance) {
      return this.instance;
    }

    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
      );

      this.instance = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      return this.instance;
    } catch (error) {
      console.error("Failed to load MediaPipe HandLandmarker:", error);
      throw error;
    }
  }
}
