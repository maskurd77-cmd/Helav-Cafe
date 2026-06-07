import { create } from 'zustand';
import { usePosStore } from './usePosStore';

export type Branch = 'cafe' | 'hospital';

interface BranchState {
  currentBranch: Branch;
  setBranch: (branch: Branch) => void;
}

export const useBranchStore = create<BranchState>((set) => ({
  currentBranch: (localStorage.getItem('helav_branch') as Branch) || 'cafe',
  setBranch: (branch) => {
    localStorage.setItem('helav_branch', branch);
    // Clear cart since products differ between cafe and hospital
    usePosStore.getState().clearCart();
    set({ currentBranch: branch });
  }
}));
