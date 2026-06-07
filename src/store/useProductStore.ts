import { create } from 'zustand';
import { Product } from '@/types';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/firebase';
import { useBranchStore, Branch } from './useBranchStore';

interface ProductState {
  products: Product[];
  loading: boolean;
  initialized: boolean;
  loadedBranch: Branch | null;
  initProducts: () => void;
}

let unsubscribe: (() => void) | null = null;

// High-quality default fallback products
const defaultCafeProducts: Product[] = [
  { id: 'def-1', name: 'ئێسپڕێسۆ (Espresso)', price: 2500, category: 'گەرم', image: '', status: 'available' },
  { id: 'def-2', name: 'چای کوردی (Kurdish Tea)', price: 1500, category: 'گەرم', image: '', status: 'available' },
  { id: 'def-3', name: 'قاوەی تورکی (Turkish Coffee)', price: 2000, category: 'گەرم', image: '', status: 'available' },
  { id: 'def-4', name: 'ئەمەریکانۆ (Americano)', price: 3000, category: 'گەرم', image: '', status: 'available' },
  { id: 'def-5', name: 'ڤانیلا لاتێ (Vanilla Latte)', price: 4000, category: 'گەرم', image: '', status: 'available' },
  { id: 'def-6', name: 'ئایس بڕێو (Cold Brew)', price: 4500, category: 'سارد', image: '', status: 'available' },
  { id: 'def-7', name: 'شەربەتی پڕتاڵ (Orange Juice)', price: 3500, category: 'سارد', image: '', status: 'available' },
  { id: 'def-8', name: 'ئاوی کانزایی (Mineral Water)', price: 500, category: 'سارد', image: '', status: 'available' },
  { id: 'def-9', name: 'سەندویچ لایت (Sandwich)', price: 5000, category: 'خۆراک', image: '', status: 'available' },
  { id: 'def-10', name: 'دۆناتی چۆکلێت (Chocolate Donut)', price: 2500, category: 'شیرینی', image: '', status: 'available' },
];

const defaultHospitalProducts: Product[] = [
  { id: 'def-h1', name: 'چای سەوز (Green Tea)', price: 1500, category: 'گەرم', image: '', status: 'available' },
  { id: 'def-h2', name: 'ئاوی لیمۆ (Lemon Water)', price: 1000, category: 'گەرم', image: '', status: 'available' },
  { id: 'def-h3', name: 'شۆربای مریشک (Chicken Soup)', price: 3500, category: 'خۆراک', image: '', status: 'available' },
  { id: 'def-h4', name: 'سێوی فرێش (Apple Slices)', price: 2000, category: 'خۆراک', image: '', status: 'available' },
  { id: 'def-h5', name: 'ئاوی سروشتی (Fresh Water)', price: 500, category: 'سارد', image: '', status: 'available' },
];

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  loading: true,
  initialized: false,
  loadedBranch: null,
  initProducts: () => {
    const branch = useBranchStore.getState().currentBranch;
    const cacheKey = `cached_products_${branch}`;
    
    // Step 1: Attempt to load from localStorage cache immediately for maximum speed
    let cachedProducts: Product[] = [];
    try {
      const serialized = localStorage.getItem(cacheKey);
      if (serialized) {
        cachedProducts = JSON.parse(serialized);
      }
    } catch (e) {
      console.warn('Failed to parse cached products', e);
    }

    // If we have cache, set state immediately so UI is never empty!
    if (cachedProducts && cachedProducts.length > 0) {
      set({ 
        products: cachedProducts, 
        loading: false, 
        initialized: true, 
        loadedBranch: branch 
      });
    } else {
      // Load fallback products before Firebase connects to avoid showing blank screen
      set({
        products: branch === 'cafe' ? defaultCafeProducts : defaultHospitalProducts,
        loading: false,
        initialized: true,
        loadedBranch: branch
      });
    }
    
    if (unsubscribe) {
        unsubscribe();
    }
    
    const collectionName = branch === 'cafe' ? 'products' : 'products_hospital';
    
    // Step 2: Subscribe to real-time changes in Firestore
    unsubscribe = onSnapshot(query(collection(db, collectionName)), (snapshot) => {
      if (snapshot.empty) {
        // If Firestore is completely empty, use and save our default products as pre-population
        const defaults = branch === 'cafe' ? defaultCafeProducts : defaultHospitalProducts;
        set({ products: defaults, loading: false });
        try {
          localStorage.setItem(cacheKey, JSON.stringify(defaults));
        } catch (_) {}
        return;
      }

      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      // Save newly fetched data to local memory state and cache limits
      set({ products: productsData, loading: false, initialized: true });
      try {
        localStorage.setItem(cacheKey, JSON.stringify(productsData));
      } catch (err) {
        console.error('Failed to write products cache', err);
      }
    }, (err) => {
      // If we encounter a permission error or limit issue, keep the cache/defaults active silently
      console.warn('Failed to listen to online products (acting in offline/cache mode):', err.message || err);
      // Ensure loading spinner is turned off
      set({ loading: false, initialized: true });
    });
  }
}));
