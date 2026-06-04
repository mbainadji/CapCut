export interface Segment {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  outputPath?: string;
  texte?: string;
  selected: boolean;
}

export interface Beat {
  time: number;
  strength: number;
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  texte: string;
}

export type AutoMode = 'scene' | 'silence' | 'parole' | 'beats' | null;

export interface AutoModeConfig {
  scene: {
    enabled: boolean;
    sensibilite: number;
  };
  silence: {
    enabled: boolean;
    seuilDb: number;
    dureeMin: number;
  };
  parole: {
    enabled: boolean;
    apiKey: string;
  };
  beats: {
    enabled: boolean;
    sensibilite: 'every' | 'every2' | 'bar';
  };
}

export interface EditorState {
  videoUri: string;
  duration: number;
  currentTime: number;
  paused: boolean;
  segments: Segment[];
  activeSegmentId: string | null;
  playheadPosition: number;
  autoConfig: AutoModeConfig;
  processing: boolean;
  processingMessage: string;
  transcription: TranscriptionSegment[];
  beats: Beat[];
}
