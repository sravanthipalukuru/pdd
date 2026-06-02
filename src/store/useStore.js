import { create } from 'zustand';
import { API_BASE } from '../config/api.js';

const getUserId = () => {
  return localStorage.getItem('teethAppUserId') || null;
};

export const useStore = create((set, get) => ({
  userId: getUserId(),
  // Child Progress State
  coins: 0,
  level: 1,
  xp: 0,
  badges: [],
  gamesCompleted: [],
  purchasedItems: [],
  gameLevels: {},
  
  // Parent/Dentist Tracking State
  anxietyScore: 50,
  readinessScore: 50,
  avatar: '🐻',
  displayName: '',
  age: '',
  birthday: '',
  
  isLoading: false,
  
  // Actions
  login: (username) => {
    localStorage.setItem('teethAppUserId', username);
    set({ userId: username });
    get().fetchProgress();
  },

  logout: () => {
    localStorage.removeItem('teethAppUserId');
    set({
      userId: null,
      coins: 0,
      level: 1,
      xp: 0,
      badges: [],
      gamesCompleted: [],
      purchasedItems: [],
      gameLevels: {},
      anxietyScore: 50,
      readinessScore: 50,
      avatar: '🐻',
      displayName: '',
      age: '',
      birthday: ''
    });
  },

  fetchProgress: async () => {
    const currentUserId = get().userId;
    if (!currentUserId) return;
    
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE}/api/progress/${currentUserId}`);
      if (res.ok) {
        const data = await res.json();
        set({
          coins: data.coins ?? 0,
          level: data.level ?? 1,
          xp: data.xp ?? 0,
          badges: data.badges ?? [],
          gamesCompleted: data.gamesCompleted || [],
          purchasedItems: data.purchasedItems || [],
          gameLevels: data.gameLevels || {},
          anxietyScore: data.anxietyScore ?? 50,
          readinessScore: data.readinessScore ?? 50,
          avatar: data.avatar || '🐻',
          displayName: data.displayName || data.userId,
          age: data.age || '',
          birthday: data.birthday || '',
          isLoading: false
        });
      }
    } catch (err) {
      console.error('Failed to fetch progress from DB:', err);
      set({ isLoading: false });
    }
  },
  
  completeGame: async (gameId, scoreEarned, anxietyReduction) => {
    // Optimistic UI update
    set((state) => {
      const isNewCompletion = !state.gamesCompleted.includes(gameId);
      const newXp = state.xp + (isNewCompletion ? 50 : 10);
      return {
        gamesCompleted: isNewCompletion ? [...state.gamesCompleted, gameId] : state.gamesCompleted,
        coins: state.coins + scoreEarned,
        anxietyScore: Math.max(0, state.anxietyScore - anxietyReduction),
        readinessScore: Math.min(100, state.readinessScore + anxietyReduction),
        xp: newXp,
        level: Math.floor(newXp / 100) + 1
      };
    });

    const currentUserId = get().userId;
    if (!currentUserId) return;

    try {
      await fetch(`${API_BASE}/api/progress/${currentUserId}/complete-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, scoreEarned, anxietyReduction })
      });
    } catch (err) {
      console.error('Failed to sync game completion to DB:', err);
    }
  },

  setAvatar: async (newAvatar) => {
    set({ avatar: newAvatar });
    const currentUserId = get().userId;
    if (!currentUserId) return;

    try {
      await fetch(`${API_BASE}/api/progress/${currentUserId}/avatar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: newAvatar })
      });
    } catch (err) {
      console.error('Failed to save avatar to DB:', err);
    }
  },

  setProfile: async (profileData) => {
    const { userId } = get();
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/api/progress/${userId}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      if (res.ok) {
        const data = await res.json();
        set({ 
          displayName: data.displayName || get().displayName,
          age: data.age !== undefined ? data.age : get().age,
          birthday: data.birthday !== undefined ? data.birthday : get().birthday
        });
      }
    } catch (err) {
      console.error('Failed to set profile', err);
    }
  },

  buyItem: async (itemId, cost) => {
    const { userId, coins, purchasedItems } = get();
    if (!userId) return false;
    if (coins < cost) return false;
    
    try {
      const res = await fetch(`${API_BASE}/api/progress/${userId}/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, cost })
      });
      
      if (res.ok) {
        const data = await res.json();
        set({ 
          coins: data.coins,
          purchasedItems: data.purchasedItems
        });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to buy item', err);
      return false;
    }
  },

  completeGameLevel: async (gameId) => {
    const { userId } = get();
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE}/api/progress/${userId}/complete-level`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId })
      });
      if (res.ok) {
        const data = await res.json();
        set({
          gameLevels: data.gameLevels || {},
          coins: data.coins,
          xp: data.xp,
          level: data.level,
          badges: data.badges || get().badges,
          gamesCompleted: data.gamesCompleted || get().gamesCompleted
        });
        return true;
      }
    } catch (err) {
      console.error('Failed to complete level', err);
    }
    return false;
  }
}));

// ── AUTO-FETCH on app start if user is already logged in ──
// This runs once when the store is first imported.
// If a userId exists in localStorage, immediately load their data from MongoDB.
const { userId, fetchProgress } = useStore.getState();
if (userId) {
  fetchProgress();
}
