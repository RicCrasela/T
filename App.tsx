import React, { useState, useRef, useEffect } from 'react';
import { ScriptBlock, GenerationState, MelodyConfig, AudioEditConfig, HistoryItem } from './types';
import { INITIAL_SCRIPT_BLOCKS, LOCAL_STORAGE_KEY } from './constants';
import ScriptEditor from './components/ScriptEditor';
import MelodyGenerator from './components/MelodyGenerator';
import AudioUploader from './components/AudioUploader';
import AudioModifier from './components/AudioModifier';
import AudioVisualizer from './components/AudioVisualizer';
import AudioEditorControls from './components/AudioEditorControls';
import HistoryList from './components/HistoryList';
import { generateAudioFromScript, generateMelody, transformAudio } from './services/geminiService';
import { decodeAudioData, bufferToWave, processAudioBuffer } from './audioHelpers';
import { Play, Pause, RefreshCw, Download, Sparkles, Music, Volume2, Mic, FileAudio, UploadCloud } from 'lucide-react';

type TabMode = 'script' | 'melody' | 'upload';

interface AppState {
  activeTab: TabMode;
  blocks: ScriptBlock[];
  melodyConfig: MelodyConfig;
  editConfig: AudioEditConfig;
}

const App: React.FC = () => {
  // --- Initialization with LocalStorage Logic ---
  const loadStateFromStorage = (): Partial<AppState> => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load state", e);
    }
    return {};
  };

  const savedState = loadStateFromStorage();

  const [activeTab, setActiveTab] = useState<TabMode>(savedState.activeTab || 'script');
  
  // Script State
  const [blocks, setBlocks] = useState<ScriptBlock[]>(savedState.blocks || INITIAL_SCRIPT_BLOCKS);
  
  // Melody State
  const [melodyConfig, setMelodyConfig] = useState<MelodyConfig>(savedState.melodyConfig || {
    genre: 'Pop',
    mood: 'Ceria',
    text: 'La la la la la...'
  });

  // Editor State
  const [editConfig, setEditConfig] = useState<AudioEditConfig>(savedState.editConfig || {
    trimStart: 0,
    trimEnd: 0,
    fadeIn: 0,
    fadeOut: 0
  });

  // --- Persistence Effect ---
  useEffect(() => {
    const stateToSave: AppState = {
      activeTab,
      blocks,
      melodyConfig,
      editConfig
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
  }, [activeTab, blocks, melodyConfig, editConfig]);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentAudioId, setCurrentAudioId] = useState<string | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null); // Track filename for Upload tab

  const [genState, setGenState] = useState<GenerationState>({
    isGenerating: false,
    error: null,
    audioUrl: null
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Audio Context and Graph Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Buffers
  const originalBufferRef = useRef<AudioBuffer | null>(null);
  const processedBufferRef = useRef<AudioBuffer | null>(null);
  
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);

  // Initialize AudioContext on first interaction or generation
  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
    }
    return audioContextRef.current;
  };

  // Helper to update state with new audio
  const handleNewAudioBuffer = async (buffer: AudioBuffer, type: TabMode, title: string) => {
    originalBufferRef.current = buffer;
    processedBufferRef.current = buffer;
    setDuration(buffer.duration);
    
    const wavBlob = bufferToWave(buffer, buffer.length);
    const url = URL.createObjectURL(wavBlob);
    
    const newHistoryItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      type: type,
      title: title,
      blobUrl: url,
      buffer: buffer
    };
    
    setHistory(prev => [newHistoryItem, ...prev]);
    setCurrentAudioId(newHistoryItem.id);
    setGenState({ isGenerating: false, error: null, audioUrl: url });
    setCurrentTime(0);
  };

  const handleFileUpload = async (file: File) => {
    setGenState({ isGenerating: true, error: null, audioUrl: null });
    stopAudio();
    setEditConfig({ trimStart: 0, trimEnd: 0, fadeIn: 0, fadeOut: 0 });
    setCurrentFileName(file.name);

    try {
      const ctx = initAudio();
      const arrayBuffer = await file.arrayBuffer();
      const buffer = await ctx.decodeAudioData(arrayBuffer);
      
      const title = file.name.length > 25 ? file.name.substring(0, 25) + '...' : file.name;
      await handleNewAudioBuffer(buffer, 'upload', title);

    } catch (err: any) {
      console.error(err);
      setGenState({ 
        isGenerating: false, 
        error: "Gagal memproses file audio. Format mungkin tidak didukung atau file rusak.", 
        audioUrl: null 
      });
    }
  };

  const handleTransformAudio = async (instruction: string) => {
    if (!originalBufferRef.current) return;
    
    setGenState({ isGenerating: true, error: null, audioUrl: null });
    stopAudio();
    
    // We keep existing trims or reset them? Let's keep them if the user already trimmed, 
    // but typically users want to transform the *whole* original or the *edited* one?
    // Let's transform the current *processed* buffer to respect trims.
    
    const bufferToTransform = processedBufferRef.current || originalBufferRef.current;
    
    try {
       const base64Data = await transformAudio(bufferToTransform, instruction);
       const ctx = initAudio();
       const newBuffer = await decodeAudioData(base64Data, ctx);
       
       await handleNewAudioBuffer(newBuffer, 'upload', `Mod: ${instruction.substring(0, 15)}...`);
       // Reset edits for the new file since it's a fresh generation
       setEditConfig({ trimStart: 0, trimEnd: 0, fadeIn: 0, fadeOut: 0 });

    } catch (err: any) {
      console.error(err);
      setGenState(prev => ({ 
        ...prev, 
        isGenerating: false, 
        error: "Gagal memodifikasi audio. Silakan coba lagi dengan instruksi berbeda."
      }));
    }
  };

  const clearUploadedFile = () => {
    stopAudio();
    originalBufferRef.current = null;
    processedBufferRef.current = null;
    setDuration(0);
    setCurrentFileName(null);
    setGenState({ isGenerating: false, error: null, audioUrl: null });
  };

  const handleGenerate = async () => {
    setGenState({ isGenerating: true, error: null, audioUrl: null });
    stopAudio();
    
    try {
      let base64Data: string;
      let title: string = '';

      if (activeTab === 'script') {
        const nonEmptyBlocks = blocks.filter(b => b.text.trim().length > 0);
        if (nonEmptyBlocks.length === 0) {
          throw new Error("Mohon isi teks naskah terlebih dahulu.");
        }
        base64Data = await generateAudioFromScript(nonEmptyBlocks);
        title = `Percakapan (${nonEmptyBlocks.length} baris)`;
      } else {
        if (!melodyConfig.text.trim()) {
           throw new Error("Mohon isi lirik atau senandung.");
        }
        base64Data = await generateMelody(melodyConfig);
        title = `Melodi ${melodyConfig.genre} ${melodyConfig.mood}`;
      }

      const ctx = initAudio();
      const buffer = await decodeAudioData(base64Data, ctx);
      await handleNewAudioBuffer(buffer, activeTab, title);

    } catch (err: any) {
      console.error(err);
      setGenState({ 
        isGenerating: false, 
        error: err.message || "Gagal menghasilkan audio. Pastikan API Key valid.", 
        audioUrl: null 
      });
    }
  };

  const restoreHistoryItem = (item: HistoryItem) => {
    stopAudio();
    
    originalBufferRef.current = item.buffer;
    processedBufferRef.current = item.buffer;
    setDuration(item.buffer.duration);
    setCurrentAudioId(item.id);
    setCurrentFileName(item.title); // Update title for context
    
    // Reset edit controls
    setEditConfig({ trimStart: 0, trimEnd: 0, fadeIn: 0, fadeOut: 0 });
    
    // Set UI state
    setGenState({ 
      isGenerating: false, 
      error: null, 
      audioUrl: item.blobUrl 
    });
    setCurrentTime(0);
    
    // If restoring an uploaded/modified item, switch to upload tab to show modifier
    if (item.type === 'upload') {
        setActiveTab('upload');
    } else {
        setActiveTab(item.type);
    }
  };

  // Re-process audio when editConfig changes
  useEffect(() => {
    if (!originalBufferRef.current || !audioContextRef.current) return;

    // Check if any edit is actually active to save processing
    const hasEdits = editConfig.trimStart > 0 || editConfig.trimEnd > 0 || editConfig.fadeIn > 0 || editConfig.fadeOut > 0;

    if (hasEdits) {
       const wasPlaying = isPlaying;
       if (wasPlaying) stopAudio(); // Pause while processing

       const newBuffer = processAudioBuffer(originalBufferRef.current, editConfig, audioContextRef.current);
       processedBufferRef.current = newBuffer;
       setDuration(newBuffer.duration);

       // Regenerate Download URL
       const wavBlob = bufferToWave(newBuffer, newBuffer.length);
       const url = URL.createObjectURL(wavBlob);
       setGenState(prev => ({ ...prev, audioUrl: url }));
       
    } else {
       // Revert to original if all edits cleared
       if (processedBufferRef.current !== originalBufferRef.current) {
          processedBufferRef.current = originalBufferRef.current;
          setDuration(originalBufferRef.current.duration);
          
          const wavBlob = bufferToWave(originalBufferRef.current, originalBufferRef.current.length);
          const url = URL.createObjectURL(wavBlob);
          setGenState(prev => ({ ...prev, audioUrl: url }));
       }
    }
  }, [editConfig]);

  const playAudio = async () => {
    const ctx = initAudio();
    if (!processedBufferRef.current) return;

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const source = ctx.createBufferSource();
    source.buffer = processedBufferRef.current;
    
    const gainNode = ctx.createGain();
    gainNode.gain.value = 1.0;

    source.connect(analyserRef.current!);
    analyserRef.current!.connect(gainNode);
    gainNode.connect(ctx.destination);

    const offset = pauseTimeRef.current;
    
    if (offset >= processedBufferRef.current.duration) {
        pauseTimeRef.current = 0;
        source.start(0, 0);
        startTimeRef.current = ctx.currentTime;
    } else {
        source.start(0, offset);
        startTimeRef.current = ctx.currentTime - offset;
    }

    sourceNodeRef.current = source;
    setIsPlaying(true);

    source.onended = () => {
       if (ctx.currentTime - startTimeRef.current >= processedBufferRef.current!.duration - 0.1) {
          setIsPlaying(false);
          pauseTimeRef.current = 0;
          setCurrentTime(0);
       }
    };
  };

  const pauseAudio = () => {
    if (sourceNodeRef.current && audioContextRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      pauseTimeRef.current = audioContextRef.current.currentTime - startTimeRef.current;
      setIsPlaying(false);
      sourceNodeRef.current = null;
    }
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (e) {
        // ignore
      }
    }
    setIsPlaying(false);
    pauseTimeRef.current = 0;
    setCurrentTime(0);
    sourceNodeRef.current = null;
  };

  // Update Progress Bar
  useEffect(() => {
    let rafId: number;
    const updateProgress = () => {
      if (isPlaying && audioContextRef.current) {
        const played = audioContextRef.current.currentTime - startTimeRef.current;
        setCurrentTime(Math.min(played, duration));
        rafId = requestAnimationFrame(updateProgress);
      }
    };
    
    if (isPlaying) {
      rafId = requestAnimationFrame(updateProgress);
    }
    
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, duration]);

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    const dec = Math.floor((time % 1) * 10);
    return `${min}:${sec.toString().padStart(2, '0')}.${dec}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-brand-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-accent-purple flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Music className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              SuaraAI Studio
            </h1>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-xs font-mono text-brand-400 px-2 py-1 bg-brand-900/30 rounded border border-brand-800">
               Gemini 2.5 Flash
             </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 grid lg:grid-cols-2 gap-8">
        
        {/* Left Column: Editor / Generator */}
        <section className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col h-fit">
          {/* Tabs */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab('script')}
              className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'script' 
                ? 'bg-slate-800/50 text-brand-400 border-b-2 border-brand-400' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
              }`}
            >
              <Mic className="w-4 h-4" /> Editor Naskah
            </button>
            <button
              onClick={() => setActiveTab('melody')}
              className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'melody' 
                ? 'bg-slate-800/50 text-accent-purple border-b-2 border-accent-purple' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
              }`}
            >
              <FileAudio className="w-4 h-4" /> Generator Melodi
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                activeTab === 'upload' 
                ? 'bg-slate-800/50 text-green-400 border-b-2 border-green-400' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
              }`}
            >
              <UploadCloud className="w-4 h-4" /> Unggah & Edit
            </button>
          </div>

          <div className="p-6 flex-1">
            {activeTab === 'script' ? (
              <ScriptEditor 
                blocks={blocks} 
                setBlocks={setBlocks} 
                isGenerating={genState.isGenerating} 
              />
            ) : activeTab === 'melody' ? (
              <MelodyGenerator 
                 config={melodyConfig}
                 setConfig={setMelodyConfig}
                 isGenerating={genState.isGenerating}
              />
            ) : (
              // Logic to toggle between Uploader and Modifier
              originalBufferRef.current ? (
                <AudioModifier 
                   onTransform={handleTransformAudio}
                   onClear={clearUploadedFile}
                   isProcessing={genState.isGenerating}
                   fileName={currentFileName || 'Audio Uploaded'}
                />
              ) : (
                <AudioUploader 
                  onFileSelect={handleFileUpload}
                  isProcessing={genState.isGenerating}
                />
              )
            )}
            
            {/* Main Generate Button for Script/Melody Tabs (Not Upload Tab) */}
            {activeTab !== 'upload' && (
              <div className="mt-8 pt-6 border-t border-slate-800">
                <button
                  onClick={handleGenerate}
                  disabled={genState.isGenerating}
                  className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-white transition-all transform active:scale-95 shadow-lg
                    ${genState.isGenerating 
                      ? 'bg-slate-700 cursor-not-allowed opacity-70' 
                      : activeTab === 'script'
                        ? 'bg-gradient-to-r from-brand-600 to-brand-400 hover:from-brand-500 hover:to-brand-300 shadow-brand-500/25'
                        : 'bg-gradient-to-r from-accent-purple to-accent-pink hover:from-purple-500 hover:to-pink-500 shadow-accent-purple/25'
                    }`}
                >
                  {genState.isGenerating ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Sedang Memproses...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      {activeTab === 'script' ? 'Generate Percakapan' : 'Generate Melodi'}
                    </>
                  )}
                </button>
              </div>
            )}
            
            {genState.error && (
              <div className="mt-4 p-4 bg-red-900/20 border border-red-800/50 rounded-xl text-red-200 text-sm">
                <p className="font-semibold">Error:</p>
                {genState.error}
              </div>
            )}
          </div>
        </section>

        {/* Right Column: Player & Visualization & History */}
        <section className="flex flex-col gap-6">
          
          {/* Visualizer Card */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl min-h-[200px] flex flex-col justify-center relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-50 ${
                activeTab === 'script' 
                ? 'from-brand-500 via-brand-300 to-brand-500' 
                : activeTab === 'melody'
                  ? 'from-accent-purple via-accent-pink to-accent-purple'
                  : 'from-green-500 via-emerald-300 to-green-500'
              }`}>
            </div>
            
            <div className="mb-4 flex items-center justify-between text-sm text-slate-400">
              <span className="flex items-center gap-2">
                <Volume2 className="w-4 h-4" /> Visualisasi {activeTab === 'script' ? 'Suara' : activeTab === 'upload' ? 'Upload' : 'Musik'}
              </span>
              <span className="font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>

            <AudioVisualizer analyser={analyserRef.current} isPlaying={isPlaying} />

            {/* Audio Editor Controls (Only if audio exists) */}
            {originalBufferRef.current && (
              <AudioEditorControls 
                config={editConfig}
                setConfig={setEditConfig}
                duration={duration}
                originalDuration={originalBufferRef.current.duration}
                disabled={isPlaying}
              />
            )}

            {/* Playback Controls */}
            <div className="mt-6 flex items-center justify-center gap-6">
               <button 
                 onClick={isPlaying ? pauseAudio : playAudio}
                 disabled={!processedBufferRef.current}
                 className="w-16 h-16 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 shadow-lg shadow-white/10"
               >
                 {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
               </button>
            </div>
            
            {/* Download Button */}
            {genState.audioUrl && (
              <a 
                href={genState.audioUrl} 
                download={`suara-ai-${activeTab}-${Date.now()}.wav`}
                className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                title="Download WAV"
              >
                <Download className="w-5 h-5" />
              </a>
            )}

            {!originalBufferRef.current && !genState.isGenerating && (
               <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-[2px] rounded-2xl z-10">
                 <p className="text-slate-500 text-sm">Hasil audio akan muncul di sini</p>
               </div>
            )}
          </div>

          {/* History List */}
          <HistoryList 
            items={history} 
            activeId={currentAudioId} 
            onRestore={restoreHistoryItem} 
          />

          {/* Info Card (Show only if no history or at bottom) */}
          {history.length === 0 && (
            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 text-sm text-slate-400">
              <h3 className="text-slate-200 font-semibold mb-2">Panduan Penggunaan</h3>
              {activeTab === 'script' ? (
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li>Isi naskah dan pilih suara karakter.</li>
                  <li>Klik <strong>Generate Percakapan</strong>.</li>
                  <li>Gunakan <strong>Editor Audio</strong> untuk mengedit.</li>
                </ul>
              ) : activeTab === 'melody' ? (
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li>Pilih Genre dan Mood, lalu isi lirik.</li>
                  <li>Klik <strong>Generate Melodi</strong>.</li>
                </ul>
              ) : (
                <ul className="list-disc list-inside space-y-1 ml-1">
                  <li>Unggah file audio (MP3/WAV).</li>
                  <li>Gunakan <strong>Modifikasi AI</strong> untuk mengubah suara/musik.</li>
                  <li>Atau potong/fade menggunakan slider di bawah visualizer.</li>
                </ul>
              )}
            </div>
          )}

        </section>

      </main>
    </div>
  );
};

export default App;