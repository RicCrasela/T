import React, { useState } from 'react';
import { Sparkles, RefreshCw, Wand2, X, Mic2 } from 'lucide-react';

interface AudioModifierProps {
  onTransform: (instruction: string) => void;
  onClear: () => void;
  isProcessing: boolean;
  fileName: string;
}

const AudioModifier: React.FC<AudioModifierProps> = ({ onTransform, onClear, isProcessing, fileName }) => {
  const [prompt, setPrompt] = useState('');

  // Presets focused on high-fidelity voice/style swapping
  const PRESETS = [
    "Ubah vokal jadi Pria (Deep Male Voice)",
    "Ubah vokal jadi Wanita (Soft Female Voice)",
    "Ubah vokal jadi Anak-anak (Child Voice)",
    "Ubah vokal jadi Robot Futuristik",
    "Gaya Akustik (Pertahankan Melodi)",
    "Gaya Rock (Pertahankan Melodi)",
    "Efek Gema Konser (Reverb)",
    "Suara Radio Lama (Lo-Fi)"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onTransform(prompt);
    }
  };

  return (
    <div className="space-y-6">
       {/* File Info Header */}
       <div className="bg-slate-800 rounded-xl p-4 flex items-center justify-between border border-slate-700">
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-brand-900/50 rounded-lg flex items-center justify-center text-brand-400">
             <Wand2 className="w-5 h-5" />
           </div>
           <div>
             <p className="text-xs text-slate-400">File Aktif</p>
             <p className="text-sm font-medium text-slate-200 truncate max-w-[200px]">{fileName}</p>
           </div>
         </div>
         <button 
           onClick={onClear}
           disabled={isProcessing}
           className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
           title="Ganti File"
         >
           <X className="w-4 h-4" />
         </button>
       </div>

       <div className="space-y-4">
         <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
               <Mic2 className="w-5 h-5 text-accent-pink" /> Ubah Suara & Musik
            </h2>
         </div>
         
         <div className="p-3 bg-brand-900/20 border border-brand-500/30 rounded-lg">
            <p className="text-brand-200 text-xs">
              <strong>Mode Preservasi:</strong> AI akan berusaha mempertahankan melodi, tempo, dan lirik asli lagu Anda, sambil mengubah karakter suara vokal atau gaya instrumen sesuai instruksi.
            </p>
         </div>

         <form onSubmit={handleSubmit} className="space-y-4">
           <div>
             <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">Instruksi Perubahan</label>
             <textarea
               value={prompt}
               onChange={(e) => setPrompt(e.target.value)}
               placeholder="Contoh: Ganti suara penyanyi menjadi pria berat, tapi pertahankan musik aslinya..."
               className="w-full bg-slate-900 border border-slate-600 rounded-xl p-4 text-slate-200 focus:ring-2 focus:ring-accent-pink focus:outline-none resize-none h-24"
               disabled={isProcessing}
             />
           </div>

           {/* Presets */}
           <div className="space-y-2">
             <label className="block text-xs text-slate-500 uppercase font-bold">Preset Cepat</label>
             <div className="flex flex-wrap gap-2">
               {PRESETS.map((preset) => (
                 <button
                   key={preset}
                   type="button"
                   onClick={() => setPrompt(preset)}
                   disabled={isProcessing}
                   className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-xs text-slate-300 transition-colors hover:border-accent-pink/50"
                 >
                   {preset}
                 </button>
               ))}
             </div>
           </div>

           <button
             type="submit"
             disabled={isProcessing || !prompt.trim()}
             className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-white transition-all shadow-lg mt-4
               ${isProcessing 
                 ? 'bg-slate-700 cursor-not-allowed opacity-70' 
                 : 'bg-gradient-to-r from-accent-pink to-brand-500 hover:from-accent-pink hover:to-brand-400 shadow-accent-pink/25'
               }`}
           >
             {isProcessing ? (
               <>
                 <RefreshCw className="w-5 h-5 animate-spin" />
                 Memproses Audio...
               </>
             ) : (
               <>
                 <Sparkles className="w-5 h-5" />
                 Terapkan Perubahan
               </>
             )}
           </button>
         </form>
       </div>
    </div>
  );
};

export default AudioModifier;