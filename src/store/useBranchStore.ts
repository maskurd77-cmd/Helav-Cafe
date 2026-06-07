import { create } from 'zustand';
import { usePosStore } from './usePosStore';

export type Branch = 'cafe';

interface BranchState {
  currentBranch: Branch;
  setBranch: (branch: Branch) => void;
}

export const useBranchStore = create<BranchState>((set) => ({
  currentBranch: 'cafe',
  setBranch: (branch) => {
    // Only cafe exists
    set({ currentBranch: 'cafe' });
  }
}));

