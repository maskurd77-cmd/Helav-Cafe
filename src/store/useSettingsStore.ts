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
    promoSlides: { title: string; desc: string; tag: string; image: string; }[];
  };
  loading: boolean;
  initialized: boolean;
  loadedBranch: Branch | null;
  initSettings: () => void;
}

let unsubscribe: (() => void) | null = null;

const defaultSlides = [
  {
    title: 'قاوەی داخی هێلاڤ',
    desc: 'بۆن و تامی ڕەسەنی قاوەی کوردی و جیهانی لەگەڵ شیری سروشتی گەرم.',
    tag: 'خواستی زۆری لەسەرە 🔥',
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=400'
  },
  {
    title: 'شیرینی و کێکە تازەکانمان',
    desc: 'هەموو بەیانییەک بە گەرمی و تازەیی بە کوالیتییەکی بەرز و بێوێنە ئامادە دەکرێن.',
    tag: 'هەمیشە تازە 🍰',
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=400'
  },
  {
    title: 'ژینگەیەکی ئارام و بێدەنگ',
    desc: 'شوێنێکی گونجاو پێشکەش دەکەین بۆ کۆبوونەوە، خوێندنەوە، و بەسەربردنی کاتی ناوازە.',
    tag: 'ئاسودەیی دڵ ☕',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&q=80&w=400'
  }
];

const defaultSettings = {
  cafe: {
    storeName: 'Helav Cafe',
    address: 'هەولێر - شەقامی ١٠٠ مەتری',
    phone: '07500000000',
    footerMessage: 'سوپاس بۆ سەردانتان بۆ هێلاڤ کافێ!',
    logoUrl: '',
    greetingMessage: 'بەخێربێیت بۆ هێلاڤ کافێ',
    subGreeting: 'تامێکی جیاواز لە هەموو لایەکەوە بۆ ئارامبوونەوە تاقیبکەرەوە.',
    promoSlides: defaultSlides,
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
    promoSlides: defaultSlides,
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
    promoSlides: defaultSlides,
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
