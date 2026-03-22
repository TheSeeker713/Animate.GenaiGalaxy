/**
 * MediaPipe Singleton Manager
 * Prevents duplicate initializations in StrictMode/multi-tab scenarios
 */
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

class MediaPipeManager {
  private static instance: MediaPipeManager;
  private faceLandmarker: FaceLandmarker | null = null;
  private initPromise: Promise<FaceLandmarker> | null = null;
  private initializationCount = 0;

  private constructor() {}

  public static getInstance(): MediaPipeManager {
    if (!MediaPipeManager.instance) {
      MediaPipeManager.instance = new MediaPipeManager();
    }
    return MediaPipeManager.instance;
  }

  public async getFaceLandmarker(): Promise<FaceLandmarker> {
    // Return existing instance if already initialized
    if (this.faceLandmarker) {
      return this.faceLandmarker;
    }

    // Wait for ongoing initialization
    if (this.initPromise) {
      return this.initPromise;
    }

    // Start new initialization
    this.initPromise = this.initializeFaceLandmarker();
    this.faceLandmarker = await this.initPromise;
    this.initPromise = null;
    
    return this.faceLandmarker;
  }

  private async initializeFaceLandmarker(): Promise<FaceLandmarker> {
    this.initializationCount++;
    console.log(`Initializing MediaPipe (attempt ${this.initializationCount})`);

    const modelUrl =
      'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      const tryCreate = (delegate: 'GPU' | 'CPU') =>
        FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: modelUrl,
            delegate,
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

      try {
        const landmarker = await tryCreate('GPU');
        console.log('MediaPipe initialized (GPU)');
        return landmarker;
      } catch (gpuErr) {
        console.warn('MediaPipe GPU init failed, retrying CPU:', gpuErr);
        const landmarker = await tryCreate('CPU');
        console.log('MediaPipe initialized (CPU fallback)');
        return landmarker;
      }
    } catch (error) {
      this.initPromise = null;
      console.error('Failed to initialize MediaPipe:', error);
      throw error;
    }
  }

  public dispose(): void {
    if (this.faceLandmarker) {
      this.faceLandmarker.close();
      this.faceLandmarker = null;
      console.log('MediaPipe disposed');
    }
  }

  public isInitialized(): boolean {
    return this.faceLandmarker !== null;
  }
}

export const mediaPipeSingleton = MediaPipeManager.getInstance();
