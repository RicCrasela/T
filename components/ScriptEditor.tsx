import React from 'react';
import { ScriptBlock, VoiceName } from '../types';
import { AVAILABLE_VOICES } from '../constants';
import { Trash2, Mic, User } from 'lucide-react';

interface ScriptEditorProps {
  blocks: ScriptBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<ScriptBlock[]>>;
  isGenerating: boolean;
}

const ScriptEditor: React.FC<ScriptEditorProps> = ({ blocks, setBlocks, isGenerating }) => {

  const updateBlock = (id: string, field: keyof ScriptBlock, value: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
  };

  const addBlock = () => {
    const newBlock: ScriptBlock = {
      id: Date.now().toString(),
      speaker: `Speaker ${blocks.length + 1}`,
      voice: 'Kore',
      text: ''
    };
    setBlocks([...blocks, newBlock]);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
          <Mic className="w-5 h-5 text-brand-400" /> Naskah Percakapan
        </h2>
        <button
          onClick={addBlock}
          disabled={isGenerating}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors border border-slate-600 disabled:opacity-50"
        >
          + Tambah Baris
        </button>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {blocks.map((block, index) => (
          <div 
            key={block.id} 
            className="p-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl transition-all hover:border-brand-500/50 group"
          >
            <div className="flex flex-col sm:flex-row gap-4 mb-3">
              {/* Speaker Name Input */}
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Nama Pembicara</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={block.speaker}
                    onChange={(e) => updateBlock(block.id, 'speaker', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 pl-9 pr-3 text-slate-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    placeholder="Contoh: Budi"
                    disabled={isGenerating}
                  />
                </div>
              </div>

              {/* Voice Selector */}
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Suara AI</label>
                <select
                  value={block.voice}
                  onChange={(e) => updateBlock(block.id, 'voice', e.target.value as VoiceName)}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 px-3 text-slate-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none appearance-none"
                  disabled={isGenerating}
                >
                  {AVAILABLE_VOICES.map(v => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.gender}) - {v.style}
                    </option>
                  ))}
                </select>
              </div>

              {/* Delete Button */}
              <div className="flex items-end pb-1">
                <button
                  onClick={() => removeBlock(block.id)}
                  disabled={blocks.length <= 1 || isGenerating}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-30"
                  title="Hapus baris ini"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Text Area */}
            <div className="w-full">
              <label className="block text-xs text-slate-400 mb-1 uppercase tracking-wider">Teks Dialog</label>
              <textarea
                value={block.text}
                onChange={(e) => updateBlock(block.id, 'text', e.target.value)}
                rows={2}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-slate-200 text-sm focus:ring-2 focus:ring-brand-500 focus:outline-none resize-y"
                placeholder="Ketik apa yang ingin diucapkan..."
                disabled={isGenerating}
              />
            </div>
          </div>
        ))}
      </div>
      
      {blocks.length === 0 && (
        <div className="text-center py-10 text-slate-500 italic bg-slate-900/50 rounded-lg border border-dashed border-slate-700">
          Belum ada naskah. Klik "Tambah Baris" untuk memulai.
        </div>
      )}
    </div>
  );
};

export default ScriptEditor;