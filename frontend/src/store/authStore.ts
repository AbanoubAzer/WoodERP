import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  companyId: string;
  isSuperAdmin?: boolean;
}

interface Location {
  id: string;
  name: string;
  type: string; // 'ALL', 'فرع', 'مخزن'
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  activeLocation: Location | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  setActiveLocation: (location: Location) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  isAuthenticated: !!localStorage.getItem('token'),
  activeLocation: localStorage.getItem('activeLocation') ? JSON.parse(localStorage.getItem('activeLocation')!) : { id: 'ALL', name: 'كل الفروع والمخازن', type: 'ALL' },
  
  login: (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeLocation');
    set({ token: null, user: null, isAuthenticated: false, activeLocation: { id: 'ALL', name: 'كل الفروع والمخازن', type: 'ALL' } });
  },

  setActiveLocation: (location: Location) => {
    localStorage.setItem('activeLocation', JSON.stringify(location));
    set({ activeLocation: location });
  }
}));
