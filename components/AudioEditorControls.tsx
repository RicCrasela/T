import React from 'react';
import { AudioEditConfig } from '../types';
import { Scissors, TrendingUp, TrendingDown } from 'lucide-react';

interface AudioEditorControlsProps {
  config: AudioEditConfig;
  setConfig: React.Dispatch<React.SetStateAction<AudioEditConfig>>;
  duration: number; // Current processed duration (approx)
  originalDuration: number;
  disabled: boolean;
}

const AudioEditorControls: React.FC<AudioEditorControlsProps> = ({ 
  config, 
  setConfig, 
  originalDuration,
  disabled 
}) => {

  const handleChange = (field: keyof AudioEditConfig, value: number) => {
    // Basic validation constraints
    let newValue = Math.max(0, value);
    
    // Prevent overlapping trims exceeding duration
    if (field === 'trimStart') {
      if (newValue + config.trimEnd >= originalDuration) return; 
    }
    if (field === 'trimEnd') {
      if (newValue + config.trimStart >= originalDuration) return;
    }

    setConfig(prev => ({ ...prev, [field]: newValue }));
  };

  const formatSec = (n: number) => `${n.toFixed(1)}s`;

  return (
    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 mt-4 space-y-4">
      <div className="flex items-center gap-2 text-slate-300 text-sm font-semibold border-b border-slate-700 pb-2">
        <Scissors className="w-4 h-4" /> Editor Audio
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Trim Start */}
        <div className="space-y-1">
          <label className="text-xs text-slate-500 uppercase font-bold flex justify-between">
            Potong Awal <span>{formatSec(config.trimStart)}</span>
          </label>
          <input
            type="range"
            min="0"
            max={originalDuration}
            step="0.1"
            value={config.trimStart}
            onChange={(e) => handleChange('trimStart', parseFloat(e.target.value))}
            disabled={disabled}
            className="w-full accent-brand-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Trim End */}
        <div className="space-y-1">
          <label className="text-xs text-slate-500 uppercase font-bold flex justify-between">
            Potong Akhir <span>{formatSec(config.trimEnd)}</span>
          </label>
          <input
            type="range"
            min="0"
            max={originalDuration}
            step="0.1"
            value={config.trimEnd}
            onChange={(e) => handleChange('trimEnd', parseFloat(e.target.value))}
            disabled={disabled}
            className="w-full accent-brand-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Fade In */}
        <div className="space-y-1">
          <label className="text-xs text-slate-500 uppercase font-bold flex items-center justify-between">
            <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Fade In</span>
            <span>{formatSec(config.fadeIn)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={config.fadeIn}
            onChange={(e) => handleChange('fadeIn', parseFloat(e.target.value))}
            disabled={disabled}
            className="w-full accent-accent-purple h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Fade Out */}
        <div className="space-y-1">
          <label className="text-xs text-slate-500 uppercase font-bold flex items-center justify-between">
            <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Fade Out</span>
            <span>{formatSec(config.fadeOut)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={config.fadeOut}
            onChange={(e) => handleChange('fadeOut', parseFloat(e.target.value))}
            disabled={disabled}
            className="w-full accent-accent-purple h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

export default AudioEditorControls;