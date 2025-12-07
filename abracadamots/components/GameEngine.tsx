
import React, { useState, useEffect, useCallback } from 'react';
import { Settings, WordItem } from '../types';
import { storageService } from '../services/storage';
import { ArrowLeft, Lightbulb, Trophy, Delete } from 'lucide-react';
import { Mascot } from './Mascot';
import { Clouds, MagicPoof } from './Visuals';
import { fireConfetti, fireFireworks } from '../utils/confetti';

interface GameEngineProps {
  childId: string;
  settings: Settings;
  onExit: () => void;
}

type GameMode = 'puzzle' | 'puzzleMedium' | 'typing';
type GamePhase = 'loading' | 'memorize' | 'input' | 'success';

interface ActiveWord extends WordItem {
  listId: string;
}

export const GameEngine: React.FC<GameEngineProps> = ({ childId, settings, onExit }) => {
  const [phase, setPhase] = useState<GamePhase>('loading');
  const [playableWords, setPlayableWords] = useState<ActiveWord[]>([]);
  const [currentWord, setCurrentWord] = useState<ActiveWord | null>(null);
  const [mode, setMode] = useState<GameMode>('puzzle');
  const [childName, setChildName] = useState('');
  
  // Game State
  const [puzzleShuffled, setPuzzleShuffled] = useState<{char: string, id: number, used: boolean}[]>([]);
  const [puzzleBuffer, setPuzzleBuffer] = useState<string>(''); // What the user has built
  const [typingInput, setTypingInput] = useState<string>('');
  
  const [isWrong, setIsWrong] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  
  // Timer state for memorization
  const [timeLeft, setTimeLeft] = useState(5);
  // Visual state for the magical disappearance
  const [isVanishing, setIsVanishing] = useState(false);
  const [isTextVisible, setIsTextVisible] = useState(true);

  // Helper: Should we use lowercase? (Script OR Cursive)
  const useLowercase = settings.writingStyle === 'lowercase' || settings.writingStyle === 'cursive';

  // --- Initialization ---
  useEffect(() => {
    // Load Child Name
    const child = storageService.getChildren().find(c => c.id === childId);
    if (child) setChildName(child.name);

    // Load Words
    const lists = storageService.getLists(childId);
    const activeLists = lists.filter(l => l.isSelected);
    
    const candidates: ActiveWord[] = [];
    activeLists.forEach(list => {
      list.words.forEach(word => {
        if (word.masteredCount < settings.requiredMasteredCount) {
          candidates.push({ ...word, listId: list.id });
        }
      });
    });

    setPlayableWords(candidates);
    setPhase('loading');
  }, [childId, settings.requiredMasteredCount]);

  // Start game when words are loaded
  useEffect(() => {
    if (phase === 'loading' && playableWords.length > 0) {
      nextTurn();
    }
  }, [phase, playableWords]);

  // Check for Win State
  const isFinished = playableWords.length === 0 && !currentWord && phase !== 'loading';
  
  // Trigger fireworks on finish
  useEffect(() => {
    if (isFinished) {
      fireFireworks();
    }
  }, [isFinished]);

  // --- Logic ---

  // Helper to generate random distractor characters not in target
  const getDistractors = (targetWord: string, count: number) => {
    const alphabet = useLowercase ? "abcdefghijklmnopqrstuvwxyz" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const targetSet = new Set(targetWord.split(''));
    const distractors: string[] = [];
    
    while (distractors.length < count) {
      const char = alphabet[Math.floor(Math.random() * alphabet.length)];
      if (!targetSet.has(char)) {
        distractors.push(char);
      }
    }
    return distractors;
  };

  const preparePuzzle = (word: string) => {
    // 1. Create target characters
    let chars = word.split('').map((char, i) => ({
      char: useLowercase ? char.toLowerCase() : char.toUpperCase(),
      id: i, // ID 0 to N-1
      used: false
    }));

    // 2. If Medium mode, add distractors
    if (mode === 'puzzleMedium') {
      const distractorCount = Math.max(1, Math.ceil(word.length * 0.3)); // 30%, min 1
      const distractors = getDistractors(useLowercase ? word.toLowerCase() : word.toUpperCase(), distractorCount);
      
      distractors.forEach((char, i) => {
        chars.push({
          char: char,
          id: word.length + i, // Continue IDs
          used: false
        });
      });
    }

    // 3. Shuffle (Fisher-Yates)
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    setPuzzleShuffled(chars);
  };

  const nextTurn = useCallback(() => {
    if (playableWords.length === 0) {
      setCurrentWord(null);
      return;
    }

    // Filter out the current word to avoid immediate repetition
    let available = playableWords;
    if (currentWord && available.length > 1) {
      available = available.filter(w => w.id !== currentWord.id);
    }

    const randomIndex = Math.floor(Math.random() * available.length);
    const word = available[randomIndex];
    
    // Determine mode based on active settings
    const activeModes: GameMode[] = [];
    if (settings.gameModes.puzzle) activeModes.push('puzzle');
    if (settings.gameModes.puzzleMedium) activeModes.push('puzzleMedium');
    if (settings.gameModes.typing) activeModes.push('typing');

    // Default to puzzle if nothing selected (defensive)
    let nextMode: GameMode = 'puzzle';
    if (activeModes.length > 0) {
      nextMode = activeModes[Math.floor(Math.random() * activeModes.length)];
    }

    setCurrentWord(word);
    setMode(nextMode);
    
    // Reset State
    setPhase('memorize');
    setIsWrong(false);
    setTypingInput('');
    setPuzzleBuffer('');
    setHintsUsed(0);
    setTimeLeft(5);
    setIsVanishing(false);
    setIsTextVisible(true);
    
  }, [playableWords, settings.gameModes, currentWord]);

  // Handle Memorize Timer
  useEffect(() => {
    let interval: number;

    if (phase === 'memorize' && currentWord && !isVanishing) {
      // Prepare puzzle logic while waiting
      if (mode === 'puzzle' || mode === 'puzzleMedium') {
        preparePuzzle(currentWord.text);
      }
      
      // Start Countdown
      interval = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            // Trigger Magic Vanish Animation
            setIsVanishing(true);
            
            // Hide the text slightly later to allow smoke to cover it
            setTimeout(() => {
              setIsTextVisible(false);
            }, 500);

            // Wait for animation completion then switch phase
            setTimeout(() => {
              setPhase('input');
              setIsVanishing(false);
            }, 800); // Duration matches animation-smoke-puff
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [phase, currentWord, mode, settings.writingStyle, useLowercase, isVanishing]);


  // Actions
  const handleShuffle = () => {
    if (phase !== 'input' || (mode !== 'puzzle' && mode !== 'puzzleMedium')) return;
    setPuzzleBuffer('');
    preparePuzzle(currentWord!.text);
  };

  const handleHint = () => {
    if (phase !== 'input' || !currentWord) return;
    setHintsUsed(prev => prev + 1);

    const target = useLowercase 
      ? currentWord.text.toLowerCase() 
      : currentWord.text.toUpperCase();

    if (mode === 'puzzle' || mode === 'puzzleMedium') {
       const nextIndex = puzzleBuffer.length;
       if (nextIndex < target.length) {
         const nextChar = target[nextIndex];
         const charIndex = puzzleShuffled.findIndex(p => !p.used && p.char === nextChar);
         if (charIndex !== -1) {
            const newShuffled = [...puzzleShuffled];
            newShuffled[charIndex].used = true;
            setPuzzleShuffled(newShuffled);
            setPuzzleBuffer(prev => prev + nextChar);
         }
       }
    } else {
       const nextIndex = typingInput.length;
       if (nextIndex < target.length) {
         setTypingInput(target.substring(0, nextIndex + 1));
       }
    }
  };

  const validateAnswer = useCallback(() => {
    if (!currentWord || phase !== 'input') return;

    const target = useLowercase 
      ? currentWord.text.toLowerCase() 
      : currentWord.text.toUpperCase();
    
    const input = (mode === 'puzzle' || mode === 'puzzleMedium') ? puzzleBuffer : typingInput.trim();
    
    if (input.toLowerCase() === target.toLowerCase()) {
      handleSuccess();
    } else {
      handleFailure();
    }
  }, [currentWord, phase, mode, puzzleBuffer, typingInput, useLowercase]);

  // Auto-validation
  useEffect(() => {
    if (phase === 'input' && currentWord) {
      const inputLength = (mode === 'puzzle' || mode === 'puzzleMedium') ? puzzleBuffer.length : typingInput.trim().length;
      if (inputLength === currentWord.text.length) {
        validateAnswer();
      }
    }
  }, [phase, currentWord, mode, puzzleBuffer, typingInput, validateAnswer]);


  const handleSuccess = () => {
    setPhase('success');
    fireConfetti();
    
    storageService.updateWordProgress(childId, currentWord!.listId, currentWord!.id, true);

    if (currentWord!.masteredCount + 1 >= settings.requiredMasteredCount) {
      setPlayableWords(prev => prev.filter(w => w.id !== currentWord!.id));
    }

    setTimeout(() => {
      nextTurn();
    }, 1500);
  };

  const handleFailure = () => {
    setIsWrong(true);
    storageService.updateWordProgress(childId, currentWord!.listId, currentWord!.id, false);
    setTimeout(() => {
      setIsWrong(false);
      // Reset logic on failure
      setPuzzleBuffer('');
      setTypingInput('');
      setPuzzleShuffled(prev => prev.map(p => ({ ...p, used: false })));
    }, 500);
  };

  const onBackspace = () => {
    if (phase !== 'input') return;

    if (mode === 'puzzle' || mode === 'puzzleMedium') {
       if (puzzleBuffer.length === 0) return;
       const lastChar = puzzleBuffer[puzzleBuffer.length - 1];
       setPuzzleBuffer(prev => prev.slice(0, -1));
       
       const indexToRestore = puzzleShuffled.findIndex(p => p.used && p.char === lastChar);
       if (indexToRestore !== -1) {
         const newShuffled = [...puzzleShuffled];
         newShuffled[indexToRestore].used = false;
         setPuzzleShuffled(newShuffled);
       }
    } else {
       if (typingInput.length > 0) {
         setTypingInput(prev => prev.slice(0, -1));
       }
    }
  };

  const onPuzzlePieceClick = (charObj: {char: string, id: number, used: boolean}, index: number) => {
    if (phase !== 'input' || charObj.used) return;
    setPuzzleBuffer(prev => prev + charObj.char);
    const newShuffled = [...puzzleShuffled];
    newShuffled[index].used = true;
    setPuzzleShuffled(newShuffled);
  };

  // --- Render Helpers ---

  const fontClass = settings.writingStyle === 'cursive' ? 'font-cursive' : 'font-sans';

  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-6 bg-gradient-to-b from-blue-300 to-blue-100 z-10 relative">
        <Clouds />
        <div className="z-10 bg-white/80 p-10 rounded-3xl shadow-xl backdrop-blur-sm animate-pop">
          <Trophy className="w-32 h-32 text-yellow-400 animate-bounce mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-brand-blue mb-2">Champion !</h2>
          <p className="text-xl text-slate-600 mb-6">Tu as maîtrisé tous tes mots !</p>
          <button 
            onClick={onExit}
            className="bg-brand-green text-white px-8 py-3 rounded-full text-xl font-bold hover:bg-green-500 transition shadow-lg"
          >
            Retour au menu
          </button>
        </div>
      </div>
    );
  }

  // --- Main Render ---

  // Progress Percentage
  const totalNeeded = settings.requiredMasteredCount * (playableWords.length + (currentWord ? 1 : 0));
  const masteredWordsCount = storageService.getLists(childId).reduce((acc, l) => acc + l.words.filter(w => w.masteredCount >= settings.requiredMasteredCount).length, 0);
  const totalWordsCount = storageService.getLists(childId).reduce((acc, l) => acc + l.words.length, 0);

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-b from-[#60A5FA] to-[#93C5FD] relative overflow-hidden text-slate-800 select-none">
      <Clouds />

      {/* Header */}
      <div className="relative z-20 pt-4 px-4 pb-2">
        <div className="flex justify-between items-center mb-2">
          <button onClick={onExit} className="bg-brand-orange hover:bg-orange-500 text-white p-3 rounded-full shadow-lg transition-transform active:scale-95">
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <h1 className="text-white text-xl sm:text-2xl font-bold drop-shadow-md">
            Bonjour {childName} !
          </h1>

          <div className="bg-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
             <Trophy className="w-5 h-5 text-yellow-400 fill-yellow-400" />
             <span className="font-bold text-slate-700">{masteredWordsCount}</span>
          </div>
        </div>
        
        {/* Progress Bar Label */}
        <div className="text-white text-sm font-medium mb-1 drop-shadow-sm ml-1">
           Mots maîtrisés : {masteredWordsCount}/{totalWordsCount}
        </div>
        {/* Progress Bar Track */}
        <div className="w-full bg-black/20 h-4 rounded-full overflow-hidden backdrop-blur-sm">
           <div 
             className="bg-brand-green h-full transition-all duration-1000 ease-out"
             style={{ width: `${(masteredWordsCount / (totalWordsCount || 1)) * 100}%` }}
           ></div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 relative z-20 flex flex-col items-center justify-start pt-14 px-4 w-full max-w-lg mx-auto">
        
        {/* MEMORIZE PHASE: Big Pill Card */}
        {phase === 'memorize' && (
          <div className="w-full flex flex-col items-center relative">
             <div className="bg-white border-b-8 border-brand-blue rounded-[3.5rem] w-full py-4 min-h-[84px] flex items-center justify-center shadow-xl relative mb-8 px-16">
                
                {/* Magic Poof Overlay */}
                {isVanishing && <MagicPoof />}

                {/* Countdown floating badge - Top Right */}
                {!isVanishing && (
                  <div className="absolute -top-8 right-8 w-16 h-16 rounded-full border-4 border-brand-orange bg-white flex items-center justify-center text-2xl font-bold text-brand-orange animate-pulse shadow-md z-10">
                    {timeLeft}
                  </div>
                )}

                {isTextVisible && (
                  <h2 className={`${fontClass} text-4xl text-slate-800`}>
                     {useLowercase ? currentWord?.text.toLowerCase() : currentWord?.text.toUpperCase()}
                  </h2>
                )}
             </div>
             <p className={`text-white text-2xl font-medium animate-pulse transition-opacity ${isVanishing ? 'opacity-0' : 'opacity-100'}`}>Mémorise le mot...</p>
          </div>
        )}

        {/* INPUT PHASE */}
        {(phase === 'input' || phase === 'success') && (
           <div className="w-full flex flex-col items-center">
              
              {/* Target Slot (The Box) */}
              <div 
                className={`bg-white border-b-8 ${isWrong ? 'border-red-400 animate-shake' : 'border-brand-blue'} rounded-[3.5rem] w-full py-4 min-h-[84px] flex items-center justify-center shadow-xl relative transition-colors px-16`}
              >
                 {phase === 'success' && (
                    <div className="absolute -top-3 right-1/2 translate-x-1/2">
                       <div className="bg-brand-green text-white text-2xl px-4 py-1 rounded-full font-bold shadow-sm border border-white">Réussi !</div>
                    </div>
                 )}

                 {/* Backspace Button inside box (Larger now) */}
                 <button 
                    onClick={onBackspace}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-slate-300 hover:text-brand-orange hover:bg-orange-50 rounded-full transition-colors active:scale-95"
                    title="Effacer"
                 >
                    <Delete className="w-8 h-8" />
                 </button>

                 {mode === 'typing' ? (
                    <input 
                      type="text"
                      autoFocus
                      value={typingInput}
                      onChange={(e) => setTypingInput(e.target.value)}
                      className={`w-full text-center bg-transparent focus:outline-none ${fontClass} text-4xl text-slate-800 placeholder:text-slate-300`}
                      placeholder="..."
                    />
                 ) : (
                   <div className={`flex flex-wrap justify-center gap-1 ${fontClass} text-4xl text-slate-800 tracking-wide`}>
                      {puzzleBuffer.split('').map((char, i) => (
                        <span key={i} className="animate-pop">{char}</span>
                      ))}
                      {/* Cursor */}
                      {phase === 'input' && (
                         <span className="w-1 h-10 bg-slate-300 animate-pulse rounded-full ml-1"></span>
                      )}
                      {puzzleBuffer.length === 0 && phase === 'input' && (
                        <span className="text-slate-300 opacity-50 text-2xl font-sans absolute">...</span>
                      )}
                   </div>
                 )}
              </div>

              {/* Mascot */}
              <div className="my-6 transform hover:scale-110 transition-transform cursor-pointer" onClick={() => fireConfetti()}>
                 <Mascot 
                   mood={phase === 'success' ? 'happy' : isWrong ? 'sad' : 'neutral'} 
                   className="w-32 h-32 sm:w-40 sm:h-40"
                 />
              </div>

              {/* Instruction */}
              <div className="text-white font-bold text-2xl mb-4 drop-shadow-md text-center px-4 leading-tight">
                 {mode === 'typing' 
                  ? 'Écris le mot !' 
                  : mode === 'puzzleMedium'
                    ? <>
                        Reconstitue le mot
                        <br />
                        <span className="text-xl">(attention aux pièges !)</span>
                      </>
                    : 'Reconstitue le mot !'
                 }
              </div>

              {/* Puzzle Pieces (Only visible in puzzle modes) */}
              {(mode === 'puzzle' || mode === 'puzzleMedium') && (
                 <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {puzzleShuffled.map((item, idx) => (
                       <button
                         key={`${item.id}-${idx}`}
                         disabled={item.used || phase === 'success'}
                         onClick={() => onPuzzlePieceClick(item, idx)}
                         className={`
                           w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white shadow-md flex items-center justify-center text-3xl font-bold transition-all transform active:scale-90
                           ${item.used ? 'opacity-0 pointer-events-none scale-0' : 'opacity-100'}
                           ${fontClass} text-slate-700
                         `}
                       >
                          {item.char}
                       </button>
                    ))}
                 </div>
              )}
           </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      {(phase === 'input' || phase === 'success') && (
        <div className="relative z-30 bg-white/20 backdrop-blur-md p-4 pb-6 flex items-center justify-center gap-6 border-t border-white/20">
            <button 
                onClick={handleHint}
                disabled={phase === 'success'}
                className="w-20 h-20 rounded-full bg-brand-blue border-b-4 border-blue-600 text-white flex items-center justify-center active:translate-y-1 transition-all shadow-lg hover:bg-blue-400"
            >
              <Lightbulb className="w-10 h-10" />
            </button>
        </div>
      )}
    </div>
  );
};
