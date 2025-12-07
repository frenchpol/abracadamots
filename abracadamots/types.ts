

export interface Child {
  id: string; // UUID
  name: string;
  created_at: string;
  faceColor?: string; // Couleur de fond de l'avatar
}

export interface WordItem {
  id: string; // UUID
  text: string;
  masteredCount: number; // Nombre de fois réussi
  stars: number; // Score actuel (0-3)
  attempts: number; // Nombre d'essais total
  bestStreak: number; // Meilleure série
}

export interface WordList {
  id: string; // UUID
  childId: string; // Lien vers l'enfant
  name: string;
  isSelected: boolean; // Si la liste est active pour le jeu
  words: WordItem[];
}

export interface Settings {
  requiredMasteredCount: number; // Par défaut: 3
  writingStyle: 'standard' | 'lowercase' | 'cursive';
  soundEnabled: boolean;
  gameModes: {
    puzzle: boolean; // Mode "Reconstituer le mot" (Facile)
    puzzleMedium: boolean; // Mode "Reconstituer + pièges" (Moyen)
    typing: boolean; // Mode "Écrire le mot" (Difficile)
  };
  selectedChildId: string | null; // ID de l'enfant actuellement en train de jouer
}

export interface AppData {
  children: Child[];
  wordLists: WordList[];
  settings: Settings;
}

export const DEFAULT_SETTINGS: Settings = {
  requiredMasteredCount: 3,
  writingStyle: 'standard',
  soundEnabled: true,
  gameModes: {
    puzzle: true,
    puzzleMedium: true,
    typing: false,
  },
  selectedChildId: null,
};

export const INITIAL_DATA: AppData = {
  children: [],
  wordLists: [],
  settings: DEFAULT_SETTINGS,
};