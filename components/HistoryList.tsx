import React from 'react';
import { HistoryItem } from '../types';
import { History, PlayCircle, Clock, Music, Mic } from 'lucide-react';

interface HistoryListProps {
  items: HistoryItem[];
  activeId: string | null;
  onRestore: (item: HistoryItem) => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ items, activeId, onRestore }) => {
  if (items.length === 0) return null;

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 flex flex-col gap-4">
      <h3 className="text-slate-200 font-semibold flex items-center gap-2">
        <History className="w-5 h-5 text-slate-400" /> Riwayat Generasi
      </h3>
      
      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {items.map((item) => (
          <div 
            key={item.id}
            onClick={() => onRestore(item)}
            className={`p-3 rounded-xl border transition-all cursor-pointer group flex items-center justify-between
              ${activeId === item.id 
                ? 'bg-brand-900/20 border-brand-500/50 shadow-sm shadow-brand-500/10' 
                : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
              }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 
                ${activeId === item.id ? 'bg-brand-500 text-white' : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'}`}>
                {item.type === 'script' ? <Mic className="w-5 h-5" /> : <Music className="w-5 h-5" />}
              </div>
              
              <div className="min-w-0">
                <p className={`text-sm font-medium truncate ${activeId === item.id ? 'text-brand-200' : 'text-slate-200'}`}>
                  {item.title}
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatTime(item.timestamp)}
                  <span className="mx-1">•</span>
                  {Math.round(item.buffer.duration)}s
                </p>
              </div>
            </div>

            <button className={`p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${activeId === item.id ? 'opacity-100 text-brand-400' : 'text-slate-400 hover:text-white'}`}>
              <PlayCircle className="w-6 h-6" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryList;