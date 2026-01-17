import { VoiceOption, ScriptBlock, MusicGenre, MusicMood } from './types';

export const AVAILABLE_VOICES: VoiceOption[] = [
  { name: 'Puck', gender: 'Male', style: 'Soft, Deep' },
  { name: 'Charon', gender: 'Male', style: 'Deep, Authoritative' },
  { name: 'Kore', gender: 'Female', style: 'Calm, Soothing' },
  { name: 'Fenrir', gender: 'Male', style: 'Energetic, Strong' },
  { name: 'Zephyr', gender: 'Female', style: 'Bright, Clear' },
];

export const INITIAL_SCRIPT_BLOCKS: ScriptBlock[] = [
  {
    id: '1',
    speaker: 'Narator',
    voice: 'Kore',
    text: 'Selamat datang di SuaraAI Studio. Ini adalah demonstrasi pengeditan suara berbasis teks.'
  },
  {
    id: '2',
    speaker: 'Budi',
    voice: 'Puck',
    text: 'Wow, suaranya terdengar sangat natural ya! Bagaimana cara kerjanya?'
  },
  {
    id: '3',
    speaker: 'Narator',
    voice: 'Kore',
    text: 'Sangat mudah. Cukup ketik naskahmu, pilih karakter, dan AI akan mengubahnya menjadi audio.'
  }
];

export const GEMINI_MODEL = 'gemini-2.5-flash-preview-tts';

export const MUSIC_GENRES: MusicGenre[] = ['Pop', 'Jazz', 'Rock', 'Lofi', 'Klasik'];
export const MUSIC_MOODS: MusicMood[] = ['Ceria', 'Sedih', 'Epik', 'Santai', 'Tegang'];

export const LOCAL_STORAGE_KEY = 'suaraai_app_state_v1';