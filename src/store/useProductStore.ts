import { create } from 'zustand';
import { Product } from '@/types';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/firebase';
import { useBranchStore } from './useBranchStore';

interface ProductState {
  products: Product[];
  loading: boolean;
  initialized: boolean;
  initProducts: () => void;
}

let unsubscribe: (() => void) | null = null;

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  loading: true,
  initialized: false,
  initProducts: () => {
    if (get().initialized) return;
    set({ loading: true });
    
    if (unsubscribe) {
        unsubscribe();
    }
    
    const branch = useBranchStore.getState().currentBranch;
    const collectionName = branch === 'cafe' ? 'products' : 'products_hospital';
    
    // Subscribe to products in real-time
    unsubscribe = onSnapshot(query(collection(db, collectionName)), (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      set({ products: productsData, loading: false, initialized: true });
    }, (err) => {
      console.error('Failed to listen to products', err);
      set({ loading: false });
    });
  }
}));
