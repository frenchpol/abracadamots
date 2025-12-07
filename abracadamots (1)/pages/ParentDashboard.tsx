import React, { useState } from 'react';
import { AppData, WordList, Settings } from '../types';
import { storageService } from '../services/storage';
import { Clouds } from '../components/Visuals';
import { Mascot } from '../components/Mascot';
import { Trash2, Plus, User, CheckCircle, Circle, ArrowLeft, Edit3, Save, Pencil } from 'lucide-react';

interface ParentDashboardProps {
  onBack: () => void;
  onDataChange: () => void; // Trigger refresh in App
}

const PROFILE_COLORS = [
  '#FEE2E2', // Red-50
  '#FEF3C7', // Amber-50
  '#D1FAE5', // Emerald-100
  '#DBEAFE', // Blue-100
  '#E0E7FF', // Indigo-100
  '#F3E8FF', // Purple-100
  '#FAE8FF', // Fuchsia-100
  '#FFEDD5', // Orange-100
];

export const ParentDashboard: React.FC<ParentDashboardProps> = ({ onBack, onDataChange }) => {
  const [data, setData] = useState<AppData>(storageService.getFullData());
  const [activeTab, setActiveTab] = useState<'profiles' | 'settings'>('profiles');
  
  // Local state for forms
  const [newChildName, setNewChildName] = useState('');
  
  // State for adding/editing a list
  const [addingListFor, setAddingListFor] = useState<string | null>(null);
  const [editingListId, setEditingListId] = useState<string | null>(null); // If set, we are editing
  const [newListName, setNewListName] = useState('');
  const [newListWords, setNewListWords] = useState('');
  
  const refresh = () => {
    setData(storageService.getFullData());
    onDataChange();
  };

  // --- Handlers ---

  const handleAddChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim()) return;
    storageService.createChild(newChildName);
    setNewChildName('');
    refresh();
  };

  const handleDeleteChild = (id: string) => {
    if (confirm('Supprimer cet enfant et toutes ses listes ?')) {
      storageService.deleteChild(id);
      refresh();
    }
  };

  const handleColorChange = (childId: string, color: string) => {
    storageService.updateChild(childId, { faceColor: color });
    refresh();
  };

  const handleSaveNewList = () => {
    if (!addingListFor) return;
    if (!newListName.trim() || !newListWords.trim()) return;

    const wordsArray = newListWords.split('\n');
    
    if (editingListId) {
       storageService.updateList(editingListId, newListName, wordsArray);
    } else {
       storageService.createList(addingListFor, newListName, wordsArray);
    }
    
    handleCancelListForm();
    refresh();
  };

  const handleEditList = (list: WordList) => {
    setAddingListFor(list.childId);
    setEditingListId(list.id);
    setNewListName(list.name);
    setNewListWords(list.words.map(w => w.text).join('\n'));
  };

  const handleCancelListForm = () => {
    setNewListName('');
    setNewListWords('');
    setAddingListFor(null);
    setEditingListId(null);
  };

  const handleDeleteList = (id: string) => {
    if (confirm('Supprimer cette liste ?')) {
      storageService.deleteList(id);
      refresh();
    }
  };

  const handleSaveSettings = (newSettings: Settings) => {
    storageService.saveSettings(newSettings);
    refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#60A5FA] to-[#93C5FD] flex flex-col relative overflow-hidden font-sans">
      <Clouds />

      {/* Header */}
      <header className="relative z-10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack} 
            className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors backdrop-blur-sm shadow-sm"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-white drop-shadow-md">Espace Parents</h1>
        </div>
      </header>

      {/* Content Wrapper */}
      <div className="flex-1 p-4 max-w-3xl mx-auto w-full relative z-10 flex flex-col">
        
        {/* Tabs */}
        <div className="flex bg-black/10 backdrop-blur-md p-1 rounded-2xl mb-6">
          <button 
            onClick={() => setActiveTab('profiles')}
            className={`flex-1 py-3 rounded-xl text-center font-bold transition-all shadow-sm ${
              activeTab === 'profiles' 
                ? 'bg-white text-brand-blue shadow-md' 
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            Profils & Mots
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-3 rounded-xl text-center font-bold transition-all shadow-sm ${
              activeTab === 'settings' 
                ? 'bg-white text-brand-blue shadow-md' 
                : 'text-white/80 hover:bg-white/10'
            }`}
          >
            Réglages
          </button>
        </div>

        {/* PROFILES TAB */}
        {activeTab === 'profiles' && (
          <div className="space-y-8 animate-pop">
            
            {/* Add Child Section */}
            <div className="bg-white/95 backdrop-blur-xl p-6 rounded-3xl shadow-xl">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-brand-blue">
                <Plus className="w-6 h-6" /> Ajouter un enfant
              </h2>
              <form onSubmit={handleAddChild} className="flex gap-3">
                <input 
                  type="text" 
                  value={newChildName}
                  onChange={(e) => setNewChildName(e.target.value)}
                  placeholder="Prénom..." 
                  className="flex-1 p-4 bg-blue-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-blue outline-none text-slate-700 placeholder:text-slate-400 font-medium"
                />
                <button className="bg-brand-green text-white px-6 rounded-2xl font-bold hover:bg-green-500 transition-colors shadow-lg active:scale-95">
                  Créer
                </button>
              </form>
            </div>

            {/* Children List */}
            <div className="space-y-6 pb-10">
              {data.children.map((child, index) => {
                const childLists = storageService.getLists(child.id);
                const isAdding = addingListFor === child.id;
                // Fallback color logic
                const color = child.faceColor || PROFILE_COLORS[index % PROFILE_COLORS.length];

                return (
                  <div key={child.id} className="bg-white/90 backdrop-blur-md rounded-3xl shadow-lg overflow-hidden border border-white/50">
                    {/* Header Card */}
                    <div className="p-5 bg-white/50 border-b border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center border-2 border-brand-blue shadow-sm overflow-hidden bg-white shrink-0">
                           <Mascot mood="happy" faceColor={color} className="w-14 h-14" />
                        </div>
                        <div>
                           <h3 className="font-bold text-2xl text-slate-800">{child.name}</h3>
                           <p className="text-sm text-slate-500 font-medium">{childLists.filter(l => l.isSelected).length} listes actives</p>
                           
                           {/* Color Picker (Small Dots) */}
                           <div className="flex gap-1.5 mt-2">
                              {PROFILE_COLORS.map(c => (
                                <button 
                                  key={c}
                                  onClick={() => handleColorChange(child.id, c)}
                                  className={`w-5 h-5 rounded-full border border-slate-300 transition-transform active:scale-90 ${color === c ? 'ring-2 ring-brand-blue scale-110' : 'hover:scale-110'}`}
                                  style={{ backgroundColor: c }}
                                  title="Changer la couleur"
                                />
                              ))}
                           </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteChild(child.id)} 
                        className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors self-end sm:self-center"
                        title="Supprimer le profil"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Lists Content */}
                    <div className="p-6">
                       <h4 className="font-bold text-brand-blue text-sm uppercase tracking-wider mb-4 opacity-80">Listes de mots</h4>
                       
                       <div className="space-y-3 mb-6">
                         {childLists.length === 0 && (
                           <p className="text-slate-400 italic text-sm text-center py-2">Aucune liste pour l'instant.</p>
                         )}
                         {childLists.map(list => (
                           <div key={list.id} className="flex items-center justify-between group p-3 -mx-2 rounded-2xl hover:bg-blue-50/80 transition-colors border border-transparent hover:border-blue-100">
                             <div 
                               className="flex items-center gap-4 cursor-pointer flex-1" 
                               onClick={() => { storageService.toggleListSelection(list.id); refresh(); }}
                             >
                                <button className="transition-transform active:scale-90">
                                  {list.isSelected 
                                    ? <CheckCircle className="w-7 h-7 text-brand-green fill-green-100" />
                                    : <Circle className="w-7 h-7 text-slate-300 hover:text-slate-400" />
                                  }
                                </button>
                                <div>
                                  <span className={`font-bold text-lg ${list.isSelected ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
                                    {list.name}
                                  </span>
                                  <div className="text-xs font-medium text-slate-400 mt-0.5">
                                     {list.words.length} mots
                                     {list.words.some(w => w.masteredCount > 0) && ` • ${Math.round(list.words.filter(w => w.masteredCount >= data.settings.requiredMasteredCount).length / list.words.length * 100)}% maîtrisé`}
                                  </div>
                                </div>
                             </div>
                             
                             <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditList(list)} className="text-slate-400 hover:text-brand-blue p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all">
                                   <Pencil className="w-5 h-5" />
                                </button>
                                <button onClick={() => handleDeleteList(list.id)} className="text-slate-400 hover:text-red-500 p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all">
                                  <Trash2 className="w-5 h-5" />
                                </button>
                             </div>
                           </div>
                         ))}
                       </div>

                       {/* Inline Add List Form */}
                       {isAdding ? (
                         <div className="bg-blue-50 p-5 rounded-2xl border-2 border-blue-200 animate-pop">
                            <h5 className="font-bold text-brand-blue mb-4 flex items-center gap-2">
                               <Edit3 className="w-4 h-4"/> {editingListId ? 'Modifier la liste' : 'Nouvelle liste'}
                            </h5>
                            <input 
                              autoFocus
                              type="text"
                              placeholder="Nom de la liste (ex: Animaux)"
                              value={newListName}
                              onChange={e => setNewListName(e.target.value)}
                              className="w-full p-3 mb-3 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-brand-blue bg-white"
                            />
                            <textarea 
                              placeholder="Mots (un par ligne)"
                              value={newListWords}
                              onChange={e => setNewListWords(e.target.value)}
                              className="w-full p-3 mb-4 rounded-xl border border-blue-200 h-32 text-base focus:outline-none focus:ring-2 focus:ring-brand-blue font-mono bg-white resize-none"
                            />
                            <div className="flex justify-end gap-3">
                              <button 
                                onClick={handleCancelListForm} 
                                className="px-4 py-2 text-slate-500 hover:text-slate-700 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                              >
                                Annuler
                              </button>
                              <button 
                                onClick={handleSaveNewList} 
                                className="px-6 py-2 bg-brand-blue text-white rounded-xl font-bold hover:bg-blue-600 shadow-md active:scale-95 transition-all flex items-center gap-2"
                              >
                                <Save className="w-4 h-4" /> Enregistrer
                              </button>
                            </div>
                         </div>
                       ) : (
                         <button 
                           onClick={() => { setAddingListFor(child.id); setNewListName(''); setNewListWords(''); setEditingListId(null); }}
                           className="w-full py-3 rounded-xl border-2 border-dashed border-blue-200 text-brand-blue font-bold hover:bg-blue-50/50 hover:border-brand-blue transition-all flex items-center justify-center gap-2"
                         >
                            <Plus className="w-5 h-5" /> Créer une liste de mots
                         </button>
                       )}
                    </div>
                  </div>
                );
              })}
              
              {data.children.length === 0 && (
                <div className="text-center py-10 bg-white/50 backdrop-blur-sm rounded-3xl border border-white/50">
                  <User className="w-20 h-20 mx-auto mb-4 text-white opacity-50" />
                  <p className="text-white font-bold text-lg drop-shadow-sm">Commence par créer un profil ci-dessus ! 👆</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-pop">
            <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-xl space-y-8 text-slate-800">
              
              {/* Threshold */}
              <div>
                <label className="block text-lg font-bold text-brand-blue mb-4">Réussites requises pour maîtriser un mot</label>
                <div className="flex gap-6 items-center">
                  <input 
                    type="range" min="1" max="10" 
                    value={data.settings.requiredMasteredCount}
                    onChange={(e) => handleSaveSettings({...data.settings, requiredMasteredCount: parseInt(e.target.value)})}
                    className="flex-1 accent-brand-blue h-3 rounded-lg bg-slate-200 appearance-none cursor-pointer"
                  />
                  <div className="w-14 h-14 bg-brand-blue text-white rounded-2xl flex items-center justify-center text-2xl font-bold shadow-md">
                    {data.settings.requiredMasteredCount}
                  </div>
                </div>
                <p className="text-sm text-slate-500 mt-3 font-medium">Plus ce nombre est élevé, plus l'entraînement sera long.</p>
              </div>

              <div className="border-t border-slate-100" />

              {/* Writing Style */}
              <div>
                <label className="block text-lg font-bold text-brand-blue mb-4">Style d'écriture</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    {id: 'standard', label: 'Bâton (ABCD)', class: 'font-sans'},
                    {id: 'lowercase', label: 'Script (abcd)', class: 'lowercase'},
                    {id: 'cursive', label: 'Cursive', class: 'font-cursive text-3xl'}
                  ].map(style => (
                    <button 
                      key={style.id}
                      onClick={() => handleSaveSettings({...data.settings, writingStyle: style.id as any})}
                      className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                        data.settings.writingStyle === style.id 
                          ? 'border-brand-blue bg-blue-50 text-brand-blue shadow-md scale-[1.02]' 
                          : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50 text-slate-600'
                      } ${style.class}`}
                    >
                      <span className="text-3xl font-bold">Aa</span>
                      <span className="text-xs font-sans font-bold opacity-60 uppercase">{style.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100" />

              {/* Game Modes */}
              <div>
                <label className="block text-lg font-bold text-brand-blue mb-4">Modes de jeu activés</label>
                <div className="grid grid-cols-1 gap-4">
                  
                  {/* Mode Easy */}
                  <label className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    data.settings.gameModes.puzzle 
                      ? 'border-brand-green bg-green-50 shadow-sm' 
                      : 'border-slate-100 hover:bg-slate-50'
                  }`}>
                    <input 
                      type="checkbox" 
                      checked={data.settings.gameModes.puzzle}
                      onChange={(e) => handleSaveSettings({...data.settings, gameModes: {...data.settings.gameModes, puzzle: e.target.checked}})}
                      className="w-6 h-6 accent-brand-green rounded"
                    />
                    <div>
                      <span className="font-bold block text-lg text-slate-800">🧩 Puzzle</span>
                      <span className="text-xs font-bold text-slate-500 uppercase">Facile : Lettres du mot</span>
                    </div>
                  </label>

                  {/* Mode Medium */}
                   <label className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    data.settings.gameModes.puzzleMedium 
                      ? 'border-brand-yellow bg-yellow-50 shadow-sm' 
                      : 'border-slate-100 hover:bg-slate-50'
                  }`}>
                    <input 
                      type="checkbox" 
                      checked={!!data.settings.gameModes.puzzleMedium} // Handle potential undefined in old data
                      onChange={(e) => handleSaveSettings({...data.settings, gameModes: {...data.settings.gameModes, puzzleMedium: e.target.checked}})}
                      className="w-6 h-6 accent-brand-yellow rounded"
                    />
                    <div>
                      <span className="font-bold block text-lg text-slate-800">⚡ Puzzle +</span>
                      <span className="text-xs font-bold text-slate-500 uppercase">Moyen : Lettres + Pièges</span>
                    </div>
                  </label>

                  {/* Mode Hard */}
                  <label className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                    data.settings.gameModes.typing 
                      ? 'border-brand-orange bg-orange-50 shadow-sm' 
                      : 'border-slate-100 hover:bg-slate-50'
                  }`}>
                    <input 
                      type="checkbox" 
                      checked={data.settings.gameModes.typing}
                      onChange={(e) => handleSaveSettings({...data.settings, gameModes: {...data.settings.gameModes, typing: e.target.checked}})}
                      className="w-6 h-6 accent-brand-orange rounded"
                    />
                     <div>
                      <span className="font-bold block text-lg text-slate-800">⌨️ Clavier</span>
                      <span className="text-xs font-bold text-slate-500 uppercase">Difficile : Écrire le mot</span>
                    </div>
                  </label>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};