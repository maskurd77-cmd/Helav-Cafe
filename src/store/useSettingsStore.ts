import { create } from 'zustand';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';

interface SettingsState {
  settings: {
    storeName: string;
    address: string;
    phone: string;
    footerMessage: string;
    logoUrl: string;
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
    logoUrl: ''
  },
  loading: true,
  initialized: false,
  initSettings: () => {
    if (get().initialized) return;
    set({ loading: true });
    
    if (unsubscribe) {
        unsubscribe();
    }
    
    unsubscribe = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
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
