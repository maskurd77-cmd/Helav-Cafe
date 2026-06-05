import { create } from 'zustand';
import { Product } from '@/types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';

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
    
    // Subscribe to products in real-time, order if you like but we do client-side sorting if needed or just take as is
    unsubscribe = onSnapshot(query(collection(db, 'products')), (snapshot) => {
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
