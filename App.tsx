import React, { useState } from 'react';
import { PromoRequest, AudioStatus } from './types';
import PromoForm from './components/PromoForm';
import GeneratedResult from './components/GeneratedResult';
import { generatePromoText, generatePromoSpeech } from './services/geminiService';
import { Zap, Sparkles, Layers } from 'lucide-react';

const App: React.FC = () => {
  const [generatedContent, setGeneratedContent] = useState<string>("");
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>(AudioStatus.IDLE);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const handleGenerateContent = async (request: PromoRequest) => {
    setIsGeneratingText(true);
    setAudioStatus(AudioStatus.IDLE);
    setAudioBuffer(null);
    setAudioBlob(null);
    setGeneratedContent("");

    try {
      const text = await generatePromoText(request);
      setGeneratedContent(text);
    } catch (error) {
      console.error(error);
      setGeneratedContent("Terjadi kesalahan saat membuat konten. Silakan periksa kunci API Anda dan coba lagi.");
    } finally {
      setIsGeneratingText(false);
    }
  };

  const handleGenerateSpeech = async (textToSpeak: string, voice: string) => {
    if (!textToSpeak) return;

    setAudioStatus(AudioStatus.GENERATING);
    try {
      const { buffer, blob } = await generatePromoSpeech(textToSpeak, voice);
      setAudioBuffer(buffer);
      setAudioBlob(blob);
      setAudioStatus(AudioStatus.READY);
    } catch (error) {
      console.error(error);
      setAudioStatus(AudioStatus.ERROR);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Modern Header - Rebranded to Dooze */}
      <header className="sticky top-0 z-50 glass-panel border-b-0 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* New Logo: Zap Icon representing "Dooze" energy */}
            <div className="bg-gradient-to-tr from-yellow-400 to-orange-500 p-2.5 rounded-xl shadow-lg shadow-orange-500/20 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
              <Zap className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Dooze<span className="text-orange-500">.AI</span>
              </h1>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 border border-white/50 text-sm font-medium text-slate-600 shadow-sm">
            <Sparkles className="w-4 h-4 text-purple-500 fill-purple-500" />
            <span>Ditenagai oleh Gemini 2.5</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Berkarya dengan <span className="gradient-text">Dooze</span>. <br/>
            Inspirasi Tanpa Batas.
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg leading-relaxed font-medium">
            Platform all-in-one untuk Copywriting, Storytelling, dan Web Showcase yang ditenagai suara AI ultra-realistis.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Input */}
          <div className="lg:col-span-5 space-y-6">
            <PromoForm onSubmit={handleGenerateContent} isLoading={isGeneratingText} />
            
            <div className="glass-panel p-6 rounded-3xl">
              <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-orange-500" />
                Cara Kerja Dooze
              </h4>
              <div className="space-y-4">
                {[
                  { title: "Pilih Mode", desc: "Promosi, Cerita, atau Web Dev" },
                  { title: "Tulis atau Upload", desc: "Input detail atau upload video demo" },
                  { title: "Dooze It!", desc: "AI membuat naskah & suara instan" }
                ].map((step, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0 border border-orange-100">
                      {idx + 1}
                    </div>
                    <div>
                      <h5 className="font-semibold text-slate-900 text-sm">{step.title}</h5>
                      <p className="text-xs text-slate-500">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Result */}
          <div className="lg:col-span-7 h-full">
            <div className="sticky top-24">
              <GeneratedResult 
                content={generatedContent}
                onGenerateSpeech={handleGenerateSpeech}
                audioStatus={audioStatus}
                audioBuffer={audioBuffer}
                audioBlob={audioBlob}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;