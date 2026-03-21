/**
 * Global Event Bus for cross-store communication
 * Prevents tight coupling between stores while enabling reactive updates
 */
import mitt, { type Emitter } from 'mitt';

export type AppEvents = {
  projectDeleted: {
    id: string
    type: 'raster' | 'vector' | 'character' | 'story'
  }
  projectSwitched: string; // projectId
  previewStarted: void;
  previewEnded: void;
  storeReset: string; // storeName
  quotaWarning: { used: number; limit: number };
  webcamStarted: void;
  webcamStopped: void;
  /** Pan React Flow to a node and select it (Story Builder) */
  focusStoryNode: string;
};

// Create singleton event bus
export const eventBus: Emitter<AppEvents> = mitt<AppEvents>();

// Helper to safely emit events with error handling
export function safeEmit<K extends keyof AppEvents>(
  type: K,
  data: AppEvents[K]
): void {
  try {
    eventBus.emit(type, data);
  } catch (error) {
    console.error(`Failed to emit event ${type}:`, error);
  }
}
