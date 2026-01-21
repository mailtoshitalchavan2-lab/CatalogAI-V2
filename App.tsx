
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { Uploader } from './components/Uploader';
import { PromptPanel } from './components/PromptPanel';
import { geminiService } from './services/geminiService';
import { AdminSaaS } from './components/AdminSaaS';
import { VideoGenerator } from './components/VideoGenerator';
import { GeneratedImage, AspectRatio, ProductAnalysis, MainCategory, CategoryPresets, KitAngles, BatchItem, CameraAngle, PlanId, Plans, PlanConfig, LogoPosition, WearableMode, GeneratedVideo } from './types';
import JSZip from 'jszip';

// Fix: Use any for aistudio to avoid "Subsequent property declarations must have the same type" errors if it's defined elsewhere.
declare global {
  interface Window {
    aistudio?: any;
  }
}

// Mock Admin Config for Payment Gateways
const MOCK_GATEWAY_CONFIG = [
  { id: 'stripe', name: 'Stripe / Cards', isEnabled: true, isPrimary: true, icon: '💳' },
  { id: 'razorpay', name: 'Razorpay / UPI', isEnabled: true, isPrimary: false, icon: '🇮🇳' },
  { id: 'paypal', name: 'PayPal / Int.', isEnabled: true, isPrimary: false, icon: '🅿️' }
];

const App: React.FC = () => {
  // Authentication & Context State
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [userRole, setUserRole] = useState<'user' | 'admin'>('user'); 
  const isAdmin = isLoggedIn && userRole === 'admin';

  // Navigation & View State
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'generate' | 'bg_remover' | 'downloads' | 'admin' | 'pricing' | 'showcase' | 'sdk' | 'about' | 'blog' | 'roadmap' | 'careers' | 'partners' | 'help' | 'api_docs' | 'privacy' | 'terms' | 'video_generator'>('dashboard');
  const [activeTab, setActiveTab] = useState<'queue' | 'history' | 'videos'>('queue');
  
  // Dynamic Plan & Token State
  const [availablePlans, setAvailablePlans] = useState<Record<PlanId, PlanConfig>>(Plans);
  const [currentPlan, setCurrentPlan] = useState<PlanId>('premium');
  const [tokens, setTokens] = useState(84);
  const [topUpModal, setTopUpModal] = useState(false);
  const [showPaymentSelector, setShowPaymentSelector] = useState<{ type: 'plan' | 'topup', id: string | number, amount: number } | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Background Remover Specific State
  const [bgRemoverSource, setBgRemoverSource] = useState<string | null>(null);
  const [bgRemoverResult, setBgRemoverResult] = useState<string | null>(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);

  // Core Data State
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [selectedCategory, setSelectedCategory] = useState<MainCategory>('Fashion');
  const [selectedPreset, setSelectedPreset] = useState<string>(CategoryPresets['Fashion'][0]);
  const [isKitMode, setIsKitMode] = useState(false);
  const [kitSize, setKitSize] = useState(4);
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>('bottom-right');
  const [globalPrompt, setGlobalPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [videoHistory, setVideoHistory] = useState<GeneratedVideo[]>([]);
  const [viewingImage, setViewingImage] = useState<GeneratedImage | null>(null);

  // STRICT SEPARATION: Only Image batches can be selected for CSV
  const [selectedImageBatches, setSelectedImageBatches] = useState<Set<string>>(new Set());

  // Download Manager State
  const [downloadModal, setDownloadModal] = useState<{ open: boolean, fileName: string, images: GeneratedImage[], isBulk?: boolean } | null>(null);
  const [skuValue, setSkuValue] = useState('');

  const queueRef = useRef<HTMLDivElement>(null);

  const planConfig = availablePlans[currentPlan];
  const isPaidPlan = currentPlan === 'pro' || currentPlan === 'premium';

  const activeGateways = useMemo(() => MOCK_GATEWAY_CONFIG.filter(g => g.isEnabled), []);

  const groupedHistory = useMemo((): Record<string, GeneratedImage[]> => {
    return history.reduce((acc: Record<string, GeneratedImage[]>, img: GeneratedImage) => {
      const key = img.fileName || 'Unknown Product';
      if (!acc[key]) acc[key] = [];
      acc[key].push(img);
      return acc;
    }, {});
  }, [history]);

  // Handlers
  const handleImagesSelect = useCallback(async (files: { name: string, base64: string }[]) => {
    const newItems: BatchItem[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      fileName: file.name,
      base64: file.base64,
      analysis: null,
      status: 'pending',
      selectedAngle: 'front',
      wearableMode: 'auto' 
    }));
    setBatchItems(prev => [...prev, ...newItems]);
    setCurrentView('generate');
    setTimeout(() => queueRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    for (const item of newItems) {
      triggerAnalysis(item);
    }
  }, []);

  const triggerAnalysis = async (item: BatchItem) => {
    setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'analyzing' } : i));
    try {
      const analysis = await geminiService.analyzeProduct(item.base64);
      setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, analysis, status: 'ready' } : i));
      if (analysis.main_category) setSelectedCategory(analysis.main_category);
    } catch (e) {
      setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error', error: 'Analysis failed' } : i));
    }
  };

  const updateBatchItemField = (itemId: string, field: keyof BatchItem, value: any) => {
    setBatchItems(prev => prev.map(item => item.id === itemId ? { ...item, [field]: value } : item));
  };

  const updateAnalysisField = (itemId: string, field: keyof ProductAnalysis, value: any) => {
    setBatchItems(prev => prev.map(item => {
      if (item.id === itemId && item.analysis) {
        return { ...item, analysis: { ...item.analysis, [field]: value } };
      }
      return item;
    }));
  };

  const processBatch = async () => {
    const totalRequired = isKitMode ? batchItems.length * kitSize : batchItems.length;
    if (tokens < totalRequired) {
      alert(`Insufficient tokens. You need ${totalRequired} tokens.`);
      setTopUpModal(true);
      return;
    }
    setIsProcessing(true);
    let usedTokens = 0;
    const itemsToProcess = [...batchItems];
    for (const item of itemsToProcess) {
      if (item.status === 'completed' || item.status === 'error') continue;
      setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'generating' } : i));
      const sessionResults: GeneratedImage[] = [];
      const presetsToGenerate = isKitMode ? (KitAngles[selectedCategory] || KitAngles['Other']).slice(0, kitSize) : [selectedPreset];
      try {
        for (const preset of presetsToGenerate) {
          const resultUrl = await geminiService.generatePhotoshoot(item.base64, globalPrompt, aspectRatio, preset, item.analysis, brandLogo, item.selectedAngle, isKitMode, logoPosition, item.wearableMode || 'auto', currentPlan === 'free');
          sessionResults.push({ 
            id: `${item.id}-${preset}-${Date.now()}`, 
            url: resultUrl, 
            prompt: isKitMode ? `Kit: ${preset}` : `${preset}`, 
            timestamp: Date.now(), 
            fileName: item.fileName, 
            shotType: preset,
            analysis: item.analysis || undefined
          });
          usedTokens++;
        }
        setHistory(prev => [...sessionResults, ...prev]);
        setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'completed' } : i));
      } catch (err) {
        setBatchItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'error' } : i));
      }
    }
    setTokens(prev => Math.max(0, prev - usedTokens));
    setIsProcessing(false);
    setCurrentView('downloads');
    setActiveTab('history');
  };

  const handleDownload = (url: string, fileName: string, shotType?: string) => {
    const link = document.createElement('a');
    link.href = url;
    const isMotion = shotType === 'motion' || url.includes('.mp4');
    const isZip = fileName.toLowerCase().endsWith('.zip');
    if (isZip) link.download = fileName;
    else if (isMotion) link.download = `${fileName.replace(/\.[^/.]+$/, "")}.mp4`;
    else link.download = `${fileName.replace(/\.[^/.]+$/, "")}_${shotType || 'asset'}.png`;
    link.click();
  };

  const handleBatchDownload = async () => {
    if (!downloadModal) return;
    const { images, isBulk } = downloadModal;
    const timestamp = new Date().toISOString().split('T')[0];
    const uniqueId = Math.random().toString(36).substr(2, 4).toUpperCase();
    const globalSku = skuValue.trim() || `CATALOGAI-${timestamp}-${uniqueId}`;
    
    const zip = new JSZip();
    let csvContent = "SKU,Image_File_Name,Product_Title,SEO_Description,Keywords,Tags,Shot_Type,Batch_ID\n";
    
    for (const [idx, asset] of images.entries()) {
      const batchId = asset.fileName || 'General';
      const itemSku = isBulk ? `${globalSku}-${batchId.replace(/\s+/g, '-')}` : globalSku;
      const sanitizedType = (asset.shotType || 'asset').toLowerCase().replace(/\s+/g, '-');
      const assetFileName = `${itemSku}_${sanitizedType}_${idx + 1}.png`;
      
      try {
        const response = await fetch(asset.url);
        const blob = await response.blob();
        zip.file(assetFileName, blob);
      } catch (e) {
        console.error("Could not add image to zip:", assetFileName);
      }
      
      const title = asset.analysis?.product_title || asset.analysis?.product_name || 'Marketplace Product';
      const desc = asset.analysis?.seo_description || 'Product asset generated by CatalogAI';
      const keywords = asset.analysis?.seo_keywords?.join(', ') || 'e-commerce, ai';
      const tags = asset.analysis?.tags?.join(', ') || sanitizedType;
      csvContent += `"${itemSku}","${assetFileName}","${title}","${desc}","${keywords}","${tags}","${sanitizedType}","${batchId}"\n`;
    }
    
    zip.file(`catalogai_export_${timestamp}.csv`, csvContent);
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = zipUrl;
    link.download = isBulk ? `CatalogAI_Bulk_Export_${timestamp}.zip` : `${globalSku}_collection.zip`;
    link.click();
    
    setDownloadModal(null);
    setSkuValue('');
    setSelectedImageBatches(new Set());
  };

  const triggerDownloadManager = (fileName: string, images: GeneratedImage[], isBulk?: boolean) => {
    setDownloadModal({ open: true, fileName, images, isBulk });
  };

  const toggleImageBatchSelection = (fileName: string) => {
    setSelectedImageBatches(prev => {
      const next = new Set(prev);
      if (next.has(fileName)) next.delete(fileName);
      else next.add(fileName);
      return next;
    });
  };

  const handleTopUpTrigger = (amount: number, tokenCount: number) => {
    setTopUpModal(false);
    setShowPaymentSelector({ type: 'topup', id: tokenCount, amount });
  };

  const handlePlanUpgradeTrigger = (planId: PlanId) => {
    const targetPlan = availablePlans[planId];
    setShowPaymentSelector({ type: 'plan', id: planId, amount: targetPlan.price });
  };

  // Fix: Add missing handleVideoGenerated callback to update history and tokens after video production.
  const handleVideoGenerated = useCallback((video: GeneratedVideo) => {
    setVideoHistory(prev => [video, ...prev]);
    // Deduct tokens (Video generation cost is 5 as per VideoGenerator.tsx)
    setTokens(prev => Math.max(0, prev - 5));
    setCurrentView('downloads');
    setActiveTab('videos');
  }, []);

  const processPayment = async (type: 'plan' | 'topup', id: string | number) => {
    setIsProcessingPayment(true);
    // Simulate real gateway authorization delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (type === 'plan') {
      const planId = id as PlanId;
      setTokens(prev => prev + availablePlans[planId].tokens);
      setCurrentPlan(planId);
      setCurrentView('dashboard');
    } else {
      setTokens(prev => prev + (id as number));
    }
    
    setIsProcessingPayment(false);
    setShowPaymentSelector(null);
    alert("Transaction Successful! Your balance has been updated.");
  };

  // Background Removal Tool View
  const handleBgRemoveUpload = (files: { name: string, base64: string }[]) => {
    if (files.length > 0) {
      setBgRemoverSource(files[0].base64);
      setBgRemoverResult(null);
    }
  };

  const performBgRemoval = async () => {
    if (!bgRemoverSource) return;
    if (tokens < 1) {
      alert("Insufficient tokens. Refill to use Background Remover.");
      setTopUpModal(true);
      return;
    }
    try {
      setIsRemovingBg(true);
      const result = await geminiService.removeBackground(bgRemoverSource);
      setBgRemoverResult(result);
      setTokens(prev => prev - 1);
    } catch (e) {
      alert("Background removal failed. Please try again.");
    } finally {
      setIsRemovingBg(false);
    }
  };

  const renderDashboardView = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const recentActivity = [...history, ...videoHistory].sort((a, b) => b.timestamp - a.timestamp).slice(0, 4);

    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Welcome back, Creative.</h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">{today}</p>
          </div>
          <div className="flex items-center gap-2 px-6 py-3 bg-indigo-50 border border-indigo-100 rounded-2xl">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Engine Ready for Production</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Archived Assets', value: history.length, icon: '🖼️', bg: 'bg-blue-50', color: 'text-blue-600' },
            { label: 'Video Clips', value: videoHistory.length, icon: '🎬', bg: 'bg-purple-50', color: 'text-purple-600' },
            { label: 'Plan Status', value: planConfig.name, icon: '🛡️', bg: 'bg-emerald-50', color: 'text-emerald-600' },
            { label: 'Tokens Available', value: tokens, icon: '⚡', bg: 'bg-amber-50', color: 'text-amber-600' },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col items-start gap-4 group hover:border-indigo-100 transition-all">
              <div className={`${item.bg} ${item.color} p-4 rounded-2xl text-2xl shadow-sm group-hover:scale-110 transition-transform`}>{item.icon}</div>
              <div>
                <p className="text-3xl font-black text-slate-900 leading-none">{item.value}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">{item.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-6">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Quick Studio Access</h3>
            <div className="space-y-4">
              <button onClick={() => setCurrentView('generate')} className="w-full p-6 bg-slate-900 text-white rounded-[2rem] flex items-center justify-between group hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                <div className="flex items-center gap-4 text-left"><div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-xl">📸</div><div><p className="text-sm font-black uppercase tracking-tight">New Photoshoot</p><p className="text-[9px] text-white/50 font-bold uppercase">Launch Batch Session</p></div></div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-40 group-hover:translate-x-1 group-hover:opacity-100 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
              <button onClick={() => setCurrentView('video_generator')} className="w-full p-6 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-between group hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100">
                <div className="flex items-center gap-4 text-left"><div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-xl">🎬</div><div><p className="text-sm font-black uppercase tracking-tight">Video Production</p><p className="text-[9px] text-white/50 font-bold uppercase">Generate Motion Assets</p></div></div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-40 group-hover:translate-x-1 group-hover:opacity-100 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
              <button onClick={() => setCurrentView('bg_remover')} className="w-full p-6 bg-white border border-slate-200 text-slate-900 rounded-[2rem] flex items-center justify-between group hover:border-indigo-600 transition-all shadow-sm">
                <div className="flex items-center gap-4 text-left"><div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-xl">🪄</div><div><p className="text-sm font-black uppercase tracking-tight">Magic Eraser</p><p className="text-[9px] text-slate-400 font-bold uppercase">Background Extraction</p></div></div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-40 group-hover:translate-x-1 group-hover:opacity-100 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </button>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Recent Work</h3>
              <button onClick={() => setCurrentView('downloads')} className="text-[9px] font-black uppercase text-indigo-600 hover:underline">View All Archive</button>
            </div>
            <div className="bg-white rounded-[2.5rem] border border-slate-100 p-6 min-h-[300px] shadow-sm">
              {recentActivity.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {recentActivity.map((item) => (
                    <div key={item.id} className="group relative aspect-square rounded-[2rem] overflow-hidden bg-slate-50 border border-slate-100 cursor-pointer" onClick={() => item.url.includes('.mp4') ? setCurrentView('downloads') : setViewingImage(item as GeneratedImage)}>
                      <img src={'thumbnailUrl' in item ? item.thumbnailUrl : item.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Activity" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        {'thumbnailUrl' in item ? ( <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-xl">▶️</div> ) : ( <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-xl">🔍</div> )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-3xl grayscale opacity-50">🖼️</div>
                  <div className="space-y-1"><p className="text-sm font-black text-slate-900 uppercase">Your Gallery is Empty</p><p className="text-xs text-slate-400 font-medium">Start your first session to see activity here.</p></div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div onClick={() => setTopUpModal(true)} className="cursor-pointer group bg-gradient-to-r from-emerald-500 to-teal-600 p-10 rounded-[3rem] shadow-xl shadow-emerald-100 flex flex-col md:flex-row items-center justify-between text-white transition-all hover:scale-[1.01]">
          <div className="space-y-2 text-center md:text-left mb-6 md:mb-0"><h3 className="text-3xl font-black tracking-tight">Fuel Your Creativity</h3><p className="text-emerald-50 font-medium text-base">You currently have <span className="font-black underline">{tokens} tokens</span> remaining in your Premium vault.</p></div>
          <button className="bg-white text-emerald-600 px-10 py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all">Refill Account Now</button>
        </div>
      </div>
    );
  };

  const renderHeader = () => (
    <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-[100]">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 h-20 flex items-center justify-between">
        <div onClick={() => setCurrentView('dashboard')} className="flex items-center gap-3 group cursor-pointer relative z-[101]">
          <div className="w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center transition-transform group-hover:rotate-6 shadow-lg shadow-gray-200"><span className="text-white font-bold text-sm">C</span></div>
          <div><h1 className="text-xl font-extrabold tracking-tight text-slate-900">Catalog<span className="text-indigo-600 italic">AI</span></h1><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Marketplace Ready</p></div>
        </div>
        <div className="hidden md:flex items-center gap-4 bg-gray-50/50 px-5 py-2 rounded-2xl border border-gray-100 relative z-[101]">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
            {planConfig.name} <span className="mx-2 text-slate-300">•</span> <span className="text-indigo-600 font-extrabold">{tokens} Tokens Left</span>
          </span>
          <button onClick={() => setTopUpModal(true)} className="text-[9px] font-black uppercase bg-indigo-600 text-white px-4 py-1.5 rounded-xl hover:bg-indigo-700 transition-all shadow-indigo-100">Buy Tokens</button>
        </div>
        <nav className="hidden lg:flex gap-10">
          {['Studio', 'Video Gen', 'BG Remover', 'Archives'].map(label => {
            const viewMap: Record<string, typeof currentView> = { 'Studio': 'generate', 'Video Gen': 'video_generator', 'BG Remover': 'bg_remover', 'Archives': 'downloads' };
            const targetView = viewMap[label];
            return <button key={label} onClick={() => targetView && setCurrentView(targetView)} className={`text-xs font-bold uppercase tracking-widest transition-colors ${currentView === targetView ? 'text-indigo-600' : 'text-slate-600 hover:text-gray-900'}`}>{label}</button>;
          })}
        </nav>
        <button onClick={() => setIsLoggedIn(false)} className="text-xs font-bold text-red-500 uppercase tracking-widest">Logout</button>
      </div>
    </header>
  );

  return (
    <Layout currentView={currentView} onProductionStudio={() => setCurrentView('generate')} onArchives={() => setCurrentView('downloads')} onPricing={() => setCurrentView('pricing')} onProfile={() => setCurrentView('dashboard')} onUpload={() => setCurrentView('generate')} onBgRemover={() => setCurrentView('bg_remover')} >
      <div className="min-h-screen bg-white">
        {renderHeader()}
        <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 py-12">
          {currentView === 'dashboard' && renderDashboardView()}
          {currentView === 'generate' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="lg:col-span-4 space-y-8">
                <Uploader onImagesSelect={handleImagesSelect} itemCount={batchItems.length} />
                <PromptPanel prompt={globalPrompt} setPrompt={setGlobalPrompt} aspectRatio={aspectRatio} setAspectRatio={setAspectRatio} category={selectedCategory} setCategory={setSelectedCategory} preset={selectedPreset} setPreset={setSelectedPreset} brandLogo={brandLogo} setBrandLogo={setBrandLogo} logoPosition={logoPosition} setLogoPosition={setLogoPosition} onGenerate={processBatch} isGenerating={isProcessing} disabled={batchItems.length === 0} isKitMode={isKitMode} setIsKitMode={setIsKitMode} kitSize={kitSize} setKitSize={setKitSize} tokens={tokens} />
              </div>
              <div className="lg:col-span-8 space-y-8" ref={queueRef}>
                <div className="flex justify-between items-center px-2"><h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Production Queue</h2></div>
                <div className="space-y-6">
                  {batchItems.map((item) => (
                    <div key={item.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col gap-8 group hover:shadow-md transition-all">
                      <div className="flex items-center gap-8"><div className="w-28 h-28 rounded-2xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100 relative group"><img src={item.base64} className="w-full h-full object-cover" alt="Source" /></div><div className="flex-1 min-w-0 space-y-2"><div className="flex items-center gap-3"><h4 className="text-base font-black text-slate-900 truncate">{item.fileName}</h4></div></div></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {currentView === 'bg_remover' && (
             <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
               <div className="text-center space-y-4"><h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Background Remover</h2><p className="text-slate-500 font-medium">Instantly remove backgrounds for clean product assets.</p></div>
               <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
                 {!bgRemoverSource ? ( <Uploader onImagesSelect={handleBgRemoveUpload} itemCount={0} /> ) : (
                   <div className="space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-4"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Source</p><div className="aspect-square bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100 relative group"><img src={bgRemoverSource} className="w-full h-full object-contain" alt="Source" /></div></div>
                       <div className="space-y-4"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Result</p><div className="aspect-square bg-slate-100 rounded-[2rem] overflow-hidden border border-slate-100 flex items-center justify-center relative bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">{bgRemoverResult ? ( <img src={bgRemoverResult} className="w-full h-full object-contain" alt="Result" /> ) : ( <div className="text-center space-y-2 px-8"><div className="w-12 h-12 bg-white/50 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto text-slate-300">🪄</div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ready</p></div> )}{isRemovingBg && ( <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" /></div> )}</div></div>
                     </div>
                     <div className="flex flex-col items-center gap-4">{!bgRemoverResult ? ( <button onClick={performBgRemoval} disabled={isRemovingBg} className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:bg-slate-200">{isRemovingBg ? 'Processing...' : 'Remove Background (1 Token)'}</button> ) : ( <button onClick={() => handleDownload(bgRemoverResult!, 'product_no_bg.png')} className="px-12 py-5 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all active:scale-95">Download PNG</button> )}</div>
                   </div>
                 )}
               </div>
             </div>
          )}
          {currentView === 'downloads' && (
            <div className="space-y-12 animate-in fade-in duration-700">
               <h2 className="text-3xl font-black text-slate-900 tracking-tight">Production Archives</h2>
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                 {history.map(img => (
                   <div key={img.id} className="group relative aspect-square rounded-[2rem] overflow-hidden bg-slate-50 border border-slate-100 shadow-sm"><img src={img.url} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Asset" /></div>
                 ))}
               </div>
            </div>
          )}
          {currentView === 'video_generator' && <VideoGenerator sourceAssets={history} tokens={tokens} onVideoGenerated={handleVideoGenerated} planConfig={planConfig} currentAspectRatio={aspectRatio} />}
        </main>

        {/* HIGH FIDELITY TOKEN STORE MODAL - MATCHES SCREENSHOT */}
        {topUpModal && (
          <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden animate-in zoom-in-95">
              <div className="p-10 border-b border-gray-50 flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Token Store</h3>
                <button onClick={() => setTopUpModal(false)} className="text-slate-300 hover:text-slate-900 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div className="p-12 grid md:grid-cols-2 gap-10">
                {/* Starter Pack - Matches Left Side of Screenshot */}
                <div className="bg-slate-50/50 p-10 rounded-[2.5rem] border border-slate-100 flex flex-col items-center text-center transition-all hover:scale-[1.02]">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Starter Pack</p>
                  <p className="text-4xl font-black text-indigo-600 mb-8">10 Tokens</p>
                  <button 
                    onClick={() => handleTopUpTrigger(299, 10)}
                    className="w-full py-5 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-sm hover:border-indigo-600 transition-all active:scale-95"
                  >
                    ₹299
                  </button>
                </div>

                {/* Value Pack - Matches Right Side of Screenshot */}
                <div className="p-10 rounded-[2.5rem] border-2 border-indigo-600/20 bg-indigo-50/10 flex flex-col items-center text-center relative transition-all hover:scale-[1.02]">
                  <div className="absolute -top-3 bg-indigo-600 text-white text-[8px] font-black uppercase px-3 py-1 rounded-full">Most Popular</div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Value Pack</p>
                  <p className="text-4xl font-black text-indigo-600 mb-8">50 Tokens</p>
                  <button 
                    onClick={() => handleTopUpTrigger(999, 50)}
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                  >
                    ₹999
                  </button>
                </div>
              </div>
              <div className="px-10 pb-8 text-center"><p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Tokens never expire • Instant Activation</p></div>
            </div>
          </div>
        )}

        {/* FUNCTIONAL PAYMENT GATEWAY MODAL */}
        {showPaymentSelector && (
          <div className="fixed inset-0 z-[700] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 p-12 space-y-10">
              {isProcessingPayment ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-6 text-center">
                  <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-900 uppercase">Authorizing Bank...</h3>
                    <p className="text-xs text-slate-400 font-medium">Please do not refresh the page or close this window.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Secure Checkout</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Order Summary: {showPaymentSelector.id} Tokens</p>
                    <p className="text-4xl font-black text-indigo-600 pt-2">₹{showPaymentSelector.amount}</p>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Choose Payment Method</label>
                    <div className="grid grid-cols-1 gap-3">
                      {activeGateways.map(gateway => (
                        <button key={gateway.id} onClick={() => processPayment(showPaymentSelector.type, showPaymentSelector.id)} className="flex items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-600 transition-all group">
                          <div className="flex items-center gap-4">
                            <span className="text-2xl">{gateway.icon}</span>
                            <span className="font-black text-slate-900 uppercase tracking-widest text-xs">{gateway.name}</span>
                          </div>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 transition-colors" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button onClick={() => setShowPaymentSelector(null)} className="w-full text-[10px] font-black uppercase text-slate-300 tracking-widest hover:text-rose-500 transition-colors">Cancel Session</button>
                </>
              )}
            </div>
          </div>
        )}

        {isProcessing && ( <div className="fixed inset-0 z-[300] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-300"><div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6" /><p className="text-xl font-black text-slate-900 uppercase tracking-widest">Processing Session...</p></div> )}
        {viewingImage && ( <div className="fixed inset-0 z-[400] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-10 animate-in fade-in duration-300"><button onClick={() => setViewingImage(null)} className="absolute top-10 right-10 text-white text-3xl">✕</button><div className="max-w-4xl w-full space-y-8 flex flex-col items-center"><img src={viewingImage.url} className="max-h-[70vh] rounded-[2rem] shadow-2xl border border-white/10" alt="Asset" /><button onClick={() => handleDownload(viewingImage.url, viewingImage.fileName || 'asset', viewingImage.shotType)} className="px-12 py-5 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition-all active:scale-95 shadow-2xl">Download High-Res</button></div></div> )}
      </div>
    </Layout>
  );
};

export default App;
