import { create } from "zustand";
import axios from "axios";

export const useAuthStore = create((set, get) => ({
  accessToken: localStorage.getItem("accessToken"),
  user: JSON.parse(localStorage.getItem("user") || "null"),
  async login(email, password) {
    const { data } = await axios.post("/api/auth/login", { email, password }, { withCredentials: true });
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("user", JSON.stringify(data.user));
    set({ accessToken: data.accessToken, user: data.user });
  },
  async refresh() {
    try {
      const { data } = await axios.post("/api/auth/refresh", {}, { withCredentials: true });
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("user", JSON.stringify(data.user));
      set({ accessToken: data.accessToken, user: data.user });
      return true;
    } catch {
      get().logoutLocal();
      return false;
    }
  },
  async logout() {
    await axios.post("/api/auth/logout", {}, { withCredentials: true });
    get().logoutLocal();
  },
  logoutLocal() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    set({ accessToken: null, user: null });
  }
}));
