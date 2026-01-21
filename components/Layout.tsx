
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  onRaiseTicket?: () => void;
  onProductionStudio?: () => void;
  onMarketplaceKits?: () => void;
  onBatchProduction?: () => void;
  onBrandIdentity?: () => void;
  onArchives?: () => void;
  onAbout?: () => void;
  onBlog?: () => void;
  onRoadmap?: () => void;
  onCareers?: () => void;
  onPartners?: () => void;
  onHelp?: () => void;
  onApiDocs?: () => void;
  onPrivacy?: () => void;
  onTerms?: () => void;
  onPricing?: () => void;
  onProfile?: () => void;
  onUpload?: () => void;
  onBgRemover?: () => void;
  currentView?: string;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  onRaiseTicket,
  onProductionStudio,
  onMarketplaceKits,
  onBatchProduction,
  onBrandIdentity,
  onArchives,
  onAbout,
  onBlog,
  onRoadmap,
  onCareers,
  onPartners,
  onHelp,
  onApiDocs,
  onPrivacy,
  onTerms,
  onPricing,
  onProfile,
  onUpload,
  onBgRemover,
  currentView
}) => {
  // Smooth scroll handler for same-page interactions
  const handleSmoothScroll = (callback?: () => void) => {
    if (callback) {
      callback();
      // Wait for React to potentially re-render the view if we are changing view modes
      setTimeout(() => {
        const topElement = document.querySelector('main > div:first-child');
        if (topElement) {
          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          
          // Using window.scrollTo with an offset to account for sticky header height (approx 80px)
          const yOffset = -100; 
          const y = topElement.getBoundingClientRect().top + window.pageYOffset + yOffset;

          window.scrollTo({
            top: y,
            behavior: prefersReducedMotion ? 'auto' : 'smooth'
          });
        }
      }, 50);
    }
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-indigo-100 selection:text-indigo-900 pb-20 md:pb-0">
      <main className="flex-grow">
        {children}
      </main>
      
      {/* MOBILE BOTTOM NAVIGATION - ADDITIVE ONLY */}
      <nav className="fixed bottom-0 left-0 right-0 z-[250] bg-white/80 backdrop-blur-xl border-t border-gray-100 flex md:hidden items-center justify-around px-2 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button 
          onClick={() => handleSmoothScroll(onProductionStudio)}
          className={`flex flex-col items-center gap-1 px-2 py-1 rounded-2xl transition-all ${currentView === 'dashboard' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-[8px] font-black uppercase tracking-widest">Studio</span>
        </button>

        <button 
          onClick={() => handleSmoothScroll(onBgRemover)}
          className={`flex flex-col items-center gap-1 px-2 py-1 rounded-2xl transition-all ${currentView === 'bg_remover' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="text-[8px] font-black uppercase tracking-widest">Eraser</span>
        </button>

        <button 
          onClick={() => handleSmoothScroll(onUpload)}
          className={`flex flex-col items-center gap-1 px-2 py-1 rounded-2xl transition-all ${currentView === 'generate' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span className="text-[8px] font-black uppercase tracking-widest">Upload</span>
        </button>

        <button 
          onClick={() => handleSmoothScroll(onArchives)}
          className={`flex flex-col items-center gap-1 px-2 py-1 rounded-2xl transition-all ${currentView === 'downloads' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3zm0 4h16m-8 4h4" />
          </svg>
          <span className="text-[8px] font-black uppercase tracking-widest">Archives</span>
        </button>

        <button 
          onClick={() => handleSmoothScroll(onPricing)}
          className={`flex flex-col items-center gap-1 px-2 py-1 rounded-2xl transition-all ${currentView === 'pricing' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-[8px] font-black uppercase tracking-widest">Plans</span>
        </button>
      </nav>

      <footer className="bg-white border-t border-gray-100 py-16 mt-20">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12">
          {/* Main Footer Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
            
            {/* Column 1: Brand & Summary */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-900 rounded-2xl flex items-center justify-center shadow-lg shadow-gray-200">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <span className="text-xl font-black tracking-tight text-slate-900">Catalog<span className="text-indigo-600 italic">AI</span></span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs font-medium">
                Professional AI-driven photoshoot engine for digital brands. Generate marketplace-ready product assets with pixel-perfect accuracy.
              </p>
              <div className="flex gap-4 pt-2">
                {['LinkedIn', 'X', 'Instagram'].map(platform => (
                  <a key={platform} href="#" className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-white transition-all">
                    <span className="sr-only">{platform}</span>
                    <div className="w-5 h-5 bg-current opacity-20 rounded-sm" />
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2: Product / Capabilities */}
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Capabilities</h4>
              <ul className="space-y-4 text-xs font-bold text-slate-600">
                <li><button onClick={() => handleSmoothScroll(onProductionStudio)} className="hover:text-indigo-600 transition-colors flex items-center gap-2">Production Studio</button></li>
                <li><button onClick={() => handleSmoothScroll(onBgRemover)} className="hover:text-indigo-600 transition-colors flex items-center gap-2">Background Remover</button></li>
                <li><button onClick={() => handleSmoothScroll(onMarketplaceKits)} className="hover:text-indigo-600 transition-colors flex items-center gap-2">Marketplace Kits <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-md">Pro</span></button></li>
                <li><button onClick={() => handleSmoothScroll(onBatchProduction)} className="hover:text-indigo-600 transition-colors flex items-center gap-2">Batch Production</button></li>
                <li><button onClick={() => handleSmoothScroll(onBrandIdentity)} className="hover:text-indigo-600 transition-colors flex items-center gap-2">Brand Identity Overlay</button></li>
                <li><button onClick={() => handleSmoothScroll(onArchives)} className="hover:text-indigo-600 transition-colors flex items-center gap-2">Archives & SKU Mapping</button></li>
              </ul>
            </div>

            {/* Column 3: Company */}
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Company</h4>
              <ul className="space-y-4 text-xs font-bold text-slate-600">
                <li><button onClick={() => handleSmoothScroll(onAbout)} className="hover:text-indigo-600 transition-colors">About CatalogAI</button></li>
                <li><button onClick={() => handleSmoothScroll(onBlog)} className="hover:text-indigo-600 transition-colors">Intelligence Blog</button></li>
                <li><button onClick={() => handleSmoothScroll(onRoadmap)} className="hover:text-indigo-600 transition-colors flex items-center gap-2">Product Roadmap <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span></button></li>
                <li><button onClick={() => handleSmoothScroll(onCareers)} className="hover:text-indigo-600 transition-colors">Careers</button></li>
                <li><button onClick={() => handleSmoothScroll(onPartners)} className="hover:text-indigo-600 transition-colors">Partner Program</button></li>
              </ul>
            </div>

            {/* Column 4: Legal & Support */}
            <div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Support & Trust</h4>
              <ul className="space-y-4 text-xs font-bold text-slate-600">
                <li><button onClick={() => handleSmoothScroll(onHelp)} className="hover:text-indigo-600 transition-colors">Support Center</button></li>
                <li><button onClick={() => handleSmoothScroll(onRaiseTicket)} className="hover:text-indigo-600 transition-colors text-left">Support Ticket</button></li>
                <li><button onClick={() => handleSmoothScroll(onApiDocs)} className="hover:text-indigo-600 transition-colors">API Documentation</button></li>
                <li><button onClick={() => handleSmoothScroll(onPrivacy)} className="hover:text-indigo-600 transition-colors">Privacy Policy</button></li>
                <li><button onClick={() => handleSmoothScroll(onTerms)} className="hover:text-indigo-600 transition-colors">Terms of Service</button></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-100 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <span>© 2025 CatalogAI Engine v2.5</span>
              <span className="text-gray-200">•</span>
              <span className="flex items-center gap-1.5">
                Powered by <span className="text-indigo-500">Gemini</span>
              </span>
            </div>
            <div className="flex gap-8">
              <button onClick={() => handleSmoothScroll(onPrivacy)} className="hover:text-slate-900 transition-colors">Privacy</button>
              <button onClick={() => handleSmoothScroll(onTerms)} className="hover:text-slate-900 transition-colors">Terms</button>
              <button className="hover:text-slate-900 transition-colors cursor-default">Cookies</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
