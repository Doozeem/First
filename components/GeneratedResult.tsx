import React, { useRef, useEffect, useState } from 'react';
import { AudioStatus } from '../types';
import { Play, Square, Loader2, Volume2, Copy, Check, Info, Download, Edit3, Music } from 'lucide-react';

interface GeneratedResultProps {
  content: string;
  onGenerateSpeech: (text: string, voice: string) => void;
  audioStatus: AudioStatus;
  audioBuffer: AudioBuffer | null;
  audioBlob: Blob | null;
}

const VOICES = [
  { id: 'Kore', name: 'Kore', desc: 'Netral' },
  { id: 'Puck', name: 'Puck', desc: 'Lembut' },
  { id: 'Charon', name: 'Charon', desc: 'Berat' },
  { id: 'Fenrir', name: 'Fenrir', desc: 'Energik' },
  { id: 'Zephyr', name: 'Zephyr', desc: 'Wanita' },
];

const GeneratedResult: React.FC<GeneratedResultProps> = ({ 
  content, 
  onGenerateSpeech, 
  audioStatus, 
  audioBuffer,
  audioBlob
}) => {
  const [localContent, setLocalContent] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [copied, setCopied] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) sourceNodeRef.current.stop();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(localContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const playAudio = async () => {
    if (!audioBuffer) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    } else if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) {}
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.start();
    sourceNodeRef.current = source;
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch (e) {}
    }
  };

  const handleDownload = () => {
    if (!audioBlob) return;
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dooze-voice-${selectedVoice}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!content && !localContent) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-12 glass-panel rounded-3xl border-dashed border-2 border-slate-300/50">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center mb-6 shadow-inner">
          <Music className="w-8 h-8 text-indigo-300" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Kanvas Kosong</h3>
        <p className="text-slate-500 max-w-xs mx-auto">
          Isi formulir di sebelah kiri untuk mulai membuat konten ajaib Anda dengan Dooze.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col h-[600px] border border-white/60">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100/50 bg-white/40 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
            <Edit3 className="w-4 h-4" />
          </div>
          Dooze Editor
        </h3>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Disalin' : 'Salin'}
        </button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 relative bg-white/30">
        <textarea
          value={localContent}
          onChange={(e) => setLocalContent(e.target.value)}
          className="w-full h-full p-8 resize-none focus:outline-none bg-transparent text-slate-800 leading-relaxed font-medium text-lg selection:bg-indigo-100"
          placeholder="Tulis..."
        />
      </div>

      {/* Controls Footer */}
      <div className="p-6 bg-white/60 border-t border-white/50 backdrop-blur-md">
        
        <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-indigo-50/50 border border-indigo-100/50 text-indigo-900/70 text-xs">
          <Info className="w-4 h-4 shrink-0 text-indigo-400" />
          <p>Bagian dalam <code>[kurung siku]</code> tidak akan disuarakan oleh AI.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          
          {/* Voice Select */}
          <div className="flex-1 min-w-[200px]">
             <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block ml-1">Karakter Suara</label>
             <div className="grid grid-cols-1">
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  disabled={audioStatus === AudioStatus.GENERATING}
                  className="w-full bg-white border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-400 outline-none cursor-pointer hover:border-indigo-300 transition"
                >
                  {VOICES.map(v => (
                    <option key={v.id} value={v.id}>{v.name} — {v.desc}</option>
                  ))}
                </select>
             </div>
          </div>

          {/* Action Area */}
          <div className="flex items-end gap-2">
            {audioStatus === AudioStatus.IDLE || audioStatus === AudioStatus.ERROR ? (
              <button
                onClick={() => onGenerateSpeech(localContent, selectedVoice)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition shadow-lg hover:-translate-y-0.5"
              >
                <Volume2 className="w-4 h-4" />
                Dooze It
              </button>
            ) : null}

            {audioStatus === AudioStatus.GENERATING && (
              <div className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-6 py-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-bold shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </div>
            )}

            {(audioStatus === AudioStatus.READY || audioStatus === AudioStatus.PLAYING) && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                 <button
                    onClick={() => onGenerateSpeech(localContent, selectedVoice)}
                    className="p-3 bg-white border border-slate-200 hover:border-indigo-300 text-slate-500 hover:text-indigo-600 rounded-xl transition shadow-sm"
                    title="Regenerate"
                  >
                     <Volume2 className="w-4 h-4" />
                  </button>
                
                <div className="flex items-center p-1 bg-slate-900 rounded-xl shadow-lg shadow-slate-300">
                  <button
                    onClick={playAudio}
                    className="p-2 hover:bg-white/20 text-white rounded-lg transition"
                  >
                    <Play className="w-5 h-5 fill-current" />
                  </button>
                  <button
                    onClick={stopAudio}
                    className="p-2 hover:bg-white/20 text-slate-400 hover:text-white rounded-lg transition"
                  >
                    <Square className="w-5 h-5 fill-current" />
                  </button>
                </div>

                {audioBlob && (
                  <button
                    onClick={handleDownload}
                    className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-md shadow-green-200 transition"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratedResult;