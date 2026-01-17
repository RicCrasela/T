import React, { useRef } from 'react';
import { UploadCloud, Music, FileAudio } from 'lucide-react';

interface AudioUploaderProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

const AudioUploader: React.FC<AudioUploaderProps> = ({ onFileSelect, isProcessing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      onFileSelect(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-green-400" /> Unggah Audio
        </h2>
      </div>

      <p className="text-slate-400 text-sm bg-slate-800/50 p-3 rounded-lg border border-slate-700">
        Unggah file rekaman atau musik dari perangkat Anda untuk diedit. Mendukung durasi panjang.
      </p>

      <div 
        className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all
          ${isProcessing 
            ? 'border-slate-700 bg-slate-900/50 opacity-50 cursor-not-allowed' 
            : 'border-slate-600 bg-slate-800/30 hover:border-green-500/50 hover:bg-slate-800/50 cursor-pointer'
          }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="audio/*" 
          className="hidden" 
        />
        
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 shadow-lg">
          {isProcessing ? (
             <UploadCloud className="w-8 h-8 text-slate-500 animate-bounce" />
          ) : (
             <FileAudio className="w-8 h-8 text-green-400" />
          )}
        </div>

        <h3 className="text-lg font-medium text-slate-200 mb-2">
          {isProcessing ? 'Memproses Audio...' : 'Klik atau Tarik File Audio'}
        </h3>
        <p className="text-sm text-slate-500 max-w-xs">
          Mendukung MP3, WAV, M4A, OGG. Ukuran file tidak dibatasi (tergantung memori perangkat).
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
            <Music className="w-5 h-5 text-slate-500" />
            <div className="text-xs text-slate-400">
                <span className="block font-bold text-slate-300">Format Bebas</span>
                MP3, WAV, dsb.
            </div>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-3">
            <UploadCloud className="w-5 h-5 text-slate-500" />
            <div className="text-xs text-slate-400">
                <span className="block font-bold text-slate-300">Durasi Panjang</span>
                Optimized buffer
            </div>
        </div>
      </div>
    </div>
  );
};

export default AudioUploader;