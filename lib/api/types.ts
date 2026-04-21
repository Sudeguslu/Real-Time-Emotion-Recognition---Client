export type EmotionLabel =
  | "happy"
  | "sad"
  | "angry"
  | "surprise"
  | "fear"
  | "disgust"
  | "neutral";

// Events
export interface Event {
  id: string;
  eventName: string;
}

export interface CreateEventBody {
  eventName: string;
}

// Event Sessions
export interface EventSession {
  id: string;
  sessionName: string;
  eventId: string;
  duration: number;
  date?: string;
}

export interface CreateEventSessionBody {
  sessionName: string;
  eventId: string;
  duration?: number;
  date?: string;
}

export interface UpdateSessionDurationBody {
  duration: number;
}

// Emotions
export interface Emotion {
  id: string;
  emotion: EmotionLabel;
  sessionId: string;
  date?: string;
}

export interface EmotionCount {
  emotion: EmotionLabel;
  count: number;
}

export interface CreateEmotionBody {
  emotion: EmotionLabel;
  sessionId: string;
  date?: string;
}

// Logs
export interface Log {
  id: string;
  exceptionMessage: string;
  exceptionDetail?: string;
}

export interface CreateLogBody {
  exceptionMessage: string;
  exceptionDetail?: string;
}
