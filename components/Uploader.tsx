
import React, { useRef } from 'react';

interface UploaderProps {
  onImagesSelect: (files: { name: string, base64: string }[]) => void;
  itemCount: number;
}

export const Uploader: React.FC<UploaderProps> = ({ onImagesSelect, itemCount }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length > 0) {
      const results = await Promise.all(files.map(file => {
        return new Promise<{ name: string, base64: string }>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({ name: file.name, base64: reader.result as string });
          };
          reader.readAsDataURL(file);
        });
      }));
      onImagesSelect(results);
    }
  };

  return (
    <div className="w-full">
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`group relative cursor-pointer border-2 border-dashed rounded-[2rem] transition-all h-56 flex flex-col items-center justify-center overflow-hidden bg-gray-50/50 hover:bg-indigo-50/30 ${itemCount > 0 ? 'border-indigo-200 ring-4 ring-indigo-50/20' : 'border-gray-200 hover:border-indigo-300'}`}
      >
        <div className="text-center p-8 transition-transform group-hover:scale-105 duration-500">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all shadow-sm ${itemCount > 0 ? 'bg-indigo-600 text-white rotate-6' : 'bg-white text-gray-300 group-hover:text-indigo-400 group-hover:rotate-12'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <p className="text-sm text-gray-900 font-extrabold tracking-tight">
            {itemCount > 0 ? `Add to ${itemCount} Assets` : 'Import Raw Products'}
          </p>
          <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-[0.2em] font-extrabold">
            Drag & Drop Master Files
          </p>
        </div>
        
        {/* Decorative corner accents */}
        <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-gray-200 group-hover:border-indigo-400 transition-colors" />
        <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-gray-200 group-hover:border-indigo-400 transition-colors" />
        <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-gray-200 group-hover:border-indigo-400 transition-colors" />
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-gray-200 group-hover:border-indigo-400 transition-colors" />

        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          multiple
          className="hidden"
        />
      </div>
    </div>
  );
};
