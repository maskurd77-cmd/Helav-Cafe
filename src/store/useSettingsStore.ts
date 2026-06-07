import { create } from 'zustand';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import { useBranchStore, Branch } from './useBranchStore';

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
  loadedBranch: Branch | null;
  initSettings: () => void;
}

let unsubscribe: (() => void) | null = null;

const defaultSettings = {
  cafe: {
    storeName: 'Helav Cafe',
    address: 'هەولێر - شەقامی ١٠٠ مەتری',
    phone: '07500000000',
    footerMessage: 'سوپاس بۆ سەردانتان بۆ هێلاڤ کافێ!',
    logoUrl: '',
    greetingMessage: 'بەخێربێیت بۆ هێلاڤ کافێ',
    subGreeting: 'تامێکی جیاواز لە هەموو لایەکەوە بۆ ئارامبوونەوە تاقیبکەرەوە.',
    enableVirtualKeyboard: false
  },
  hospital: {
    storeName: 'Hospital Cafeteria',
    address: 'هەولێر - ناو نەخۆشخانە',
    phone: '07501111111',
    footerMessage: 'هیوای تەندروستیەکی باشتان بۆ دەخوازین!',
    logoUrl: '',
    greetingMessage: 'بەخێربێیت بۆ کافتریای نەخۆشخانە',
    subGreeting: 'پێشکەشکردنی باشترین جۆرەکانی خۆراک و خواردنەوەی تەندروست بۆ ئێوە.',
    enableVirtualKeyboard: false
  }
};

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
  loadedBranch: null,
  initSettings: () => {
    const branch = useBranchStore.getState().currentBranch;
    const cacheKey = `cached_settings_${branch}`;
    const fallback = branch === 'cafe' ? defaultSettings.cafe : defaultSettings.hospital;

    // Step 1: Immediately load from cache to prevent blank flashing and firebase quotas
    let cached: any = null;
    try {
      const serialized = localStorage.getItem(cacheKey);
      if (serialized) {
        cached = JSON.parse(serialized);
      }
    } catch (_) {}

    set({ 
      settings: cached ? { ...fallback, ...cached } : fallback, 
      loading: false, 
      initialized: true, 
      loadedBranch: branch 
    });
    
    if (unsubscribe) {
        unsubscribe();
    }
    
    const docName = branch === 'cafe' ? 'general' : 'hospital';
    
    // Step 2: Set up real-time listener with automatic persistence
    unsubscribe = onSnapshot(doc(db, 'settings', docName), (docSnap) => {
      if (docSnap.exists()) {
          const freshData = docSnap.data();
          const updated = { ...fallback, ...freshData };
          set({ settings: updated, loading: false, initialized: true });
          try {
            localStorage.setItem(cacheKey, JSON.stringify(freshData));
          } catch (_) {}
      } else {
          set({ loading: false, initialized: true });
      }
    }, (err) => {
      // In case of insufficient permissions or offline, act silently without crashing
      console.warn('Failed to listen to online settings (cached values retained):', err.message || err);
      // Turn off loading spinner
      set({ loading: false, initialized: true });
    });
  }
}));
