
import React, { useState, useRef } from 'react';
import { GeneratedImage, VideoPresets, VideoPreset, GeneratedVideo, PlanConfig, AspectRatio } from '../types';
import { geminiService } from '../services/geminiService';

interface VideoGeneratorProps {
  sourceAssets: GeneratedImage[];
  onVideoGenerated: (video: GeneratedVideo) => void;
  tokens: number;
  planConfig: PlanConfig;
  currentAspectRatio: AspectRatio;
}

export const VideoGenerator: React.FC<VideoGeneratorProps> = ({ 
  sourceAssets, 
  onVideoGenerated, 
  tokens, 
  planConfig, 
  currentAspectRatio 
}) => {
  const [selectedAsset, setSelectedAsset] = useState<GeneratedImage | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<VideoPreset | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [eligibility, setEligibility] = useState<{ eligible: boolean, reason?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const VIDEO_TOKEN_COST = 5;
  const isVideoEnabled = planConfig.features.videoGeneration;

  const activeBase64 = uploadedImage || selectedAsset?.url || null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const b64 = reader.result as string;
        setUploadedImage(b64);
        setSelectedAsset(null);
        setEligibility(null);
        setError(null);
        setSelectedPreset(null);
        
        // Immediate Eligibility Check
        setVideoStatus('Verifying Product Eligibility...');
        const result = await geminiService.checkVideoEligibility(b64);
        setEligibility(result);
        setVideoStatus('');
      };
      reader.readAsDataURL(file);
    }
  };

  const selectFromArchive = async (asset: GeneratedImage) => {
    setSelectedAsset(asset);
    setUploadedImage(null);
    setEligibility(null);
    setError(null);
    setSelectedPreset(null);
    
    setVideoStatus('Verifying Product Eligibility...');
    const result = await geminiService.checkVideoEligibility(asset.url);
    setEligibility(result);
    setVideoStatus('');
  };

  const handleGenerate = async () => {
    if (!activeBase64 || !selectedPreset) return;
    if (eligibility && !eligibility.eligible) return;
    
    if (!isVideoEnabled) {
      alert("Upgrade to Premium to unlock Product Video Generation");
      return;
    }

    if (tokens < VIDEO_TOKEN_COST) {
      alert("Insufficient tokens. Please refill to generate video.");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      setVideoStatus('Initializing Veo Production Engine...');

      const statusInterval = setInterval(() => {
        const messages = [
          'Analyzing commercial product textures...',
          'Applying high-end studio lighting...',
          'Synthesizing cinematic motion path...',
          'Performing final MP4 assembly...',
          'Running commercial safety audit...'
        ];
        setVideoStatus(messages[Math.floor(Math.random() * messages.length)]);
      }, 7000);

      try {
        const videoUrl = await geminiService.generateProductVideo(activeBase64, selectedPreset.prompt, currentAspectRatio);
        clearInterval(statusInterval);

        const newVideo: GeneratedVideo = {
          id: `vid-${Date.now()}`,
          url: videoUrl,
          thumbnailUrl: activeBase64,
          prompt: selectedPreset.prompt,
          preset: selectedPreset,
          timestamp: Date.now(),
          fileName: selectedAsset?.fileName || 'product_video',
          aspectRatio: currentAspectRatio
        };

        onVideoGenerated(newVideo);
      } catch (innerErr: any) {
        clearInterval(statusInterval);
        throw innerErr;
      }

      setIsGenerating(false);
      setVideoStatus('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Production interrupted. Video generation could not be completed. Please try another preset.');
      setIsGenerating(false);
      setVideoStatus('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 space-y-12 animate-in fade-in duration-500 relative">
      {!isVideoEnabled && (
        <div className="absolute inset-0 z-50 bg-white/60 backdrop-blur-md rounded-[3rem] flex flex-col items-center justify-center p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center text-4xl shadow-2xl shadow-indigo-200">💎</div>
          <div className="space-y-2">
            <h3 className="text-3xl font-black text-slate-900">Premium Feature</h3>
            <p className="text-slate-500 max-w-sm font-medium">Upgrade to Premium to unlock High-End MP4 Product Video Generation</p>
          </div>
          <button className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95">View Plans</button>
        </div>
      )}

      <div className="text-center space-y-4">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Product Video Generator <span className="text-[10px] px-2 py-0.5 bg-indigo-600 text-white rounded-md align-middle ml-2">Premium</span></h2>
        <p className="text-slate-500 font-medium max-w-2xl mx-auto">Generate studio-quality commercial videos directly from raw photos. Choose from professional Myntra & Amazon style motion presets.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-10">
        {/* Left Column: Media Selection */}
        <div className="lg:col-span-6 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs">1</div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Import Media</h3>
            </div>
            
            <div className="flex gap-4">
               <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 p-8 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 transition-all flex flex-col items-center justify-center gap-2 group"
               >
                 <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                   </svg>
                 </div>
                 <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">New Upload</span>
                 <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
               </button>

               <div className="flex-1 flex flex-col gap-2">
                  <div className="bg-white border border-slate-100 rounded-[2rem] p-4 flex-grow overflow-y-auto max-h-[160px] shadow-sm">
                    <p className="text-[9px] font-black text-slate-300 uppercase mb-3 tracking-widest ml-1">Archive Assets</p>
                    <div className="grid grid-cols-3 gap-2">
                      {sourceAssets.map(asset => (
                        <button 
                          key={asset.id} 
                          onClick={() => selectFromArchive(asset)}
                          className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedAsset?.id === asset.id ? 'border-indigo-600 ring-2 ring-indigo-50' : 'border-transparent'}`}
                        >
                          <img src={asset.url} className="w-full h-full object-cover" alt="Thumb" />
                        </button>
                      ))}
                    </div>
                  </div>
               </div>
            </div>

            {activeBase64 && (
              <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-slate-100 border border-slate-200 shadow-inner group animate-in zoom-in-95 duration-500">
                <img src={activeBase64} className="w-full h-full object-contain" alt="Target" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-6">
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">Source Image Loaded</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Presets & Generation */}
        <div className="lg:col-span-6 space-y-8">
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs">2</div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest">Motion Preset Library</h3>
            </div>

            {eligibility && !eligibility.eligible ? (
               <div className="p-8 bg-rose-50 border border-rose-100 rounded-[2.5rem] text-rose-600 animate-in slide-in-from-top-2">
                 <div className="flex items-center gap-3 mb-3">
                   <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center text-xl">🚫</div>
                   <p className="text-[11px] font-black uppercase tracking-widest">Ineligible Product Category</p>
                 </div>
                 <p className="text-sm font-bold leading-relaxed">{eligibility.reason || "This product is not eligible for video production."}</p>
                 <p className="text-[10px] mt-4 opacity-70 italic">Restricted items include undergarments, lingerie, or intimate apparel as per commercial safety standards.</p>
               </div>
            ) : (
              <div className={`space-y-3 transition-all ${!activeBase64 ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
                {VideoPresets.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset)}
                    className={`w-full p-6 rounded-[2rem] border-2 text-left transition-all group ${
                      selectedPreset?.id === preset.id 
                        ? 'border-indigo-600 bg-indigo-50/20 shadow-lg shadow-indigo-100/50' 
                        : 'border-slate-50 bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{preset.label}</p>
                      {selectedPreset?.id === preset.id && <span className="text-indigo-600">✓</span>}
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed group-hover:text-slate-700">{preset.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 space-y-6">
            <div className="flex justify-between items-center px-4 py-3 bg-slate-50 rounded-2xl">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Production Cost</span>
              <div className="flex items-center gap-2">
                <span className="text-indigo-600 font-black text-base">{VIDEO_TOKEN_COST} Tokens</span>
                <span className="text-[9px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded font-black">MP4</span>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!activeBase64 || !selectedPreset || isGenerating || !isVideoEnabled || (eligibility && !eligibility.eligible)}
              className={`w-full py-6 rounded-[2.5rem] font-black uppercase text-xs tracking-widest transition-all shadow-2xl relative overflow-hidden ${
                !activeBase64 || !selectedPreset || isGenerating || !isVideoEnabled || (eligibility && !eligibility.eligible)
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95 shadow-slate-200'
              }`}
            >
              {isGenerating ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Studio Processing...</span>
                </div>
              ) : (
                'Generate Commercial Video'
              )}
            </button>

            {isGenerating && (
              <div className="space-y-2">
                <p className="text-center text-[10px] font-black text-indigo-500 uppercase animate-pulse tracking-widest">
                  {videoStatus}
                </p>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-600 animate-[progress_20s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                <p className="text-center text-[10px] font-black text-rose-500 uppercase tracking-widest">
                  {error}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 95%; }
        }
      `}</style>
    </div>
  );
};
