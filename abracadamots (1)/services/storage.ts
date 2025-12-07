
import { AppData, Child, INITIAL_DATA, Settings, WordItem, WordList } from '../types';

const STORAGE_KEY = 'tiptap_data';

const PROFILE_COLORS = [
  '#FEE2E2', '#FEF3C7', '#D1FAE5', '#DBEAFE', 
  '#E0E7FF', '#F3E8FF', '#FAE8FF', '#FFEDD5'
];

// --- Core Helper ---

const generateUUID = (): string => {
  return crypto.randomUUID();
};

const getStore = (): AppData => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_DATA;
    return JSON.parse(raw) as AppData;
  } catch (e) {
    console.error("Failed to load data", e);
    return INITIAL_DATA;
  }
};

const setStore = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// --- Exported Service Methods ---

export const storageService = {
  init: (): AppData => {
    const data = getStore();
    if (!localStorage.getItem(STORAGE_KEY)) {
      setStore(INITIAL_DATA);
    }
    return data;
  },

  // --- Children ---

  getChildren: (): Child[] => {
    return getStore().children;
  },

  createChild: (name: string): Child => {
    const data = getStore();
    const newChild: Child = {
      id: generateUUID(),
      name,
      created_at: new Date().toISOString(),
      // Assign random color
      faceColor: PROFILE_COLORS[Math.floor(Math.random() * PROFILE_COLORS.length)]
    };
    data.children.push(newChild);
    
    // Auto-select if first child
    if (!data.settings.selectedChildId) {
      data.settings.selectedChildId = newChild.id;
    }

    setStore(data);
    return newChild;
  },

  updateChild: (id: string, updates: Partial<Child>) => {
    const data = getStore();
    const index = data.children.findIndex(c => c.id === id);
    if (index !== -1) {
      data.children[index] = { ...data.children[index], ...updates };
      setStore(data);
    }
  },

  deleteChild: (id: string) => {
    const data = getStore();
    data.children = data.children.filter(c => c.id !== id);
    data.wordLists = data.wordLists.filter(l => l.childId !== id);
    
    if (data.settings.selectedChildId === id) {
      data.settings.selectedChildId = data.children.length > 0 ? data.children[0].id : null;
    }
    setStore(data);
  },

  // --- Lists ---

  getLists: (childId: string): WordList[] => {
    return getStore().wordLists.filter(l => l.childId === childId);
  },

  createList: (childId: string, name: string, rawWords: string[]) => {
    const data = getStore();
    const words: WordItem[] = rawWords
      .map(w => w.trim())
      .filter(w => w.length > 0)
      .map(text => ({
        id: generateUUID(),
        text: text,
        masteredCount: 0,
        stars: 0,
        attempts: 0,
        bestStreak: 0
      }));

    const newList: WordList = {
      id: generateUUID(),
      childId,
      name,
      isSelected: true, // Auto-select new lists
      words
    };
    
    data.wordLists.push(newList);
    setStore(data);
  },

  updateList: (listId: string, name: string, rawWords: string[]) => {
    const data = getStore();
    const listIndex = data.wordLists.findIndex(l => l.id === listId);
    if (listIndex === -1) return;

    const oldList = data.wordLists[listIndex];
    const processedNewWords = rawWords.map(w => w.trim()).filter(w => w.length > 0);

    // Smart merge: Preserve stats if the word text matches exactly
    const newWordsObjects: WordItem[] = processedNewWords.map(text => {
      const existingWord = oldList.words.find(w => w.text === text);
      if (existingWord) {
        return existingWord;
      }
      return {
        id: generateUUID(),
        text: text,
        masteredCount: 0,
        stars: 0,
        attempts: 0,
        bestStreak: 0
      };
    });

    data.wordLists[listIndex] = {
      ...oldList,
      name: name,
      words: newWordsObjects
    };
    setStore(data);
  },

  deleteList: (listId: string) => {
    const data = getStore();
    data.wordLists = data.wordLists.filter(l => l.id !== listId);
    setStore(data);
  },

  toggleListSelection: (listId: string) => {
    const data = getStore();
    const list = data.wordLists.find(l => l.id === listId);
    if (list) {
      list.isSelected = !list.isSelected;
      setStore(data);
    }
  },

  // --- Game Progress ---

  updateWordProgress: (childId: string, listId: string, wordId: string, success: boolean) => {
    const data = getStore();
    const list = data.wordLists.find(l => l.id === listId && l.childId === childId);
    if (!list) return;

    const word = list.words.find(w => w.id === wordId);
    if (!word) return;

    word.attempts += 1;
    if (success) {
      word.masteredCount += 1;
      word.stars = Math.min(3, word.stars + 1);
    } else {
      // Optional: Penalty logic, or just don't increment
    }

    setStore(data);
  },

  // --- Settings ---

  getSettings: (): Settings => {
    return getStore().settings;
  },

  saveSettings: (settings: Settings) => {
    const data = getStore();
    data.settings = settings;
    setStore(data);
  },

  getFullData: (): AppData => {
    return getStore();
  }
};
