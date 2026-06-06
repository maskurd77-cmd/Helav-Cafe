import { create } from 'zustand';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import { useBranchStore } from './useBranchStore';

interface SettingsState {
  settings: {
    storeName: string;
    address: string;
    phone: string;
    footerMessage: string;
    logoUrl: string;
    greetingMessage: string;
    subGreeting: string;
    enableVirtualKeyboard: boolean;
  };
  loading: boolean;
  initialized: boolean;
  initSettings: () => void;
}

let unsubscribe: (() => void) | null = null;

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: {
    storeName: 'Helav Cafe',
    address: 'هەولێر',
    phone: '',
    footerMessage: 'سوپاس بۆ سەردانت!',
    logoUrl: '',
    greetingMessage: 'بەخێربێیت بۆ کافێکەمان',
    subGreeting: 'ئێمە لێرەین بۆ پێشکەشکردنی باشترین تام و چێژ بۆ ئێوەی ئازیز.',
    enableVirtualKeyboard: false
  },
  loading: true,
  initialized: false,
  initSettings: () => {
    if (get().initialized) return;
    set({ loading: true });
    
    if (unsubscribe) {
        unsubscribe();
    }
    
    const branch = useBranchStore.getState().currentBranch;
    const docName = branch === 'cafe' ? 'general' : 'hospital';
    
    unsubscribe = onSnapshot(doc(db, 'settings', docName), (docSnap) => {
      if (docSnap.exists()) {
          set({ settings: { ...get().settings, ...docSnap.data() as any }, loading: false, initialized: true });
      } else {
          set({ loading: false, initialized: true });
      }
    }, (err) => {
      console.error('Failed to listen to settings', err);
      set({ loading: false });
    });
  }
}));
