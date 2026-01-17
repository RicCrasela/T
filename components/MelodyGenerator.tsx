import React from 'react';
import { MelodyConfig, MusicGenre, MusicMood } from '../types';
import { MUSIC_GENRES, MUSIC_MOODS } from '../constants';
import { Music, Mic2 } from 'lucide-react';

interface MelodyGeneratorProps {
  config: MelodyConfig;
  setConfig: React.Dispatch<React.SetStateAction<MelodyConfig>>;
  isGenerating: boolean;
}

const MelodyGenerator: React.FC<MelodyGeneratorProps> = ({ config, setConfig, isGenerating }) => {
  
  const handleChange = (field: keyof MelodyConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
          <Music className="w-5 h-5 text-accent-purple" /> Generator Melodi AI
        </h2>
      </div>
      
      <p className="text-slate-400 text-sm bg-slate-800/50 p-3 rounded-lg border border-slate-700">
        Gunakan AI untuk membuat senandung atau vokal melodis. Tentukan genre dan mood, lalu masukkan lirik atau suku kata (seperti "La la la").
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Genre Selector */}
        <div>
          <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Genre Musik</label>
          <select
            value={config.genre}
            onChange={(e) => handleChange('genre', e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 px-4 text-slate-200 text-sm focus:ring-2 focus:ring-accent-purple focus:outline-none appearance-none cursor-pointer hover:border-accent-purple/50 transition-colors"
            disabled={isGenerating}
          >
            {MUSIC_GENRES.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        {/* Mood Selector */}
        <div>
          <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Mood / Suasana</label>
          <select
            value={config.mood}
            onChange={(e) => handleChange('mood', e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg py-3 px-4 text-slate-200 text-sm focus:ring-2 focus:ring-accent-purple focus:outline-none appearance-none cursor-pointer hover:border-accent-purple/50 transition-colors"
            disabled={isGenerating}
          >
            {MUSIC_MOODS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lyrics Input */}
      <div>
        <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Lirik / Senandung</label>
        <div className="relative">
          <Mic2 className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
          <textarea
            value={config.text}
            onChange={(e) => handleChange('text', e.target.value)}
            rows={4}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 pl-10 text-slate-200 text-sm focus:ring-2 focus:ring-accent-purple focus:outline-none resize-none font-medium"
            placeholder="Contoh: La la la la..."
            disabled={isGenerating}
          />
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <button 
             type="button"
             onClick={() => handleChange('text', 'La la la, hm hm hm...')}
             className="text-xs text-brand-400 hover:text-brand-300 underline"
          >
            Isi "La la la"
          </button>
          <button 
             type="button"
             onClick={() => handleChange('text', 'Na na na na, yeah yeah...')}
             className="text-xs text-brand-400 hover:text-brand-300 underline"
          >
            Isi "Na na na"
          </button>
        </div>
      </div>
    </div>
  );
};

export default MelodyGenerator;