export interface ScriptBlock {
  id: string;
  speaker: string;
  voice: VoiceName;
  text: string;
}

export type VoiceName = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

export interface VoiceOption {
  name: VoiceName;
  gender: 'Male' | 'Female';
  style: string;
}

export interface GenerationState {
  isGenerating: boolean;
  error: string | null;
  audioUrl: string | null;
}

export type MusicGenre = 'Pop' | 'Jazz' | 'Rock' | 'Lofi' | 'Klasik';
export type MusicMood = 'Ceria' | 'Sedih' | 'Epik' | 'Santai' | 'Tegang';

export interface MelodyConfig {
  genre: MusicGenre;
  mood: MusicMood;
  text: string;
}

export interface AudioEditConfig {
  trimStart: number;
  trimEnd: number;
  fadeIn: number;
  fadeOut: number;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  type: 'script' | 'melody' | 'upload';
  title: string;
  blobUrl: string;
  buffer: AudioBuffer;
}