
import React, { useRef } from 'react';
import { AspectRatio, CategoryPresets, MainCategory, LogoPosition } from '../types';

interface PromptPanelProps {
  prompt: string;
  setPrompt: (p: string) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (a: AspectRatio) => void;
  category: MainCategory;
  setCategory: (c: MainCategory) => void;
  preset: string;
  setPreset: (p: string) => void;
  brandLogo: string | null;
  setBrandLogo: (logo: string | null) => void;
  logoPosition: LogoPosition;
  setLogoPosition: (pos: LogoPosition) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  disabled: boolean;
  isKitMode: boolean;
  setIsKitMode: (k: boolean) => void;
  kitSize: number;
  setKitSize: (s: number) => void;
  tokens: number;
  instructorRef_kit?: React.RefObject<HTMLDivElement | null>;
  instructorRef_count?: React.RefObject<HTMLDivElement | null>;
  instructorRef_generate?: React.RefObject<HTMLButtonElement | null>;
  instructorStep?: number | null;
}

export const PromptPanel: React.FC<PromptPanelProps> = ({
  prompt,
  setPrompt,
  aspectRatio,
  setAspectRatio,
  category,
  setCategory,
  preset,
  setPreset,
  brandLogo,
  setBrandLogo,
  logoPosition,
  setLogoPosition,
  onGenerate,
  isGenerating,
  disabled,
  isKitMode,
  setIsKitMode,
  kitSize,
  setKitSize,
  tokens,
  instructorRef_kit,
  instructorRef_count,
  instructorRef_generate,
  instructorStep
}) => {
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrandLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const positions: { id: LogoPosition; label: string }[] = [
    { id: 'top-left', label: 'Top Left' },
    { id: 'top-center', label: 'Top Center' },
    { id: 'top-right', label: 'Top Right' },
    { id: 'bottom-left', label: 'Bottom Left' },
    { id: 'bottom-right', label: 'Bottom Right' }
  ];

  const currentPresets = CategoryPresets[category] || CategoryPresets['Other'];

  return (
    <div className="space-y-8">
      {/* MARKETPLACE KIT CARD */}
      <div 
        ref={instructorRef_kit}
        onClick={() => setIsKitMode(!isKitMode)}
        className={`group relative overflow-hidden p-6 rounded-[2rem] border-2 transition-all cursor-pointer duration-500 ${
          isKitMode 
            ? 'border-indigo-600 bg-indigo-50/40 shadow-xl shadow-indigo-100/50' 
            : instructorStep === 2
              ? 'border-indigo-600 ring-8 ring-indigo-50 shadow-indigo-100'
              : 'border-gray-100 bg-white hover:border-gray-300'
        }`}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all shadow-sm ${isKitMode ? 'bg-indigo-600 text-white scale-110' : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200'}`}>
            ✨
          </div>
          <div>
            <p className={`text-xs font-bold uppercase tracking-widest ${isKitMode ? 'text-indigo-900' : 'text-gray-900'}`}>Marketplace Ready Kit</p>
            <p className="text-[10px] text-gray-500 font-bold">4-5 Master Assets</p>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 leading-relaxed font-medium mb-4">
          Automated collection including Hero Shot, Side View, Macro Detail, and Lifestyle Context.
        </p>

        <div 
          ref={instructorRef_count}
          className={`pt-4 border-t border-indigo-100 transition-all duration-500 ${isKitMode ? 'opacity-100 max-h-40' : 'opacity-40 grayscale max-h-40'} ${instructorStep === 3 ? 'ring-8 ring-indigo-50 rounded-xl' : ''}`}
        >
          <div className="flex gap-2">
            {[4, 5].map(size => (
              <button
                key={size}
                disabled={!isKitMode}
                onClick={(e) => { e.stopPropagation(); setKitSize(size); }}
                className={`flex-1 py-3 rounded-2xl text-[10px] font-extrabold uppercase tracking-widest transition-all ${
                  kitSize === size && isKitMode
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                    : 'bg-white text-indigo-400 border border-indigo-200 hover:bg-indigo-50'
                }`}
              >
                {size} Master Images
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* ASPECT RATIO SELECTOR */}
        <div className="space-y-4">
          <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
            Canvas Format
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(AspectRatio).map(([key, value]) => (
              <button
                key={value}
                onClick={() => setAspectRatio(value)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all border ${
                  aspectRatio === value
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : 'bg-white text-slate-500 border-gray-100 hover:border-gray-300'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {/* PRESET SELECTOR */}
        <div className="space-y-4">
          <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
            Production Preset
          </label>
          <div className="grid grid-cols-1 gap-2">
            {currentPresets.map((p) => (
              <button
                key={p}
                disabled={isKitMode}
                onClick={() => setPreset(p)}
                className={`w-full px-5 py-3 rounded-xl text-left text-[11px] font-bold transition-all border ${
                  !isKitMode && preset === p
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : isKitMode 
                      ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                      : 'bg-white text-slate-600 border-gray-100 hover:border-indigo-200 hover:text-indigo-600'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          {isKitMode && (
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-tight text-center">
              Individual Presets Disabled in Kit Mode
            </p>
          )}
        </div>

        {/* Brand Kit */}
        <div className="space-y-4">
          <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
            Brand Kit
          </label>
          <div className="flex items-center gap-4 p-4 border border-gray-100 bg-white rounded-2xl shadow-sm relative group/logo">
            <button 
              onClick={() => logoInputRef.current?.click()}
              className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 border-2 border-dashed transition-all ${brandLogo ? 'border-indigo-200 bg-indigo-50 shadow-inner' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}
            >
              {brandLogo ? (
                <img src={brandLogo} className="w-full h-full object-contain p-2" alt="Logo" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-gray-900 uppercase tracking-widest truncate">{brandLogo ? 'Active Brand Logo' : 'Upload PNG Logo'}</p>
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight truncate">{brandLogo ? 'Logo placement enabled' : 'Transparency Recommended'}</p>
            </div>
            {brandLogo && (
              <button 
                onClick={(e) => { e.stopPropagation(); setBrandLogo(null); if(logoInputRef.current) logoInputRef.current.value = ''; }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors z-10"
                title="Remove Logo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
          <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/png" className="hidden" />
          
          <div className={`pt-2 transition-all ${brandLogo ? 'opacity-100 scale-100' : 'opacity-40 grayscale scale-95 pointer-events-none'}`}>
            <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-3 text-center">Placement Position</label>
            <div className="flex flex-wrap justify-center gap-1.5">
              {positions.map(pos => (
                <button
                  key={pos.id}
                  onClick={() => setLogoPosition(pos.id)}
                  className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                    logoPosition === pos.id 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'bg-gray-50 text-gray-400 border border-gray-100 hover:border-gray-300'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Global Context */}
        <div className="space-y-4">
          <label className="block text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
            Production Context
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. 'Soft afternoon glow, natural shadows...'"
            className="w-full px-5 py-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-600 focus:border-transparent min-h-[100px] text-xs font-medium text-gray-900 placeholder-gray-300 bg-white shadow-sm transition-all"
          />
        </div>

        {/* PRIMARY ACTION BUTTON - Hidden on mobile, moved to queue section in mobile flow */}
        <button
          ref={instructorRef_generate}
          onClick={onGenerate}
          disabled={disabled || isGenerating}
          className={`hidden md:flex group w-full py-6 rounded-[2rem] font-bold text-white transition-all flex-col items-center justify-center gap-1 shadow-2xl relative overflow-hidden duration-500 ${
            isGenerating || disabled 
              ? 'bg-gray-300 cursor-not-allowed' 
              : instructorStep === 4
                ? 'bg-indigo-600 ring-8 ring-indigo-50 shadow-indigo-100'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
          }`}
        >
          {isGenerating && (
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          )}
          {isGenerating ? (
            <>
              <svg className="animate-spin h-6 w-6 text-white mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-[10px] uppercase tracking-[0.2em] font-extrabold">Production Active</span>
            </>
          ) : tokens === 0 ? (
            <>
              <span className="text-base flex items-center gap-2">Upgrade to Generate</span>
              <span className="text-[9px] uppercase tracking-[0.2em] opacity-60 font-extrabold">0 Tokens Left</span>
            </>
          ) : (
            <>
              <span className="text-base flex items-center gap-2">
                {isKitMode ? 'Assemble Multi-Shot Kit' : 'Launch Batch Session'}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] opacity-60 font-extrabold">Marketplace Ready</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
