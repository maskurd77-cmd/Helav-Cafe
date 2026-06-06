import { create } from 'zustand';

export type Branch = 'cafe' | 'hospital';

interface BranchState {
  currentBranch: Branch;
  setBranch: (branch: Branch) => void;
}

export const useBranchStore = create<BranchState>((set) => ({
  currentBranch: (localStorage.getItem('helav_branch') as Branch) || 'cafe',
  setBranch: (branch) => {
    localStorage.setItem('helav_branch', branch);
    set({ currentBranch: branch });
    // Reload page to refresh all stores with the new branch context
    window.location.reload();
  }
}));
