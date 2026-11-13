import { create } from "zustand";
import { authStorage } from "@/lib/authStorage";

export const useAuthStore = create((set) => ({
  token: authStorage.getToken(),
  user: null,
  isAuthenticated: !!authStorage.getToken(),

  setAuth: (token, user) => {
    authStorage.setAuth(token, user?.role);
    set({
      token,
      user,
      isAuthenticated: true,
    });
  },

  logout: () => {
    authStorage.clear();
    set({
      token: null,
      user: null,
      isAuthenticated: false,
    });
  },
}));
