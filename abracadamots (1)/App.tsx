import React, { useState, useEffect } from 'react';
import { storageService } from './services/storage';
import { AppData } from './types';
import { GameEngine } from './components/GameEngine';
import { Clouds } from './components/Visuals';
import { Mascot } from './components/Mascot';
import { ParentDashboard } from './pages/ParentDashboard';
import { Settings, Play, Plus } from 'lucide-react';

type Screen = 'HOME' | 'GAME' | 'PARENTS';

// Fallback colors if not yet set
const DEFAULT_COLORS = [
  '#FEE2E2', // Red-50
  '#FEF3C7', // Amber-50
  '#D1FAE5', // Emerald-100
  '#DBEAFE', // Blue-100
  '#E0E7FF', // Indigo-100
  '#F3E8FF', // Purple-100
  '#FAE8FF', // Fuchsia-100
  '#FFEDD5', // Orange-100
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('HOME');
  const [data, setData] = useState<AppData | null>(null);

  // Initial Load
  useEffect(() => {
    const loadedData = storageService.init();
    setData(loadedData);
  }, []);

  const refreshData = () => {
    setData(storageService.getFullData());
  };

  const selectChild = (id: string) => {
    if (!data) return;
    const newSettings = { ...data.settings, selectedChildId: id };
    storageService.saveSettings(newSettings);
    refreshData();
  };

  const activeChild = data?.children.find(c => c.id === data.settings.selectedChildId);

  // --- Render Logic ---

  if (!data) return null;

  if (currentScreen === 'GAME') {
    if (!activeChild) {
      // Fallback if no child selected but tried to play
      setCurrentScreen('HOME');
      return null;
    }
    return (
      <div className="fixed inset-0 bg-blue-50 overflow-hidden">
        <GameEngine 
          childId={activeChild.id} 
          settings={data.settings} 
          onExit={() => {
            refreshData(); // Sync progress stats
            setCurrentScreen('HOME');
          }} 
        />
      </div>
    );
  }

  if (currentScreen === 'PARENTS') {
    return <ParentDashboard onBack={() => setCurrentScreen('HOME')} onDataChange={refreshData} />;
  }

  // Home Screen
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#60A5FA] to-[#93C5FD] relative overflow-hidden text-slate-800">
      
      {/* Background */}
      <Clouds />

      {/* Parent Access Button (Top Right) */}
      <button 
        onClick={() => setCurrentScreen('PARENTS')}
        className="absolute top-6 right-6 z-50 p-3 bg-white/20 hover:bg-white/30 text-white rounded-full backdrop-blur-sm shadow-lg transition-all active:scale-95"
        title="Espace Parents"
      >
        <Settings className="w-7 h-7" />
      </button>

      <div className="z-10 text-center space-y-10 max-w-md w-full">
        
        {/* Logo area */}
        <div className="space-y-4 flex flex-col items-center">
          <div className="animate-bounce drop-shadow-md">
             <Mascot mood="happy" className="w-40 h-40" />
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight font-sans drop-shadow-md">
            abracada<span className="text-brand-yellow">Mots</span>
          </h1>
          <p className="text-white text-lg font-medium drop-shadow-sm">La magie de l'écriture !</p>
        </div>

        {/* Player Selector */}
        <div className="space-y-4">
           {data.children.length > 0 ? (
             <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-white/50 shadow-lg">
               <label className="block text-xs font-bold text-brand-blue uppercase tracking-widest mb-4">Qui va jouer ?</label>
               <div className="flex flex-wrap justify-center gap-6">
                 {data.children.map((child, index) => {
                   const isSelected = activeChild?.id === child.id;
                   // Use stored color or fallback to index based color
                   const color = child.faceColor || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
                   
                   return (
                     <button 
                       key={child.id}
                       onClick={() => selectChild(child.id)}
                       className={`flex flex-col items-center gap-2 transition-all duration-300 ${isSelected ? 'scale-110' : 'opacity-60 hover:opacity-100 hover:scale-105'}`}
                     >
                       <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg border-4 transition-colors overflow-hidden ${isSelected ? 'border-brand-orange bg-white' : 'border-slate-200 bg-slate-50'}`}>
                         <Mascot mood="neutral" faceColor={color} className="w-14 h-14" />
                       </div>
                       <span className={`font-bold text-sm ${isSelected ? 'text-brand-orange' : 'text-slate-600'}`}>
                         {child.name}
                       </span>
                     </button>
                   );
                 })}
               </div>
             </div>
           ) : (
             <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 border border-white/50 shadow-sm flex flex-col items-center gap-4">
               <p className="text-slate-500 italic">Aucun profil créé.</p>
               <button 
                  onClick={() => setCurrentScreen('PARENTS')}
                  className="bg-brand-blue hover:bg-blue-600 text-white rounded-full p-3 shadow-md transition-transform hover:scale-110"
                  title="Ajouter un enfant"
               >
                  <Plus className="w-6 h-6" />
               </button>
             </div>
           )}
        </div>

        {/* Main Actions */}
        <div className="space-y-4 w-full pt-4">
          <button 
            onClick={() => {
              if (activeChild) {
                setCurrentScreen('GAME');
              } else {
                alert("Sélectionne ou crée un profil d'abord !");
              }
            }}
            disabled={!activeChild}
            className={`w-full group relative text-white text-2xl font-bold py-5 rounded-3xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 overflow-hidden border-b-4 border-orange-500
              ${activeChild ? 'bg-brand-orange hover:bg-orange-400' : 'bg-slate-300 border-slate-400 cursor-not-allowed'}
            `}
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            <Play className="w-8 h-8 fill-current" />
            <span>JOUER</span>
          </button>
        </div>

      </div>
      
      <footer className="absolute bottom-4 text-center text-blue-100 text-xs opacity-70">
        v1.1 • abracadaMots
      </footer>
    </div>
  );
}