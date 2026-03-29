import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ExecutionStep, QueryExecutionResult } from '@/lib/executionEngine';

interface AppState {
  xp: number;
  level: number;
  streak: number;
  lastLoginDate: string | null;
  completedChapters: string[];
  badges: string[];
  showLevelUpModal: boolean;
  lastExecutedQuery: string | null;
  lastExecutionResult: QueryExecutionResult | null;
  lastExecutionSteps: ExecutionStep[];
  addXP: (amount: number) => void;
  completeChapter: (chapterId: string) => void;
  addBadge: (badge: string) => void;
  checkStreak: () => void;
  closeLevelUpModal: () => void;
  setLastExecutedQuery: (query: string) => void;
  setLastExecution: (query: string, result: QueryExecutionResult, steps: ExecutionStep[]) => void;
}

const XP_PER_LEVEL = 1000;

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      xp: 0,
      level: 1,
      streak: 0,
      lastLoginDate: null,
      completedChapters: [],
      badges: [],
      showLevelUpModal: false,
      lastExecutedQuery: null,
      lastExecutionResult: null,
      lastExecutionSteps: [],
      addXP: (amount) =>
        set((state) => {
          const newXp = state.xp + amount;
          const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1;
          const leveledUp = newLevel > state.level;
          return { 
            xp: newXp, 
            level: newLevel,
            showLevelUpModal: state.showLevelUpModal || leveledUp
          };
        }),
      completeChapter: (chapterId) =>
        set((state) => ({
          completedChapters: state.completedChapters.includes(chapterId)
            ? state.completedChapters
            : [...state.completedChapters, chapterId],
        })),
      addBadge: (badge) =>
        set((state) => ({
          badges: state.badges.includes(badge) ? state.badges : [...state.badges, badge],
        })),
      checkStreak: () => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        if (state.lastLoginDate === today) {
          return state; // Already logged in today
        }
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
 
        let newStreak = 1;
        if (state.lastLoginDate === yesterdayStr) {
          // Logged in yesterday, increment streak
          newStreak = state.streak + 1;
        }
 
        const newBadges = [...state.badges];
        if (newStreak >= 3 && !newBadges.includes('streak_3')) newBadges.push('streak_3');
        if (newStreak >= 7 && !newBadges.includes('streak_7')) newBadges.push('streak_7');
 
        return { streak: newStreak, lastLoginDate: today, badges: newBadges };
      }),
      closeLevelUpModal: () => set({ showLevelUpModal: false }),
      setLastExecutedQuery: (query) => set({ lastExecutedQuery: query }),
      setLastExecution: (query, result, steps) =>
        set({
          lastExecutedQuery: query,
          lastExecutionResult: result,
          lastExecutionSteps: steps,
        }),
    }),
    {
      name: 'queryquest-storage',
    }
  )
);
