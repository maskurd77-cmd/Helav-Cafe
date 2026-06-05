import { create } from 'zustand';
import { CartItem, Product } from '@/types';

interface PosState {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

export const usePosStore = create<PosState>((set, get) => ({
  cart: [],
  addToCart: (product) => {
    set((state) => {
      const existing = state.cart.find(item => item.id === product.id);
      let newCart;
      if (existing) {
        newCart = state.cart.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        newCart = [...state.cart, { ...product, quantity: 1 }];
      }
      localStorage.setItem('customer_cart', JSON.stringify(newCart));
      return { cart: newCart };
    });
  },
  removeFromCart: (productId) => {
    set((state) => {
      const newCart = state.cart.filter(item => item.id !== productId);
      localStorage.setItem('customer_cart', JSON.stringify(newCart));
      return { cart: newCart };
    });
  },
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set((state) => {
      const newCart = state.cart.map(item => 
        item.id === productId ? { ...item, quantity } : item
      );
      localStorage.setItem('customer_cart', JSON.stringify(newCart));
      return { cart: newCart };
    });
  },
  clearCart: () => {
    localStorage.removeItem('customer_cart');
    set({ cart: [] });
  },
  getCartTotal: () => {
    return get().cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }
}));
